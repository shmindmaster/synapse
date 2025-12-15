
    # Synapse Agent Runbook

    > **Note:** This file provides quick reference. For complete agent guidance, see `AGENTS.md` (Shared Platform Standard).

    **Mission:** CPU-only on shared DO stack. No new infra. Follow this to build, test, and deploy safely.

    ## 1) Identity & Endpoints
    - Slug/namespace/db: `synapse` (lowercase everywhere)
    - Cluster: `sh-demo-cluster` (NYC3) v1.34.1-do.1
    - Registry: `registry.digitalocean.com/shtrial-reg`
    - Hosts: `synapse.shtrial.com` (frontend), `api-synapse.shtrial.com` (backend)
    - TLS: Per-app TLS certificate (standard): Each app namespace must have a cert-manager Certificate named wildcard-shtrial-tls issuing a TLS secret wildcard-shtrial-tls for synapse.shtrial.com and api-synapse.shtrial.com using ClusterIssuer/letsencrypt-prod (HTTP-01). Do not create *.shtrial.com wildcard certificates.
    - Sentry projects: `synapse-frontend`, `synapse-backend` (Sarosh org); no shared DSNs

    ## 2) Code Map (common layout)
    - Frontend root: `apps/frontend/` (Next.js App Router or Vite). Routes/components under `app/` or `src/`. API client helpers typically `apps/frontend/src/lib/api`.
    - Frontend state/UI: hooks/components under `apps/frontend/src` (look for `hooks`, `components`). Tests: `apps/frontend/e2e` or `tests` with Playwright config.
    - Backend root: `apps/backend/` (FastAPI Python or Node Fastify). Main entry `src/main.py` or `src/index.ts`. API routes under `src/api` or `src/routers`. Services/agents under `src/agents` or `src/services`. Config/env loader under `src/config`.
    - Vector/RAG: use shared Postgres via `doc_embeddings`; ingestion scripts (if present) under `scripts/` or `utils/`.
    - K8s: `k8s/` templates; scripts: `scripts/` for deploy; test plans: `TEST_PLAN.md` at repo root.

    ## 3) Naming (enforced)
    - Images: frontend `registry.digitalocean.com/shtrial-reg/synapse-frontend:latest`, backend `registry.digitalocean.com/shtrial-reg/synapse-backend:latest`
    - K8s names/labels: `synapse-frontend` and `synapse-backend` for Deployment/Service/Container; label `app: synapse-frontend|backend`
    - Ingress hosts: `synapse.shtrial.com`, `api-synapse.shtrial.com` with TLS secret `wildcard-shtrial-tls`

    ## 4) Data & Vector Store (shared Postgres only)
    - Database: `synapse` on `sh-shared-postgres-do-user-29516566-0.f.db.ondigitalocean.com:25060`, user `doadmin`, `sslmode=require`.
    - Extensions pre-enabled: `pgcrypto`, `vector/pgvector`. Do **not** create Pinecone/Weaviate/Chroma/extra DO vector services.
    - Table (precreated): `doc_embeddings(id uuid default gen_random_uuid() primary key, doc_id text, chunk_index int, content text, embedding vector(1024), created_at timestamptz default now())`; index `ivfflat` on `embedding vector_l2_ops (lists=100)`.
    - RAG rules: keep dim=1024; reuse `doc_embeddings`; upsert with stable `doc_id` + `chunk_index`.

    ## 5) Storage
    - Spaces bucket: `sh-storage` (NYC3) + CDN, endpoint `https://nyc3.digitaloceanspaces.com`; prefix paths with `synapse/...`. No new buckets.


