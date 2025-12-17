# synapse - Developer & Agent Guide (v9.5)

## 1. Architecture Identity
*   **App Slug:** `synapse`
*   **Database:** DO Managed Postgres (DB Name: `synapse`)
*   **Storage:** DO Spaces (`sh-storage` bucket, prefix: `synapse/`)
*   **Namespace:** K8s namespace `synapse`

**⛔ NO SUPABASE.** Use `DATABASE_URL` only.

---

## 2. RAG & Vector Standards (STRICT)

### Database Schema
```sql
CREATE EXTENSION IF NOT EXISTS vector;

CREATE TABLE embeddings (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  content TEXT NOT NULL,
  metadata JSONB DEFAULT '{}',
  embedding VECTOR(1024),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE INDEX idx_embeddings_vector ON embeddings USING hnsw (embedding vector_l2_ops);
CREATE INDEX idx_embeddings_metadata ON embeddings USING gin (metadata);
```

### Vector Configuration
- **Dimension:** 1024 (FIXED)
- **Model:** `Alibaba-NLP/gte-large-en-v1.5` (via `MODEL_EMBEDDING`)
- **Table:** `embeddings` (standard name)
- **Index:** HNSW with L2 distance

### Ingestion Pipeline
1. **Web Scraping:** Firecrawl → Markdown → Split → Embed → Store
2. **PDF Processing:** PyPDFLoader → Text → Split → Embed → Store
3. **Chunking:** RecursiveCharacterTextSplitter (size: 1000, overlap: 200)

**Use:** `src/services/ingestion.py` (auto-generated)

---

## 3. Storage Isolation (S3-Compatible)

### Configuration
- **Endpoint:** `https://nyc3.digitaloceanspaces.com`
- **Bucket:** `sh-storage` (SHARED)
- **Prefix:** `synapse/` (MANDATORY for isolation)
- **CDN:** `https://sh-storage.nyc3.cdn.digitaloceanspaces.com/synapse`

### File Upload Example
```python
import boto3
import os

s3 = boto3.client(
    's3',
    endpoint_url=os.getenv("AWS_ENDPOINT_URL"),
    aws_access_key_id=os.getenv("AWS_ACCESS_KEY_ID"),
    aws_secret_access_key=os.getenv("AWS_SECRET_ACCESS_KEY")
)

# MUST use app prefix
key = f"{os.getenv('OBJECT_STORAGE_PREFIX')}myfile.pdf"  # voxops/myfile.pdf
s3.upload_file("/tmp/myfile.pdf", os.getenv("AWS_BUCKET_NAME"), key)
```

**⚠️ CRITICAL:** Always use `OBJECT_STORAGE_PREFIX` to avoid cross-app contamination.

---

## 4. Preferred Models (Use Variables)

| Use Case | Env Variable | Value | Provider |
|----------|--------------|-------|----------|
| **Reasoning** | `MODEL_CHAT` | `openai-gpt-oss-120b` | DO Gateway |
| **Fast Tasks** | `MODEL_FAST` | `openai-gpt-oss-20b` | DO Gateway |
| **Embeddings** | `MODEL_EMBEDDING` | `Alibaba-NLP/gte-large-en-v1.5` | DO Gateway |
| **Image Gen** | `MODEL_IMAGE` | `fal-ai/fast-sdxl` | DO Gateway |
| **TTS** | `MODEL_TTS` | `fal-ai/elevenlabs/tts/multilingual-v2` | DO Gateway |

**Example:**
```typescript
const response = await openai.chat.completions.create({
  model: process.env.MODEL_CHAT,  // ✅ CORRECT
  // model: "gpt-4o",              // ❌ WRONG - Hardcoded
  messages: [...]
});
```

---

## 5. Hybrid AI Stack

### LLM Providers
- **OpenAI (DO Gateway):** `OPENAI_API_KEY` - Primary interface
- **Groq:** `GROQ_API_KEY` - Real-time (500+ tokens/sec)
- **Cerebras:** `CEREBRAS_API_KEY` - Bulk processing
- **AWS Bedrock:** `BEDROCK_ACCESS_KEY_ID` - Claude 3.5 Sonnet

### Voice & Telephony
- **ElevenLabs:** `ELEVENLABS_API_KEY` - TTS/STT
- **Bland AI:** `BLAND_AI_API_KEY` - Phone agents

### Search & Knowledge
- **Firecrawl:** `FIRECRAWL_API_KEY` - Web scraping
- **Tavily:** `TAVILY_API_KEY` - Search API
- **Context7:** `CONTEXT7_API_KEY` - Code docs

---

## 6. Build & Deployment

### Initialize Database (One-Time)
```bash
./scripts/init-database.sh
```

### Build & Deploy
```bash
./scripts/shtrial-build-deploy.sh
```

**Builder Machine:** `sh-builder-nyc3` (143.198.9.100)
**Registry:** `registry.digitalocean.com/shtrial-reg`

---

## 7. Development Workflow

### Local Setup
1. Ensure root `.env` exists (DO NOT create in subdirs)
2. Install dependencies: `pnpm install`
3. Initialize DB: `./scripts/init-database.sh`
4. Run: `npm run dev`

### Ingestion Example
```python
from src.services.ingestion import UnifiedIngestor

ingestor = UnifiedIngestor()

# Web
ingestor.ingest_url("https://docs.example.com/guide")

# PDF
ingestor.ingest_pdf("/path/to/manual.pdf")

# Search
results = ingestor.search("How do I configure X?", top_k=3)
```

---

## 8. Configuration Source

**Local:** Root `.env` file (not committed)
**Production:** K8s Secret `app-secrets` in namespace `synapse`

### Loading .env

**Backend (Node/Python):**
```typescript
// apps/backend/src/main.ts
import * as dotenv from 'dotenv';
import path from 'path';
dotenv.config({ path: path.resolve(__dirname, '../../../.env') });
```

**Frontend (Next.js):**
```json
// apps/web/package.json
{
  "scripts": {
    "dev": "env-cmd -f ../../.env next dev"
  }
}
```

---

## 9. Agent Rules

### When Adding Features
1. **RAG/Search:** Use `src/services/ingestion.py`
2. **File Upload:** MUST use `OBJECT_STORAGE_PREFIX`
3. **Embeddings:** MUST be 1024-dim
4. **Models:** MUST use env variables

### Security
- **Never** log API keys or secrets
- **Never** hardcode model names
- **Always** validate file paths include app prefix
- **Always** use `DATABASE_URL` (not Supabase)

---

**Last Updated:** 2025-12-17
**Standard Version:** v9.5
**RAG:** ✅ Enabled (1024-dim)
**Storage Isolation:** ✅ Enforced
**Hybrid AI:** ✅ 10 Providers
