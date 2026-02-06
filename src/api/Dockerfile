# ==========================================
# ⚡ Fastify Backend - Synapse API
# ==========================================
# Build Context: This directory (projects/api/)
# Each project builds independently

FROM node:20-alpine AS base
RUN apk add --no-cache libc6-compat openssl
RUN npm install -g pnpm

FROM base AS deps
WORKDIR /app
# Install dependencies (workspace-aware)
COPY package.json pnpm-workspace.yaml* ./
COPY src/api/package.json ./src/api/
RUN pnpm install --prefer-offline

FROM base AS builder
WORKDIR /app
# COPY --from=deps /app/node_modules ./node_modules
# COPY --from=deps /app/src/api/node_modules ./src/api/node_modules
COPY src/api ./src/api
COPY src/api/prisma ./prisma
COPY tsconfig.json ./

ENV NODE_ENV=production

# Build with TypeScript
WORKDIR /app/src/api
# Install deps locally to ensure binaries work
RUN pnpm install --config.dedupe-peer-dependents=false
# Generate Prisma client using local version from API directory
RUN pnpm exec prisma generate --schema=../../prisma/schema.prisma
RUN pnpm run build

FROM base AS runner
WORKDIR /app

ENV NODE_ENV=production
ENV PORT=8000

RUN addgroup --system --gid 1001 nodejs
RUN adduser --system --uid 1001 fastify

# Copy application files
COPY --from=builder --chown=fastify:nodejs /app/src/api ./src/api
# Copy both root and backend node_modules
COPY --from=deps --chown=fastify:nodejs /app/node_modules ./node_modules
COPY --from=builder --chown=fastify:nodejs /app/src/api/node_modules ./src/api/node_modules

USER fastify
EXPOSE 8000

HEALTHCHECK --interval=30s --timeout=3s --start-period=20s --retries=3 \
  CMD node -e "require('http').get('http://localhost:8000/api/health', (r) => {process.exit(r.statusCode === 200 ? 0 : 1)})"

WORKDIR /app
# Copy Prisma schema and migrations
COPY --chown=fastify:nodejs src/api/prisma ./prisma

WORKDIR /app/src/api
# Run migrations and seed database before starting server
CMD ["sh", "-c", "cd /app && npx prisma generate && npx prisma migrate deploy && npx prisma db seed; cd /app/src/api && npm start"]
