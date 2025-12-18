# PENDOAH/SHTRIAL Unified Standardization Playbook
**Version:** v9.5 (Unified)
**Last Updated:** 2025-12-17
**Status:** Production Ready
**For:** This Repository
**Platform:** SHTrial Platform

---

## Table of Contents

1. [Quick Start](#quick-start)
2. [Architecture & Standards](#architecture--standards)
3. [Infrastructure Setup](#infrastructure-setup)
4. [Repository Standardization](#repository-standardization)
5. [Hybrid AI Configuration](#hybrid-ai-configuration)
6. [RAG & Storage Standards](#rag--storage-standards)
7. [Build & Deployment Workflow](#build--deployment-workflow)
8. [Validation & Monitoring](#validation--monitoring)
9. [Troubleshooting](#troubleshooting)
10. [Reference](#reference)

---

## Quick Start

### Getting Started with This Repository

**1. Verify Configuration:**
```bash
# Check that .env exists (generated from .env.example)
cat .env

# Verify APP_SLUG matches repository name
grep APP_SLUG .env
```

**2. Initialize Database (First Time Only):**
```bash
# Set up RAG database with pgvector
./scripts/init-database.sh
```

**3. Inject Secrets to Kubernetes (First Time Only):**
```bash
# Create K8s secrets from .env
./scripts/inject-secrets.sh
```

**4. Deploy Application:**
```bash
# Build and deploy backend
APP_SLUG=$(grep APP_SLUG .env | cut -d'=' -f2) ROLE=backend DOCKERFILE=apps/backend/Dockerfile ./scripts/shtrial-build-deploy.sh

# Build and deploy frontend
APP_SLUG=$(grep APP_SLUG .env | cut -d'=' -f2) ROLE=frontend DOCKERFILE=apps/web/Dockerfile ./scripts/shtrial-build-deploy.sh
```

**5. Verify Deployment:**
```bash
# Check deployment status
kubectl get pods -n $(grep APP_SLUG .env | cut -d'=' -f2)

# View logs
kubectl logs -f -n $(grep APP_SLUG .env | cut -d'=' -f2) deployment/$(grep APP_SLUG .env | cut -d'=' -f2)-backend
```

---

## Architecture & Standards

### Infrastructure Components

```
┌─────────────────────────────────────────────────────────┐
│                    DigitalOcean Cloud                    │
├─────────────────────────────────────────────────────────┤
│                                                           │
│  ┌────────────────┐        ┌─────────────────────┐      │
│  │  sh-builder-    │        │  sh-demo-cluster    │      │
│  │  nyc3           │───────▶│  (Kubernetes)       │      │
│  │  (Droplet)      │  Push  │                     │      │
│  │                 │  Images│  ┌───────────────┐  │      │
│  │  - Docker       │        │  │ Namespaces:   │  │      │
│  │  - doctl        │        │  │ • lawli       │  │      │
│  │  - kubectl      │        │  │ • apexcoachai │  │      │
│  └────────────────┘        │  │ • ...         │  │      │
│                             │  └───────────────┘  │      │
│  ┌────────────────┐        │                     │      │
│  │  shtrial-reg    │◀───────┤                     │      │
│  │  (DOCR)         │  Pull  │                     │      │
│  └────────────────┘        └─────────────────────┘      │
│                                                           │
│  ┌────────────────┐        ┌─────────────────────┐      │
│  │  sh-shared-     │        │  sh-storage         │      │
│  │  postgres       │        │  (Spaces/S3)        │      │
│  │  (Managed DB)   │        │  (Object Storage)   │      │
│  └────────────────┘        └─────────────────────┘      │
│                                                           │
└─────────────────────────────────────────────────────────┘
```

### Key Resources

| Resource | Type | Purpose |
|----------|------|---------|
| `sh-demo-cluster` | DOKS Cluster | Runs all application workloads |
| `sh-builder-nyc3` | Droplet (4vCPU/8GB) | Builds & pushes Docker images |
| `shtrial-reg` | Container Registry | Stores application images |
| `sh-shared-postgres` | Managed Postgres 16 | Database with pgvector |
| `sh-storage` | Spaces Bucket | File storage (S3-compatible) |

### Identity & Naming Conventions

- **App Slug (`{APP_SLUG}`):** Unique, lowercase, alphanumeric identifier (e.g., `voxops`, `lawli`)
- **Repo Name:** Must match `{APP_SLUG}`
- **K8s Namespace:** Must match `{APP_SLUG}`
- **Database Name:** Must match `{APP_SLUG}` (in shared Postgres cluster)
- **Image Naming:** `{APP_SLUG}-{ROLE}:{TAG}` (e.g., `lawli-backend:a1b2c3-20251216143022`, `lawli-frontend:a1b2c3-20251216143022`)
  - **ROLE values:** `backend`, `frontend`, `worker`
  - **K8s Deployment names:** `{APP_SLUG}-backend`, `{APP_SLUG}-frontend`
  - **Container names:** Match deployment names (1:1 mapping)

### Configuration Strategy

**CRITICAL:** All environment configuration lives in a **single .env file at the repository root**.

```
repo-root/
├── .env                    ← THE ONLY .env FILE (not committed)
├── .env.example            ← Template (committed)
├── apps/
│   ├── backend/            ← NO .env here
│   └── web/                ← NO .env here
├── scripts/
│   ├── inject-secrets.sh   ← Pushes .env to K8s
│   └── shtrial-build-deploy.sh
└── k8s/
    └── deployment.yaml
```

### Configuration Template

This repository uses `.env.example` as the configuration template:
- **Template:** `.env.example` (committed to git)
- **Runtime Config:** `.env` (generated from template, not committed)

The `.env` file contains all environment variables needed for this application, including:
- `APP_SLUG` - Your application identifier
- `DATABASE_URL` - Database connection string
- AI provider keys and configuration
- Infrastructure settings

---

## Infrastructure Setup

### Prerequisites

- DigitalOcean account with API token
- `doctl` installed and authenticated
- `kubectl` installed
- SSH access configured (for builder droplet)

### Builder Droplet Setup

**Access:** `ssh root@143.198.9.100` or via [DigitalOcean Console](https://cloud.digitalocean.com/droplets/537613916/console)

**Automated Setup:**
```bash
# Run the unified setup script
bash setup-builder.sh
```

**What it does:**
- Installs Docker, doctl, kubectl
- Configures non-expiring DOCR credentials
- Connects to sh-demo-cluster
- Creates master config from `.env.shared`
- Clones/pulls all 23 repositories
- Sets up workspace structure

**Manual Setup (if needed):**

```bash
# Install Docker
sudo apt-get update
sudo apt-get install -y ca-certificates curl git jq docker.io
systemctl enable docker && systemctl start docker

# Install doctl
snap install doctl
doctl auth init   # Paste your DO_API_TOKEN

# Setup non-expiring DOCR credentials
mkdir -p ~/.docker
doctl registry docker-config shtrial-reg > ~/.docker/config.json
chmod 600 ~/.docker/config.json

# Install kubectl
snap install kubectl --classic

# Connect to Kubernetes cluster
doctl kubernetes cluster kubeconfig save sh-demo-cluster

# Verify connection
kubectl get nodes
```

### Configuration Management

**Template:** `.env.example` (committed to git)

**Runtime:** `.env` (generated from template, not committed)

**Key sections in `.env`:**
- Infrastructure (DO region, cluster, registry, load balancer)
- Database credentials (shared Postgres, RAG configuration)
- Storage credentials (DO Spaces, CDN URLs)
- All AI provider keys (10 providers: OpenAI, Groq, Cerebras, Gemini, Bedrock, ElevenLabs, Bland AI, Firecrawl, Tavily, Context7)
- Model preferences (5 types: CHAT, FAST, EMBEDDING, IMAGE, TTS)
- Developer tools (Cursor, Cloudflare, Sentry, GitHub tokens)
- Networking & security (VPC, firewalls, projects)

### Global Secrets in Cluster

Create shared secrets for all apps:

```bash
# Create system namespace
kubectl create namespace shtrial-system || true

# Load shared secrets (run on builder)
source ~/pendoah-master.env

kubectl -n shtrial-system create secret generic global-ai-secrets \
  --from-literal=OPENAI_API_KEY="${OPENAI_API_KEY}" \
  --from-literal=OPENAI_API_BASE="${OPENAI_API_BASE}" \
  --from-literal=GROQ_API_KEY="${GROQ_API_KEY}" \
  --from-literal=CEREBRAS_API_KEY="${CEREBRAS_API_KEY}" \
  --from-literal=GEMINI_API_KEY="${GEMINI_API_KEY}" \
  --from-literal=BEDROCK_ACCESS_KEY_ID="${BEDROCK_ACCESS_KEY_ID}" \
  --from-literal=BEDROCK_SECRET_ACCESS_KEY="${BEDROCK_SECRET_ACCESS_KEY}" \
  --from-literal=BEDROCK_REGION="${BEDROCK_REGION}" \
  --from-literal=ELEVENLABS_API_KEY="${ELEVENLABS_API_KEY}" \
  --from-literal=BLAND_AI_API_KEY="${BLAND_AI_API_KEY}" \
  --from-literal=FIRECRAWL_API_KEY="${FIRECRAWL_API_KEY}" \
  --from-literal=TAVILY_API_KEY="${TAVILY_API_KEY}" \
  --from-literal=CONTEXT7_API_KEY="${CONTEXT7_API_KEY}" \
  --from-literal=AWS_ACCESS_KEY_ID="${AWS_ACCESS_KEY_ID}" \
  --from-literal=AWS_SECRET_ACCESS_KEY="${AWS_SECRET_ACCESS_KEY}" \
  --from-literal=AWS_ENDPOINT_URL="${AWS_ENDPOINT_URL}" \
  --from-literal=RESEND_API_KEY="${RESEND_API_KEY}" \
  --from-literal=SENDGRID_API_KEY="${SENDGRID_API_KEY}" \
  --dry-run=client -o yaml | kubectl apply -f -
```

---

## Repository Standardization

### Canonical Naming Standard

**DOCR Images (Required):**
- `registry.digitalocean.com/shtrial-reg/{APP_SLUG}-backend:{TAG}`
- `registry.digitalocean.com/shtrial-reg/{APP_SLUG}-frontend:{TAG}`

**K8s Objects (Recommended 1:1 mapping):**
- Namespace: `{APP_SLUG}`
- Deployment names: `{APP_SLUG}-backend`, `{APP_SLUG}-frontend`
- Container names: Match deployment names exactly (`{APP_SLUG}-backend`, `{APP_SLUG}-frontend`)
- Service names: `{APP_SLUG}-backend`, `{APP_SLUG}-frontend`

This aligns with Sentry convention (`{APP_SLUG}-frontend` / `{APP_SLUG}-backend`).

### Standard Repository Structure

Each application repository must have this exact structure:

```
app-name/
├── .env                           # Root config (not committed)
├── .env.example                   # Template (committed)
├── .gitignore                     # Must exclude .env
├── apps/
│   ├── backend/
│   │   ├── Dockerfile
│   │   └── src/main.ts            # Loads ../../.env
│   └── web/
│       ├── Dockerfile
│       └── package.json           # Uses env-cmd
├── scripts/
│   ├── shtrial-build-deploy.sh   # Build & deploy script
│   ├── inject-secrets.sh          # Secret injection
│   ├── init-database.sh           # RAG database setup
│   └── verify-setup.sh            # Validation
├── src/services/
│   └── ingestion.py                # Unified RAG ingestion
├── k8s/
│   └── deployment.yaml            # K8s manifests
├── AGENTS.MD                      # AI agent context
└── CLAUDE.md                      # Claude-specific docs
```

### Applying the Standard

#### Automated (Recommended)

**Single Repository:**
```bash
cd /path/to/repo
bash standardize-repo.sh
```


The standardization script:
- Auto-detects app slug from directory name
- Auto-detects service types (api, web, worker) from repo structure
- Generates root `.env` with all configuration
- Creates all required scripts
- Generates `AGENTS.MD` and `CLAUDE.md`
- Creates RAG ingestion service template
- Creates database initialization script
- Is idempotent (safe to run multiple times)

### Repository Setup Checklist

**Required Files (should already exist):**
- `.env.example` - Configuration template
- `.env` - Runtime configuration (generated from template)
- `AGENTS.MD` - App-specific developer guide
- `scripts/` directory with deployment scripts
- `k8s/` directory with Kubernetes manifests

**Initial Setup Steps:**

1. **Initialize Database:**
   ```bash
   ./scripts/init-database.sh
   ```

2. **Inject Secrets to Kubernetes:**
   ```bash
   ./scripts/inject-secrets.sh
   ```

3. **Apply Kubernetes Manifests:**
   ```bash
   kubectl apply -f k8s/
   ```

4. **Verify Setup:**
   ```bash
   ./scripts/verify-setup.sh
   ```

**Specification:** See `STANDARDIZATION_SPEC.md` for complete specification including canonical naming, infrastructure requirements, code patterns, and validation rules.

### New App Onboarding

**Time to Complete:** 2-3 hours (first time), 1 hour (with experience)

#### Step 1: Repository Setup

**Create new repository:**
```bash
mkdir ~/myapp
cd ~/myapp
git init
git remote add origin https://github.com/shmindmaster/MyApp.git
```

**Apply standardization:**
```bash
# From repo root
bash standardize-repo.sh myapp
```

This automatically:
- Creates root `.env` with all configuration
- Generates required directory structure
- Creates build and deployment scripts
- Generates K8s manifests with canonical naming
- Creates RAG ingestion service
- Generates AGENTS.MD documentation

#### Step 2: Database Setup

**Create logical database in shared Postgres:**

```bash
# Via doctl
doctl databases db create b3649979-b082-47ce-b1ce-4ff0c2b9a8a9 myapp

# Verify
doctl databases db list b3649979-b082-47ce-b1ce-4ff0c2b9a8a9
```

**Initialize RAG database:**
```bash
cd ~/myapp
./scripts/init-database.sh
```

This creates:
- `pgvector` extension
- `embeddings` table (1024 dimensions)
- HNSW index for vector search

#### Step 3: Storage Configuration

No action required - Spaces bucket `sh-storage` already exists. Your app automatically uses prefix `/myapp/` via `OBJECT_STORAGE_PREFIX` environment variable.

**Verify access:**
```bash
# Load environment variables from .env
source .env
aws s3 ls --endpoint=https://nyc3.digitaloceanspaces.com s3://sh-storage/${APP_SLUG}/
```

#### Step 4: Kubernetes Resources

**Inject secrets:**
```bash
cd ~/myapp
./scripts/inject-secrets.sh
```

**Apply K8s manifests (if generated):**
```bash
kubectl apply -f k8s/namespace.yaml
kubectl apply -f k8s/backend.yaml
kubectl apply -f k8s/frontend.yaml
kubectl apply -f k8s/ingress.yaml
```

#### Step 5: First Deployment

**Build and deploy:**
```bash
# Backend
APP_SLUG=myapp ROLE=backend DOCKERFILE=apps/backend/Dockerfile ./scripts/shtrial-build-deploy.sh

# Frontend
APP_SLUG=myapp ROLE=frontend DOCKERFILE=apps/web/Dockerfile ./scripts/shtrial-build-deploy.sh
```

**Verify deployment:**
```bash
kubectl get pods -n myapp
kubectl rollout status deployment/myapp-backend -n myapp
kubectl rollout status deployment/myapp-frontend -n myapp
```

**Access application:**
- Frontend: `https://myapp.shtrial.com`
- Backend API: `https://myapp-api.shtrial.com` (if configured)

#### Step 6: Optional - AI Integration

**Add LangGraph agent:**
1. Review `AGENTS.MD` for agent development guide
2. Use `src/services/ingestion.py` for RAG setup
3. Follow LangGraph patterns in code templates

**Total Time:** ~25 minutes from repo to production (with automation)

### How Apps Load Configuration

#### Backend (Node.js/NestJS)
```typescript
// apps/backend/src/main.ts
import * as dotenv from 'dotenv';
import path from 'path';

// Load from repo root (../../.env from src/)
dotenv.config({ path: path.resolve(__dirname, '../../../.env') });
```

#### Frontend (Next.js)
```json
// apps/web/package.json
{
  "scripts": {
    "dev": "env-cmd -f ../../.env next dev",
    "build": "env-cmd -f ../../.env next build",
    "start": "env-cmd -f ../../.env next start"
  }
}
```

**Requires:** `npm install -D env-cmd` in the web package.

---

## Hybrid AI Configuration

### LangGraph AI Standard (v6.0)

**Vendor Neutrality • Standardized Orchestration • OpenAI-Compatible**

#### Core Philosophy

1. **Vendor Neutrality:** Use **LangGraph** (Python/JS) as code, not proprietary agent DSLs
2. **OpenAI Compatibility:** All models accessed via standard OpenAI-compatible endpoints
3. **Fast Transport:** FastAPI (Python) or Fastify (TypeScript)
4. **State Management:** Explicit state definitions in LangGraph (checkpointers) backed by Postgres

#### The Agent Stack

**Control Plane: LangGraph**
- **State:** Typed object (e.g., `ConversationState`) holding messages and context
- **Nodes:** Functions that perform work (call LLM, run tool, query DB)
- **Edges:** Logic determining next step (e.g., `conditional_edge` to check for tool calls)
- **Checkpointer:** Persists state to database (`thread_id` = `sessionId`)

**LLM Interface:**
All apps must use standard environment variables:
- `LLM_API_BASE`: Endpoint URL (e.g., `https://inference.do-ai.run/v1`)
- `LLM_API_KEY`: Authentication token
- `LLM_MODEL_NAME`: Default model ID

**Clients:**
- **Python:** `langchain_openai.ChatOpenAI`
- **TypeScript:** `openai` (official SDK) or `@langchain/openai`

#### Implementation Patterns

**TypeScript (Fastify + LangGraph.js):**
```typescript
// apps/backend/src/graph/assistantGraph.ts
import { StateGraph } from "@langchain/langgraph";
import { ChatOpenAI } from "@langchain/openai";

const llm = new ChatOpenAI({
  modelName: process.env.MODEL_CHAT,
  openAIApiKey: process.env.OPENAI_API_KEY,
  configuration: {
    baseURL: process.env.OPENAI_API_BASE,
  },
});

// Define state
interface ConversationState {
  messages: BaseMessage[];
  // ... other state
}

// Define graph
const graph = new StateGraph<ConversationState>({
  channels: {
    messages: {
      reducer: (x, y) => x.concat(y),
      default: () => [],
    },
  },
})
  .addNode("agent", agentNode)
  .addNode("tools", toolsNode)
  .addConditionalEdges("agent", shouldContinue)
  .setEntryPoint("agent");

const runnable = graph.compile();
```

**Python (FastAPI + LangGraph):**
```python
# apps/backend/src/graph.py
from langgraph.graph import StateGraph
from langchain_openai import ChatOpenAI

llm = ChatOpenAI(
    model=os.getenv("MODEL_CHAT"),
    openai_api_key=os.getenv("OPENAI_API_KEY"),
    base_url=os.getenv("OPENAI_API_BASE"),
)

# Define state
class ConversationState(TypedDict):
    messages: list[BaseMessage]
    # ... other state

# Define graph
graph = StateGraph(ConversationState)
graph.add_node("agent", agent_node)
graph.add_node("tools", tools_node)
graph.add_conditional_edges("agent", should_continue)
graph.set_entry_point("agent")

runnable = graph.compile()
```

#### RAG & Knowledge Integration

RAG is implemented as a tool within the graph:

1. **Embeddings:** Use `MODEL_EMBEDDING` (e.g., `Alibaba-NLP/gte-large-en-v1.5`)
2. **Storage:** `pgvector` in shared Postgres cluster
3. **Retrieval:** Graph node or tool function queries DB and injects context into state

**Example RAG Tool:**
```python
from src.services.ingestion import UnifiedIngestor

def rag_search_tool(query: str) -> str:
    ingestor = UnifiedIngestor()
    results = ingestor.search(query, top_k=5)
    return "\n".join([r["content"] for r in results])
```

### Model Preferences (Standardized)

Use these environment variables in code. **NEVER hardcode model names.**

| Use Case | Env Variable | Value | Provider |
|----------|--------------|-------|----------|
| **Reasoning** | `MODEL_CHAT` | `openai-gpt-oss-120b` | DO Gateway |
| **Fast Tasks** | `MODEL_FAST` | `openai-gpt-oss-20b` | DO Gateway |
| **Embeddings** | `MODEL_EMBEDDING` | `Alibaba-NLP/gte-large-en-v1.5` | DO Gateway |
| **Image Gen** | `MODEL_IMAGE` | `fal-ai/fast-sdxl` | DO Gateway |
| **TTS** | `MODEL_TTS` | `fal-ai/elevenlabs/tts/multilingual-v2` | DO Gateway |

**Example Usage:**
```typescript
const response = await openai.chat.completions.create({
  model: process.env.MODEL_CHAT,  // ✅ CORRECT
  // model: "gpt-4o",              // ❌ WRONG - Hardcoded
  messages: [...]
});
```

### Hybrid AI Stack (10 Providers)

All repositories have immediate access to:

#### LLM Providers (5 Providers)
- **OpenAI (DO Gateway)** - Primary interface, DO-hosted models
- **Groq** - Sub-second latency (500+ tokens/sec)
- **Cerebras** - High throughput bulk processing
- **Gemini** - Multimodal, large context
- **AWS Bedrock** - Claude 3.5 Sonnet, best reasoning

#### Voice & Telephony (2 Providers)
- **ElevenLabs** - High-fidelity TTS, voice cloning
- **Bland AI** - Conversational phone agents

#### Search & Knowledge (3 Providers)
- **Firecrawl** - Web scraping, content extraction
- **Tavily** - Real-time search API
- **Context7** - Code documentation search

### Provider Selection Guide

| Task | Recommended Provider | Env Variable | Rationale |
|------|---------------------|--------------|-----------|
| Complex reasoning | AWS Bedrock | `BEDROCK_ACCESS_KEY_ID` | Claude 3.5 Sonnet |
| Real-time chat | Groq | `GROQ_API_KEY` | 500+ tokens/sec |
| Bulk processing | Cerebras | `CEREBRAS_API_KEY` | High throughput |
| Standard chat | DO Gateway | `MODEL_CHAT` | Cost-effective default |
| Quick responses | DO Gateway | `MODEL_FAST` | Low latency |
| Voice TTS | ElevenLabs | `ELEVENLABS_API_KEY` | Highest quality |
| Phone agents | Bland AI | `BLAND_AI_API_KEY` | Conversational |
| Web scraping | Firecrawl | `FIRECRAWL_API_KEY` | Content extraction |
| Search API | Tavily | `TAVILY_API_KEY` | Real-time search |
| Code docs | Context7 | `CONTEXT7_API_KEY` | Documentation search |

---

## RAG & Storage Standards

### RAG with pgvector (1024 dimensions)

**Database Schema:**
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

CREATE INDEX idx_embeddings_vector ON embeddings
  USING hnsw (embedding vector_l2_ops);
CREATE INDEX idx_embeddings_metadata ON embeddings
  USING gin (metadata);
```

**Configuration (in .env):**
```bash
VECTOR_DIMENSION=1024
VECTOR_TABLE=embeddings
EMBEDDING_MODEL=Alibaba-NLP/gte-large-en-v1.5
```

**Initialization:**
```bash
./scripts/init-database.sh
```

### Storage Isolation (App-Level Prefixes)

**Problem:** Multiple apps sharing `sh-storage` bucket could cause file conflicts.

**Solution:** Mandatory app-level prefixes.

**Configuration (in .env):**
```bash
AWS_BUCKET_NAME=sh-storage
OBJECT_STORAGE_PREFIX=${APP_SLUG}/
CDN_BASE_URL=https://sh-storage.nyc3.cdn.digitaloceanspaces.com/${APP_SLUG}
```

**Example:**
- lawli uploads to: `sh-storage/lawli/document.pdf`
- voxops uploads to: `sh-storage/voxops/document.pdf`
- No conflicts!

**File Upload Example:**
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
key = f"{os.getenv('OBJECT_STORAGE_PREFIX')}myfile.pdf"  # {APP_SLUG}/myfile.pdf
s3.upload_file("/tmp/myfile.pdf", os.getenv("AWS_BUCKET_NAME"), key)
```

**⚠️ CRITICAL:** Always use `OBJECT_STORAGE_PREFIX` to avoid cross-app contamination.

### Unified Ingestion Service

**Location:** `src/services/ingestion.py` (auto-generated in every repo)

**Capabilities:**
- Web scraping (Firecrawl → Markdown)
- PDF processing (PyPDFLoader → Text)
- Automatic chunking (1000 chars, 200 overlap)
- Embedding generation (1024-dim via DO Gateway)
- Vector storage (pgvector)
- Semantic search

**Usage Example:**
```python
from src.services.ingestion import UnifiedIngestor

ingestor = UnifiedIngestor()

# Ingest from web
ingestor.ingest_url("https://docs.example.com/guide")

# Ingest from PDF
ingestor.ingest_pdf("/path/to/manual.pdf")

# Search
results = ingestor.search("How do I configure X?", top_k=5)
for r in results:
    print(f"{r['distance']:.3f}: {r['content'][:100]}...")
```

### Ingestion Pipeline

1. **Web Scraping:** Firecrawl → Markdown → Split → Embed → Store
2. **PDF Processing:** PyPDFLoader → Text → Split → Embed → Store
3. **Chunking:** RecursiveCharacterTextSplitter (size: 1000, overlap: 200)

---

## Build & Deployment Workflow

### Development Workflow (Local)

```bash
# 1. Clone repo
git clone https://github.com/sh-pendoah/lawli.git
cd lawli

# 2. Verify .env exists and has correct values
cat .env

# 3. Install dependencies
pnpm install

# 4. Initialize database (one-time)
./scripts/init-database.sh

# 5. Start backend
cd apps/backend
npm run dev

# 6. Start frontend (in new terminal)
cd apps/web
npm run dev
```

### Production Deployment Workflow

**⛔ NEVER build Docker images on local machines.**

All production builds MUST run on `sh-builder-nyc3`.

#### Step 1: Push Code to GitHub

```bash
git add .
git commit -m "feat: new feature"
git push origin main
```

#### Step 2: SSH to Builder

```bash
ssh root@143.198.9.100
# Or if you have SSH config:
ssh sh-builder-nyc3
```

#### Step 3: Clone/Update Repo

```bash
# First time:
cd ~/repos
git clone https://github.com/sh-pendoah/lawli.git
cd lawli

# Subsequent times:
cd ~/repos/lawli
git pull origin main
```

#### Step 4: Inject Secrets (First Time Only)

```bash
# This reads .env and creates K8s secret
./scripts/inject-secrets.sh
```

#### Step 5: Build & Deploy

```bash
# Build and deploy Backend
APP_SLUG=lawli ROLE=backend DOCKERFILE=apps/backend/Dockerfile \
  ./scripts/shtrial-build-deploy.sh

# Build and deploy Frontend
APP_SLUG=lawli ROLE=frontend DOCKERFILE=apps/web/Dockerfile \
  ./scripts/shtrial-build-deploy.sh
```

**Image naming convention:**
- Backend: `registry.digitalocean.com/shtrial-reg/{APP_SLUG}-backend:{TAG}`
- Frontend: `registry.digitalocean.com/shtrial-reg/{APP_SLUG}-frontend:{TAG}`
- Tag format: `{git-sha}-{timestamp}` (e.g., `a1b2c3d-20251216143022`)

#### What Happens During Build/Deploy:

1. **Validates** APP_SLUG against allowlist
2. **Validates** ROLE is `backend`, `frontend`, or `worker`
3. **Generates** immutable tag: `{git-sha}-{timestamp}`
4. **Builds** Docker image with BuildKit
5. **Pushes** to `registry.digitalocean.com/shtrial-reg/{APP_SLUG}-{ROLE}:{tag}`
6. **Updates** K8s deployment `{APP_SLUG}-{ROLE}` with new image
7. **Waits** for rollout to complete (300s timeout)

### Kubernetes Deployment Script (k8s-deploy.sh)

**Security Patterns (Voxops Learnings):**

All `k8s-deploy.sh` scripts must use **envsubst whitelist** to prevent secret leakage:

```bash
# CRITICAL: Whitelist only safe variables for envsubst
# Never expand secrets (DATABASE_URL, OPENAI_API_KEY, etc.) into manifests
SUBST_VARS='$APP_SLUG $DO_REGISTRY $GIT_SHA $APP_DOMAIN_BASE $SPEECH_STT_PROVIDER $SPEECH_TTS_PROVIDER'

# Generate manifests with whitelist
for f in k8s/*.yaml; do
  envsubst "${SUBST_VARS}" < "${f}" > "k8s/generated/$(basename "${f}")"
done
```

**Why:** Secrets should be injected via K8s secrets, not expanded into ConfigMaps or manifests.

**Deployment Script Pattern:**

```bash
#!/bin/bash
set -euo pipefail

# Load environment
source .env.shared 2>/dev/null || true

# Whitelist for envsubst (Voxops pattern)
SUBST_VARS='$APP_SLUG $DO_REGISTRY $GIT_SHA $APP_DOMAIN_BASE'

# Generate manifests
mkdir -p k8s/generated
for f in k8s/*.yaml; do
  [[ -f "${f}" ]] || continue
  [[ "${f}" == *"secret"* ]] && continue  # Skip secret files
  envsubst "${SUBST_VARS}" < "${f}" > "k8s/generated/$(basename "${f}")"
done

# Apply manifests
kubectl apply -f k8s/generated/
```

### Application Security Patterns

**CORS Safety (FastAPI):**

Browsers disallow `Access-Control-Allow-Origin: *` when credentials are enabled. Always detect wildcards and disable credentials:

```python
from fastapi.middleware.cors import CORSMiddleware

_cors_allow_origins = ALLOWED_ORIGINS or []
_cors_has_wildcard = "*" in _cors_allow_origins

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"] if _cors_has_wildcard else _cors_allow_origins,
    allow_credentials=False if _cors_has_wildcard else True,  # Disable if wildcard
    allow_methods=["*"],
    allow_headers=["*"],
)
```

**Health Check Security:**

Health endpoints must validate services without leaking secrets:

```python
@app.get("/health")
async def health():
    """Health check with service validation (no secret leakage)."""
    from src import config as app_config
    
    status = "ok"
    services = {}
    
    # Check config presence (do NOT return values)
    required_env = ["DATABASE_URL", "OPENAI_API_KEY"]
    missing_env = [k for k in required_env if not (os.getenv(k) or "").strip()]
    services["config"] = {
        "status": "ok" if not missing_env else "degraded",
        "missing": missing_env,  # List missing keys, not values
    }
    
    # Validate services (use config module, not direct env access)
    if app_config.OPENAI_API_KEY:
        services["llm"] = {"status": "ok", "provider": app_config.LLM_PROVIDER}
    else:
        services["llm"] = {"status": "error"}
        status = "degraded"
    
    return {"status": status, "services": services}
```

**Key Principles:**
- Never return secret values in health checks
- Use config modules instead of direct `os.getenv()` for validation
- List missing keys, not their values

### Remote Build (From Local Machine)

```powershell
# Build and deploy from your local machine
.\remote-build.ps1 -AppSlug lawli -InjectSecrets

# Build only backend
.\remote-build.ps1 -AppSlug lawli -Service backend

# Build only frontend
.\remote-build.ps1 -AppSlug lawli -Service frontend

# Verbose output for debugging
.\remote-build.ps1 -AppSlug lawli -Verbose
```

**Note:** The `remote-build.ps1` script (if present) uses `Service` parameter which maps to `ROLE` in the build script:
- `Service=backend` → `ROLE=backend`
- `Service=frontend` → `ROLE=frontend`
- `Service=worker` → `ROLE=worker`

---

## Validation & Monitoring

### Local Validation (Windows)

#### Verify doctl/kubectl Setup

```powershell
.\validate-doctl-setup.ps1
```

This checks:
- doctl installation & authentication
- kubectl installation
- Cluster connection
- Registry access
- Database connectivity

#### Validate K8s Deployments

```powershell
# Validate specific app
.\validate-k8s-deployment.ps1 -AppSlug lawli

# Detailed validation
.\validate-k8s-deployment.ps1 -AppSlug lawli -Detailed

# Validate all apps
.\validate-k8s-deployment.ps1 -All
```

### Builder Validation (Linux)

#### Verify Individual Repo Setup

```bash
cd /path/to/repo
./scripts/verify-setup.sh
```

#### Check Cluster Resources

```bash
# List all app namespaces
kubectl get namespaces | grep -E "lawli|apexcoachai|aura"

# Check specific app
kubectl get all -n lawli

# View logs
kubectl logs -f -n lawli deployment/lawli-api

# Check secrets
kubectl get secrets -n lawli
kubectl describe secret app-secrets -n lawli
```

#### Verify Images in Registry

```bash
doctl registry repository list shtrial-reg

# List tags for specific image
doctl registry repository list-tags shtrial-reg/lawli-api
```

### Monitoring Commands

```bash
# View logs
kubectl logs -f -n lawli deployment/lawli-api

# Check pod status
kubectl get pods -n lawli -w

# View events
kubectl get events -n lawli --sort-by='.lastTimestamp'

# Check resource usage
kubectl top pods -n lawli

# Describe deployment
kubectl describe deployment lawli-api -n lawli
```

---

## Troubleshooting

### TLS / Certificate Issues

#### Symptom: Certificate Stuck in "Issuing" State

**Root Cause:** ACME HTTP-01 challenges blocked by NetworkPolicy or incorrect ingress-nginx namespace labels.

**Diagnosis:**
```bash
# Check certificate status
kubectl get certificate -n ${APP_SLUG}
kubectl describe certificate wildcard-shtrial-com-tls -n ${APP_SLUG}

# Check ACME challenges
kubectl get challenge -n ${APP_SLUG}
kubectl describe challenge -n ${APP_SLUG}

# Check ingress-nginx namespace labels
kubectl get namespace ingress-nginx --show-labels
```

**Resolution:**
```bash
# 1. Add required label to ingress-nginx namespace
kubectl label namespace ingress-nginx name=ingress-nginx --overwrite

# 2. Add required label for cert-manager
kubectl label namespace cert-manager app=cert-manager --overwrite

# 3. Delete stuck certificate to trigger fresh issuance
kubectl delete certificate wildcard-shtrial-com-tls -n ${APP_SLUG}

# 4. Monitor re-issuance
kubectl get certificate -n ${APP_SLUG} -w
```

**Prevention:**
- Use shared wildcard certificate (`wildcard-shtrial-com-tls`)
- Don't create per-app Certificate resources
- Ensure namespace labels are set during cluster setup

#### Symptom: Browser Shows "Certificate Invalid" or "Not Secure"

**Root Cause:** Certificate not properly mounted or wrong domain pattern used.

**Diagnosis:**
```bash
# Check certificate secret exists
kubectl get secret wildcard-shtrial-com-tls -n ${APP_SLUG}

# Check ingress TLS configuration
kubectl get ingress app-ingress -n ${APP_SLUG} -o yaml | grep -A 5 tls

# Test certificate from command line
curl -vI https://${APP_SLUG}.shtrial.com 2>&1 | grep -E 'subject|issuer|expire'
```

**Resolution:**
```bash
# 1. Verify ingress uses correct secret name
kubectl patch ingress app-ingress -n ${APP_SLUG} \
  --type='json' \
  -p='[{"op": "replace", "path": "/spec/tls/0/secretName", "value": "wildcard-shtrial-com-tls"}]'

# 2. Verify certificate is valid
kubectl get secret wildcard-shtrial-com-tls -n ${APP_SLUG} -o jsonpath='{.data.tls\.crt}' | base64 -d | openssl x509 -noout -text

# 3. Restart ingress controller (if needed)
kubectl rollout restart deployment ingress-nginx-controller -n ingress-nginx
```

**Prevention:**
- Always use `secretName: wildcard-shtrial-com-tls` in ingress
- Follow flat subdomain pattern: `${APP_SLUG}.shtrial.com`, `api-${APP_SLUG}.shtrial.com`
- Never use nested subdomains: `api.${APP_SLUG}.shtrial.com`

### Ingress / Routing Issues

#### Symptom: 404 Not Found or Wrong Service

**Root Cause:** Ingress rules not matching or service name mismatch.

**Diagnosis:**
```bash
# Check ingress rules
kubectl get ingress -n ${APP_SLUG} -o yaml

# Check services
kubectl get services -n ${APP_SLUG}

# Test ingress controller
kubectl get pods -n ingress-nginx
```

**Resolution:**
```bash
# Verify service names match canonical naming
kubectl get service ${APP_SLUG}-backend -n ${APP_SLUG}
kubectl get service ${APP_SLUG}-frontend -n ${APP_SLUG}

# Update ingress if needed
kubectl edit ingress app-ingress -n ${APP_SLUG}
```

### Database / Migration Issues

#### Symptom: Migration Fails or Database Locked

**Root Cause:** Concurrent migrations or connection pool exhaustion.

**Diagnosis:**
```bash
# Check active connections
psql "${DATABASE_URL}" -c "SELECT count(*) FROM pg_stat_activity;"

# Check for locks
psql "${DATABASE_URL}" -c "SELECT * FROM pg_locks WHERE NOT granted;"
```

**Resolution:**
```bash
# Run migrations sequentially (one at a time)
cd apps/backend
npx prisma migrate deploy

# Or for Python
alembic upgrade head
```

### Common Issues

#### Issue: "Environment variable X is undefined"

**Cause:** Variable not in root .env or not injected to K8s

**Fix:**
```bash
# 1. Add to root .env
echo "X=value" >> .env

# 2. Update inject-secrets.sh to include new variable
nano scripts/inject-secrets.sh
# Add: --from-literal=X="${X}" \

# 3. Re-inject secrets
./scripts/inject-secrets.sh

# 4. Restart pods
kubectl rollout restart deployment/lawli-api -n lawli
```

#### Issue: "Cannot connect to database"

**Cause:** DATABASE_URL incorrect or secret not updated

**Fix:**
```bash
# Verify secret value
kubectl get secret app-secrets -n lawli -o jsonpath='{.data.DATABASE_URL}' | base64 -d

# If wrong, update root .env and re-inject
./scripts/inject-secrets.sh

# Restart deployment
kubectl rollout restart deployment/lawli-api -n lawli
```

#### Issue: "Image not updating after push"

**Cause:** imagePullPolicy not set to Always, or deployment name mismatch

**Fix:**
```bash
# Check deployment name matches canonical naming
kubectl get deployments -n lawli
# Should see: lawli-backend, lawli-frontend

# Check imagePullPolicy
kubectl get deployment lawli-backend -n lawli -o yaml | grep imagePullPolicy

# If not "Always", edit deployment
kubectl edit deployment lawli-backend -n lawli
# Set: imagePullPolicy: Always

# Verify container name matches deployment name
kubectl get deployment lawli-backend -n lawli -o jsonpath='{.spec.template.spec.containers[0].name}'
# Should output: lawli-backend
```

#### Issue: "Pod CrashLoopBackOff"

**Diagnosis:**
```bash
# View pod logs
kubectl logs -n lawli <pod-name>

# Describe pod for events
kubectl describe pod -n lawli <pod-name>

# Check recent events
kubectl get events -n lawli --sort-by='.lastTimestamp'
```

**Common Causes:**
- Missing environment variables
- Database connection failure
- Port already in use
- Application startup error

#### Issue: "Unauthorized: registry access denied"

**Cause:** DOCR credentials not configured on builder

**Fix:**
```bash
# On builder droplet
doctl registry docker-config shtrial-reg > ~/.docker/config.json
chmod 600 ~/.docker/config.json

# Verify
cat ~/.docker/config.json
```

#### Issue: "pgvector extension not found"

**Fix:**
```bash
# Enable on the database
psql "${DATABASE_URL}" -c "CREATE EXTENSION IF NOT EXISTS vector;"
```

#### Issue: "Vector dimension mismatch"

- All apps use 1024 dimensions (FIXED)
- Check: `grep VECTOR_DIMENSION .env`
- Should show: `VECTOR_DIMENSION=1024`

#### Issue: "Storage prefix missing"

- Check: `grep OBJECT_STORAGE_PREFIX .env`
- Should show: `OBJECT_STORAGE_PREFIX=${APP_SLUG}/`
- Never upload without prefix!

#### Issue: "Ingestion service import error"

**Fix:**
```bash
# Install dependencies
pip install firecrawl-py langchain-community openai psycopg2-binary pgvector boto3
```

#### Issue: "Database init fails"

- Verify `DATABASE_URL` is correct
- Check database exists: `psql "${DATABASE_URL}" -c "SELECT current_database();"`
- Check permissions: User must have CREATE EXTENSION rights

---

## Reference

### Canonical App List

**shmindmaster** (14 apps):
- apexcoachai, aura, billigent, campgen, careaxis
- careiq, comminsightsai, financeos, homeiq, lawli
- synapse, ummaconnect, voxops, warrantygains

**sh-pendoah** (8 apps):
- flashmaster, jurisai, magiccommerce, omniforge
- petdnaplus, prismiq, quantcoach, serenemind

**Total:** 23 applications

### Environment Variable Reference

See `.env.example` for the complete list of environment variables and their descriptions.

**Critical Variables:**
```bash
APP_SLUG=<app-name>               # App identifier
DATABASE_URL=<postgres-url>        # App-specific DB URL
OPENAI_API_KEY=<key>              # AI provider (shared)
AWS_ACCESS_KEY_ID=<key>           # S3/Spaces (shared)
DO_API_TOKEN=<token>              # DigitalOcean API (shared)
```

### Builder Droplet Best Practices

#### Stable DOCR Authentication (Non-Expiring)

The builder droplet uses non-expiring DOCR credentials:

```bash
# This is done automatically by setup-builder.sh
mkdir -p ~/.docker
doctl registry docker-config shtrial-reg > ~/.docker/config.json
chmod 600 ~/.docker/config.json
```

**Note:** By default, the generated credentials do not expire. ([DigitalOcean Docs](https://docs.digitalocean.com/reference/doctl/reference/registry/docker-config/))

#### DOKS ↔ DOCR Integration

Ensure the Kubernetes cluster can pull from the container registry:

```bash
# This is done automatically by setup-builder.sh
doctl kubernetes cluster registry add sh-demo-cluster
```

This enables seamless image pulls without additional authentication in pods. ([DigitalOcean Docs](https://docs.digitalocean.com/reference/doctl/reference/kubernetes/cluster/registry/add/))

### Useful Commands

#### doctl Commands

```bash
# List clusters
doctl kubernetes cluster list

# Get cluster info
doctl kubernetes cluster get sh-demo-cluster

# List registries
doctl registry get

# List databases
doctl databases list

# Create droplet
doctl compute droplet create <name> --region nyc3 --image ubuntu-22-04-x64 --size s-2vcpu-4gb
```

#### kubectl Commands

```bash
# Switch context
kubectl config use-context do-nyc3-sh-demo-cluster

# Get all resources in namespace
kubectl get all -n <namespace>

# Port forward
kubectl port-forward -n <namespace> svc/<service> 8000:8000

# Execute command in pod
kubectl exec -it -n <namespace> <pod-name> -- /bin/bash

# Scale deployment
kubectl scale deployment/<name> -n <namespace> --replicas=3

# Rollout management
kubectl rollout status deployment/<name> -n <namespace>
kubectl rollout restart deployment/<name> -n <namespace>
kubectl rollout undo deployment/<name> -n <namespace>
```

### Builder Droplet Access

- **Name:** sh-builder-nyc3
- **IP:** 143.198.9.100
- **Console:** https://cloud.digitalocean.com/droplets/537613916/console

### Infrastructure Details

- **Region:** NYC3
- **Cluster:** sh-demo-cluster
- **Registry:** registry.digitalocean.com/shtrial-reg
- **Database:** sh-shared-postgres (managed)
- **Storage:** sh-storage (Spaces)

### Security Best Practices

#### Environment Variables
- ✅ All secrets in root `.env` (not committed to git)
- ✅ K8s secrets injected from `.env` in production
- ✅ No hardcoded API keys or model names
- ✅ Always use `process.env.MODEL_*` variables

#### Database Security
- ✅ SSL required for all connections (`sslmode=require`)
- ✅ App-level database isolation (one DB per app)
- ✅ Vector embeddings include app metadata
- ✅ Indexes optimized for performance and security

#### Storage Security
- ✅ Mandatory app-level prefixes prevent conflicts
- ✅ S3-compatible access control
- ✅ CDN URLs include app prefix
- ✅ No cross-app file access

#### AI Provider Security
- ✅ Provider keys in environment variables only
- ✅ Never log API requests/responses with keys
- ✅ Rate limiting enforced by providers
- ✅ Fallback strategies for provider outages

### Kubernetes Deployment Naming

**Migration Checklist (per repo):**

1. **Update Deployment Names:**
   - Old: `{APP_SLUG}-api`, `{APP_SLUG}-web`
   - New: `{APP_SLUG}-backend`, `{APP_SLUG}-frontend`

2. **Update Container Names:**
   - Must match deployment names exactly (1:1 mapping)
   - Container: `{APP_SLUG}-backend` in deployment `{APP_SLUG}-backend`

3. **Update Image References:**
   - Old: `registry.digitalocean.com/shtrial-reg/{APP_SLUG}-api:latest`
   - New: `registry.digitalocean.com/shtrial-reg/{APP_SLUG}-backend:{TAG}`
   - **Never use `:latest` in production** - use immutable tags

4. **Example K8s Deployment:**
```yaml
apiVersion: apps/v1
kind: Deployment
metadata:
  name: lawli-backend
  namespace: lawli
spec:
  replicas: 1
  selector:
    matchLabels:
      app: lawli
      role: backend
  template:
    metadata:
      labels:
        app: lawli
        role: backend
    spec:
      containers:
      - name: lawli-backend  # Must match deployment name
        image: registry.digitalocean.com/shtrial-reg/lawli-backend:latest
        imagePullPolicy: Always
        # ... rest of config
```

### Code Standards

#### FastAPI (AI & Backend)

- **Strict Typing:** Use Python 3.12+ type hints for **all** parameters and returns
- **Data Validation:** Use **Pydantic v2** models (`BaseModel`) for all request bodies and response schemas
- **AI Orchestration:** Use **LangGraph** (`StateGraph`) for all agentic logic
- **Real-time & Voice:** Use **WebSockets** (`@app.websocket`) for voice/audio agents
- **Dependency Injection:** Use `Depends()` for DB sessions, user context, and shared services
- **Structure:** Organize routes using `APIRouter` in `src/api/routes/`
- **Async First:** All route handlers and DB calls must be `async def`
- **Error Handling:** Raise `HTTPException` with clear details

#### Next.js (App Router & UI)

- **Framework:** Use **Next.js 16+** with the **App Router** (`app/`)
- **AI Integration:** Use **Vercel AI SDK** (`ai/react`) for all chat interfaces
- **Rendering Strategy:** Default to **React Server Components (RSC)**
- **Data Fetching:** Fetch data directly in Server Components, use **Server Actions** for mutations
- **State Management:** Use URL Search Params (`nuqs`) for shareable UI state
- **Component Library:** Use **Shadcn UI** components located in `components/ui`
- **Naming:** Folders: `kebab-case`, Files: `PascalCase`

#### Tailwind CSS v4

- **Configuration:** Use the **CSS-first** configuration approach
- **Theming:** Define all design tokens using the `@theme` directive in CSS
- **Dynamic Values:** Use the new v4 dynamic syntax for one-off values
- **Composition:** Use `@utility` to create composed classes if repeating 10+ utility classes

---

## Changelog

### Version v9.6 (2025-12-17) - Aggressive Consolidation + Comprehensive Standardization
- Deleted archive/ folder (aggressive cleanup)
- Merged all .pendoah/platform/docs content into playbook
- Enhanced standardize-repo.sh with template generation (Dockerfiles, K8s manifests)
- Added auto-detection of stack (Python/FastAPI vs Node.js/Fastify)
- Added canonical naming to all generated K8s manifests
- Added New App Onboarding section
- Added LangGraph AI Standard documentation
- Enhanced troubleshooting with TLS, Ingress, and Database sections
- Deleted entire .pendoah/ folder after consolidation
- **Result:** ~95% reduction in files, single source of truth
- **Distribution:** Added combined distribution/standardization script for .github folder
- **Agents/Instructions:** Updated all 22 agents and 20 instructions with v9.6 platform context
- **Path Fixes:** Removed all hardcoded Windows paths, using relative paths
- **Post-Scripts:** Added automation for database init, secret injection, K8s deployment
- **Comprehensive Standardization:** Added infrastructure validation, auto-setup, canonical naming enforcement
- **Code Patterns:** Added batch code pattern updates (Whisper removal, API host fixes)
- **Validation:** Added comprehensive validation scripts (naming, K8s, env, code, frontend)
- **Canonical Allowlist:** Enforced 23 canonical apps + 4 static apps classification
- **Environment Contract:** Standardized required variables per repo type
- **K8s Labels:** Added Kubernetes recommended labels to all manifests
- **Speech Providers:** Replaced Whisper with provider abstraction (ElevenLabs default)

### Version v9.5 (2025-12-17)
- Unified all documentation into single playbook
- Consolidated all scripts into 4 core automation scripts
- Added RAG capabilities (pgvector, 1024-dim)
- Added storage isolation (app-level prefixes)
- Standardized Hybrid AI stack (10 providers)
- Zero-touch automation with bootstrap script

### Version v2.0 (2025-12-16)
- Added Hybrid AI stack (10 providers)
- Standardized model preferences

### Version v1.0 (2025-12-16)
- Initial standard defined
- Root .env strategy implemented
- Builder droplet architecture established
- Automated standardization scripts created
- Validation tooling implemented

---

**End of Unified Playbook**

For questions or issues, contact: Sarosh Hussain (sarosh.hussain@mahumtech.com)

