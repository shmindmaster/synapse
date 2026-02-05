# ==========================================
# ⚡ Vite/React Frontend (Context-Aware)
# ==========================================
# Build Context: Repo Root (App Platform builds from root)
# This Dockerfile assumes it's run from repository root, not apps/frontend

FROM node:20-alpine AS builder
WORKDIR /app

# Install pnpm
RUN npm install -g pnpm

# Copy workspace files from root
COPY package.json pnpm-lock.yaml* pnpm-workspace.yaml* tsconfig.json ./
# Copy both package files
COPY apps/frontend/package.json ./apps/frontend/
COPY apps/backend/package.json ./apps/backend/

# Install all dependencies
RUN pnpm install --frozen-lockfile

# Copy frontend source
COPY apps/frontend ./apps/frontend

# Build from root so it has access to root deps
WORKDIR /app
ENV NODE_ENV=production
# Vite reads env vars from .env files or build-time ARGs
ARG VITE_API_URL
ARG NEXT_PUBLIC_API_URL
ARG EXPO_PUBLIC_API_URL
ENV VITE_API_URL=${VITE_API_URL}
ENV NEXT_PUBLIC_API_URL=${NEXT_PUBLIC_API_URL}
ENV EXPO_PUBLIC_API_URL=${EXPO_PUBLIC_API_URL}

# Skip TypeScript check, go straight to vite build
RUN cd apps/frontend && ../../node_modules/.bin/vite build

# Production stage - serve static files
FROM node:20-alpine AS runner
WORKDIR /app

RUN npm install -g serve

# Copy built assets
COPY --from=builder /app/apps/frontend/dist ./dist

RUN addgroup --system --gid 1001 nodejs
RUN adduser --system --uid 1001 nextjs

RUN chown -R nextjs:nodejs /app

USER nextjs
EXPOSE 3000

HEALTHCHECK --interval=30s --timeout=3s --start-period=30s --retries=3 \
  CMD node -e "require('http').get('http://localhost:3000/', (r) => {process.exit(r.statusCode === 200 ? 0 : 1)})"

CMD ["serve", "-s", "dist", "-l", "3000"]
