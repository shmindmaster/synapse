# ==========================================
# ⚡ Fastify Backend (Context-Aware)
# ==========================================
# Build Context: Repo Root (App Platform builds from root)
# This Dockerfile assumes it's run from repository root, not apps/backend

FROM node:20-alpine AS base
RUN apk add --no-cache libc6-compat openssl
RUN npm install -g pnpm

FROM base AS deps
WORKDIR /app
# Copy workspace files from root
COPY package.json pnpm-lock.yaml* pnpm-workspace.yaml* ./
# Copy backend package.json
COPY apps/backend/package.json ./apps/backend/
RUN pnpm install --frozen-lockfile

FROM base AS builder
WORKDIR /app
COPY --from=deps /app/node_modules ./node_modules
# Copy workspace config
COPY package.json pnpm-lock.yaml* pnpm-workspace.yaml* ./
# Copy backend source
COPY apps/backend ./apps/backend

ENV NODE_ENV=production

WORKDIR /app/apps/backend
# Build if build script exists, otherwise skip
RUN if grep -q '"build"' package.json; then pnpm build; else echo "No build script, skipping build step"; fi

FROM base AS runner
WORKDIR /app

ENV NODE_ENV=production
ENV PORT=8000

RUN addgroup --system --gid 1001 nodejs
RUN adduser --system --uid 1001 fastify

# Copy application files
COPY --from=builder --chown=fastify:nodejs /app/apps/backend ./apps/backend
COPY --from=deps --chown=fastify:nodejs /app/node_modules ./node_modules

USER fastify
EXPOSE 8000

HEALTHCHECK --interval=30s --timeout=3s --start-period=20s --retries=3 \
  CMD node -e "require('http').get('http://localhost:8000/health', (r) => {process.exit(r.statusCode === 200 ? 0 : 1)})"

WORKDIR /app/apps/backend
# Use npm start if available, otherwise try common entry points
CMD ["sh", "-c", "if [ -f package.json ] && grep -q '\"start\"' package.json; then npm start; elif [ -f dist/server.js ]; then node dist/server.js; elif [ -f dist/main.js ]; then node dist/main.js; else node src/server.js; fi"]
