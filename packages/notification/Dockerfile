# --- Build stage ---
FROM node:20-alpine AS builder
RUN corepack enable && corepack prepare pnpm@latest --activate
WORKDIR /app

COPY pnpm-workspace.yaml package.json pnpm-lock.yaml* ./
COPY packages/notification/package.json ./packages/notification/
RUN pnpm install --frozen-lockfile --filter notification-service

COPY packages/notification/ ./packages/notification/
WORKDIR /app/packages/notification
RUN pnpm run build

# --- Production stage ---
FROM node:20-alpine
RUN corepack enable && corepack prepare pnpm@latest --activate
WORKDIR /app

COPY --from=builder /app/packages/notification/dist ./dist
COPY --from=builder /app/packages/notification/node_modules ./node_modules
COPY --from=builder /app/packages/notification/package.json ./

ENV NODE_ENV=production
EXPOSE 3060
CMD ["node", "dist/main.js"]
