# ========================================
# Multi-Stage Build for Node.js/Fastify (Synapse Backend)
# Pendoah v8.1 Standard - Track B
# ========================================

# ────────────────────────────────────────
# Stage 1: Builder
# ────────────────────────────────────────
FROM node:22-alpine AS builder

WORKDIR /app

# Install pnpm
RUN npm install -g pnpm@10.23.0

# Copy monorepo files
COPY package.json pnpm-lock.yaml pnpm-workspace.yaml ./
COPY apps/backend/package.json ./apps/backend/
COPY apps/backend/tsconfig.json ./apps/backend/

# Install all dependencies (including devDependencies for build)
RUN pnpm install --frozen-lockfile --filter backend

# Copy source files
COPY apps/backend/src ./apps/backend/src

# Build the application
RUN cd apps/backend && pnpm run build

# Prune development dependencies
RUN pnpm prune --prod --filter backend

# ────────────────────────────────────────
# Stage 2: Runtime (Production)
# ────────────────────────────────────────
FROM node:22-alpine AS runner

WORKDIR /app

ENV NODE_ENV=production
ENV PORT=8000

# Copy built application from builder
COPY --from=builder /app/apps/backend/dist ./dist
COPY --from=builder /app/node_modules ./node_modules
COPY --from=builder /app/apps/backend/node_modules ./apps/backend/node_modules

# Copy environment template
COPY .env.shared ./.env.shared

# Create non-root user
RUN addgroup -g 1001 -S nodejs && \
    adduser -S nodejs -u 1001 && \
    chown -R nodejs:nodejs /app

USER nodejs

EXPOSE 8000

HEALTHCHECK --interval=30s --timeout=5s --start-period=30s --retries=3 \
  CMD wget --no-verbose --tries=1 --spider http://localhost:8000/health || exit 1

CMD ["node", "dist/server.js"]

