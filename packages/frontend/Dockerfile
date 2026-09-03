# --- Build stage ---
FROM node:20-alpine AS builder
ARG VITE_API_BASE=http://localhost:3050
ARG VITE_WS_URL=http://localhost:3060
ENV VITE_API_BASE=$VITE_API_BASE
ENV VITE_WS_URL=$VITE_WS_URL
RUN corepack enable && corepack prepare pnpm@latest --activate
WORKDIR /app

COPY pnpm-workspace.yaml package.json pnpm-lock.yaml* ./
COPY packages/frontend/package.json ./packages/frontend/
RUN pnpm install --frozen-lockfile --filter todo-frontend

COPY packages/frontend/ ./packages/frontend/
WORKDIR /app/packages/frontend
RUN pnpm run build

# --- Production stage ---
FROM nginx:alpine
COPY --from=builder /app/packages/frontend/dist /usr/share/nginx/html
COPY packages/frontend/nginx.conf /etc/nginx/conf.d/default.conf
EXPOSE 3040
CMD ["nginx", "-g", "daemon off;"]
