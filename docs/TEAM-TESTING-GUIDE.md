# Synapse Team Testing Guide

**Last Updated:** December 2024

This guide provides three clear testing paths for the team. Start with Path A (fastest), then try Path B if you want to test the full offline experience.

---

## 🚀 Path A: Docker + Cloud AI (Recommended First Test)

**Setup Time:** ~5 minutes  
**Requirements:** Docker, OpenAI API key (free $5 credits available)

This tests the core loop (index → search → chat) with minimal setup.

### Steps

```bash
# 1. Clone and enter directory
git clone https://github.com/shmindmaster/synapse.git
cd synapse

# 2. Create and configure .env
cp .env.example .env

# 3. Edit .env - add your OpenAI key:
#    OPENAI_API_KEY=sk-your-key-here

# 4. Start services (builds take 3-5 min first time)
./quick-start.sh
# Or manually: docker compose up --build -d

# 5. Wait for health checks (~30-60 seconds after build)
# Script will show progress
```

### Test Checklist

- [ ] Open http://localhost:3000
- [ ] Login: `demo@synapse.local` / `DemoPassword123!`
- [ ] Index some files via the web UI
- [ ] Search for content in indexed files
- [ ] Chat with the AI about indexed content
- [ ] Verify search results include source citations

### Troubleshooting

```bash
# Check service status
docker compose ps

# View logs
docker compose logs backend
docker compose logs frontend

# Restart if needed
docker compose down && docker compose up -d
```

---

## 💻 Path B: Docker + Local Models (Full Offline)

**Setup Time:** ~15-20 minutes (mostly model download)  
**Requirements:** Docker, 8GB+ RAM, ~4GB disk space

This tests the privacy story - 100% offline, no API costs.

### Prerequisites

1. **Download the chat model (~2GB)**
   ```bash
   mkdir -p models
   curl -L -o models/Llama-3.2-3B-Instruct-Q4_K_M.gguf \
     https://huggingface.co/bartowski/Llama-3.2-3B-Instruct-GGUF/resolve/main/Llama-3.2-3B-Instruct-Q4_K_M.gguf
   ```

2. **Create embeddings service** (if not exists)
   See `docs/local-offline-deployment.md` for the embedding service setup.

### Steps

```bash
# 1. Clone (skip if already done)
git clone https://github.com/shmindmaster/synapse.git
cd synapse

# 2. Configure for local models
cp .env.example .env
# Edit .env - uncomment: USE_LOCAL_MODELS=true

# 3. Start with local compose file
docker compose -f docker-compose.local.yml up --build -d

# 4. Wait for model loading (~60 seconds for llama.cpp)
docker compose -f docker-compose.local.yml logs -f llama-cpp
# Wait until you see "server listening"
```

### Test Checklist

- [ ] Verify llama-cpp is healthy: `curl http://localhost:8080/health`
- [ ] Verify embeddings is healthy: `curl http://localhost:8081/health`
- [ ] Open http://localhost:3000 and login
- [ ] Index files (embeddings will be 384-dim local)
- [ ] Search should work with local embeddings
- [ ] Chat should use local Llama model

### Known Limitations

- Local models are slower than cloud (~5-15 seconds per response)
- 384-dim embeddings (local) vs 1536-dim (OpenAI) - don't mix in same index
- First request may be slow while model loads

---

## ☁️ Path C: Hybrid (Docker + Remote API)

**Setup Time:** ~5 minutes  
**Use Case:** Local containers, remote AI (for teams with shared API keys)

Same as Path A, but explicitly for the "local infrastructure, cloud AI" scenario.

```bash
# Same as Path A, but with explicit configuration:
cp .env.example .env

# In .env, set:
OPENAI_API_KEY=sk-your-team-shared-key
# Or use Azure:
# USE_AZURE_OPENAI=true
# AZURE_OPENAI_ENDPOINT=https://your-resource.openai.azure.com
# AZURE_OPENAI_API_KEY=your-azure-key

docker compose up --build -d
```

---

## 📋 Quick Reference

| Path | AI Provider | Setup Time | Best For |
|------|-------------|------------|----------|
| **A** | OpenAI Cloud | 5 min | First test, demos |
| **B** | Local (llama.cpp) | 15-20 min | Privacy testing, offline |
| **C** | Azure/Remote | 5 min | Enterprise, shared keys |

## 🔧 Common Issues

### Backend won't start
```bash
docker compose logs backend
# Check for DATABASE_URL errors - ensure postgres is healthy first
```

### Frontend shows "Network Error"
- Backend port is 8000, not 3001
- Check: `curl http://localhost:8000/api/health`

### Search returns no results
- Files indexed without embeddings (no AI configured)
- Check index response: `embeddingsGenerated: true`

### Chat says "configure an OpenAI API key"
- API key not set or not in correct env var
- Check `.env` has `OPENAI_API_KEY=sk-...`

## 📞 Getting Help

- Check logs: `docker compose logs -f`
- GitHub Issues: https://github.com/shmindmaster/synapse/issues
- Full docs: `docs/` directory

---

**Happy Testing! 🧠**
