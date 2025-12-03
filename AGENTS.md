# AI Agent Guidelines (agents.md)

This repository is AI-agent-friendly, but with strict rules.

These instructions apply to **all coding agents**, including:
- GitHub Copilot / Copilot Workspace / Copilot Agents
- Gemini CLI / Gemini Code Assist
- Cursor, Windsurf, Devin, and any other codegen or refactor agents

---

## 1. Global Infrastructure Model (DigitalOcean-only)

All code in this repo must assume the **canonical shared infrastructure** defined by the central .env.shared for the sh organization.

### 1.1 Organization & Region
- SH_ORG_PREFIX=sh 
- SH_REGION=nyc3 

### 1.2 Managed PostgreSQL (Shared Cluster)
Canonical DB resources:
- SH_DB_CLUSTER_NAME=sh-shared-postgres 
- SH_DB_CLUSTER_ID=<managed-cluster-id> 

Connection env vars (names must not change):
- DB_HOST, DB_HOST_PRIVATE, DB_PORT 
- DB_USER, DB_PASSWORD, DB_SSL_MODE 
- DO_DATABASE_URL_PUBLIC, DO_DATABASE_URL_PRIVATE 
- DATABASE_URL, DATABASE_URL_PRIVATE 

**Agent rules:**
1. Use this **single managed Postgres cluster** for all relational database needs.
2. Use **separate databases or schemas** for different apps/features.
3. Do **not**:
   - Spin up new Postgres Droplets.
   - Create additional managed Postgres clusters for convenience.
   - Hardcode DB credentials in code.

### 1.3 Spaces & CDN (Shared Bucket)
Canonical storage resources:
- DO_SPACES_ENDPOINT=https://nyc3.digitaloceanspaces.com 
- DO_SPACES_BUCKET=voxops 
- SH_SPACES_BUCKET=voxops 
- DO_SPACES_REGION=nyc3 
- DO_SPACES_CDN_ENDPOINT=https://voxops.nyc3.cdn.digitaloceanspaces.com 
- NEXT_PUBLIC_CDN_BASE_URL=https://voxops.nyc3.cdn.digitaloceanspaces.com 

**Agent rules:**
1. Use the **existing voxops bucket** for all object storage.
2. Organize by path prefix (voxops/<app-name>/...) rather than creating new buckets.
3. Serve public assets via DO_SPACES_CDN_ENDPOINT / NEXT_PUBLIC_CDN_BASE_URL.
4. Creating new Spaces buckets or regions requires explicit human approval.

---

## 2. AI Stack, Models, and Hatch Billing

### 2.1 Hatch Reality (Billing Model)
- **Hatch does not give you free proprietary APIs (like OpenAI).**
- Hatch gives **credits and discounts** for:
  - Gradient AI GPU Droplets and Bare Metal
  - Gradient AI Platform (Serverless Inference, Agents, Knowledge Bases)
  - 1-Click Models

We pay **DigitalOcean** for GPU/Platform usage (offset by Hatch).  
We do **not** pay per-vendor SaaS subscriptions for each model when using Gradient/1-Click.

### 2.2 Canonical LLM & Inference Env Vars
Canonical env vars:
- DIGITALOCEAN_INFERENCE_ENDPOINT 
- DIGITALOCEAN_MODEL_KEY 
- AI_PROVIDER=digitalocean 
- AI_MODEL (primary LLM)
- SH_GRADIENT_KEY_NAME 
- SH_GRADIENT_KEY_UUID 

Suggested model strategy (examples; IDs live in env):
- **Primary general-purpose LLM (AI_MODEL):** A strong Llama 3 / 3.1 / 3.2 Instruct variant.
- **Optional cheap/fast models:** Mistral / Mixtral / smaller Llama models.
- **Vision / multimodal:** Llama 3.2 Vision.

**Agent rules:**
- All LLM calls must go through a **central gateway/client module** (e.g., src/lib/ai/doClient.ts).
- Code should reference env vars (AI_MODEL, etc.), never hardcoded model strings.

### 2.3 RAG & Embeddings
Canonical env vars:
- DO_RAG_REGION 
- DO_RAG_OPENSEARCH_REGION_OPTIONS 
- DO_RAG_EMBEDDING_MODEL_ID_1, _2, _3 
- DO_RAG_EMBEDDING_MODEL_DEFAULT=GTE LARGE EN V1.5 
- DO_RAG_EMBEDDING_MODEL_LOW_COST_1=All MiniLM L6 v2 

**Agent rules:**
- Use DO_RAG_EMBEDDING_MODEL_DEFAULT by default.
- All embedding calls must go through a shared RAG client module.

### 2.4 Image & Audio via fal
Canonical env vars:
- FAL_MODEL_FAST_SDXL
- FAL_MODEL_FLUX_SCHNELL
- FAL_MODEL_STABLE_AUDIO
- FAL_MODEL_TTS_V2

**Agent rules:**
- All image/audio generation should use these env vars and a shared fal/Gradient client.

### 2.5 Speech & Voice (ASR / TTS on GPUs)
Speech workloads run on **GPU Droplets or 1-Click Models**, billed as GPUs.
- ASR: Sesame Conversational Speech Model (CSM) or similar.
- TTS: Kokoro, F5-TTS, Maya1, SparkTTS, etc.

**Agent rules:**
- Do not build per-repo ASR/TTS stacks.
- Treat speech as a **separate internal service**.

---

## 3. Foundational Dev Services
Env names (global):
- DNS: NAMECHEAP_API_USER, NAMECHEAP_API_KEY
- GitHub: GITHUB_PAT_SHMINDMASTER, GITHUB_PAT_SH-PENDOAH
- Scraping: FIRECRAWL_API_KEY, CONTEXT7_API_KEY, TAVILY_API_KEY, DEVIN_API_KEY

**Agent rules:**
- Never hardcode these values.

---

## 4. Tooling & Code Style
1. **Package manager:** Always use **pnpm** for Node/TypeScript repos.
2. **Languages & frameworks:** Prefer TypeScript. Match current framework (React, Next.js, Vite).
3. **File system rules:** Do **not** modify node_modules/, build output, or generated code/UI components.

---

## 5. Security & Secrets
- Do not commit .env* with secrets.
- Read all secrets from env vars.
