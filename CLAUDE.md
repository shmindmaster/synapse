# Synapse - AI Agent Instructions

> **For AI Agents (Claude, Devin, Cursor, Gemini, etc.):** This document provides repo-specific context and references the Shared Platform + Per-App Logical Isolation Standard.

---

## Reference: Shared Platform Standard

**Primary Reference:** See `../../shtrial-demo-standards.md` for the complete Shared Platform + Per-App Logical Isolation Standard.

This document provides **Synapse-specific context**. For infrastructure patterns, naming conventions, and shared services, refer to the root standard document.

---

## Application Identity

- **App Slug:** `synapse` (lowercase, matches repository folder name)
- **GitHub Repository:** `Synapse` (case-sensitive)
- **Kubernetes Namespace:** `synapse`
- **Database Name:** `synapse` (in `sh-shared-postgres` cluster)
- **Storage Prefix:** `synapse/`
- **Vector Table Prefix:** `synapse_*`

---

## Application Overview

**Synapse** is a local-first RAG (Retrieval Augmented Generation) engine that transforms codebases and technical documentation into an intelligent, queryable knowledge base. Built for developers who value privacy, control, and the freedom to understand their codebase without vendor lock-in.

### Key Features

- **Semantic Codebase Search**: Find code by what it does, not just what it's named
- **Documentation Indexing**: Index and search technical documentation
- **Privacy-First Architecture**: Codebase and embeddings stay on your infrastructure
- **Local-First, Cloud-Optional**: Run locally or deploy to your own servers
- **RAG Integration**: Vector search over code and documentation
- **Multi-Repository Support**: Index multiple codebases and documentation sources

### Architecture

- **Frontend:** Next.js App Router + React + TypeScript
- **Backend:** Fastify (Node.js) - REST API
- **Database:** PostgreSQL with Prisma ORM + pgvector
- **AI/LLM:** DigitalOcean GenAI (Gradient) - **Native only**
- **Agent Framework:** LangGraph/LangChain for agent orchestration

---

## Shared Infrastructure (Platform-Provided)

Synapse uses the shared DigitalOcean infrastructure. See `../../shtrial-demo-standards.md` for complete details.

### Quick Reference

- **Cluster:** `sh-demo-cluster` (ID: `fa17ab7c-4a61-4c4d-a80a-1fc8bf26d782`)
- **Region:** `nyc3`
- **Database:** `sh-shared-postgres` → database: `synapse`
- **Storage:** `sh-storage` → prefix: `synapse/`
- **Registry:** `registry.digitalocean.com/shtrial-reg`
- **Ingress Hosts:**
  - Frontend: `synapse.shtrial.com`
  - Backend: `api-synapse.shtrial.com` ⚠️ **Note:** Use `api-synapse` (with hyphen), NOT `api.synapse` (with dot)
- **LLM Endpoint:** `https://inference.do-ai.run/v1` (DigitalOcean GenAI only)
- **Whisper Service:** `http://whisper-service.ai-services.svc.cluster.local:9000/transcribe`
- **Observability:** Sentry (projects: `synapse-frontend`, `synapse-backend`)

---

## Naming & Isolation Rules

Following the Shared Platform Standard:

### Kubernetes

- **Namespace:** `synapse` (not `app-synapse`)
- **Service names:** `backend`, `frontend` (lowercase, no prefix)
- **Deployment names:** `backend`, `frontend`
- **Ingress name:** `app-ingress`
- **Secret name:** `app-secrets`

### Data Segmentation

- **Database:** `synapse` (DB-per-app model)
- **Storage prefix:** `synapse/` (in shared bucket `sh-storage`)
- **Vector tables:** `synapse_*` prefix (e.g., `synapse_embeddings`, `synapse_documents`)

### Container Images

- **Naming:** `registry.digitalocean.com/shtrial-reg/synapse-{SERVICE}:{TAG}`
- **Examples:**
  - `registry.digitalocean.com/shtrial-reg/synapse-backend:latest`
  - `registry.digitalocean.com/shtrial-reg/synapse-frontend:latest`

---

## Environment Configuration

### Required Environment Variables

All configuration is in `.env.shared` at repository root. Key variables for Synapse:

