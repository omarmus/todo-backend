<p align="center">
  <a href="http://nestjs.com/" target="blank"><img src="https://nestjs.com/img/logo-small.svg" width="120" alt="Nest Logo" /></a>
</p>

# Todo Backend — NestJS + Prisma + PostgreSQL (DDD)

Backend de tareas construido con NestJS, Prisma ORM y PostgreSQL, siguiendo los principios de **Domain-Driven Design (DDD)** con **Hexagonal Architecture**.

## Requisitos previos

- Node.js >= 18
- pnpm
- PostgreSQL corriendo localmente (o una instancia en la nube)

## Instalación y configuración

```bash
# 1. Instalar dependencias
pnpm install

# 2. Configurar DATABASE_URL en .env
# 3. Generar client de Prisma
npx prisma generate

# 4. Crear migración inicial
npx prisma migrate dev --name init
```

### Variables de entorno (`.env`)

```env
DATABASE_URL="postgresql://postgres:postgres@localhost:5432/todo?schema=public"
```

Formato general:
```
postgresql://USUARIO:CONTRASEÑA@HOST:PUERTO/NOMBRE_DB?schema=public
```

## Paquetes de Prisma

| Paquete | Propósito |
|---------|-----------|
| `prisma` | CLI de Prisma para migraciones, generación de client, etc. |
| `@prisma/client` | Cliente generado para consultar la base de datos |
| `@prisma/adapter-pg` | Driver adapter para usar `pg` (node-postgres) como transport |
| `pg` | Driver PostgreSQL puro para Node.js |

> **Nota:** En Prisma 7, el client se importa desde `generated/prisma/client` (no desde `@prisma/client`) por el custom output en el schema.

---

## Evolución de la estructura

Este proyecto evolucionó paso a paso desde una estructura simple hasta DDD. A continuación se muestra cada fase.

### Fase 1: Estructura inicial (NestJS flat)

La estructura original del proyecto era plana, sin separación por capas:

```
src/
├── prisma/
│   ├── prisma.module.ts       # Módulo global de Prisma
│   └── prisma.service.ts      # Service que extiende PrismaClient
├── todo/
│   ├── todo.module.ts
│   ├── todo.controller.ts
│   ├── todo.service.ts
│   └── dto/
├── app.module.ts              # Módulo raíz
└── main.ts
```

**Problema:** Todo vivía en el mismo nivel. No había separación entre dominio, aplicación e infraestructura. Agregar una segunda feature (ej. users) habría crecido la confusión rápidamente.

### Fase 2: Extracción de Prisma a shared infrastructure

El primer paso fue mover `PrismaService` y `PrismaModule` a una capa compartida (`shared/`), sacándolos del módulo de dominio:

```
src/
├── shared/
│   └── infrastructure/
│       └── prisma/
│           ├── prisma.module.ts    # @Global — disponible en toda la app
│           └── prisma.service.ts   # Extiende PrismaClient con driver adapter
└── todo/                           # (todavía flat en src/)
```

**Por qué:** Prisma es infraestructura, no pertenece a ninguna feature. Al ser `@Global()`, se inyecta en cualquier módulo sin importarlo explícitamente.

### Fase 3: Creación de bounded contexts (contexts)

Se creó la capa `contexts/` para agrupar **bounded contexts** — dominios de negocio que se comunican entre sí pero son independientes internamente:

```
src/
├── contexts/
│   └── tasks/                    # Bounded context: "Tasks"
│       └── todo/                 # Aggregate root: Todo
│           ├── domain/           # Entidad + repositorio abstracto
│           ├── application/      # Service + DTOs
│           └── infrastructure/   # Implementación del repositorio
├── shared/
│   └── infrastructure/
│       └── prisma/
└── apps/                         # Capa de delivery
```

**Regla clave:** Los bounded contexts NO importan entre sí. Si `tasks/users` necesitara algo de `tasks/todos`, se comunica por eventos o DTOs compartidos — nunca por imports directos.

### Fase 4: Separación por capas DDD (domain / application / infrastructure)

Dentro de cada aggregate root (`todo/`), se separó la lógica en tres capas:

#### Domain (el corazón)

```typescript
// src/contexts/tasks/todo/domain/todo.entity.ts
export class Todo {
  constructor(
    public readonly id: string,
    public readonly title: string,
    public readonly completed: boolean,
  ) {}
}

// src/contexts/tasks/todo/domain/todo.repository.ts
export abstract class TodoRepository {
  abstract findAll(): Promise<Todo[]>;
  abstract getOne(id: number): Promise<Todo | null>;
  abstract create(data: CreateTodoData): Promise<Todo | null>;
  abstract update(id: number, data: UpdateTodoData): Promise<Todo | null>;
  abstract deleteItem(id: number): Promise<void>;
}
```

- **Entidad:** Representación pura del dominio, sin dependencias de frameworks.
- **Repositorio abstracto:** Interfaz que define QUÉ se puede hacer con los datos, no CÓMO se almacenan.

#### Application (casos de uso)

```typescript
// src/contexts/tasks/todo/application/todo.service.ts
@Injectable()
export class TodoService {
  constructor(private readonly todoRepository: TodoRepository) {}
  // Lógica de negocio: validaciones, transformaciones, orquestación
}
```

- Depende del **repositorio abstracto** (domain), NO de Prisma.
- Los DTOs (`create-todo.dto.ts`, `update-todo.dto.ts`) definen la forma de los datos de entrada.

#### Infrastructure (implementación técnica)

