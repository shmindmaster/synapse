# ========================================
# Multi-Stage Build for Node.js/Express (Synapse Backend)
# Target: Production < 500MB
# ========================================

# ────────────────────────────────────────
# Stage 1: Dependencies
# ────────────────────────────────────────
FROM node:20-alpine AS deps

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

# Copy prisma schema
COPY prisma ./prisma

# Install dependencies (production only)
RUN pnpm install --frozen-lockfile --prod --filter backend && \
    pnpm store prune && \
    rm -rf /root/.npm /root/.pnpm-store /tmp/*

# ────────────────────────────────────────
# Stage 2: Builder
# ────────────────────────────────────────
FROM node:20-alpine AS builder

WORKDIR /app

# Install pnpm
RUN npm install -g pnpm@10.23.0

# Copy monorepo files
COPY package.json pnpm-lock.yaml pnpm-workspace.yaml ./
COPY apps/backend/package.json ./apps/backend/

# Install all dependencies (including devDependencies for build)
RUN pnpm install --frozen-lockfile --filter backend

# Copy source files
COPY apps/backend ./apps/backend
COPY prisma ./prisma

# Generate Prisma client with Alpine compatibility
RUN pnpm exec prisma generate

# Build the application - bypass npm script and call tsc directly from node_modules
RUN /app/node_modules/.bin/tsc --project apps/backend/tsconfig.json

# ────────────────────────────────────────
# Stage 3: Runtime (Production)
# ────────────────────────────────────────
FROM node:20-alpine AS runner

WORKDIR /app

ENV NODE_ENV=production
ENV PORT=3000

# Install pnpm
RUN npm install -g pnpm@10.23.0

# Copy production dependencies from deps stage
COPY --from=deps /app/node_modules ./node_modules
COPY --from=deps /app/apps/backend/node_modules ./apps/backend/node_modules
COPY --from=deps /app/prisma ./prisma

# Copy built application and Prisma client from builder
COPY --from=builder /app/apps/backend ./apps/backend
COPY --from=builder /app/node_modules/.prisma ./node_modules/.prisma

# Copy monorepo config
COPY package.json pnpm-lock.yaml pnpm-workspace.yaml ./
COPY lib ./lib

# Create non-root user
RUN addgroup -g 1001 -S nodejs && \
    adduser -S nodejs -u 1001 && \
    chown -R nodejs:nodejs /app

USER nodejs

EXPOSE 3000

HEALTHCHECK --interval=30s --timeout=5s --start-period=30s --retries=3 \
  CMD wget --no-verbose --tries=1 --spider http://localhost:3000/health || exit 1

CMD ["node", "apps/backend/server.js"]

