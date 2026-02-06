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
COPY --from=deps /app/node_modules ./node_modules
COPY tsconfig.json ./
COPY src/web ./src/web

# Build from frontend directory
WORKDIR /app/src/web
ENV NODE_ENV=production
# Vite reads env vars from .env files or build-time ARGs
ARG VITE_API_URL
ARG NEXT_PUBLIC_API_URL
ARG EXPO_PUBLIC_API_URL
ARG APP_DOMAIN
ENV VITE_API_URL=${VITE_API_URL}
ENV NEXT_PUBLIC_API_URL=${NEXT_PUBLIC_API_URL}
ENV EXPO_PUBLIC_API_URL=${EXPO_PUBLIC_API_URL}

# Run pnpm build (which runs tsc and vite from this directory)
RUN pnpm build

# Production stage - serve static files
FROM node:20-alpine AS runner
WORKDIR /app

RUN npm install -g serve

# Copy built assets
COPY --from=builder /app/src/web/dist ./dist

RUN addgroup --system --gid 1001 nodejs
RUN adduser --system --uid 1001 nextjs

RUN chown -R nextjs:nodejs /app

USER nextjs
EXPOSE 3000

HEALTHCHECK --interval=30s --timeout=3s --start-period=30s --retries=3 \
  CMD node -e "require('http').get('http://localhost:3000/', (r) => {process.exit(r.statusCode === 200 ? 0 : 1)})"

CMD ["serve", "-s", "dist", "-l", "3000"]
