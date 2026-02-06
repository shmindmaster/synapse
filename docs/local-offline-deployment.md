# Local/Offline Deployment Guide

This guide explains how to run Synapse **completely offline** without cloud AI services, using local models with technologies like **llama.cpp**, **vLLM**, and **sentence-transformers**.

## Why Run Offline?

✅ **Privacy**: All data stays on your machine
✅ **Cost**: No API charges
✅ **Compliance**: Meet strict data residency requirements
✅ **Reliability**: No internet dependency
✅ **Customization**: Full control over models

## Architecture Overview

```
┌─────────────────────────────────────────────────────┐
│                    Synapse Backend                  │
│  ┌──────────────────────────────────────────────┐  │
│  │  AI Service Abstraction Layer                │  │
│  │  - OpenAI API (Cloud)                        │  │
│  │  - Azure OpenAI (Cloud)                      │  │
│  │  - Local Models (Offline) ← THIS GUIDE      │  │
│  └──────────────────────────────────────────────┘  │
└─────────────────────────────────────────────────────┘
           ↓                           ↓
    ┌──────────────┐          ┌─────────────────┐
    │  llama.cpp   │          │ sentence-       │
    │  HTTP Server │          │ transformers    │
    │  (Chat/Code) │          │ (Embeddings)    │
    └──────────────┘          └─────────────────┘
         ↓                              ↓
    Local GGUF                    Local PyTorch
    Model Files                   Model Files
```

## Quick Start

### Prerequisites

**Hardware Requirements (Minimum)**:

- **RAM**: 12GB+ (for 7B models)
- **Storage**: 10GB+ free
- **CPU**: Multi-core (ARM64 or x86_64)
- **GPU**: Optional (NVIDIA with CUDA for better performance)

**Software Requirements**:

- Docker and Docker Compose
- OR Python 3.10+ and Node.js 20+

### Option 1: Docker Compose (Recommended)

The fastest way to get started:

```bash
# Clone and navigate to repo
git clone https://github.com/yourusername/synapse.git
cd synapse

# Start with local models
docker-compose -f docker-compose.local.yml up -d

# Check status
docker-compose -f docker-compose.local.yml ps

# View logs
docker-compose -f docker-compose.local.yml logs -f
```

This will:

1. Start PostgreSQL with pgvector
2. Download and run llama.cpp with Llama 3.2 (3B)
3. Download and run sentence-transformers embedding server
4. Start Synapse backend configured for local models
5. Start Synapse frontend

### Option 2: Manual Setup

For more control, follow the detailed setup below.

## Detailed Setup Guide

### Step 1: Choose Your Chat Model

#### Option A: llama.cpp (CPU-first, Recommended)

**Best for**: Running on CPU, laptops, servers without GPU

1. **Install llama.cpp**:

```bash
# macOS/Linux
git clone https://github.com/ggerganov/llama.cpp
cd llama.cpp
make

# Windows (with CMake)
git clone https://github.com/ggerganov/llama.cpp
cd llama.cpp
cmake -B build
cmake --build build --config Release
```

2. **Download a model** (GGUF format):

```bash
# Download Llama 3.2 3B (4-bit quantized, ~2GB)
huggingface-cli download \
  bartowski/Llama-3.2-3B-Instruct-GGUF \
  Llama-3.2-3B-Instruct-Q4_K_M.gguf \
  --local-dir ./models

# OR download manually from:
# https://huggingface.co/bartowski/Llama-3.2-3B-Instruct-GGUF
```

**Recommended models**:
| Model | Size | RAM | Use Case |
|-------|------|-----|----------|
| Llama 3.2 3B Q4_K_M | 2GB | 4GB | Fastest, good quality |
| Llama 3.2 3B Q5_K_M | 2.5GB | 6GB | Better quality |
| Qwen 2.5 7B Q4_K_M | 4.4GB | 8GB | Code-focused |
| Llama 3.1 8B Q4_K_M | 4.9GB | 10GB | Best general purpose |

3. **Start llama.cpp server**:

