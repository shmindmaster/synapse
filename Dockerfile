# Stage 1: Build the Frontend
FROM node:20-alpine AS builder
WORKDIR /app

COPY package.json package-lock.json* pnpm-lock.yaml* ./
# Support both npm and pnpm
RUN if [ -f pnpm-lock.yaml ]; then npm install -g pnpm && pnpm install; else npm ci; fi

COPY . .
RUN if [ -f pnpm-lock.yaml ]; then pnpm build; else npm run build; fi

# Stage 2: Production Runner
FROM node:20-alpine
WORKDIR /app

# Install only production dependencies
COPY package.json package-lock.json* pnpm-lock.yaml* ./
# Support both npm and pnpm
RUN if [ -f pnpm-lock.yaml ]; then npm install -g pnpm && pnpm install --prod; else npm ci --only=production; fi

# Copy backend source and built frontend
COPY server.js ./
COPY synapse_memory.json* ./
COPY --from=builder /app/dist ./dist

# Environment defaults (Override these in your .env file or Azure Configuration)
ENV PORT=3000
ENV NODE_ENV=production

EXPOSE 3000

CMD ["node", "server.js"]

