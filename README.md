<p align="center">
  <a href="http://nestjs.com/" target="blank"><img src="https://nestjs.com/img/logo-small.svg" width="120" alt="Nest Logo" /></a>
</p>

# Todo Backend — NestJS + Prisma + PostgreSQL

Backend de tareas construido con NestJS, Prisma ORM y PostgreSQL.

## Requisitos previos

- Node.js >= 18
- pnpm
- PostgreSQL corriendo localmente (o una instancia en la nube)

## 1. Instalación de dependencias

```bash
pnpm install
```

### Paquetes de Prisma instalados

| Paquete | Propósito |
|---------|-----------|
| `prisma` | CLI de Prisma para migraciones, generación de client, etc. |
| `@prisma/client` | Cliente generado para consultar la base de datos |
| `@prisma/adapter-pg` | Driver adapter para usar `pg` (node-postgres) como transport |
| `pg` | Driver PostgreSQL puro para Node.js |

```bash
# Instalación manual (ya incluidas en package.json)
pnpm add prisma @prisma/client @prisma/adapter-pg pg
pnpm add -D @types/pg
```

## 2. Inicializar Prisma

```bash
npx prisma init --datasource-provider postgresql
```

Esto genera:
- `prisma/schema.prisma` — esquema de modelos
- `prisma7.config.ts` — configuración de Prisma 7 (lee variables de entorno desde `.env`)
- `DATABASE_URL` en `.env`

La bandera `--datasource-provider postgresql` es explícita (PostgreSQL es el default, pero queda claro en el historial de comandos).

## 3. Configurar la conexión a PostgreSQL

En `.env`:

```env
DATABASE_URL="postgresql://postgres:postgres@localhost:5432/todo?schema=public"
```

Formato general:
```
postgresql://USUARIO:CONTRASEÑA@HOST:PUERTO/NOMBRE_DB?schema=public
```

## 4. Definir el esquema

En `prisma/schema.prisma`:

```prisma
generator client {
  provider = "prisma-client"
  output   = "../generated/prisma"
}

datasource db {
  provider = "postgresql"
}

model Todo {
  id        Int      @id @default(autoincrement())
  title     String
  completed Boolean  @default(false)
}
```

**Puntos clave:**
- `output = "../generated/prisma"` genera el client en `generated/prisma/` en vez de `node_modules/.prisma/client`
- `provider = "prisma-client"` es el nuevo generator de Prisma 7 (reemplaza a `prisma-client-js`)

## 5. Generar el client y crear migraciones

**Orden correcto — `generate` primero, `migrate` después:**

```bash
# 1. Generar el client de Prisma (lee schema.prisma y genera generated/prisma/)
npx prisma generate

# 2. Crear la migración inicial
npx prisma migrate dev --name init
```

> `migrate dev` **NO** ejecuta `generate` automáticamente. Son pasos independientes.

### Script postinstall (recomendado)

Para que `prisma generate` se ejecute solo después de cada `pnpm install`, agregar en `package.json`:

```json
"scripts": {
  "postinstall": "prisma generate"
}
```

Así nunca olvidás generar el client después de instalar dependencias nuevas.

### CI/CD

En pipelines de build, ejecutar antes del build:

```bash
pnpm install
npx prisma generate
npx prisma migrate deploy
pnpm run build
```

## 6. Configurar Prisma en NestJS

### 6.1 PrismaService (`src/prisma/prisma.service.ts`)

```typescript
import { Injectable, OnModuleInit, OnModuleDestroy } from '@nestjs/common';
import { PrismaClient } from '../../generated/prisma/client';
import { PrismaPg } from '@prisma/adapter-pg';

@Injectable()
export class PrismaService
  extends PrismaClient
  implements OnModuleInit, OnModuleDestroy
{
  constructor() {
    const adapter = new PrismaPg(process.env.DATABASE_URL!);
    super({ adapter });
  }

  async onModuleInit() {
    await this.$connect();
  }

  async onModuleDestroy() {
    await this.$disconnect();
  }
}
```

**¿Por qué `PrismaPg`?** En Prisma 7, el client ya no se conecta directamente. Usa un *driver adapter* (`@prisma/adapter-pg`) que delega las queries al driver `pg`. Esto permite mayor control sobre la conexión y compatibilidad con connection pooling.

### 6.2 PrismaModule (`src/prisma/prisma.module.ts`)

```typescript
import { Global, Module } from '@nestjs/common';
import { PrismaService } from './prisma.service';

@Global()
@Module({
  providers: [PrismaService],
  exports: [PrismaService],
})
export class PrismaModule {}
```

`@Global()` permite inyectar `PrismaService` en cualquier módulo sin importarlo explícitamente.

### 6.3 Registrar en AppModule (`src/app.module.ts`)

```typescript
import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { PrismaModule } from './prisma/prisma.module';
import { TodoModule } from './todo/todo.module';

@Module({
  imports: [
    ConfigModule.forRoot({ isGlobal: true }),
    PrismaModule,
    TodoModule,
  ],
})
export class AppModule {}
```

`ConfigModule.forRoot({ isGlobal: true })` carga las variables de `.env` globalmente.

## 7. Comandos útiles de Prisma

```bash
# Generar client después de cambiar schema.prisma
npx prisma generate

# Crear migración (desarrollo)
npx prisma migrate dev --name nombre_migration

# Aplicar migraciones en producción
npx prisma migrate deploy

# Ver y modificar la DB en el navegador
npx prisma studio

# Resetear la DB (borra datos + recrea)
npx prisma migrate reset

# Formatear schema.prisma
npx prisma format

# Ver el SQL de una migración
npx prisma migrate diff --from-schema-datasource prisma/schema.prisma --to-migrations prisma/migrations
```

## 8. Estructura del proyecto

```
todo-backend/
├── prisma/
│   ├── schema.prisma          # Esquema de modelos
│   └── migrations/            # Migraciones generadas
├── src/
│   ├── prisma/
│   │   ├── prisma.module.ts   # Módulo global de Prisma
│   │   └── prisma.service.ts  # Service que extiende PrismaClient
│   ├── todo/                  # Módulo de ejemplo (CRUD)
│   └── app.module.ts          # Módulo raíz
├── generated/                 # Client generado por Prisma (no commitear)
├── prisma7.config.ts          # Configuración de Prisma 7
├── .env                       # Variables de entorno (no commitear)
└── package.json
```

## Ejecutar el proyecto

```bash
# Desarrollo (hot-reload)
pnpm run start:dev

# Build + producción
pnpm run build
pnpm run start:prod
```

## Tests

```bash
pnpm run test        # unit tests
pnpm run test:e2e    # e2e tests
pnpm run test:cov    # coverage
```

## Notas

- `generated/` y `.env` están en `.gitignore` — no se commitean.
- Prisma 7 usa `prisma7.config.ts` para configuración (reemplaza la sección `[prisma]` de `package.json` de versiones anteriores).
- El client se importa desde `generated/prisma/client` (no desde `@prisma/client`) por el custom output en el schema.
- `prisma generate` corre después de cada `pnpm install` gracias al script `postinstall`.

## Recursos

- [NestJS Docs](https://docs.nestjs.com)
- [Prisma Docs](https://www.prisma.io/docs)
- [Prisma + NestJS](https://www.prisma.io/docs/guides/tutorials/prisma-nestjs)