```typescript
// src/contexts/tasks/todo/infrastructure/prisma-todo.repository.ts
@Injectable()
export class PrismaTodoRepository implements TodoRepository {
  constructor(private readonly prisma: PrismaService) {}

  private toDomain(row: any) {
    return new Todo(row.id, row.title, row.completed);
  }

  async findAll() {
    const rows = await this.prisma.todo.findMany();
    return rows.map((r) => this.toDomain(r));
  }
  // ... CRUD operations
}
```

- Implementa el repositorio abstracto usando Prisma.
- El método `toDomain()` traduce los datos de la DB a la entidad del dominio.
- Para cambiar de Prisma a TypeORM, se crea otro archivo en `infrastructure/` que implemente la misma interfaz — el service NO cambia.

### Fase 5: Capa de delivery (apps)

Se creó la capa `apps/` para separar la presentación de la lógica de negocio:

```
src/
├── apps/
│   ├── apps.module.ts           # Agrupa las diferentes "apps"
│   └── api/
│       ├── api.module.ts        # Importa módulos de contextos
│       ├── todo.controller.ts   # HTTP endpoints
│       └── todo.controller.spec.ts
```

El controller depende del **service** (application layer), nunca del repositorio directamente:

```typescript
@Controller('todo')
export class TodoController {
  constructor(private readonly todoService: TodoService) {}
  // Los endpoints delegan al service
}
```

**Por qué `apps/`:** Permite tener múltiples capas de delivery (HTTP API, CLI, gRPC, etc.) sin mezclar controllers con lógica de negocio.

### Fase 6: Árbol de módulos final

La jerarquía de módulos NestJS ahora es:

```
AppModule
├── PrismaModule (@Global)
├── ContextsModule
│   └── TasksModule
│       └── TodoModule
└── AppsModule
    └── ApiModule
        └── TodoController
```

**Flujo de inyección:**
1. `PrismaModule` exporta `PrismaService` (disponible globalmente).
2. `TodoModule` registra `TodoRepository` → `PrismaTodoRepository` y exporta `TodoService`.
3. `ApiModule` importa `TodoModule` para inyectar `TodoService` en el controller.
4. `AppModule` conecta todo: `ContextsModule` (dominio) + `AppsModule` (delivery) + `PrismaModule` (infraestructura compartida).

---

## Estructura final del proyecto

```
todo-backend/
├── prisma/
│   ├── schema.prisma                  # Esquema de modelos
│   └── migrations/                    # Migraciones generadas
├── src/
│   ├── main.ts                        # Bootstrap de la app
│   ├── app.module.ts                  # Módulo raíz
│   │
│   ├── shared/                        # Infraestructura compartida
│   │   └── infrastructure/
│   │       └── prisma/
│   │           ├── prisma.module.ts   # @Global — disponible en toda la app
│   │           └── prisma.service.ts  # Extiende PrismaClient con driver adapter
│   │
│   ├── contexts/                      # Bounded contexts (dominios de negocio)
│   │   ├── contexts.module.ts
│   │   └── tasks/                     # Bounded context: "Tasks"
│   │       ├── tasks.module.ts
│   │       └── todo/                  # Aggregate root: Todo
│   │           ├── todo.module.ts
│   │           ├── domain/            # 💎 El corazón — sin dependencias
│   │           │   ├── todo.entity.ts        # Entidad del dominio
│   │           │   └── todo.repository.ts    # Interfaz del repositorio
│   │           ├── application/        # 🧠 Casos de uso
│   │           │   ├── todo.service.ts       # Service (lógica de negocio)
│   │           │   └── dto/
│   │           │       ├── create-todo.dto.ts
│   │           │       └── update-todo.dto.ts
│   │           └── infrastructure/    # 🔧 Implementación técnica
│   │               └── prisma-todo.repository.ts  # Repositorio con Prisma
│   │
│   └── apps/                          # Capa de delivery
│       ├── apps.module.ts
│       └── api/
│           ├── api.module.ts
│           ├── todo.controller.ts     # HTTP endpoints
│           └── todo.controller.spec.ts
│
├── generated/                         # Client generado por Prisma (no commitear)
├── prisma7.config.ts
├── .env
└── package.json
```

---

## Prisma commands

```bash
npx prisma generate                    # Generar client después de cambiar schema.prisma
npx prisma migrate dev --name nombre   # Crear migración (desarrollo)
npx prisma migrate deploy              # Aplicar migraciones en producción
npx prisma studio                      # Ver y modificar la DB en el navegador
npx prisma migrate reset               # Resetear la DB (borra datos + recrea)
npx prisma format                      # Formatear schema.prisma
```

## Ejecutar el proyecto

```bash
pnpm run start:dev                     # Desarrollo (hot-reload)
pnpm run build && pnpm run start:prod  # Build + producción
```

## Tests

```bash
pnpm run test                          # unit tests
pnpm run test:e2e                      # e2e tests
pnpm run test:cov                      # coverage
```

## Notas

- `generated/` y `.env` están en `.gitignore` — no se commitean.
- Prisma 7 usa `prisma7.config.ts` para configuración.
- El client se importa desde `generated/prisma/client` (no desde `@prisma/client`).
- `prisma generate` corre después de cada `pnpm install` gracias al script `postinstall`.

## Recursos

- [NestJS Docs](https://docs.nestjs.com)
- [Prisma Docs](https://www.prisma.io/docs)
- [Domain-Driven Design — Eric Evans](https://www.domainlanguage.com/ddd/)