```bash
# App Identity
APP_SLUG=synapse
APP_NAMESPACE=synapse
BASE_URL=https://synapse.shtrial.com
API_BASE_URL=https://api-synapse.shtrial.com

# Database (Shared Postgres)
DATABASE_URL="postgresql://doadmin:{PASSWORD}@sh-shared-postgres-do-user-29516566-0.f.db.ondigitalocean.com:25060/synapse?sslmode=require"
DATABASE_URL_INTERNAL="postgresql://doadmin:{PASSWORD}@private-sh-shared-postgres-do-user-29516566-0.f.db.ondigitalocean.com:25060/synapse?sslmode=require"

# Storage (DO Spaces)
OBJECT_STORAGE_BUCKET=sh-storage
OBJECT_STORAGE_PREFIX=synapse/
AWS_ENDPOINT_URL=https://nyc3.digitaloceanspaces.com
AWS_REGION=nyc3

# AI/LLM (DigitalOcean GenAI Only)
OPENAI_BASE_URL=https://inference.do-ai.run/v1
OPENAI_API_KEY={DIGITALOCEAN_GENAI_API_KEY}
MODEL_CHAT=openai-gpt-oss-120b
MODEL_FAST=openai-gpt-oss-20b
MODEL_EMBEDDING=Alibaba-NLP/gte-large-en-v1.5

# Whisper Service
WHISPER_API_URL=http://whisper-service.ai-services.svc.cluster.local:9000/transcribe

# Sentry
SENTRY_DSN_FRONTEND={SENTRY_FRONTEND_DSN}
SENTRY_DSN_BACKEND={SENTRY_BACKEND_DSN}

# LangGraph/LangChain
LLM_API_BASE=https://inference.do-ai.run/v1
LLM_API_KEY={OPENAI_API_KEY}
LLM_MODEL_NAME={MODEL_CHAT}
VECTOR_STORE_CONNECTION_STRING={DATABASE_URL}
LANGGRAPH_CHECKPOINT_DB={DATABASE_URL}
```

**Full configuration:** See `.env.shared` file for complete list.

---

## AI/LLM Constraints

**CRITICAL:** Synapse must use **only DigitalOcean native models**. External providers (AWS Bedrock, Google Gemini, Groq, Cerebras, etc.) are **not supported**.

### Available DigitalOcean Native Models

**Standard LLM Models (Preferred):**
- `openai-gpt-oss-120b` - **Default/Premium** - Cost-effective, high quality (117B params) ⭐ **PREFERRED**
- `openai-gpt-oss-20b` - **Fast** - Quick responses (21B params) ⭐ **PREFERRED**

**Alternative LLM Models:**
- `llama3.3-70b-instruct` - Llama 3.3 (70B params) - Alternative to openai-gpt-oss-120b
- `llama3-8b-instruct` - Llama 3.1 (8B params) - Alternative to openai-gpt-oss-20b
- `mistral-nemo-instruct-2407` - NeMo (12B params)
- `deepseek-r1-distill-llama-70b` - DeepSeek (70B params)

**Serverless Inference (Multimodal):**
- `fal-ai/fast-sdxl` - Image generation
- `fal-ai/flux/schnell` - Image generation
- `fal-ai/stable-audio-25/text-to-audio` - Text-to-audio
- `fal-ai/elevenlabs/tts/multilingual-v2` - Text-to-speech

**Embedding Models:**
- `Alibaba-NLP/gte-large-en-v1.5` - **Default** (434M params) ⭐ **PREFERRED**
- `sentence-transformers/all-MiniLM-L6-v2` - Lightweight (22.7M params)
- `sentence-transformers/multi-qa-mpnet-base-dot-v1` - QA-focused (109M params)

See `../../shtrial-demo-standards.md` for complete model list.

---

## LangGraph/LangChain Implementation

Synapse uses **LangGraph/LangChain** for agent orchestration and business logic.

### Architecture Pattern

```
┌─────────────────────────────────────────────────────────┐
│ Application Layer (LangGraph/LangChain)                  │
│ - Agent graphs and workflows                            │
│ - Business logic and tool calling                       │
│ - State management (Postgres-backed checkpoints)        │
└─────────────────────────────────────────────────────────┘
                        ↓
┌─────────────────────────────────────────────────────────┐
│ DigitalOcean Infrastructure Layer                       │
│ - Kubernetes (compute)                                  │
│ - Postgres + pgvector (data + vectors)                  │
│ - Spaces (object storage)                                │
│ - GenAI (LLM inference)                                 │
│ - Whisper service (ASR/STT)                             │
└─────────────────────────────────────────────────────────┘
```

