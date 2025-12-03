# Stage 1: Build the Frontend
FROM node:20-alpine AS builder
WORKDIR /app

COPY package.json pnpm-lock.yaml* ./
COPY apps/frontend/package.json ./apps/frontend/
COPY apps/backend/package.json ./apps/backend/

# Install pnpm and all dependencies
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

# Install only production dependencies
COPY package.json pnpm-lock.yaml* ./
COPY apps/backend/package.json ./apps/backend/
RUN npm install -g pnpm && pnpm install --prod

# Copy backend source, built frontend, and Prisma artifacts
COPY apps/backend ./apps/backend
COPY prisma ./prisma
COPY --from=builder /app/apps/frontend/dist ./apps/frontend/dist
COPY --from=builder /app/node_modules/.prisma ./node_modules/.prisma

# Environment defaults (override these in deployment configuration)
ENV PORT=3000
ENV NODE_ENV=production

EXPOSE 3000

# Run database migrations before starting the server
CMD ["sh", "-c", "npx prisma migrate deploy && node apps/backend/server.js"]

