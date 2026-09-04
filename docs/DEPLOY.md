# Guía de Deploy — Todo Monorepo

Documentación completa para deployar los 3 servicios del monorepo: **backend**, **frontend** y **notification**.

---

## Arquitectura de Servicios

```
┌─────────────────────────────────────────────────────────────┐
│                      nginx / ALB                             │
│                                                              │
│  :3040 → Frontend (React)                                   │
│  :3050 → Backend (NestJS + PostgreSQL)                      │
│  :3060 → Notification (NestJS + MongoDB + WebSocket)        │
│                                                              │
└─────────────────────────────────────────────────────────────┘
```

| Servicio | Puerto | DB | Tecnología |
|----------|--------|----|------------|
| Frontend | 3040 | — | React 19 + Tailwind 4 + Vite |
| Backend | 3050 | PostgreSQL 16 | NestJS 12 + Prisma 7 |
| Notification | 3060 | MongoDB 8 | NestJS 12 + Mongoose + Socket.io |

---

## Docker Compose (local)

### Por qué Docker Compose

Docker Compose nos permite:
1. **Levantar todo el entorno local** con un solo comando (`docker compose up`)
2. **Reproducibilidad** — el mismo entorno en tu máquina, en CI y en producción
3. **Aislamiento** — cada servicio corre en su propio contenedor con sus dependencias
4. **Orquestación** — dependencias entre servicios (`backend` espera a `postgres`)
5. **Simplicidad** — sin necesidad de instalar PostgreSQL o MongoDB manualmente

En producción, Docker Compose se reemplaza por un orquestador como ECS, EKS o ECS on EC2, pero el concepto de "definir servicios, dependencias y redes en un archivo" es el mismo.

### Levantar localmente

```bash
# Solo infraestructura (DBs)
docker compose up -d postgres mongodb

# Todo junto (DBs + servicios)
docker compose up --build

# Ver logs
docker compose logs -f backend

# Detener
docker compose down

# Detener y borrar datos
docker compose down -v
```

### Qué hace cada servicio en el compose

**postgres** — PostgreSQL 16 con volumen persistente:
- Puerto 5432 expuesto
- Crea la DB `todo` automáticamente
- Healthcheck con `pg_isready`
- No necesita migraciones manuales — Prisma las aplica al iniciar el backend

**mongodb** — MongoDB 8 con volumen persistente:
- Puerto 27017 expuesto
- Crea la DB `notifications` al primer insert (schema-less)
- Healthcheck con `mongosh`

**backend** — NestJS + Prisma:
- Espera a que PostgreSQL esté healthy
- Ejecuta `prisma generate` en el build stage
- Se conecta a PostgreSQL y MongoDB (notification service)
- Puerto 3050

**notification** — NestJS + Mongoose + WebSocket:
- Espera a que MongoDB esté healthy
- Socket.io escucha en el mismo puerto (3060)
- Puerto 3060

**frontend** — React via nginx:
- Build con Vite (ARGs para variables de entorno)
- Servido por nginx con SPA fallback (`try_files`)
- Puerto 3040

### Variables de entorno

En local, el `docker-compose.yml` usa valores por defecto. Para override:

```bash
# Crear .env en la raíz
JWT_SECRET=mi-secret-super-seguro
API_URL=https://api.midominio.com
WS_URL=wss://ws.midominio.com
```

---

## Deploy en AWS — EC2 t3.micro (pruebas)

Un solo t3.micro corre todo: los 3 servicios + PostgreSQL + MongoDB via Docker Compose.

### Por qué t3.micro

- **$0.0104/hora** (~$7.5/mes si está siempre encendido)
- **2 vCPU, 1 GB RAM** — suficiente para 3 contenedores NestJS + 2 DBs en pruebas
- **T3 burst** — usa CPU credit para arranques, idle no cuesta extra
- **Sin complejidad** — no hay ECS, RDS, ni DocumentDB que configurar

### Gotchas conocidos

- **pnpm v11 requiere Node 22+** — los Dockerfiles usan `node:22-alpine`
- **t3.micro tiene 1GB RAM** — necesitás 1GB de swap y buildear servicios de a uno
- **pnpm ignora build scripts por defecto** — el `package.json` raíz tiene `pnpm.onlyBuiltDependencies` para permitir Prisma, esbuild, etc.
- **NestJS build genera `dist/src/main.js`** — no `dist/main.js`

