# ========================================
# Multi-Stage Build for Vite/React (Synapse)
# ========================================

# ────────────────────────────────────────
# Stage 1: Dependencies
# ────────────────────────────────────────
FROM node:20-alpine AS deps

WORKDIR /app

# Install pnpm
RUN npm install -g pnpm@10.23.0

# Copy monorepo root files
COPY package.json pnpm-lock.yaml pnpm-workspace.yaml ./

# Copy frontend package.json
COPY apps/frontend/package.json ./apps/frontend/

# Install dependencies
RUN pnpm install --frozen-lockfile --filter frontend && \
    pnpm store prune && \
    rm -rf /root/.npm /root/.pnpm-store /tmp/*

# ────────────────────────────────────────
# Stage 2: Build
# ────────────────────────────────────────
FROM node:20-alpine AS builder

WORKDIR /app

# Install pnpm
RUN npm install -g pnpm@10.23.0

# Copy dependencies from deps stage
COPY --from=deps /app/node_modules ./node_modules
COPY --from=deps /app/apps/frontend/node_modules ./apps/frontend/node_modules

# Copy source files
COPY apps/frontend ./apps/frontend
COPY package.json pnpm-lock.yaml pnpm-workspace.yaml ./

# Build arguments
ARG VITE_API_URL
ENV VITE_API_URL=${VITE_API_URL}
ENV NODE_ENV=production

# Build the frontend
RUN pnpm --filter frontend build

# ────────────────────────────────────────
# Stage 3: Production (nginx)
# ────────────────────────────────────────
FROM nginx:alpine AS runner

# Copy built static files
COPY --from=builder /app/apps/frontend/dist /usr/share/nginx/html

# Copy nginx configuration
COPY apps/frontend/nginx.conf /etc/nginx/conf.d/default.conf 2>/dev/null || \
    echo 'server { listen 80; server_name _; root /usr/share/nginx/html; index index.html; location / { try_files $uri $uri/ /index.html; } }' > /etc/nginx/conf.d/default.conf

EXPOSE 80

CMD ["nginx", "-g", "daemon off;"]

