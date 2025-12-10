# ========================================
# Multi-Stage Build for Vite/React (Synapse Frontend)
# Target: Production < 500MB
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

# Copy app packages (include all workspaces for proper dependency resolution)
COPY apps/frontend/package.json ./apps/frontend/
COPY apps/backend/package.json ./apps/backend/
COPY apps/cli/package.json ./apps/cli/
COPY apps/mcp-server/package.json ./apps/mcp-server/
COPY apps/vscode-extension/package.json ./apps/vscode-extension/

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

# Build the frontend
RUN pnpm --filter frontend build && \
    rm -rf /app/apps/frontend/node_modules && \
    rm -rf /app/node_modules

# ────────────────────────────────────────
# Stage 3: Production (nginx)
# ────────────────────────────────────────
FROM nginx:alpine AS runner

# Copy built static files
COPY --from=builder /app/apps/frontend/dist /usr/share/nginx/html

# Create custom nginx config (with fallback to file if it exists)
RUN if [ -f /app/apps/frontend/nginx.conf ]; then \
        cp /app/apps/frontend/nginx.conf /etc/nginx/conf.d/default.conf; \
    else \
        echo 'server { \
    listen 80; \
    server_name _; \
    root /usr/share/nginx/html; \
    index index.html; \
    location / { \
        try_files $uri $uri/ /index.html; \
    } \
    location /health { \
        access_log off; \
        return 200 "healthy\n"; \
        add_header Content-Type text/plain; \
    } \
    gzip on; \
    gzip_types text/plain text/css application/json application/javascript text/xml application/xml application/xml+rss text/javascript; \
    gzip_vary on; \
}' > /etc/nginx/conf.d/default.conf; \
    fi

EXPOSE 80

HEALTHCHECK --interval=30s --timeout=3s --start-period=10s --retries=3 \
  CMD wget --no-verbose --tries=1 --spider http://localhost/health || exit 1

CMD ["nginx", "-g", "daemon off;"]