### Instalar AWS CLI

```bash
# macOS
brew install awscli

# Linux (Debian/Ubuntu)
curl "https://awscli.amazonaws.com/awscli-exe-linux-x86_64.zip" -o "awscliv2.zip"
unzip awscliv2.zip
sudo ./aws/install

# Linux (Amazon Linux / RHEL / Fedora)
sudo dnf install -y awscli

# Windows (PowerShell)
msiexec.exe /i https://awscli.amazonaws.com/AWSCLIV2.msi

# Verificar instalación
aws --version

# Configurar credenciales
aws configure
# Access Key ID: tu-access-key
# Secret Access Key: tu-secret-key
# Region: us-east-1 (o tu región)
# Output format: json
```

### Paso 1: Crear la instancia EC2

```bash
# Crear security group
aws ec2 create-security-group \
  --group-name todo-sg \
  --description "Security group for todo app" \
  --vpc-id VPC_ID \
  --query 'GroupId' --output text
# → sg-XXXXX

# Abrir puertos 22 (SSH), 80 (HTTP), 443 (HTTPS), 3040-3060
aws ec2 authorize-security-group-ingress \
  --group-id sg-XXXXX \
  --protocol tcp --port 22 --cidr 0.0.0.0/0

aws ec2 authorize-security-group-ingress \
  --group-id sg-XXXXX \
  --protocol tcp --port 80 --cidr 0.0.0.0/0

aws ec2 authorize-security-group-ingress \
  --group-id sg-XXXXX \
  --protocol tcp --port 443 --cidr 0.0.0.0/0

aws ec2 authorize-security-group-ingress \
  --group-id sg-XXXXX \
  --protocol tcp --port 3040-3060 --cidr 0.0.0.0/0

# Crear key pair (para poder conectarte por SSH)
aws ec2 create-key-pair \
  --key-name todo-key \
  --query 'KeyMaterial' --output text > ~/.ssh/todo-key.pem
chmod 400 ~/.ssh/todo-key.pem

# Crear instancia t3.micro con Amazon Linux 2023
aws ec2 run-instances \
  --image-id ami-081b0a6eac00b4f53 \
  --instance-type t3.micro \
  --key-name todo-key \
  --security-group-ids sg-XXXXX \
  --block-device-mappings '[{"DeviceName":"/dev/xvda","Ebs":{"VolumeSize":20,"VolumeType":"gp3"}}]' \
  --tag-specifications 'ResourceType=instance,Tags=[{Key=Name,Value=todo-server}]' \
  --query 'Instances[0].InstanceId' --output text
# → i-XXXXX

# Esperar a que esté corriendo
aws ec2 wait instance-running --instance-ids i-XXXXX

# Crear y asociar IP elástica (para que no cambie al reiniciar)
aws ec2 allocate-address --domain vpc --query 'AllocationId' --output text
# → eipalloc-XXXXX

aws ec2 associate-address \
  --instance-id i-XXXXX \
  --allocation-id eipalloc-XXXXX

# Obtener la IP pública
aws ec2 describe-instances \
  --instance-ids i-XXXXX \
  --query 'Reservations[0].Instances[0].PublicIpAddress' --output text
# → IP_PUBLICA
```

### Paso 2: Conectarse y preparar la instancia

