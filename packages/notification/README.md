# Notification Service — NestJS + MongoDB + WebSockets

Microservicio de notificaciones en tiempo real construido con NestJS 12, Mongoose y Socket.io.

> Este servicio forma parte de un monorepo. El backend principal está en `packages/backend/`.

## Requisitos previos

- Node.js >= 20
- pnpm
- MongoDB corriendo localmente

### Instalar MongoDB

**macOS (Homebrew):**
```bash
brew tap mongodb/brew https://github.com/mongodb/homebrew-brew.git
brew install mongodb-community
brew services start mongodb/brew/mongodb-community
```

**Linux (Ubuntu/Debian):**
```bash
# Importar GPG key
curl -fsSL https://www.mongodb.org/static/pgp/server-8.0.asc | sudo gpg -o /usr/share/keyrings/mongodb-server-8.0.gpg --dearmor

# Agregar repo
echo "deb [ signed-by=/usr/share/keyrings/mongodb-server-8.0.gpg ] https://repo.mongodb.org/apt/ubuntu jammy/mongodb-org/8.0 multiverse" | sudo tee /etc/apt/sources.list.d/mongodb-org-8.0.list

# Instalar
sudo apt update && sudo apt install -y mongodb-org

# Iniciar
sudo systemctl start mongod
sudo systemctl enable mongod
```

**Windows:**
1. Descargar el instalador desde https://www.mongodb.com/try/download/community
2. Ejecutar el `.msi` y seguir el asistente
3. Seleccionar "Install MongoDB as a Service"
4. Iniciar desde Services (services.msc) o con PowerShell:
```powershell
net start MongoDB
```

**Verificar (todos los SO):**
```bash
mongosh --eval "db.runCommand({ ping: 1 })"
# { ok: 1 }
```

## Instalación

```bash
# Desde la raíz del monorepo
pnpm install

# Configurar variables de entorno
cp .env.sample .env
```

### Variables de entorno (`.env`)

```env
PORT=3060
MONGODB_URI=mongodb://localhost:27017/notifications
```

No hay migraciones — MongoDB es schema-less. Al crear la primera notificación, Mongoose crea la colección `notifications` automáticamente.

## Ejecutar

```bash
# Desde la raíz del monorepo
pnpm --filter notification-service dev

# O desde packages/notification
pnpm dev
```

- **API:** http://localhost:3060
- **Swagger:** http://localhost:3060/docs
- **WebSocket:** ws://localhost:3060

---

## Modelo de Notificación

```typescript
enum NotificationType {
  TASK_CREATED = 'TASK_CREATED',
  TASK_COMPLETED = 'TASK_COMPLETED',
  TASK_DUE_SOON = 'TASK_DUE_SOON',
}

// Document en MongoDB
{
  _id: ObjectId,
  userId: string,
  type: NotificationType,
  title: string,
  message: string,
  metadata: { taskId: string },
  read: boolean,
  createdAt: Date,
}
```

---

## API Endpoints

### REST

| Método | Ruta | Descripción |
|--------|------|-------------|
| GET | `/notifications/:userId` | Listar notificaciones de un usuario |
| POST | `/notifications` | Crear y enviar notificación vía WebSocket |
| PATCH | `/notifications/:id/read` | Marcar como leída |
| DELETE | `/notifications/:id` | Eliminar notificación |

### Ejemplos

```bash
# Crear notificación
curl -X POST http://localhost:3060/notifications \
  -H "Content-Type: application/json" \
  -d '{
    "userId": "user-1",
    "type": "TASK_CREATED",
    "title": "Nueva tarea",
    "message": "Se creó una nueva tarea",
    "metadata": { "taskId": "task-1" }
  }'

# Obtener notificaciones del usuario
curl http://localhost:3060/notifications/user-1

# Marcar como leída
curl -X PATCH http://localhost:3060/notifications/{id}/read

# Eliminar
curl -X DELETE http://localhost:3060/notifications/{id}
```

### WebSocket

Gateway escuchando en el mismo puerto (3060) vía Socket.io.

**Conexión:**
```typescript
import { io } from 'socket.io-client';

const socket = io('http://localhost:3060', {
  query: { userId: 'user-1' }
});

// Unirse a un room manualmente
socket.emit('join', { userId: 'user-1' });

// Escuchar notificaciones
socket.on('notification', (notification) => {
  console.log('Nueva notificación:', notification);
});
```

**Eventos:**

| Dirección | Evento | Data | Descripción |
|-----------|--------|------|-------------|
| Entrante | `join` | `{ userId }` | Unirse al room del usuario |
| Saliente | `notification` | `{ notification }` | Notificación para el usuario |
| Saliente | `joined` | `{ userId }` | Confirmación de join |

**Flujo:**
1. El cliente se conecta con `?userId=xxx` en el query
2. El gateway lo une al room `user:{userId}`
3. Cuando se crea una notificación vía POST, el controller llama al gateway
4. El gateway emite `notification` al room del usuario
5. El cliente recibe la notificación en tiempo real