```bash
# Start HTTP server
./llama-server \
  -m ./models/Llama-3.2-3B-Instruct-Q4_K_M.gguf \
  -c 4096 \
  --host 0.0.0.0 \
  --port 8080 \
  -ngl 0  # Use -ngl 35 if you have GPU

# Server will be available at http://localhost:8080
```

4. **Test it**:

```bash
curl http://localhost:8080/v1/chat/completions \
  -H "Content-Type: application/json" \
  -d '{
    "messages": [{"role": "user", "content": "Hello!"}],
    "temperature": 0.7,
    "max_tokens": 100
  }'
```

#### Option B: vLLM (GPU-first, High Performance)

**Best for**: Linux servers with NVIDIA GPU (compute ≥7.0)

⚠️ **Requirements**: Linux, NVIDIA GPU, CUDA 12.1+

1. **Install vLLM**:

```bash
# Create virtual environment
python3 -m venv vllm-env
source vllm-env/bin/activate

# Install vLLM
pip install vllm

# Verify GPU
python -c "import torch; print(torch.cuda.is_available())"
```

2. **Download model**:

```bash
# vLLM uses HuggingFace format (not GGUF)
huggingface-cli download meta-llama/Llama-3.2-3B-Instruct \
  --local-dir ./models/Llama-3.2-3B-Instruct
```

3. **Start vLLM server**:

```bash
vllm serve meta-llama/Llama-3.2-3B-Instruct \
  --host 0.0.0.0 \
  --port 8080 \
  --dtype auto \
  --max-model-len 4096

# Server provides OpenAI-compatible API at http://localhost:8080/v1
```

4. **Test it**:

```bash
curl http://localhost:8080/v1/chat/completions \
  -H "Content-Type: application/json" \
  -d '{
    "model": "meta-llama/Llama-3.2-3B-Instruct",
    "messages": [{"role": "user", "content": "Hello!"}],
    "temperature": 0.7,
    "max_tokens": 100
  }'
```

### Step 2: Setup Local Embeddings

#### sentence-transformers Python Server

1. **Create embedding server** (`embedding_server.py`):

```python
#!/usr/bin/env python3
"""
Local embedding server using sentence-transformers
Compatible with OpenAI embeddings API
"""
from flask import Flask, request, jsonify
from sentence_transformers import SentenceTransformer
import numpy as np

app = Flask(__name__)

# Load model (384-dim, fast, good quality)
model = SentenceTransformer('all-MiniLM-L6-v2')

# OR use larger model (768-dim, better quality, slower)
# model = SentenceTransformer('all-mpnet-base-v2')

@app.route('/v1/embeddings', methods=['POST'])
def create_embedding():
    data = request.json
    input_text = data.get('input')

    if isinstance(input_text, str):
        input_text = [input_text]

    # Generate embeddings
    embeddings = model.encode(input_text, convert_to_numpy=True)

    # Format response to match OpenAI API
    response = {
        'object': 'list',
        'data': [
            {
                'object': 'embedding',
                'embedding': emb.tolist(),
                'index': idx
            }
            for idx, emb in enumerate(embeddings)
        ],
        'model': 'all-MiniLM-L6-v2',
        'usage': {
            'prompt_tokens': sum(len(text.split()) for text in input_text),
            'total_tokens': sum(len(text.split()) for text in input_text)
        }
    }

    return jsonify(response)

@app.route('/health', methods=['GET'])
def health():
    return jsonify({'status': 'ok'})

if __name__ == '__main__':
    print("Starting embedding server on http://localhost:8081")
    print(f"Model: {model}")
    print(f"Embedding dimension: {model.get_sentence_embedding_dimension()}")
    app.run(host='0.0.0.0', port=8081)
```

2. **Install dependencies**:

```bash
pip install flask sentence-transformers torch
```

3. **Start embedding server**:

```bash
python embedding_server.py

# Server will be available at http://localhost:8081
```

4. **Test it**:

```bash
curl http://localhost:8081/v1/embeddings \
  -H "Content-Type: application/json" \
  -d '{
    "input": "Hello world",
    "model": "all-MiniLM-L6-v2"
  }'
```

