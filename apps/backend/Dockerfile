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
COPY package.json pnpm-lock.yaml pnpm-workspace.yaml ./

# Copy backend package.json
COPY apps/backend/package.json ./apps/backend/

# Install dependencies (including devDependencies for build)
RUN pnpm install --frozen-lockfile && \
    pnpm store prune && \
    rm -rf /root/.npm /root/.pnpm-store /tmp/*

# Copy source files
COPY apps/backend ./apps/backend
COPY prisma ./prisma 2>/dev/null || true

# Build the application
RUN pnpm --filter backend build

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

# Install production dependencies only
RUN pnpm install --frozen-lockfile --prod --filter backend && \
    pnpm store prune && \
    rm -rf /root/.npm /root/.pnpm-store /tmp/*

# Copy build artifacts from builder
COPY --from=builder /app/apps/backend ./apps/backend
COPY --from=builder /app/prisma ./prisma 2>/dev/null || true

# Create non-root user
RUN addgroup -g 1001 -S nodejs && \
    adduser -S nodejs -u 1001 && \
    chown -R nodejs:nodejs /app

USER nodejs

EXPOSE 3000

HEALTHCHECK --interval=30s --timeout=5s --start-period=30s --retries=3 \
  CMD wget --no-verbose --tries=1 --spider http://localhost:3000/health || exit 1

CMD ["node", "apps/backend/server.js"]