---

## Estructura del Proyecto

```
packages/notification/
├── src/
│   ├── main.ts                                    # Bootstrap + Swagger + CORS
│   ├── app.module.ts                              # Root module
│   │
│   ├── shared/
│   │   └── infrastructure/
│   │       └── mongoose/
│   │           └── mongoose.module.ts             # @Global — conexión MongoDB
│   │
│   ├── contexts/
│   │   ├── contexts.module.ts                     # Agrupa bounded contexts
│   │   └── notifications/
│   │       ├── notifications.module.ts            # Módulo de notificaciones
│   │       ├── domain/
│   │       │   ├── notification.entity.ts          # Entidad + NotificationType enum
│   │       │   └── notification.repository.ts      # Interfaz abstracta
│   │       ├── application/
│   │       │   ├── notification.service.ts          # Lógica de negocio
│   │       │   └── dto/
│   │       │       └── create-notification.dto.ts   # DTO con Swagger decorators
│   │       └── infrastructure/
│   │           ├── mongoose-notification.schema.ts    # Schema Mongoose
│   │           └── mongoose-notification.repository.ts
│   │
│   └── apps/
│       ├── apps.module.ts
│       └── api/
│           ├── api.module.ts
│           ├── notification.controller.ts           # REST endpoints
│           └── notification.gateway.ts              # WebSocket gateway
│
├── dist/                                          # Build output (SWC)
├── .env / .env.sample
├── .swcrc                                         # Config SWC (decorators)
├── nest-cli.json                                  # Builder: SWC
├── tsconfig.json
└── package.json
```

---

## Árbol de Módulos

```
AppModule
├── ConfigModule (@Global)       — Variables de entorno
├── MongooseSharedModule (@Global) — Conexión MongoDB
├── ContextsModule
│   └── NotificationsModule
│       └── NotificationRepository → MongooseNotificationRepository
└── AppsModule
    └── ApiModule
        ├── NotificationController  — REST
        └── NotificationGateway     — WebSocket
```

---

## Arquitectura DDD

Siguiendo los mismos principios que `packages/backend`:

### Domain (el corazón)

```typescript
// notification.entity.ts — Entidad pura, sin dependencias
export class Notification {
  constructor(
    public readonly id: string,
    public readonly userId: string,
    public readonly type: NotificationType,
    public readonly title: string,
    public readonly message: string,
    public readonly metadata: Record<string, unknown>,
    public readonly read: boolean,
    public readonly createdAt: Date,
  ) {}
}

// notification.repository.ts — Interfaz abstracta
export abstract class NotificationRepository {
  abstract findByUserId(userId: string): Promise<Notification[]>;
  abstract findById(id: string): Promise<Notification | null>;
  abstract create(data: CreateNotificationData): Promise<Notification>;
  abstract markAsRead(id: string): Promise<Notification | null>;
  abstract deleteItem(id: string): Promise<void>;
}
```

### Application (casos de uso)

```typescript
// notification.service.ts — Depende del repositorio abstracto
@Injectable()
export class NotificationService {
  constructor(private readonly notificationRepository: NotificationRepository) {}
  // Lógica de negocio
}
```

### Infrastructure (implementación técnica)

```typescript
// mongoose-notification.repository.ts — Implementa con Mongoose
@Injectable()
export class MongooseNotificationRepository implements NotificationRepository {
  constructor(@InjectModel(NotificationSchema.name) private readonly model) {}
  // CRUD con Mongoose
}
```

---

## Diferencia con `packages/backend`

| Aspecto | `packages/backend` | `packages/notification` |
|---------|-------------------|------------------------|
| Framework | NestJS 12 | NestJS 12 |
| DB | PostgreSQL | MongoDB |
| ORM | Prisma | Mongoose |
| Realtime | No | WebSocket (Socket.io) |
| Auth | JWT en Guards | JWT en WebSocket query param |
| Puerto | 3050 | 3060 |
| Build | tsc (SWC para tests) | SWC |

---

## Notas Técnicas

### SWC Builder

NestJS 12 con `@nestjs/common@12` es ESM puro. El builder SWC compila sin problemas de decorators, a diferencia de `tsc` que genera conflictos con `lib.decorators.legacy.d.ts`.

### Mongoose Enum

El `enum` de Mongoose necesita un array de strings, no un TypeScript enum. Se define directamente en el `@Prop`:

```typescript
@Prop({ required: true, enum: ['TASK_CREATED', 'TASK_COMPLETED', 'TASK_DUE_SOON'] })
type: string;
```

El enum TypeScript se mantiene en `domain/notification.entity.ts` para type-safety en la capa de dominio.

### Sin Migraciones

MongoDB no requiere migraciones. La colección `notifications` se crea automáticamente al insertar el primer documento. Mongoose valida el schema a nivel de aplicación.

---

## Build

```bash
npx nest build     # Compila a dist/ con SWC
pnpm test           # Tests (jest + @swc/jest)
```