### Step 3: Configure Synapse Backend

1. **Update `.env` file**:

```bash
# ====================================
# LOCAL/OFFLINE MODE CONFIGURATION
# ====================================

# Enable local model mode
USE_LOCAL_MODELS=true

# Chat model endpoint (llama.cpp or vLLM)
LOCAL_LLM_ENDPOINT=http://localhost:8080
LOCAL_LLM_MODEL=Llama-3.2-3B-Instruct

# Embedding model endpoint (sentence-transformers)
LOCAL_EMBEDDING_ENDPOINT=http://localhost:8081
LOCAL_EMBEDDING_MODEL=all-MiniLM-L6-v2
LOCAL_EMBEDDING_DIMENSIONS=384

# Disable cloud services
USE_AZURE_OPENAI=false
OPENAI_API_KEY=not-required-for-local-mode

# Database (use local PostgreSQL)
DATABASE_URL=postgresql://synapse:synapse@localhost:5432/synapse

# ====================================
# OPTIONAL: PERFORMANCE TUNING
# ====================================

# Context length (must match your model)
LOCAL_LLM_CONTEXT_LENGTH=4096

# Timeout for local inference (ms)
LOCAL_LLM_TIMEOUT=30000

# Batch size for embeddings
EMBEDDING_BATCH_SIZE=10
```

2. **Update backend configuration** (`src/api/src/config/configuration.ts`):

```typescript
export const config = {
  // ... existing config ...

  // NEW: Local models configuration
  localModels: {
    enabled: process.env.USE_LOCAL_MODELS === 'true',

    llm: {
      endpoint: process.env.LOCAL_LLM_ENDPOINT || 'http://localhost:8080',
      model: process.env.LOCAL_LLM_MODEL || 'local-model',
      contextLength: parseInt(process.env.LOCAL_LLM_CONTEXT_LENGTH || '4096'),
      timeout: parseInt(process.env.LOCAL_LLM_TIMEOUT || '30000'),
    },

    embeddings: {
      endpoint: process.env.LOCAL_EMBEDDING_ENDPOINT || 'http://localhost:8081',
      model: process.env.LOCAL_EMBEDDING_MODEL || 'all-MiniLM-L6-v2',
      dimensions: parseInt(process.env.LOCAL_EMBEDDING_DIMENSIONS || '384'),
      batchSize: parseInt(process.env.EMBEDDING_BATCH_SIZE || '10'),
    },
  },
};
```

3. **Update AI Service** (`src/api/src/services/aiService.ts`):

```typescript
import { OpenAI } from 'openai';
import { config } from '../config/configuration';

class AIService {
  private client: OpenAI;

  constructor() {
    if (config.localModels.enabled) {
      // Use local model server (llama.cpp or vLLM)
      this.client = new OpenAI({
        baseURL: config.localModels.llm.endpoint + '/v1',
        apiKey: 'not-needed', // Local servers don't need auth
        timeout: config.localModels.llm.timeout,
      });
    } else if (config.azureOpenai.enabled) {
      this.client = this.createAzureClient();
    } else {
      this.client = new OpenAI({ apiKey: config.openai.apiKey });
    }
  }

  async generateResponse(messages: any[]): Promise<string> {
    const modelName = config.localModels.enabled
      ? config.localModels.llm.model
      : config.azureOpenai.enabled
        ? config.azureOpenai.chatDeployment
        : config.openai.model;

    const completion = await this.client.chat.completions.create({
      model: modelName,
      messages,
      max_tokens: config.openai.maxTokens,
      temperature: config.openai.temperature,
    });

    return completion.choices[0]?.message?.content || '';
  }

  // ... rest of methods
}

export default new AIService();
```

4. **Update Embedding Service** (`src/api/src/services/embeddingService.ts`):

