# --- Build stage ---
FROM node:20-alpine AS builder
RUN corepack enable && corepack prepare pnpm@latest --activate
WORKDIR /app

COPY pnpm-workspace.yaml package.json pnpm-lock.yaml* ./
COPY packages/backend/package.json ./packages/backend/
RUN pnpm install --frozen-lockfile --filter todo-backend

COPY packages/backend/ ./packages/backend/
WORKDIR /app/packages/backend
RUN npx prisma generate
RUN pnpm run build

# --- Production stage ---
FROM node:20-alpine
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
