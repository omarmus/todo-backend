# --- Build stage ---
FROM node:22-alpine AS builder
RUN corepack enable && corepack prepare pnpm@latest --activate
WORKDIR /app

COPY pnpm-workspace.yaml package.json pnpm-lock.yaml* ./
COPY packages/backend/package.json ./packages/backend/
COPY packages/backend/prisma ./packages/backend/prisma/
RUN pnpm approve-builds argon2 esbuild @swc/core @parcel/watcher @prisma/engines prisma unrs-resolver 2>/dev/null || true
RUN pnpm install --frozen-lockfile --filter todo-backend

COPY packages/backend/ ./packages/backend/
WORKDIR /app/packages/backend
RUN npx prisma generate
RUN npx nest build

# --- Production stage ---
FROM node:22-alpine
RUN corepack enable && corepack prepare pnpm@latest --activate
WORKDIR /app

COPY --from=builder /app/packages/backend/dist ./dist
COPY --from=builder /app/packages/backend/generated ./generated
COPY --from=builder /app/packages/backend/node_modules ./node_modules
COPY --from=builder /app/packages/backend/package.json ./
COPY --from=builder /app/packages/backend/prisma ./prisma

ENV NODE_ENV=production
EXPOSE 3050
CMD ["node", "dist/main.js"]
