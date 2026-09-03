# Todo App — Monorepo

Proyecto de tareas construido como monorepo con **pnpm workspaces**.

## Estructura

```
todo-backend/
├── packages/
│   ├── backend/        # NestJS + Prisma + PostgreSQL (DDD)
│   └── frontend/       # React 19 + Tailwind CSS v4 + Vite
├── package.json        # Root workspace config
└── pnpm-workspace.yaml
```

## Requisitos previos

- Node.js >= 18
- pnpm
- PostgreSQL corriendo localmente

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
```

## Ejecutar

```bash
# Backend (puerto 3050)
pnpm --filter todo-backend dev

# Frontend (puerto 3040)
pnpm --filter todo-frontend dev
```

## Scripts disponibles

| Comando | Descripción |
|---------|-------------|
| `pnpm --filter todo-backend dev` | Iniciar backend en desarrollo |
| `pnpm --filter todo-backend build` | Build del backend |
| `pnpm --filter todo-backend test` | Tests del backend |
| `pnpm --filter todo-frontend dev` | Iniciar frontend en desarrollo |
| `pnpm --filter todo-frontend build` | Build del frontend |

## Packages

### Backend (`packages/backend`)

- **Stack:** NestJS 11 + Prisma 7 + PostgreSQL
- **Arquitectura:** DDD (Domain-Driven Design) con Hexagonal Architecture
- **Auth:** JWT + Argon2id + Passport
- **Docs:** Swagger en `http://localhost:3050/docs`
- **Tests:** Jest (31 tests, 7 suites)

### Frontend (`packages/frontend`)

- **Stack:** React 19 + Tailwind CSS v4 + Vite
- **Routing:** React Router v7
- **Pantallas:** Login, CRUD Usuarios, CRUD Tareas
- **Puerto:** 3040

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
        ├── AuthController (POST /auth/login)
        ├── UserController (GET/POST /users)
        └── TodoController (GET/POST/PATCH/DELETE /todo)
```

## Recursos

- [NestJS Docs](https://docs.nestjs.com)
- [Prisma Docs](https://www.prisma.io/docs)
- [React Docs](https://react.dev)
- [Tailwind CSS v4](https://tailwindcss.com)
- [Domain-Driven Design — Eric Evans](https://www.domainlanguage.com/ddd/)
