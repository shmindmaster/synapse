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
# Install dependencies from this project only
COPY package.json pnpm-lock.yaml* ./
RUN pnpm install --frozen-lockfile --prefer-offline

FROM base AS builder
WORKDIR /app
COPY --from=deps /app/node_modules ./node_modules
# Copy source code
COPY . .

ENV NODE_ENV=production

# Build with TypeScript
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
COPY --from=deps --chown=fastify:nodejs /app/src/api/node_modules ./src/api/node_modules

USER fastify
EXPOSE 8000

HEALTHCHECK --interval=30s --timeout=3s --start-period=20s --retries=3 \
  CMD node -e "require('http').get('http://localhost:8000/health', (r) => {process.exit(r.statusCode === 200 ? 0 : 1)})"

WORKDIR /app
# Copy Prisma schema and migrations
COPY --chown=fastify:nodejs prisma ./prisma

WORKDIR /app/src/api
# Run migrations and seed database before starting server
CMD ["sh", "-c", "cd /app && npx prisma migrate deploy --skip-generate 2>/dev/null; npx prisma db seed 2>/dev/null; cd /app/src/api && npm start"]