```bash
# Conectar por SSH
ssh -i ~/.ssh/todo-key.pem ec2-user@IP_PUBLICA

# Actualizar sistema
sudo dnf update -y

# Instalar Docker
sudo dnf install -y docker
sudo systemctl enable --now docker
sudo usermod -aG docker ec2-user

# Instalar git
sudo dnf install -y git

# Instalar docker-compose v2 (CLI plugin)
sudo mkdir -p /usr/local/lib/docker/cli-plugins
sudo curl -SL "https://github.com/docker/compose/releases/latest/download/docker-compose-linux-x86_64" \
  -o /usr/local/lib/docker/cli-plugins/docker-compose
sudo chmod +x /usr/local/lib/docker/cli-plugins/docker-compose

# Instalar buildx (requerido por docker compose build)
BUILDX_VERSION=$(curl -s https://api.github.com/repos/docker/buildx/releases/latest | grep tag_name | cut -d '"' -f 4)
sudo mkdir -p /usr/libexec/docker/cli-plugins
sudo curl -SL "https://github.com/docker/buildx/releases/download/$BUILDX_VERSION/buildx-$BUILDX_VERSION.linux-amd64" \
  -o /usr/libexec/docker/cli-plugins/docker-buildx
sudo chmod +x /usr/libexec/docker/cli-plugins/docker-buildx

# Verificar versiones
docker --version
docker compose version
docker buildx version

# Agregar 1GB de swap (la t3.micro tiene solo 1GB RAM, necesita swap para buildear)
sudo fallocate -l 1G /swapfile
sudo chmod 600 /swapfile
sudo mkswap /swapfile
sudo swapon /swapfile
echo '/swapfile none swap sw 0 0' | sudo tee -a /etc/fstab

# Cerrar sesión y volver a conectar para que el grupo docker surta efecto
exit
ssh -i ~/.ssh/todo-key.pem ec2-user@IP_PUBLICA
```

### Paso 3: Clonar el proyecto y configurar variables

```bash
# Clonar
git clone https://github.com/TU_USUARIO/todo-backend.git
cd todo-backend

# Crear archivo .env
cat > .env << 'EOF'
# Backend
DATABASE_URL=postgresql://postgres:PASSWORD_DB@postgres:5432/todo
JWT_SECRET=generar-con-openssl-rand-hex-32
MONGODB_URI=mongodb://mongodb:27017/notifications

# Frontend
VITE_API_URL=http://IP_PUBLICA:3050
VITE_WS_URL=ws://IP_PUBLICA:3060

# Notification
PORT=3060
EOF

# Generar JWT_SECRET
JWT_SECRET=$(openssl rand -hex 32)
sed -i "s|generar-con-openssl-rand-hex-32|$JWT_SECRET|" .env
```

### Paso 4: Levantar todo con Docker Compose

En una t3.micro (1GB RAM) hay que buildear uno por uno para evitar OOM:

```bash
# Build cada imagen por separado
docker compose build --no-cache backend
docker compose build --no-cache notification
docker compose build --no-cache frontend

# Levantar todos los servicios
docker compose up -d

# Verificar que todo esté corriendo
docker compose ps

# Ver logs
docker compose logs -f
```

### Paso 5: Verificar que funciona

```bash
# Health check desde la máquina
curl http://localhost:3050    # Backend (debería devolver 404 con JSON)
curl http://localhost:3040    # Frontend (debería devolver HTML)
curl http://localhost:3060    # Notification (debería devolver 404 con JSON)

# Desde tu máquina local
curl http://IP_PUBLICA:3050
curl http://IP_PUBLICA:3040
```

### Paso 6: Ejecutar migraciones y seed

Las migraciones y el seed se ejecutan una sola vez después del primer deploy:

```bash
# Crear script de migración + seed
cat << 'SEEDSCRIPT' > /tmp/migrate-and-seed.js
const { PrismaClient } = require('/app/packages/backend/dist/generated/prisma/client');
const { PrismaPg } = require('/app/node_modules/.pnpm/@prisma+adapter-pg@7.10.0/node_modules/@prisma/adapter-pg');
const fs = require('fs');
const path = require('path');

async function main() {
  const migrationsDir = '/app/packages/backend/prisma/migrations';
  const migrationDirs = fs.readdirSync(migrationsDir).filter(d => d !== 'migration_lock.toml').sort();
  
  const adapter = new PrismaPg(process.env.DATABASE_URL);
  const prisma = new PrismaClient({ adapter });
  
  for (const dir of migrationDirs) {
    const sqlFile = path.join(migrationsDir, dir, 'migration.sql');
    if (fs.existsSync(sqlFile)) {
      const sql = fs.readFileSync(sqlFile, 'utf8');
      console.log('Applying migration: ' + dir);
      await prisma.$executeRawUnsafe(sql);
    }
  }
  
  console.log('Migrations applied!');
  
  const argon2 = require('/app/node_modules/.pnpm/argon2@0.45.1/node_modules/argon2');
  const email = 'admin@todo.com';
  const password = 'admin123';
  
  const existing = await prisma.user.findUnique({ where: { email } });
  if (existing) {
    console.log('User already exists, skipping seed.');
    await prisma.$disconnect();
    return;
  }
  
  const hashed = await argon2.hash(password, { type: argon2.argon2id, memoryCost: 19456, timeCost: 2, parallelism: 1 });
  const user = await prisma.user.create({ data: { email, name: 'Admin', password: hashed, role: 'ADMIN', status: 'ACTIVE' } });
  console.log('Admin user created: ' + user.email);
  await prisma.$disconnect();
}
main().catch(e => { console.error(e); process.exit(1); });
SEEDSCRIPT

# Copiar al contenedor y ejecutar
docker compose cp /tmp/migrate-and-seed.js backend:/app/packages/backend/migrate-and-seed.js
docker compose exec backend node packages/backend/migrate-and-seed.js
```

