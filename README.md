# Todo App — Monorepo

Proyecto de tareas construido como monorepo con **pnpm workspaces**.

## Índice

- [Estructura](#estructura)
- [Requisitos previos](#requisitos-previos)
- [Instalación](#instalación)
- [Variables de entorno](#variables-de-entorno)
- [Ejecutar](#ejecutar)
- [Scripts disponibles](#scripts-disponibles)
- [Seguridad](#seguridad)
  - [CORS](#cors-cross-origin-resource-sharing)
  - [Autenticación JWT](#autenticación-jwt)
  - [Validación de entrada](#validación-de-entrada)
  - [Seguridad de la contraseña](#seguridad-de-la-contraseña)
- [Packages](#packages)
  - [Backend](#backend-packagesbackend)
  - [Frontend](#frontend-packagesfrontend)
  - [Notification](#notification-packagesnotification)
- [Arquitectura del Monorepo](#arquitectura-del-monorepo)
- [Despliegue](#despliegue)
- [Recursos](#recursos)

## Estructura

```
todo-backend/
├── packages/
│   ├── backend/        # NestJS + Prisma + PostgreSQL (DDD)
│   ├── frontend/       # React 19 + Tailwind CSS v4 + Vite
│   └── notification/   # NestJS + MongoDB + Socket.IO
├── docs/               # Documentación del proyecto
├── package.json        # Root workspace config
└── pnpm-workspace.yaml
```

## Requisitos previos

- Node.js >= 22
- pnpm
- PostgreSQL corriendo localmente
- MongoDB corriendo localmente (para notification service)

## Instalación

```bash
# Instalar dependencias de todos los packages
pnpm install

# Aprobar builds nativos (argon2, esbuild, etc.)
pnpm approve-builds argon2 esbuild @parcel/watcher @prisma/engines prisma unrs-resolver
```

## Variables de entorno

Cada package tiene su propio `.env`. Copia los samples:

```bash
cp packages/backend/.env.sample packages/backend/.env
cp packages/frontend/.env.sample packages/frontend/.env
cp packages/notification/.env.sample packages/notification/.env
```

## Ejecutar

```bash
# Backend (puerto 3050)
pnpm --filter todo-backend dev

# Frontend (puerto 3040)
pnpm --filter todo-frontend dev

# Notification (puerto 3060)
pnpm --filter notification-service dev
```

## Scripts disponibles

| Comando | Descripción |
|---------|-------------|
| `pnpm --filter todo-backend dev` | Iniciar backend en desarrollo |
| `pnpm --filter todo-backend build` | Build del backend |
| `pnpm --filter todo-backend test` | Tests del backend |
| `pnpm --filter todo-frontend dev` | Iniciar frontend en desarrollo |
| `pnpm --filter todo-frontend build` | Build del frontend |
| `pnpm --filter notification-service dev` | Iniciar notification en desarrollo |

## Seguridad

### CORS (Cross-Origin Resource Sharing)

El backend configura CORS para permitir solo orígenes específicos:

```typescript
// packages/backend/src/main.ts
app.enableCors({
  origin: process.env.CORS_ORIGIN ?? 'http://localhost:3040',
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'PATCH'],
  credentials: true,
});
```

**Producción:** La variable `CORS_ORIGIN` se configura en `docker-compose.yml` con la IP pública del servidor. Nunca se usa `*` como origin en producción.

```yaml
# docker-compose.yml
backend:
  environment:
    CORS_ORIGIN: http://IP_PUBLICA:3040
```

### Autenticación JWT

- **Password hashing:** Argon2id (memoryCost: 19456, timeCost: 2, parallelism: 1) — resistente a GPU/ASIC attacks
- **Token:** JWT con payload `{ sub, email, role }` y expiración
- **Extracción:** Bearer token en header `Authorization`
- **Validación:** Passport strategy que verifica el token y carga el usuario desde la DB
- **Endpoints protegidos:** Todos excepto `POST /api/auth/login`

```typescript
// Guard aplicado a nivel de controller
@ApiBearerAuth('jwt')
@UseGuards(JwtAuthGuard)
@Controller('todo')
export class TodoController { ... }
```

### Validación de entrada

`ValidationPipe` global con `whitelist: true` y `forbidNonWhitelisted: true`:

```typescript
app.useGlobalPipes(
  new ValidationPipe({
    whitelist: true,           // elimina propiedades no declaradas en el DTO
    forbidNonWhitelisted: true, // lanza 400 si hay propiedades extra
  }),
);
```

DTOs usan `class-validator` (`@IsString`, `@IsNotEmpty`, `@IsOptional`, etc.) para validar cada campo.

### Seguridad de la contraseña

- Las contraseñas **nunca** se retornan en las respuestas API
- El endpoint `GET /users` usa `toSafeUser()` que excluye el campo `password`
- El login retorna solo `{ id, email, role }` del usuario

## Packages

### Backend (`packages/backend`)

- **Stack:** NestJS 12 + Prisma 7 + PostgreSQL
- **Arquitectura:** DDD (Domain-Driven Design) con Clean Architecture
- **Auth:** JWT + Argon2id + Passport
- **Docs:** Swagger en `http://localhost:3050/docs`
- **Tests:** Jest (32 tests, 7 suites)
- **Prefijo global:** `/api` (todas las rutas son `/api/...`)

### Frontend (`packages/frontend`)

- **Stack:** React 19 + Tailwind CSS v4 + Vite
- **Routing:** React Router v7
- **Pantallas:** Login, CRUD Usuarios, CRUD Tareas
- **Puerto:** 3040

### Notification (`packages/notification`)

- **Stack:** NestJS 12 + Mongoose + MongoDB + Socket.IO
- **Arquitectura:** Mismos principios DDD que el backend — contextos aislados
- **Puerto:** 3060
- **Docs:** Swagger en `http://localhost:3060/docs`

#### Endpoints REST

| Método | Ruta | Descripción |
|--------|------|-------------|
| `POST` | `/notifications` | Crear notificación (el backend llama este endpoint internamente) |
| `GET` | `/notifications/:userId` | Obtener notificaciones de un usuario |
| `PATCH` | `/notifications/:id/read` | Marcar como leída |
| `DELETE` | `/notifications/:id` | Eliminar notificación |

#### WebSocket (Socket.IO)

El gateway WebSocket permite recibir notificaciones en tiempo real sin polling:

```typescript
// Conexión desde el frontend
const socket = io(WS_URL, {
  query: { userId: user.id },
  transports: ["websocket", "polling"],
});

// Escuchar notificaciones nuevas
socket.on("notification", (notification) => {
  // actualiza el estado del frontend
});
```

**Cómo funciona el flujo completo:**

```
1. Backend crea una tarea (POST /api/todo)
       │
       ▼
2. TodoService llama a NotificationPort.send()
       │
       ▼
3. HttpNotificationAdapter hace POST a notification:3060/notifications
       │
       ▼
4. NotificationService.create() guarda en MongoDB
       │
       ▼
5. NotificationGateway.sendNotificationToUser() emite vía WebSocket
       │
       ▼
6. Frontend recibe el evento "notification" en tiempo real
```

#### Integración con el Backend

El backend se comunica con notification vía HTTP interno (no expuesto al público):

```typescript
// packages/backend/src/contexts/tasks/todo/infrastructure/http-notification.adapter.ts
async send(data: SendNotificationData): Promise<void> {
  await fetch(`${this.notificationUrl}/notifications`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(data),
  });
}
```

**Tipos de notificación:**
- `TASK_CREATED` — cuando se crea una tarea
- `TASK_COMPLETED` — cuando se marca como completada
- `TASK_DUE_SOON` — (reservado) para alertas de vencimiento

#### Frontend — Hook `useNotifications`

El frontend consume notificaciones via un custom hook:

```typescript
const { notifications, unread, connected, markAsRead, markAllAsRead } = useNotifications();
```

- Carga notificaciones existentes vía REST al montar
- Se conecta al WebSocket para recibir nuevas en tiempo real
- Reconexión automática con `reconnectionDelay: 3000`
- `unread` — contador de notificaciones no leídas
- `connected` — estado de la conexión WebSocket

## Arquitectura del Monorepo

```
AppModule (NestJS)
├── PrismaModule (@Global)
├── ContextsModule
│   ├── TasksModule → TodoModule
│   └── IdentityAccessModule
│       ├── UserModule
│       └── AuthModule
└── AppsModule
    └── ApiModule
        ├── AuthController   (POST /api/auth/login)
        ├── UserController   (GET/POST /api/users)
        └── TodoController   (GET/POST/PATCH/DELETE /api/todo)
```

## Despliegue

Ver [docs/DEPLOY.md](docs/DEPLOY.md) para instrucciones completas de deploy a AWS EC2 con Docker Compose.

## Recursos

- [NestJS Docs](https://docs.nestjs.com)
- [Prisma Docs](https://www.prisma.io/docs)
- [React Docs](https://react.dev)
- [Tailwind CSS v4](https://tailwindcss.com)
- [Domain-Driven Design — Eric Evans](https://www.domainlanguage.com/ddd/)
- [OWASP Top 10](https://owasp.org/Top10/)
