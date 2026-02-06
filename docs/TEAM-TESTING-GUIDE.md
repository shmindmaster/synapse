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

## 💻 Path B: Docker + Local Models via Ollama (Full Offline)

**Setup Time:** ~5 min setup + 3-10 min model download (first run only)  
**Requirements:** Docker, 8GB+ RAM, ~6GB disk space  
**No manual downloads needed** — Ollama pulls models automatically.

This tests the privacy story — 100% offline, zero API costs, no data leaves your machine.

### How It Works

Ollama is a single container that serves **both** the chat LLM and embedding model
via an OpenAI-compatible API. No separate Python services or manual GGUF downloads.

### Steps

```bash
# 1. Clone (skip if already done)
git clone https://github.com/shmindmaster/synapse.git
cd synapse

# 2. Configure
cp .env.example .env
# No edits needed — defaults work for local testing

# 3. Start with local compose file
docker compose -f docker-compose.local.yml up --build -d

# 4. Watch model downloads (first run only, ~3-10 min)
docker compose -f docker-compose.local.yml logs -f ollama-init
# Wait for "Models ready!"
```

### Default Models

| Role | Model | Size | Why |
|------|-------|------|-----|
| **Chat** | `qwen2.5-coder:7b` | ~4.5GB | Best for code understanding, 32K context |
| **Embeddings** | `nomic-embed-text` | ~275MB | 768-dim, Matryoshka, best quality/speed |

To use a **lighter chat model** (CPU-constrained machines), set in `.env`:
```bash
LOCAL_LLM_MODEL=gemma3:4b    # Google Gemma 3 QAT, only ~2.6GB
```

### Test Checklist

- [ ] Verify Ollama is healthy: `curl http://localhost:11434/api/tags`
- [ ] Open http://localhost:3000 and login
- [ ] Index files (embeddings will be 768-dim via nomic-embed-text)
- [ ] Search should work with local embeddings
- [ ] Chat should use local Qwen2.5-Coder model
- [ ] Verify no external API calls (check docker network traffic)

### Known Limitations

- Local LLM is slower than cloud (~3-15 sec per response depending on hardware)
- First request after startup may be slow (model loading into memory)
- 768-dim embeddings (local) vs 1536-dim (OpenAI) — don't mix in same index
- GPU dramatically improves chat speed (see GPU section in docker-compose.local.yml)

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
| **B** | Local (Ollama) | 5 min + model pull | Privacy testing, offline |
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

### Ollama model download stuck (Path B)
```bash
# Check init container logs
docker compose -f docker-compose.local.yml logs ollama-init

# Manual pull if needed
docker exec synapse-ollama-local ollama pull nomic-embed-text
docker exec synapse-ollama-local ollama pull qwen2.5-coder:7b

# Verify models installed
curl http://localhost:11434/api/tags
```

### Slow local responses (Path B)
- Enable GPU support (see docker-compose.local.yml GPU section)
- Switch to smaller model: `LOCAL_LLM_MODEL=gemma3:4b` in `.env`
- Embeddings are fast on CPU — only chat benefits from GPU

## 📞 Getting Help

- Check logs: `docker compose logs -f`
- GitHub Issues: https://github.com/shmindmaster/synapse/issues
- Full docs: `docs/` directory

---

**Happy Testing! 🧠**