### Implementation Guidelines

1. **LLM Access:**
   - Use `OPENAI_API_BASE=https://inference.do-ai.run/v1`
   - Use `OPENAI_API_KEY` from `.env.shared`
   - Configure LangChain `ChatOpenAI` or LangGraph LLM nodes

2. **Vector Storage:**
   - Store embeddings in Postgres with pgvector
   - Use table prefix: `synapse_embeddings`
   - Use LangChain PGVector store for retrieval

3. **State Persistence:**
   - Use LangGraph checkpointers with Postgres backend
   - Store conversation state per `thread_id` or `session_id`
   - Use `synapse` database for isolation

4. **Tool Implementation:**
   - Tools interact with DigitalOcean services (Spaces, Postgres)
   - Use LangChain tool decorators for function calling

5. **RAG Implementation:**
   - Use LangChain document loaders for content ingestion
   - Store chunks in `synapse_documents` and `synapse_chunks` tables
   - Use LangChain retrievers with pgvector similarity search

---

## Deployment Process

### Quick Deploy

```bash
# Primary deployment method
bash scripts/k8s-deploy.sh
```

The deployment script:
1. Loads configuration from `.env.shared`
2. Builds and pushes Docker images to registry
3. Generates K8s manifests using `envsubst`
4. Creates namespace if needed
5. Applies all manifests
6. Ensures database exists

### Manual Deployment Steps

1. **Build locally:**
   ```bash
   # Backend
   docker build -t registry.digitalocean.com/shtrial-reg/synapse-backend:latest -f apps/backend/Dockerfile .
   
   # Frontend
   docker build -t registry.digitalocean.com/shtrial-reg/synapse-frontend:latest -f apps/frontend/Dockerfile .
   ```

2. **Push to registry:**
   ```bash
   doctl registry login
   docker push registry.digitalocean.com/shtrial-reg/synapse-backend:latest
   docker push registry.digitalocean.com/shtrial-reg/synapse-frontend:latest
   ```

3. **Deploy to Kubernetes:**
   ```bash
   doctl kubernetes cluster kubeconfig save sh-demo-cluster
   kubectl create namespace synapse --dry-run=client -o yaml | kubectl apply -f -
   kubectl apply -f k8s/ -n synapse
   ```

### Kubernetes Resources

Standard resources in `k8s/` directory:
- `01-namespace.yaml` - App namespace
- `02-secret.yaml` - Environment variables and secrets
- `03-backend.yaml` - Backend deployment
- `04-frontend.yaml` - Frontend deployment
- `07-ingress.yaml` - Ingress with TLS configuration

**Ingress Configuration:**
- Uses `ingressClassName: nginx`
- Uses `cert-manager.io/cluster-issuer: letsencrypt-prod`
- Hosts: `synapse.shtrial.com` and `api-synapse.shtrial.com`
- TLS secret: `wildcard-shtrial-tls`

---

## Database Setup

The database `synapse` is automatically created in `sh-shared-postgres` during deployment.

**Connection Details:**
- **Host (Public):** `sh-shared-postgres-do-user-29516566-0.f.db.ondigitalocean.com`
- **Host (Private):** `private-sh-shared-postgres-do-user-29516566-0.f.db.ondigitalocean.com` (use for internal cluster access)
- **Port:** `25060`
- **User:** `doadmin`
- **Database:** `synapse`
- **SSL:** Required (`sslmode=require`)

**Extensions:**
- `pgvector` - For vector embeddings
- `pgcrypto` - For cryptographic functions

**Vector Tables:**
- Use prefix `synapse_` for all vector-related tables
- Examples: `synapse_embeddings`, `synapse_documents`, `synapse_chunks`

---

## Storage Operations

**DigitalOcean Spaces:**
- **Bucket:** `sh-storage`
- **Endpoint:** `https://nyc3.digitaloceanspaces.com`
- **Region:** `nyc3`
- **Prefix:** `synapse/`
- **CDN:** `https://sh-storage.nyc3.cdn.digitaloceanspaces.com/synapse/`

**Storage Paths:**
- Uploads: `synapse/uploads/`
- Documents: `synapse/documents/`
- Exports: `synapse/exports/`

---

## AI Agent Instructions