```typescript
import { OpenAI } from 'openai';
import { config } from '../config/configuration';

class EmbeddingService {
  private client: OpenAI;

  constructor() {
    if (config.localModels.enabled) {
      // Use local embedding server (sentence-transformers)
      this.client = new OpenAI({
        baseURL: config.localModels.embeddings.endpoint + '/v1',
        apiKey: 'not-needed',
      });
    } else if (config.azureOpenai.enabled) {
      this.client = this.createAzureClient();
    } else {
      this.client = new OpenAI({ apiKey: config.openai.apiKey });
    }
  }

  async generateEmbedding(text: string): Promise<number[]> {
    const modelName = config.localModels.enabled
      ? config.localModels.embeddings.model
      : config.azureOpenai.enabled
        ? config.azureOpenai.embeddingDeployment
        : 'text-embedding-ada-002';

    const response = await this.client.embeddings.create({
      model: modelName,
      input: text,
    });

    return response.data[0].embedding;
  }

  async generateEmbeddings(texts: string[]): Promise<number[][]> {
    if (config.localModels.enabled) {
      // Batch processing for local embeddings
      const batchSize = config.localModels.embeddings.batchSize;
      const batches = [];

      for (let i = 0; i < texts.length; i += batchSize) {
        const batch = texts.slice(i, i + batchSize);
        batches.push(this.batchEmbed(batch));
      }

      const results = await Promise.all(batches);
      return results.flat();
    } else {
      // Standard OpenAI batch embedding
      const response = await this.client.embeddings.create({
        model: config.localModels.enabled
          ? config.localModels.embeddings.model
          : 'text-embedding-ada-002',
        input: texts,
      });

      return response.data.map(d => d.embedding);
    }
  }

  private async batchEmbed(texts: string[]): Promise<number[][]> {
    const response = await this.client.embeddings.create({
      model: config.localModels.embeddings.model,
      input: texts,
    });
    return response.data.map(d => d.embedding);
  }

  // ... rest of methods
}

export default new EmbeddingService();
```

### Step 4: Start Everything

```bash
# Start PostgreSQL (if not using Docker)
# ... see docker-compose.yml for setup

# Start llama.cpp server
./llama-server -m ./models/Llama-3.2-3B-Instruct-Q4_K_M.gguf -c 4096 --port 8080

# Start embedding server
python embedding_server.py

# Start Synapse backend
cd src/api
pnpm install
pnpm run dev

# Start Synapse frontend
cd src/web
pnpm install
pnpm run dev
```

## Docker Compose Setup

Create `docker-compose.local.yml`:

```yaml
version: '3.8'

services:
  db:
    image: pgvector/pgvector:pg16
    environment:
      POSTGRES_USER: synapse
      POSTGRES_PASSWORD: synapse
      POSTGRES_DB: synapse
    volumes:
      - postgres_data:/var/lib/postgresql/data
    ports:
      - '5432:5432'
    healthcheck:
      test: ['CMD-SHELL', 'pg_isready -U synapse']
      interval: 10s
      timeout: 5s
      retries: 5

  llama-cpp:
    image: ghcr.io/ggerganov/llama.cpp:server
    command: >
      --model /models/Llama-3.2-3B-Instruct-Q4_K_M.gguf
      --host 0.0.0.0
      --port 8080
      --ctx-size 4096
      --n-gpu-layers 0
    volumes:
      - ./models:/models:ro
    ports:
      - '8080:8080'
    environment:
      - OMP_NUM_THREADS=8
    deploy:
      resources:
        limits:
          cpus: '8'
          memory: 8G

  embeddings:
    build:
      context: ./services/embeddings
      dockerfile: Dockerfile
    ports:
      - '8081:8081'
    environment:
      - MODEL_NAME=all-MiniLM-L6-v2
    healthcheck:
      test: ['CMD', 'curl', '-f', 'http://localhost:8081/health']
      interval: 30s
      timeout: 10s
      retries: 3

  backend:
    build:
      context: ./apps/backend
    depends_on:
      db:
        condition: service_healthy
      llama-cpp:
        condition: service_started
      embeddings:
        condition: service_healthy
    environment:
      - NODE_ENV=production
      - DATABASE_URL=postgresql://synapse:synapse@db:5432/synapse
      - USE_LOCAL_MODELS=true
      - LOCAL_LLM_ENDPOINT=http://llama-cpp:8080
      - LOCAL_EMBEDDING_ENDPOINT=http://embeddings:8081
      - PORT=3000
    ports:
      - '3000:3000'

  frontend:
    build:
      context: ./apps/frontend
    depends_on:
      - backend
    environment:
      - VITE_API_URL=http://localhost:3000
    ports:
      - '5173:80'

volumes:
  postgres_data:
```

