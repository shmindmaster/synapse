# Stage 1: Build the Frontend
FROM node:20-alpine AS builder
WORKDIR /app

COPY package.json pnpm-lock.yaml* pnpm-workspace.yaml ./
COPY apps/frontend/package.json ./apps/frontend/
COPY apps/backend/package.json ./apps/backend/

# Install pnpm and all dependencies (including frontend deps for build)
RUN npm install -g pnpm && pnpm install

# Copy source code
COPY apps/frontend ./apps/frontend
COPY apps/backend ./apps/backend
COPY prisma ./prisma
COPY tsconfig.json ./
COPY pnpm-workspace.yaml ./

# Generate Prisma client (requires DATABASE_URL at build time)
RUN pnpm db:generate

# Build frontend and backend
RUN pnpm build

# Stage 2: Production Runner
FROM node:20-alpine
WORKDIR /app

# Copy package files first
COPY package.json pnpm-lock.yaml* ./
COPY apps/backend/package.json ./apps/backend/
COPY prisma ./prisma

# Install pnpm and all dependencies (including prisma and tsx for migrations/seeding)
RUN npm install -g pnpm && pnpm install

# Copy backend source and built frontend
COPY apps/backend ./apps/backend
COPY --from=builder /app/apps/frontend/dist ./apps/frontend/dist

# Environment defaults (override these in deployment configuration)
ENV PORT=3000
ENV NODE_ENV=production

EXPOSE 3000

# Run database migrations and seeding before starting the server (with error handling)
CMD sh -c "pnpm exec prisma migrate deploy || echo 'Migration failed, continuing...' && pnpm db:seed || echo 'Seeding failed, continuing...' && node apps/backend/server.js"