### AI Models (Gradient)
- LLM fast: `openai-gpt-oss-20b`
- LLM reason: `openai-gpt-oss-120b`
- LLM small: `openai-gpt-oss-20b` (preferred fast model) or `llama3-8b-instruct` (alternative)
- Embeddings: `Alibaba-NLP/gte-large-en-v1.5` (dim=1024)
- Image gen: `fal-ai/flux/schnell`
- TTS: `fal-ai/elevenlabs/tts/multilingual-v2`
- STT (local): `http://whisper-service.ai-services.svc.cluster.local:9000/transcribe`


    ## 6) Required .env.shared (per app)
    ```dotenv
    APP_SLUG=synapse
    APP_DOMAIN_BASE=shtrial.com
    NEXT_PUBLIC_API_URL=https://api-synapse.shtrial.com
    DO_CLUSTER_NAME=sh-demo-cluster
    DO_REGISTRY_URL=registry.digitalocean.com/shtrial-reg
    DO_NAMESPACE=synapse
    DATABASE_URL="postgresql://doadmin:AVNS_YjWXReTbi5Epp6MzXjq@sh-shared-postgres-do-user-29516566-0.f.db.ondigitalocean.com:25060/synapse?sslmode=require"
    DO_DATABASE_URL_PRIVATE="postgresql://doadmin:AVNS_YjWXReTbi5Epp6MzXjq@private-sh-shared-postgres-do-user-29516566-0.f.db.ondigitalocean.com:25060/synapse?sslmode=require"
    DO_SPACES_BUCKET=sh-storage
    DO_SPACES_ENDPOINT=https://nyc3.digitaloceanspaces.com
    DO_SPACES_KEY=DO00LMB24WZXVCMK6G22
    DO_SPACES_SECRET=iF+p6XAKezSNNCKsIB3f0XGS+6/gmDE+8VPZCyyBU1o
    GRADIENT_API_BASE=https://inference.do-ai.run/v1
    GRADIENT_API_KEY=sk-do-uthd1l4FYE-EUeITacHO9LHOFFJnHdVNdio21yT07SwyDyg3yIa0ip4dOa
    LLM_MODEL_ID=openai-gpt-oss-20b
    LLM_MODEL_PREMIUM=openai-gpt-oss-120b
    AI_MODEL_IMAGE=fal-ai/flux/schnell
    AI_MODEL_TTS=fal-ai/elevenlabs/tts/multilingual-v2
    WHISPER_API_URL=http://whisper-service.ai-services.svc.cluster.local:9000/transcribe
    PORT=8000
    DOCKER_BUILDKIT=1
    ```

    ## 7) Build & Test
    - Frontend: `pnpm -C apps/frontend install && pnpm -C apps/frontend lint && pnpm -C apps/frontend build`
    - Backend (py): `poetry install && poetry run pytest` (or run lint if configured); if Node backend: `pnpm -C apps/backend install && pnpm -C apps/backend lint && pnpm -C apps/backend build`
    - E2E: `pnpm -C apps/frontend test:e2e` or `npx playwright test --config apps/frontend/playwright.config.ts`
    - Follow `TEST_PLAN.md` for golden paths and APIs.

    ## 8) Deploy (canonical)
    1) Build/push images to names above.
    2) `envsubst` manifests in `k8s/`; apply to namespace `synapse`.
    3) Ensure ingress hosts `synapse.shtrial.com` and `api-synapse.shtrial.com` with Per-app TLS certificate (standard): Each app namespace must have a cert-manager Certificate named wildcard-shtrial-tls issuing a TLS secret wildcard-shtrial-tls for synapse.shtrial.com and api-synapse.shtrial.com using ClusterIssuer/letsencrypt-prod (HTTP-01). Do not create *.shtrial.com wildcard certificates..
    4) Verify rollout: `kubectl get deploy,svc,ingress -n synapse`; wait for cert ready.

    ## 9) Verification (blockers)
    - Ingress: `curl -I https://synapse.shtrial.com` and `curl -I https://api-synapse.shtrial.com/health` (expect 200/30x).
    - Sentry: trigger test events; confirm in `synapse-frontend` and `synapse-backend` projects.
    - Vector: `\d+ doc_embeddings` shows ivfflat; embeddings dim 1024.
    - Tests: TEST_PLAN + Playwright must pass for feature changes.

    ## 10) Patterns & Rules
    - API: use typed schemas (Pydantic/FastAPI or zod), structured errors, request validation, and logging with request ids.
    - Auth: reuse existing middleware; do not roll custom auth.
    - Frontend data: use existing fetch/React Query/SWR helpers; show user-facing errors; keep host from `NEXT_PUBLIC_API_URL`.
    - RAG: normalize text before embedding; deterministic chunking; upsert by `doc_id`+`chunk_index`.
    - No GPUs, no new infra, no secrets in git, no alternate certs/hosts, no alternate vector stores.