## Model Selection Guide

### Chat Models

| Model        | Params | Quant  | Size  | RAM  | Speed  | Quality | Best For        |
| ------------ | ------ | ------ | ----- | ---- | ------ | ------- | --------------- |
| Llama 3.2 3B | 3B     | Q4_K_M | 2GB   | 4GB  | ⚡⚡⚡ | ★★★☆    | Fast responses  |
| Qwen 2.5 7B  | 7B     | Q4_K_M | 4.4GB | 8GB  | ⚡⚡☆  | ★★★★    | Code tasks      |
| Llama 3.1 8B | 8B     | Q5_K_M | 5.9GB | 10GB | ⚡☆☆   | ★★★★★   | General purpose |
| Mixtral 8x7B | 47B    | Q4_K_M | 26GB  | 32GB | ☆☆☆    | ★★★★★   | Best quality    |

### Embedding Models

| Model                  | Dimensions | Size  | Speed  | Quality | Best For        |
| ---------------------- | ---------- | ----- | ------ | ------- | --------------- |
| all-MiniLM-L6-v2       | 384        | 80MB  | ⚡⚡⚡ | ★★★☆    | Fast, general   |
| all-mpnet-base-v2      | 768        | 420MB | ⚡⚡☆  | ★★★★    | Better quality  |
| BAAI/bge-small-en-v1.5 | 384        | 120MB | ⚡⚡⚡ | ★★★★    | Retrieval tasks |
| BAAI/bge-base-en-v1.5  | 768        | 440MB | ⚡⚡☆  | ★★★★★   | Best quality    |

## Performance Tuning

### CPU Optimization

```bash
# llama.cpp: Increase thread count
./llama-server -m model.gguf -t 12  # Use more CPU cores

# Enable memory locking (Linux)
./llama-server -m model.gguf --mlock

# Use quantized models
# Q4_K_M: 4-bit quantization, good balance
# Q5_K_M: 5-bit quantization, better quality
# Q8_0: 8-bit quantization, highest quality
```

### GPU Acceleration

```bash
# llama.cpp with GPU offloading
./llama-server -m model.gguf -ngl 35  # Offload 35 layers to GPU

# Check GPU usage
nvidia-smi -l 1

# vLLM automatically uses GPU
# Control memory usage with --gpu-memory-utilization
vllm serve model --gpu-memory-utilization 0.8
```

### Memory Management

```bash
# Reduce context size if running out of memory
./llama-server -m model.gguf -c 2048  # Smaller context

# Use smaller quantization
# Q4_K_M uses ~50% less memory than Q8_0

# Limit batch size for embeddings
EMBEDDING_BATCH_SIZE=5  # Process 5 texts at a time
```

## Troubleshooting

### Issue: "Out of memory" error

**Solutions**:

1. Use smaller model (3B instead of 7B)
2. Lower quantization (Q4_K_M instead of Q5_K_M)
3. Reduce context size (`-c 2048` instead of `-c 4096`)
4. Close other applications

### Issue: llama.cpp server won't start

**Check**:

```bash
# Verify model file exists
ls -lh ./models/*.gguf

# Test directly
./llama-cli -m ./models/model.gguf -p "Hello"

# Check logs
./llama-server -m ./models/model.gguf --log-file llama.log
```

### Issue: Slow inference (>30s per response)

**Solutions**:

1. Use smaller model
2. Enable GPU offloading: `-ngl 35`
3. Increase threads: `-t 8`
4. Use Q4_K_M quantization
5. Reduce max_tokens in requests

