# Synapse Deployment Guide

**One-click deployment for all scenarios: local, hybrid, and cloud.**

---

## Quick Start

### Option 1: Interactive (Recommended)
```bash
./quick-start.sh          # Linux/Mac
quick-start.bat           # Windows
```
Follow the prompts to select your deployment mode.

### Option 2: Direct Mode Selection
```bash
# Full Local (100% offline, Ollama AI)
./quick-start.sh --local

# Docker + Cloud AI (OpenAI/Azure)
./quick-start.sh --cloud

# Bare-metal Dev (Docker DB only)
./quick-start.sh --dev
```

---

## Deployment Scenarios

| Scenario | Database | AI | Frontend | Use Case |
|----------|----------|----|----|----------|
| **Full Local** | Docker PG | Docker Ollama | Docker | Air-gapped, privacy, no API costs |
| **Docker + Cloud** | Docker PG | OpenAI API | Docker | Dev with cloud AI, fastest setup |
| **Bare-metal Dev** | Docker PG | Ollama/OpenAI | Native | Active development, hot reload |
| **Cloud Platform** | Managed PG | OpenAI/Azure | Static host | Production deployment |

---

## Docker Compose Files

### `docker-compose.local.yml` - Full Local/Offline
- **Services**: PostgreSQL + Ollama + Backend + Frontend
- **AI**: Ollama (qwen2.5-coder:7b + nomic-embed-text)
- **Models**: Download automatically on first run (~5GB, 5-10 min)
- **GPU**: Uncomment deploy section in ollama service
- **Use**: `docker compose -f docker-compose.local.yml up -d`

### `docker-compose.yml` - Docker + Cloud AI
- **Services**: PostgreSQL + Backend + Frontend
- **AI**: OpenAI/Azure (requires API key)
- **Use**: `docker compose up -d`

### `docker-compose.hybrid.yml` - Hybrid Mode
- **Services**: PostgreSQL + Backend + Frontend
- **AI**: Cloud (OpenAI or Azure OpenAI)
- **Use**: `docker compose -f docker-compose.hybrid.yml up -d`

---

## Environment Variables

### Required (All Scenarios)
```bash
DATABASE_URL=postgresql://synapse:synapse@postgres:5432/synapse
AUTH_SECRET=change-this-in-production
```

### Cloud AI Mode
```bash
OPENAI_API_KEY=sk-...
MODEL_CHAT=gpt-4o
MODEL_FAST=gpt-3.5-turbo
MODEL_EMBEDDING=text-embedding-3-small
```

### Local AI Mode (Ollama)
```bash
USE_LOCAL_MODELS=true
LOCAL_LLM_ENDPOINT=http://ollama:11434/v1
LOCAL_LLM_MODEL=qwen2.5-coder:7b
LOCAL_EMBEDDING_ENDPOINT=http://ollama:11434/v1
LOCAL_EMBEDDING_MODEL=nomic-embed-text
LOCAL_EMBEDDING_DIMENSIONS=768
```

### Azure OpenAI (Optional)
```bash
USE_AZURE_OPENAI=true
AZURE_OPENAI_ENDPOINT=https://your-resource.openai.azure.com
AZURE_OPENAI_API_KEY=...
AZURE_OPENAI_CHAT_DEPLOYMENT=gpt-4-deployment
AZURE_OPENAI_EMBEDDING_DEPLOYMENT=embedding-deployment
```

### Server Configuration
```bash
CORS_ORIGIN=http://localhost:3000
FRONTEND_PORT=3000
BACKEND_PORT=8000
POSTGRES_PORT=5432
```

---

## Cloud Platform Deployment

### Render
```bash
# Deploy via Render Blueprint
# Uses: render.yaml
# Database: Managed PostgreSQL 16 with pgvector
# Build: Dockerfile-based
```
**Deploy**: Click "Deploy to Render" button or use `render.yaml`

### Railway
```bash
# Deploy via Railway Template
# Uses: railway.json
# Database: PostgreSQL 16 with pgvector extension
# Build: Monorepo-aware (src/api, src/web)
```
**Deploy**: Click "Deploy on Railway" button or use Railway CLI

### Heroku
```bash
# Deploy via Heroku Button
# Uses: app.json, Procfile
# Database: Heroku PostgreSQL Essential-0
# Build: Buildpack-based
```
**Deploy**: Click "Deploy to Heroku" button

### DigitalOcean App Platform
```bash
# Deploy via App Spec
# Uses: app-spec.yaml
# Database: Managed PostgreSQL 16
# Build: Dockerfile-based
```
**Deploy**: Use `doctl apps create --spec app-spec.yaml`

### Azure
```bash
# Deploy via ARM Template
# Uses: azuredeploy.json
# Database: Azure Database for PostgreSQL Flexible Server
# Build: Azure App Service (Node.js)
```
**Deploy**: Use Azure Portal or `az deployment group create`

---

## Local Model Options

