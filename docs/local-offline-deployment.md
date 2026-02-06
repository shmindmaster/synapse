# Local/Offline Deployment Guide (Ollama-Powered)

Run Synapse **100% offline** with local AI models via [Ollama](https://ollama.com). No cloud APIs, no API keys, no data leaves your machine.

## Why Run Offline?

- **Privacy**: All data stays on your machine
- **Cost**: Zero API charges, ever
- **Compliance**: HIPAA, GDPR, SOC 2 friendly
- **Reliability**: No internet dependency
- **Control**: Choose your own models

## Architecture

```
┌─────────────────────────────────────────────────┐
│              Synapse Backend (Node.js)           │
│  ┌───────────────────────────────────────────┐  │
│  │  OpenAI SDK → routes to baseURL           │  │
│  │  Cloud: api.openai.com                    │  │
│  │  Local: http://ollama:11434/v1  ← HERE    │  │
│  └───────────────────────────────────────────┘  │
└─────────────────────────────────────────────────┘
                       ↓
            ┌──────────────────┐
            │     Ollama       │
            │  (Single binary) │
            │                  │
            │  Chat LLM  ←→  OpenAI-compatible API
            │  Embeddings ←→  /v1/embeddings
            │                  │
            │  GPU auto-detect │
            └──────────────────┘
```

**Key simplification:** Ollama serves **both** chat LLM and embeddings from a single container via an OpenAI-compatible API. No separate Python embedding servers or manual GGUF downloads needed.

---

## Quick Start (Docker)

```bash
# 1. Clone
git clone https://github.com/shmindmaster/synapse.git
cd synapse

# 2. Configure (defaults work — no edits needed)
cp .env.example .env

# 3. Start everything
docker compose -f docker-compose.local.yml up -d

# 4. Watch model downloads (first run only, ~3-10 min)
docker compose -f docker-compose.local.yml logs -f ollama-init

# 5. Open Synapse
open http://localhost:3000
# Login: demo@synapse.local / DemoPassword123!
```

That's it. Ollama automatically pulls the required models on first run.

---

## Default Model Stack

| Role | Model | Dim | Size | Why |
|------|-------|-----|------|-----|
| **Chat LLM** | `qwen2.5-coder:7b` | — | ~4.5GB | Best code understanding, 32K context |
| **Embeddings** | `nomic-embed-text` | 768 | ~275MB | Matryoshka, best quality/speed on Ollama |

### Alternative Chat Models

Set `LOCAL_LLM_MODEL` in `.env` to switch:

| Model | Size | RAM Needed | Best For |
|-------|------|-----------|----------|
| `qwen2.5-coder:7b` | 4.5GB | 8GB+ | **Code tasks** (default) |
| `gemma3:4b` | 2.6GB | 6GB+ | CPU-constrained machines, fast |
| `phi3.5:latest` | 2.2GB | 4GB+ | Smallest, 128K context |
| `llama3.1:8b` | 4.7GB | 10GB+ | General purpose, widely tested |

### Alternative Embedding Models

Set `LOCAL_EMBEDDING_MODEL` in `.env` to switch:

| Model | Dimensions | Size | Best For |
|-------|-----------|------|----------|
| `nomic-embed-text` | 768 | 275MB | **Best quality** (default) |
| `all-minilm` | 384 | 45MB | Fastest, smallest |

---

## Hardware Requirements

### Minimum (CPU-only)

- **RAM**: 8GB (for gemma3:4b) or 12GB (for qwen2.5-coder:7b)
- **Storage**: 8GB free (models + Docker images)
- **CPU**: Any modern multi-core (ARM64 or x86_64)

### Recommended (with GPU)

- **GPU**: NVIDIA with 6GB+ VRAM (RTX 3060 or better)
- **RAM**: 16GB
- **Storage**: 10GB free

---

## GPU Support

Ollama auto-detects NVIDIA GPUs if the NVIDIA Container Toolkit is installed.

### Enable GPU in Docker

1. **Install NVIDIA Container Toolkit**:
   ```bash
   # Ubuntu/Debian
   curl -fsSL https://nvidia.github.io/libnvidia-container/gpgkey | sudo gpg --dearmor -o /usr/share/keyrings/nvidia-container-toolkit-keyring.gpg
   curl -s -L https://nvidia.github.io/libnvidia-container/stable/deb/nvidia-container-toolkit.list | \
     sed 's#deb https://#deb [signed-by=/usr/share/keyrings/nvidia-container-toolkit-keyring.gpg] https://#g' | \
     sudo tee /etc/apt/sources.list.d/nvidia-container-toolkit.list
   sudo apt-get update && sudo apt-get install -y nvidia-container-toolkit
   sudo systemctl restart docker
   ```

2. **Uncomment GPU section** in `docker-compose.local.yml`:
   ```yaml
   ollama:
     deploy:
       resources:
         reservations:
           devices:
             - driver: nvidia
               count: all
               capabilities: [gpu]
   ```

3. **Restart**:
   ```bash
   docker compose -f docker-compose.local.yml up -d
   ```

4. **Verify GPU is in use**:
   ```bash
   # Check Ollama logs for GPU detection
   docker compose -f docker-compose.local.yml logs ollama | grep -i gpu

   # Monitor GPU usage
   nvidia-smi -l 1
   ```

---

## Manual Setup (Without Docker)

If you prefer to run Ollama natively:

### 1. Install Ollama

```bash
# macOS / Linux
curl -fsSL https://ollama.com/install.sh | sh

# Windows — download from https://ollama.com/download
```

### 2. Pull Models

```bash
ollama pull nomic-embed-text
ollama pull qwen2.5-coder:7b
```

### 3. Configure Synapse

Edit `.env`:
```bash
USE_LOCAL_MODELS=true
LOCAL_LLM_ENDPOINT=http://localhost:11434/v1
LOCAL_LLM_MODEL=qwen2.5-coder:7b
LOCAL_EMBEDDING_ENDPOINT=http://localhost:11434/v1
LOCAL_EMBEDDING_MODEL=nomic-embed-text
LOCAL_EMBEDDING_DIMENSIONS=768
```

### 4. Start Synapse

```bash
# Ollama runs as a system service (started on install)
ollama serve  # or it's already running

# Start backend
cd src/api && pnpm install && pnpm run dev

# Start frontend
cd src/web && pnpm install && pnpm run dev
```

---

## Advanced: Alternative Runtimes

Synapse's backend uses the OpenAI SDK with a configurable `baseURL`. Any OpenAI-compatible server works:

### vLLM (GPU, high throughput)

```bash
pip install vllm
vllm serve Qwen/Qwen2.5-Coder-7B-Instruct --host 0.0.0.0 --port 8080

# Set in .env:
LOCAL_LLM_ENDPOINT=http://localhost:8080/v1
```

### LM Studio (GUI, easy)

1. Download from [lmstudio.ai](https://lmstudio.ai)
2. Load a model and start the local server
3. Set `LOCAL_LLM_ENDPOINT=http://localhost:1234/v1` in `.env`

### llama.cpp (minimal, CPU-first)

```bash
./llama-server -m model.gguf --host 0.0.0.0 --port 8080 -c 4096

# Set in .env:
LOCAL_LLM_ENDPOINT=http://localhost:8080/v1
```

### HuggingFace TEI (embeddings only, high perf)

```bash
docker run -p 8081:80 ghcr.io/huggingface/text-embeddings-inference:latest \
  --model-id BAAI/bge-small-en-v1.5

# Set in .env:
LOCAL_EMBEDDING_ENDPOINT=http://localhost:8081/v1
LOCAL_EMBEDDING_MODEL=BAAI/bge-small-en-v1.5
LOCAL_EMBEDDING_DIMENSIONS=384
```

---

## Configuration Reference

All local model settings in `.env`:

```bash
# Core toggle
USE_LOCAL_MODELS=true

# Chat LLM
LOCAL_LLM_ENDPOINT="http://localhost:11434/v1"
LOCAL_LLM_MODEL="qwen2.5-coder:7b"
LOCAL_LLM_CONTEXT_LENGTH=32768
LOCAL_LLM_TIMEOUT=120000         # ms, increase for CPU

# Embeddings
LOCAL_EMBEDDING_ENDPOINT="http://localhost:11434/v1"
LOCAL_EMBEDDING_MODEL="nomic-embed-text"
LOCAL_EMBEDDING_DIMENSIONS=768
EMBEDDING_BATCH_SIZE=50
```

---

## Performance Tuning

### Speed up chat responses
- **Enable GPU** (biggest impact)
- Use smaller model: `gemma3:4b` instead of `qwen2.5-coder:7b`
- Reduce context: `LOCAL_LLM_CONTEXT_LENGTH=4096`

### Speed up embeddings
- Embeddings are fast on CPU — GPU helps for large batch indexing
- Increase batch size: `EMBEDDING_BATCH_SIZE=100`
- Use smaller model: `all-minilm` (384-dim, ~6x smaller)

### Reduce memory usage
- Use `gemma3:4b` (~2.6GB) instead of 7B models (~4.5GB)
- Set `OLLAMA_MAX_LOADED_MODELS=1` to unload idle models

---

## Troubleshooting

### Ollama won't start
```bash
docker compose -f docker-compose.local.yml logs ollama
# Check for port conflicts: lsof -i :11434
```

### Models won't download
```bash
# Check init container
docker compose -f docker-compose.local.yml logs ollama-init

# Manual pull
docker exec synapse-ollama-local ollama pull nomic-embed-text
docker exec synapse-ollama-local ollama pull qwen2.5-coder:7b

# Check disk space (need ~6GB free)
df -h
```

### Slow responses (>30s)
1. Enable GPU (see above)
2. Switch to `gemma3:4b`: smaller, faster
3. Check memory: `docker stats synapse-ollama-local`
4. Reduce context: `LOCAL_LLM_CONTEXT_LENGTH=4096`

### Backend can't connect to Ollama
```bash
# Test from host
curl http://localhost:11434/api/tags

# Test from backend container
docker exec synapse-backend-local curl http://ollama:11434/api/tags

# Verify network
docker network inspect synapse-local_synapse-local
```

### Embeddings not generated during indexing
- Check backend logs: `docker compose logs backend | grep -i embedding`
- Verify Ollama has the embedding model: `curl http://localhost:11434/api/tags`
- Check response includes `embeddingsGenerated: true`

---

## Dimension Mismatch Warning

**Do not mix embedding dimensions in the same index.**

| Mode | Default Model | Dimensions |
|------|--------------|-----------|
| Local (Ollama) | nomic-embed-text | 768 |
| Cloud (OpenAI) | text-embedding-3-small | 1536 |

If you switch between local and cloud modes, **re-index your documents** to regenerate embeddings with the correct dimensions. The database uses dimensionless vectors so both work, but search requires consistent dimensions across the index.

---

## Model Licenses

| Model | License | Commercial Use |
|-------|---------|---------------|
| Qwen 2.5 Coder | Apache 2.0 | Yes |
| Gemma 3 | Gemma License | Yes, with terms |
| Llama 3.1 | Meta License | Yes, with conditions |
| Phi 3.5 | MIT | Yes |
| nomic-embed-text | Apache 2.0 | Yes |

---

## Resources

- [Ollama Documentation](https://ollama.com)
- [Ollama Model Library](https://ollama.com/library)
- [vLLM Documentation](https://docs.vllm.ai/)
- [LM Studio](https://lmstudio.ai)
- [HuggingFace TEI](https://github.com/huggingface/text-embeddings-inference)