Credenciales del admin:
- Email: `admin@todo.com`
- Password: `admin123`

### Paso 6: Configurar nginx (reverso proxy en puerto 80)

Para acceder en `http://IP_PUBLICA/` sin especificar puerto:

```bash
# Instalar nginx
sudo dnf install -y nginx

# Copiar configuración desde el repo
scp -i ~/.ssh/todo-key.pem nginx/ip-based.conf ec2-user@IP_PUBLICA:/tmp/todo.conf
ssh -i ~/.ssh/todo-key.pem ec2-user@IP_PUBLICA 'sudo cp /tmp/todo.conf /etc/nginx/conf.d/todo.conf'

# Verificar configuración y reiniciar
sudo nginx -t
sudo systemctl enable --now nginx
```

Archivos nginx en el repo:
- `nginx/ip-based.conf` — para IP directa (pruebas)
- `nginx/subdomain-based.conf` — para subdominios (producción)

### Rutas con nginx

| Ruta | Servicio |
|------|----------|
| `http://IP_PUBLICA/` | Frontend (React) |
| `http://IP_PUBLICA/api/` | Backend (NestJS) |
| `http://IP_PUBLICA/notifications/` | Notification REST |
| `http://IP_PUBLICA/socket.io/` | Notification WebSocket |

### Paso 7 (producción): Configurar subdominios

Cuando tengas un dominio, configurá DNS y nginx para separar servicios por subdominio:

#### Paso 7a: Configurar DNS

Crear registros A en tu proveedor DNS:

| Tipo | Nombre | Valor |
|------|--------|-------|
| A | `@` (midominio.com) | IP_PUBLICA |
| A | `api` | IP_PUBLICA |
| A | `notify` | IP_PUBLICA |

Si usás **Cloudflare**: DNS → Records → Add record (tipo A, nombre, contenido = IP, proxy desactivado para backend).

Si usás **Route 53** (AWS): Route 53 → Hosted zones → Create record (A, alias no, IP).

#### Paso 7b: Cambiar nginx a modo subdominios

```bash
# Copiar config de subdominios
scp -i ~/.ssh/todo-key.pem nginx/subdomain-based.conf ec2-user@IP_PUBLICA:/tmp/todo.conf
ssh -i ~/.ssh/todo-key.pem ec2-user@IP_PUBLICA 'sudo cp /tmp/todo.conf /etc/nginx/conf.d/todo.conf && sudo nginx -t && sudo systemctl restart nginx'
```

#### Paso 7c: Actualizar CORS y frontend

En `docker-compose.yml`, actualizar las variables de entorno:

```yaml
backend:
  environment:
    CORS_ORIGIN: https://midominio.com

frontend:
  build:
    args:
      VITE_API_BASE: https://api.midominio.com
      VITE_WS_URL: wss://notify.midominio.com
```

#### Paso 7d: HTTPS con Let's Encrypt (opcional)

```bash
sudo dnf install -y certbot python3-certbot-nginx
sudo certbot --nginx -d midominio.com -d api.midominio.com -d notify.midominio.com
sudo systemctl enable --now certbot-renew.timer
```

