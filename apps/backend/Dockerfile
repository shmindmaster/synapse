# ========================================
# Multi-Stage Build for Node.js/Express (Synapse)
# ========================================

# ────────────────────────────────────────
# Stage 1: Builder
# ────────────────────────────────────────
FROM node:20-alpine AS builder

WORKDIR /app

# Install pnpm
RUN npm install -g pnpm@10.23.0

# Copy monorepo root files
COPY package.json pnpm-lock.yaml pnpm-workspace.yaml tsconfig.json ./

# Copy package.json files for all apps (pnpm needs to know about all workspaces)
COPY apps/backend/package.json ./apps/backend/
COPY apps/frontend/package.json ./apps/frontend/
COPY apps/cli/package.json ./apps/cli/
COPY apps/mcp-server/package.json ./apps/mcp-server/
COPY apps/vscode-extension/package.json ./apps/vscode-extension/

# Install dependencies (including devDependencies for build)
RUN pnpm install --frozen-lockfile && \
    pnpm store prune && \
    rm -rf /root/.npm /root/.pnpm-store /tmp/*

# Copy source files
COPY apps/backend ./apps/backend

# Build the application - bypass npm script and call tsc directly from node_modules
RUN /app/node_modules/.bin/tsc --project apps/backend/tsconfig.json && \
    pnpm db:generate

# ────────────────────────────────────────
# Stage 2: Runtime
# ────────────────────────────────────────
FROM node:20-alpine AS runner

WORKDIR /app

ENV NODE_ENV=production
ENV PORT=3000

# Install pnpm
RUN npm install -g pnpm@10.23.0

# Copy monorepo structure
COPY package.json pnpm-lock.yaml pnpm-workspace.yaml ./
COPY apps/backend/package.json ./apps/backend/
COPY apps/frontend/package.json ./apps/frontend/
COPY lib ./lib
COPY prisma ./prisma

# Install production dependencies only
RUN pnpm install --frozen-lockfile --prod && \
    pnpm store prune && \
    rm -rf /root/.npm /root/.pnpm-store /tmp/*

# Copy build artifacts from builder
COPY --from=builder /app/apps/backend ./apps/backend
RUN if [ -d /app/prisma ]; then cp -r /app/prisma . ; fi

# Create non-root user
RUN addgroup -g 1001 -S nodejs && \
    adduser -S nodejs -u 1001 && \
    chown -R nodejs:nodejs /app

USER nodejs

EXPOSE 3000

HEALTHCHECK --interval=30s --timeout=5s --start-period=30s --retries=3 \
  CMD wget --no-verbose --tries=1 --spider http://localhost:3000/health || exit 1

CMD ["node", "apps/backend/server.js"]