### Chat Models (via Ollama)
| Model | Size | Best For | Context |
|-------|------|----------|---------|
| `qwen2.5-coder:7b` | 4.5GB | Code (default) | 32K |
| `gemma3:4b` | 2.6GB | Lightweight, CPU | 8K |
| `phi3.5:latest` | 2.2GB | Microsoft, long context | 128K |
| `llama3.1:8b` | 4.7GB | General purpose | 128K |

### Embedding Models (via Ollama)
| Model | Size | Dimensions | Speed |
|-------|------|------------|-------|
| `nomic-embed-text` | 275MB | 768 | Best quality (default) |
| `all-minilm` | 45MB | 384 | Fastest |

**Change models**: Edit `.env` and set `LOCAL_LLM_MODEL` / `LOCAL_EMBEDDING_MODEL`, then restart.

---

## Architecture Changes

### Fixed Issues
1. ✅ `docker-compose.local.yml` now uses Ollama (was llama.cpp)
2. ✅ All services attached to proper networks
3. ✅ Cloud configs use correct paths (`src/api`, `src/web`)
4. ✅ Frontend `api.ts` no longer hardcodes domain
5. ✅ CORS_ORIGIN properly configured
6. ✅ Dockerfiles use correct Prisma paths
7. ✅ Backend healthcheck uses `curl` instead of Node.js
8. ✅ Frontend Dockerfile removes dead env vars

### New Features
1. ✅ Deployment mode detection in config
2. ✅ Scenario-aware quick-start scripts
3. ✅ Three Docker Compose variants
4. ✅ Standardized environment variables
5. ✅ Azure OpenAI support in all configs

---

## Testing Checklist

### Local Testing (This Machine)
- [ ] Full Local: `./quick-start.sh --local`
  - [ ] Ollama pulls models
  - [ ] Backend connects to Ollama
  - [ ] Frontend loads
  - [ ] Search works
  - [ ] Chat works
  
- [ ] Docker + Cloud: `./quick-start.sh --cloud`
  - [ ] PostgreSQL starts
  - [ ] Backend uses OpenAI
  - [ ] Frontend connects
  
- [ ] Bare-metal Dev: `./quick-start.sh --dev`
  - [ ] PostgreSQL starts
  - [ ] `pnpm dev` works in src/api
  - [ ] `pnpm dev` works in src/web

### Cloud Platform Testing
- [ ] Render deployment
- [ ] Railway deployment
- [ ] Heroku deployment
- [ ] DigitalOcean App Platform
- [ ] Azure deployment

---

## Troubleshooting

### Docker Issues
```bash
# Check Docker is running
docker ps

# View logs
docker compose -f docker-compose.local.yml logs -f

# Restart services
docker compose -f docker-compose.local.yml restart

# Clean rebuild
docker compose -f docker-compose.local.yml down -v
docker compose -f docker-compose.local.yml up --build
```

### Ollama Issues
```bash
# Check Ollama is running
curl http://localhost:11434/api/tags

# Check models are downloaded
docker compose -f docker-compose.local.yml exec ollama ollama list

# Re-download models
docker compose -f docker-compose.local.yml up init-models --force-recreate
```

### Backend Issues
```bash
# Check health
curl http://localhost:8000/api/health

# Check database connection
docker compose -f docker-compose.local.yml exec backend npx prisma db push

# View backend logs
docker compose -f docker-compose.local.yml logs backend
```

### Frontend Issues
```bash
# Check frontend is serving
curl http://localhost:3000

# Rebuild frontend
docker compose -f docker-compose.local.yml up frontend --build

# Check VITE_API_URL
docker compose -f docker-compose.local.yml exec frontend env | grep VITE
```

---

## Performance Tuning

### Local Models (Ollama)
- **CPU**: Use `gemma3:4b` or `phi3.5` (smaller, faster)
- **GPU**: Uncomment GPU section in `docker-compose.local.yml`
- **Memory**: Allocate 8GB+ to Docker Desktop
- **Context**: Reduce `LOCAL_LLM_CONTEXT_LENGTH` if OOM

### Cloud AI
- **Cost**: Use `gpt-3.5-turbo` for `MODEL_FAST`
- **Speed**: Use `text-embedding-3-small` (1536-dim)
- **Quality**: Use `gpt-4o` for `MODEL_CHAT`

---

## Migration from Old Setup

### If you had llama.cpp setup:
1. Remove `./models/` directory (no longer needed)
2. Remove `src/services/embeddings/` (no longer needed)
3. Update `.env` to use Ollama endpoints
4. Run `docker compose -f docker-compose.local.yml up -d`

### If you had custom embedding server:
1. Switch to Ollama embeddings (same endpoint as LLM)
2. Update `LOCAL_EMBEDDING_ENDPOINT` to match `LOCAL_LLM_ENDPOINT`
3. Models download automatically

---

## Next Steps

1. **Choose your deployment mode** (local/cloud/hybrid)
2. **Run quick-start script** for your OS
3. **Open http://localhost:3000**
4. **Login** with demo@synapse.local / DemoPassword123!
5. **Index your first codebase**
6. **Start searching and chatting**

For production deployment, see cloud platform sections above.