| Subdominio | Servicio |
|------------|----------|
| `midominio.com` | Frontend (React) |
| `api.midominio.com` | Backend (NestJS) |
| `notify.midominio.com` | Notification (WebSocket) |

---

## Comandos útiles (EC2)

```bash
# Ver estado de contenedores
docker compose ps

# Reiniciar un servicio
docker compose restart backend

# Ver logs en tiempo real
docker compose logs -f backend
docker compose logs -f notification
docker compose logs -f frontend

# Detener todo
docker compose down

# Detener y borrar datos (reset completo)
docker compose down -v

# Reconstruir desde cero
docker compose up -d --build --force-recreate

# Entrar al contenedor del backend
docker compose exec backend sh

# Ejecutar Prisma migrate manualmente
docker compose exec backend npx prisma migrate deploy

# Acceder a la base de datos
docker compose exec postgres psql -U postgres -d todo
```

### Variables de entorno en EC2

| Variable | Descripción | Ejemplo |
|----------|-------------|---------|
| `DATABASE_URL` | URL de PostgreSQL | `postgresql://postgres:pass@postgres:5432/todo` |
| `JWT_SECRET` | Secret para JWT | `openssl rand -hex 32` |
| `MONGODB_URI` | URL de MongoDB | `mongodb://mongodb:27017/notifications` |
| `VITE_API_URL` | URL del backend para el frontend | `http://IP:3050` |
| `VITE_WS_URL` | URL del WebSocket | `ws://IP:3060` |

---

## GitHub Actions — CI/CD

### Qué hace el workflow (`.github/workflows/ci.yml`)

**En cada push/PR a `main`** — 3 jobs en paralelo:

| Job | Qué hace |
|-----|----------|
| `test-backend` | Instala deps → genera Prisma client → corre Jest |
| `test-notification` | Instala deps → corre Jest |
| `build-frontend` | Instala deps → buildea con Vite |

**Solo en push a `main`** (después de que los 3 pasen):

| Job | Qué hace |
|-----|----------|
| `docker` | Buildea 3 imágenes Docker → push a Docker Hub |

### Flujo

```
PR a main        →  test-backend ✓
                   test-notification ✓
                   build-frontend ✓
                   (no buildea Docker)

Push a main      →  test-backend ✓
                   test-notification ✓
                   build-frontend ✓
                   → docker build + push a Docker Hub
```

### Secrets necesarios en GitHub

Ir a **Settings → Secrets and variables → Actions**:

| Secret | Descripción |
|--------|-------------|
| `DOCKERHUB_USERNAME` | Usuario de Docker Hub |
| `DOCKERHUB_TOKEN` | Token de Docker Hub (no la password) |

| Variable | Descripción |
|----------|-------------|
| `API_URL` | URL del backend para el frontend build |
| `WS_URL` | URL del WebSocket para el frontend build |

### Para conectarse a EC2 en vez de Docker Hub

Si deployás directo al t3.micro (sin ECR), el workflow actual no alcanza. Necesitarías un step extra que haga SSH a la EC2 y ejecute `docker compose pull && docker compose up -d`. Eso se agrega al job `docker`:

```yaml
      - name: Deploy to EC2
        uses: appleboy/ssh-action@v1
        with:
          host: ${{ secrets.EC2_HOST }}
          username: ec2-user
          key: ${{ secrets.EC2_SSH_KEY }}
          script: |
            cd todo-backend
            docker compose pull
            docker compose up -d --build
```

Y agregar estos secrets:
- `EC2_HOST` — IP pública de la instancia
- `EC2_SSH_KEY` — contenido completo de la key `.pem`

---

## Checklist antes de pruebas

- [ ] `JWT_SECRET` — generado con `openssl rand -hex 32`
- [ ] `DATABASE_URL` — apunta al contenedor postgres, no a localhost
- [ ] `MONGODB_URI` — apunta al contenedor mongodb
- [ ] `VITE_API_URL` — usa la IP pública, no localhost
- [ ] Puertos abiertos en security group (3040-3060)
- [ ] `docker compose ps` — todos los servicios healthy
- [ ] Prisma migrate ejecutado — `docker compose logs backend | grep migrate`
