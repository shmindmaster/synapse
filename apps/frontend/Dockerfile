# ========================================
# Multi-Stage Build for Vite/React (Synapse)
# ========================================

# ────────────────────────────────────────
# Stage 1: Build
# ────────────────────────────────────────
FROM node:20-alpine AS builder

WORKDIR /app

# Install pnpm
RUN npm install -g pnpm@10.23.0

# Copy monorepo root files
COPY package.json pnpm-lock.yaml pnpm-workspace.yaml tsconfig.json ./

# Copy app packages
COPY apps/frontend/package.json ./apps/frontend/
COPY apps/backend/package.json ./apps/backend/

# Install all dependencies (needed for build and TypeScript)
RUN pnpm install --frozen-lockfile && \
    pnpm store prune && \
    rm -rf /root/.npm /root/.pnpm-store /tmp/*

# Copy source files
COPY apps/frontend ./apps/frontend

# Build arguments
ARG VITE_API_URL
ENV VITE_API_URL=${VITE_API_URL}
ENV NODE_ENV=production

# Build the frontend from root using pnpm to respect monorepo structure
RUN pnpm --dir /app run -r --filter @synapse/frontend build

# ────────────────────────────────────────
# Stage 3: Production (nginx)
# ────────────────────────────────────────
FROM nginx:alpine AS runner

# Copy built static files
COPY --from=builder /app/apps/frontend/dist /usr/share/nginx/html

# Copy nginx configuration (with fallback)
COPY apps/frontend/nginx.conf /etc/nginx/conf.d/default.conf

EXPOSE 80

CMD ["nginx", "-g", "daemon off;"]