### Issue: Embeddings fail to generate

**Check embedding server**:

```bash
# Test health endpoint
curl http://localhost:8081/health

# Test embedding
curl http://localhost:8081/v1/embeddings \
  -H "Content-Type: application/json" \
  -d '{"input": "test"}'

# Check Python logs
python embedding_server.py
```

### Issue: Backend can't connect to local models

**Verify connectivity**:

```bash
# Test LLM endpoint
curl http://localhost:8080/health

# Test from Docker container (if using Docker)
docker exec synapse-backend curl http://llama-cpp:8080/health

# Check firewall settings
# Ensure ports 8080 and 8081 are accessible
```

## Cost & Performance Comparison

### Infrastructure Costs (Self-Hosted vs Cloud)

| Configuration    | Hardware              | Monthly Cost | Performance |
| ---------------- | --------------------- | ------------ | ----------- |
| **Local CPU**    | Desktop PC (12GB RAM) | $0           | ~10 tok/s   |
| **Local GPU**    | NVIDIA RTX 4090       | $0\*         | ~100 tok/s  |
| **Cloud OpenAI** | GPT-4 Turbo API       | $100-500     | ~50 tok/s   |
| **Azure OpenAI** | GPT-4 Turbo           | $100-500     | ~50 tok/s   |

\*Electricity cost ~$20/month for 24/7 operation

### Quality Comparison

| Metric         | OpenAI GPT-4 | Local Llama 3.1 8B | Local Qwen 2.5 7B |
| -------------- | ------------ | ------------------ | ----------------- |
| **General QA** | ★★★★★        | ★★★★☆              | ★★★★☆             |
| **Code Gen**   | ★★★★★        | ★★★☆☆              | ★★★★★             |
| **RAG Tasks**  | ★★★★★        | ★★★★☆              | ★★★★☆             |
| **Speed**      | ~50 tok/s    | ~10 tok/s (CPU)    | ~10 tok/s (CPU)   |
| **Privacy**    | ❌ Cloud     | ✅ Offline         | ✅ Offline        |

## Security & Privacy

### Benefits of Local Deployment

✅ **No data leaves your network**
✅ **No usage logging by third parties**
✅ **Full audit trail control**
✅ **Compliance-friendly (HIPAA, GDPR, SOC 2)**
✅ **No vendor lock-in**

### Best Practices

1. **Network Isolation**: Run models on isolated network segment
2. **Access Control**: Restrict access to model endpoints
3. **Audit Logging**: Log all model requests/responses
4. **Model Integrity**: Verify model checksums after download
5. **Regular Updates**: Keep llama.cpp and models up to date

## Model Licenses

⚠️ **Always check model licenses before use**

| Model         | License      | Commercial Use     | Attribution  |
| ------------- | ------------ | ------------------ | ------------ |
| Llama 3.2     | Meta License | ✅ With conditions | Required     |
| Qwen 2.5      | Apache 2.0   | ✅ Yes             | Not required |
| Mistral       | Apache 2.0   | ✅ Yes             | Not required |
| all-MiniLM-L6 | Apache 2.0   | ✅ Yes             | Not required |

## Next Steps

- **Cloud Deployment**: See [One-Click Deployment Guide](./one-click-deploy.md)
- **Azure OpenAI**: Configure Azure OpenAI credentials in your `.env` file
- **Docker Development**: See [Docker Deployment Guide](./docker-deploy.md)

## Resources

- [llama.cpp Documentation](https://github.com/ggerganov/llama.cpp)
- [vLLM Documentation](https://docs.vllm.ai/)
- [sentence-transformers](https://www.sbert.net/)
- [HuggingFace Model Hub](https://huggingface.co/models)
- [GGUF Model Collection](https://huggingface.co/models?library=gguf)

## Support

If you encounter issues with local/offline deployment:

1. Check the troubleshooting section above
2. Review the [llama.cpp issues](https://github.com/ggerganov/llama.cpp/issues)
3. Open an issue on the [Synapse GitHub repository](https://github.com/yourusername/synapse/issues)