### When Working on This Repository

1. **Always source `.env.shared`** before running commands:
   ```bash
   set -o allexport; source .env.shared; set +o allexport
   ```

2. **Use standardized naming:**
   - App slug: `synapse` (lowercase)
   - Namespace: `synapse` (not `app-synapse`)
   - Service names: `backend`, `frontend` (lowercase, no prefix)
   - Ingress hosts: `synapse.shtrial.com` and `api-synapse.shtrial.com`

3. **Deployment process:**
   - Never hardcode values - use environment variables
   - Always use `scripts/k8s-deploy.sh` for deployments
   - Verify `.env.shared` exists and is complete before deploying

4. **Database operations:**
   - Use `DATABASE_URL` from `.env.shared`
   - Run migrations before deploying new code
   - Use Prisma migrations: `npx prisma migrate deploy`
   - Never use `prisma migrate dev` on production database

5. **Storage operations:**
   - Use `synapse/` prefix for all uploaded files
   - Access via `DO_SPACES_ENDPOINT` and `DO_SPACES_BUCKET`
   - CDN URL: `NEXT_PUBLIC_CDN_BASE_URL`

6. **AI/LLM operations:**
   - **ONLY** use DigitalOcean GenAI models
   - Use `OPENAI_API_BASE=https://inference.do-ai.run/v1`
   - Use `OPENAI_API_KEY` from `.env.shared`
   - **DO NOT** use external providers (AWS, Google, Groq, etc.)

7. **Vector/RAG operations:**
   - Store embeddings in Postgres with pgvector
   - Use table prefix: `synapse_*`
   - Use LangChain PGVector store for retrieval

8. **TLS and Ingress:**
   - Use `ingressClassName: nginx`
   - Use `cert-manager.io/cluster-issuer: letsencrypt-prod`
   - Hosts: `synapse.shtrial.com` and `api-synapse.shtrial.com`
   - TLS secret: `wildcard-shtrial-tls`

### Forbidden Actions

❌ **DO NOT**:
- Create separate infrastructure resources (use shared resources)
- Hardcode credentials or connection strings
- Use external AI providers (AWS Bedrock, Google Gemini, Groq, Cerebras, etc.)
- Create per-app TLS certificates (use shared cert-manager setup)
- Use incorrect DNS patterns (`api.synapse` instead of `api-synapse`)
- Create vector tables without `synapse_` prefix

✅ **DO**:
- Use environment variables from `.env.shared`
- Follow naming conventions strictly
- Use shared infrastructure (cluster, database, storage, inference)
- Deploy via `scripts/k8s-deploy.sh`
- Test locally before deploying
- Use DigitalOcean native models only
- Use LangGraph/LangChain for agent orchestration

---

## Troubleshooting

### App Not Accessible

1. Check pods: `kubectl get pods -n synapse`
2. Check logs: `kubectl logs deployment/backend -n synapse`
3. Check ingress: `kubectl get ingress -n synapse`
4. Verify TLS secret: `kubectl get secret wildcard-shtrial-tls -n synapse`

### Database Connection Issues

1. Verify database exists: `doctl databases db list ${DO_DB_CLUSTER_ID}`
2. Check connection string: `echo $DATABASE_URL`
3. Test connection: `psql "$DATABASE_URL" -c "SELECT 1"`

### Deployment Failures

1. Check build logs: Review Docker build output
2. Verify registry access: `doctl registry login`
3. Check manifest generation: Review `k8s/generated/` files
4. Verify environment variables: `env | grep APP_SLUG`

### AI/LLM Issues

1. Verify API key: `echo $OPENAI_API_KEY`
2. Test endpoint: `curl https://inference.do-ai.run/v1/models -H "Authorization: Bearer $OPENAI_API_KEY"`
3. Check model availability: `doctl genai models list`

---

## References

- **Shared Platform Standard:** `../../shtrial-demo-standards.md` (PRIMARY REFERENCE)
- **Environment Configuration:** `.env.shared` (master configuration)
- **GitHub Copilot Config**: `.github/` (agents and instructions with platform context)
- **K8s Templates:** `k8s/` directory
- **Deployment Script:** `scripts/k8s-deploy.sh`

---

**Last Updated:** December 2025  
**Version:** Aligned with Shared Platform Standard  
**Cluster:** sh-demo-cluster (NYC3)
