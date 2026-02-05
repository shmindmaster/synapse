# Synapse RAG Platform - Minimal Setup Guide

## ⚡ Quick Start (5 minutes)

### Prerequisites

- Node.js 20+
- PostgreSQL 14+ (with pgvector extension)
- pnpm 10.23+

### Setup Steps

```bash
# 1. Install dependencies
pnpm install

# 2. CRITICAL: Generate Prisma client (fixes build errors)
pnpm exec prisma generate

# 3. Create environment file
cp .env.example .env

# 4. Update .env with your database URL
# Edit .env and set DATABASE_URL to your PostgreSQL instance
# Example: postgresql://user:password@localhost:5432/synapse

# 5. Build all packages
pnpm build

# 6. Run database migrations
pnpm exec prisma migrate deploy

# 7. Seed demo user
pnpm exec prisma db seed

# 8. Start development
# In terminal 1:
cd apps/backend && npm run dev

# In terminal 2:
cd apps/frontend && npm run dev
```

## 🐳 Using Docker (Recommended for new users)

```bash
# Start everything with PostgreSQL
docker-compose up

# In another terminal, seed the database:
docker exec synapse-backend pnpm exec prisma db seed
```

Then visit: http://localhost:5173

**Demo Credentials:**

- Email: `demomaster@pendoah.ai`
- Password: `Pendoah1225`

## 📋 What Each Step Does

| Step                    | What it does                                        | Why it matters                                             |
| ----------------------- | --------------------------------------------------- | ---------------------------------------------------------- |
| `pnpm install`          | Installs 917 dependencies                           | Enables all code to run                                    |
| `prisma generate`       | **CRITICAL** - Creates TypeScript types from schema | Without this, build fails with "PrismaClient not exported" |
| `cp .env.example .env`  | Creates local environment config                    | Allows you to set database URL securely                    |
| `pnpm build`            | Compiles TypeScript to JavaScript                   | Creates `dist/` folders for production                     |
| `prisma migrate deploy` | Updates database schema                             | Creates tables for users, vectors, audit logs              |
| `prisma db seed`        | Adds demo user                                      | Lets you login without creating an account                 |

## 🔧 Environment Variables

Create `.env` file with:

```env
# Database (REQUIRED)
DATABASE_URL=postgresql://user:password@localhost:5432/synapse

# JWT (Authentication)
AUTH_SECRET=super-secret-auth-key-change-in-prod

# AI/LLM (Optional - defaults work without this)
OPENAI_DIRECT_API_KEY=sk-your-key-here

# Application
NODE_ENV=development
PORT=8000
```

## 🗄️ Database Setup Options

### Option 1: Local PostgreSQL

```bash
# Install PostgreSQL 14+
# Enable pgvector extension:
psql -U postgres
CREATE EXTENSION vector;

# Create database
CREATE DATABASE synapse;

# In .env:
DATABASE_URL=postgresql://postgres:password@localhost:5432/synapse
```

### Option 2: Docker PostgreSQL

```bash
docker run --name synapse-db \
  -e POSTGRES_PASSWORD=password \
  -e POSTGRES_DB=synapse \
  -p 5432:5432 \
  -d pgvector/pgvector:pg16

# Then run migrations:
pnpm exec prisma migrate deploy
```

### Option 3: Docker Compose (Easiest)

```bash
docker-compose up
```

Includes PostgreSQL + pgvector automatically configured.

## ✅ Verify Setup Works

```bash
# Build should succeed
pnpm build
# ✓ All 4 packages compile

# Database is working
pnpm exec prisma db push --skip-generate
# ✓ DB migrations applied

# Demo user exists
pnpm exec prisma db seed
# ✓ User created

# Backend starts on port 8000
cd apps/backend && npm run dev
# ✓ Server listening at http://localhost:8000

# Frontend starts on port 5173
cd apps/frontend && npm run dev
# ✓ App running at http://localhost:5173
```

## 🚀 Next Steps After Setup

1. **Login** with `demomaster@pendoah.ai` / `Pendoah1225`
2. **Upload documents** via the UI
3. **Search** your documents using semantic search
4. **Chat** with your knowledge base
5. **Index more files** from your project

## ❌ Common Issues & Fixes

### Error: "PrismaClient not exported"

**Fix:** Run `pnpm exec prisma generate`

### Error: "Cannot connect to database"

**Fix:** Check DATABASE_URL is correct in .env and PostgreSQL is running

### Error: "pgvector not installed"

**Fix:** Connect to your PostgreSQL and run `CREATE EXTENSION vector;`

### Build fails with TypeScript errors

**Fix:** Try `pnpm install && pnpm exec prisma generate && pnpm build`

### Port 8000 or 5173 already in use

**Fix:**

- Backend: Change PORT in .env and apps/backend/src/config/configuration.ts
- Frontend: Change in apps/frontend/vite.config.ts

## 📊 Architecture Overview

```
┌─────────────────┐
│   Frontend UI   │  React + Vite
│   (port 5173)   │
└────────┬────────┘
         │ HTTP
┌────────▼────────┐
│  Backend API    │  Fastify + TypeScript
│  (port 8000)    │
└────────┬────────┘
         │ SQL
┌────────▼────────┐
│  PostgreSQL     │  pgvector + Prisma
│  + pgvector     │
└─────────────────┘
```

## 📚 Documentation Files

- [README.md](README.md) - Project overview
- [docs/architecture.md](docs/architecture.md) - Detailed architecture
- [docs/use-cases.md](docs/use-cases.md) - Industries and use cases
- [CONTRIBUTING.md](CONTRIBUTING.md) - How to contribute
- [BACKEND_IMPL_CRITICAL_GUIDE.md](BACKEND_IMPL_CRITICAL_GUIDE.md) - API endpoints

## 🤝 Support

- **Issues:** GitHub Issues tab
- **Discussions:** GitHub Discussions for Q&A
- **Wiki:** Detailed guides in GitHub Wiki
- **Email:** team@synapse.dev (if available)

## 📝 What's Included After Setup

✅ Full RAG system working
✅ Demo user for testing
✅ All backend endpoints functional
✅ Semantic search with embeddings (when API key added)
✅ E2E tests ready to run: `cd apps/backend && pnpm test`

## 🎯 You're Ready!

Your Synapse instance is now running with:

- User authentication & authorization
- Document indexing & search
- RAG chat interface
- Full-text and semantic search
- Vector database with PostgreSQL

Start building! 🚀
