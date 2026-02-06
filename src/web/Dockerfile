# ==========================================
# ⚡ Vite/React Frontend (Context-Aware)
# ==========================================
# Build Context: Repo Root (App Platform builds from root)
# This Dockerfile assumes it's run from repository root, not apps/frontend

FROM node:20-alpine AS base
WORKDIR /app
RUN apk add --no-cache libc6-compat
RUN npm install -g pnpm

FROM base AS deps
WORKDIR /app
# Copy workspace files
COPY package.json pnpm-workspace.yaml* tsconfig.json ./
COPY src/web/package.json ./src/web/
COPY src/api/package.json ./src/api/
RUN pnpm install --prefer-offline

FROM base AS builder
WORKDIR /app
# COPY --from=deps /app/node_modules ./node_modules
COPY package.json pnpm-workspace.yaml* tsconfig.json ./
COPY src/web ./src/web

# Build from frontend directory
WORKDIR /app/src/web
ENV NODE_ENV=production

# Build-time env vars (injected via ARG)
ARG VITE_API_URL
ENV VITE_API_URL=${VITE_API_URL}

# Install deps locally (failsafe) and build
RUN pnpm install --config.dedupe-peer-dependents=false
RUN pnpm build

# Production stage - serve static files
FROM node:20-alpine AS runner
WORKDIR /app

RUN npm install -g serve

# Copy built assets
COPY --from=builder /app/src/web/dist ./dist

RUN addgroup --system --gid 1001 nodejs
RUN adduser --system --uid 1001 synapse

RUN chown -R synapse:nodejs /app

USER synapse
EXPOSE 3000

HEALTHCHECK --interval=30s --timeout=3s --start-period=30s --retries=3 \
  CMD node -e "require('http').get('http://localhost:3000/', (r) => {process.exit(r.statusCode === 200 ? 0 : 1)})"

CMD ["serve", "-s", "dist", "-l", "tcp://0.0.0.0:3000"]
