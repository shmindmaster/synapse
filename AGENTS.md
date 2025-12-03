# AI Agent Guidelines (`agents.md`)

This repository is AI-agent-friendly, but with strict rules.

These instructions apply to **all coding agents**, including:
- GitHub Copilot / Copilot Workspace
- Gemini CLI / Gemini Code Assist
- Cursor, Windsurf, Devin, and any other codegen or refactor agents

---

## 1. Global Infrastructure Model (DigitalOcean-only)

All code in this repo must assume the **canonical shared infrastructure** defined by the central `.env.shared` for the `sh` organization.

### 1.1 Organization & Region

- Organization prefix: `SH_ORG_PREFIX=sh` 
- Primary region: `SH_REGION=nyc3` 
- New resources MUST target `nyc3` unless a human explicitly decides otherwise.

Do **not** introduce resources in other regions (e.g., `sfo3`, `fra1`) on your own.

### 1.2 Managed PostgreSQL (Shared Cluster)

Canonical DB resources:

- Cluster:
  - `SH_DB_CLUSTER_NAME=sh-shared-postgres` 
  - `SH_DB_CLUSTER_ID=<value>` 
- Connection envs (do not rename):
  - `DB_HOST`, `DB_HOST_PRIVATE`, `DB_PORT`, `DB_USER`, `DB_PASSWORD`, `DB_SSL_MODE` 
  - `DO_DATABASE_URL_PUBLIC`, `DO_DATABASE_URL_PRIVATE` 
  - `DATABASE_URL`, `DATABASE_URL_PRIVATE` (Prisma / legacy compatibility)

**Agent rules:**

1. Use this **single managed Postgres cluster** for all database needs.
2. Use **separate databases or schemas** for different apps/features.
3. Do **not**:
   - Spin up new Postgres Droplets.
   - Create additional managed Postgres clusters.
   - Hardcode credentials in code.

All DB credentials come from environment variables only.

### 1.3 DigitalOcean Spaces & CDN (Shared Bucket)

Canonical storage resources:

- `DO_SPACES_ENDPOINT=https://nyc3.digitaloceanspaces.com` 
- `DO_SPACES_BUCKET=voxops` 
- `SH_SPACES_BUCKET=voxops` 
- `DO_SPACES_REGION=nyc3` 
- `DO_SPACES_CDN_ENDPOINT=https://voxops.nyc3.cdn.digitaloceanspaces.com` 
- `NEXT_PUBLIC_CDN_BASE_URL=https://voxops.nyc3.cdn.digitaloceanspaces.com` 

**Agent rules:**

1. Use the **existing `voxops` bucket** for all object storage.
2. Organize by path prefix (`app-name/...`) rather than adding new buckets.
3. Serve public assets via `DO_SPACES_CDN_ENDPOINT` / `NEXT_PUBLIC_CDN_BASE_URL`.
4. Do not create new Spaces buckets or regions unless explicitly requested.

### 1.4 AI Stack: DO RAG, Gradient, and FAL

Canonical AI resources:

- RAG / embeddings:
  - `DO_RAG_REGION=nyc3` 
  - `DO_RAG_OPENSEARCH_REGION_OPTIONS=nyc1,nyc2,sfo2,sfo3,atl1,tor1,lon1,ams3,fra1` 
  - `DO_RAG_EMBEDDING_MODEL_ID_1` 
  - `DO_RAG_EMBEDDING_MODEL_ID_2` 
  - `DO_RAG_EMBEDDING_MODEL_ID_3` 
  - `DO_RAG_EMBEDDING_MODEL_DEFAULT=GTE LARGE EN V1.5` 
  - `DO_RAG_EMBEDDING_MODEL_LOW_COST_1=All MiniLM L6 v2` 
  - `DO_RAG_EMBEDDING_MODEL_LOW_COST_2=Multi QA MPNet Base Dot v1` 

- Gradient AI Inference:
  - `DIGITALOCEAN_INFERENCE_ENDPOINT=https://inference.do-ai.run/v1` 
  - `DIGITALOCEAN_MODEL_KEY` 
  - `AI_PROVIDER=digitalocean` 
  - `AI_MODEL=llama-3.1-70b-instruct` 
  - `SH_GRADIENT_KEY_NAME=sh-shared-gradient-key` 
  - `SH_GRADIENT_KEY_UUID` 

- FAL via DigitalOcean:
  - `FAL_MODEL_FAST_SDXL` 
  - `FAL_MODEL_FLUX_SCHNELL` 
  - `FAL_MODEL_STABLE_AUDIO` 
  - `FAL_MODEL_TTS_V2` 

**Agent rules:**

1. All LLM / embedding / multimodal calls go through a **shared AI gateway layer** in code (e.g., `src/lib/ai/doClient.ts`), not directly scattered everywhere.
2. The gateway:
   - Reads models and keys from the env vars above.
   - Uses low-cost embeddings by default:
     - Prefer `DO_RAG_EMBEDDING_MODEL_LOW_COST_*` for general work.
   - Uses expensive models (`AI_MODEL`) only for explicitly high-value tasks.
3. Do not:
   - Hardcode keys or model names.
   - Introduce other AI providers as primary infra (OpenAI, Anthropic, etc.) unless explicitly required.

### 1.5 Compute & Deployment Conventions

Assume:

- Backends run on a **small set of shared Droplets** in `nyc3` (e.g., `sh-app-01`, `sh-app-02`, `sh-dev-01`).
- Frontends are:
  - Static builds on DigitalOcean App Platform, or
  - Served as built assets via NGINX on these Droplets.
- Background jobs use DigitalOcean Functions where possible.

**Agent rules:**

- Prefer **consolidation**: multiple apps/services per Droplet via Docker, not one Droplet per microservice.
- Do not create new Droplets / Kubernetes clusters in code (Terraform, scripts, etc.) unless guided by an infra doc.

---

## 2. Foundational Dev Services

Canonical env vars (names only):

- DNS via Namecheap:
  - `NAMECHEAP_API_USER`, `NAMECHEAP_API_KEY`, `NAMECHEAP_USERNAME`, `NAMECHEAP_PASSWORD` 
- GitHub & CI:
  - `GITHUB_PAT_SHMINDMASTER`, `GITHUB_PAT_SH-PENDOAH` 
- Scraping & search:
  - `FIRECRAWL_API_KEY`, `CONTEXT7_API_KEY`, `TAVILY_API_KEY`, `DEVIN_API_KEY` 

**Agent rules:**

- Never hardcode values for these keys.
- Do not rename these environment variables.
- If adding new env vars, document them in `.env.example` without secrets.

---

## 3. Tooling & Code Style

1. **Package manager**
   - Use **pnpm** for Node/TypeScript projects:
     ```bash
     pnpm install
     pnpm add <package>
     pnpm add -D <dev-package>
     ```
   - Do not suggest `npm` or `yarn` unless explicitly documented.

2. **Languages**
   - Prefer TypeScript where the project uses TS.
   - Match existing frameworks and patterns (React/Next/Vite/etc.).

3. **File system rules**
   - Do **not** modify:
     - `node_modules/` 
     - Build output (`.next/`, `dist/`, etc.)
     - Generated code folders (e.g., `src/generated`, `src/__generated__`)
     - Auto-generated UI components (e.g., `src/components/ui/`) unless instructed.

---

## 4. Security & Secrets

- Do not commit `.env` files or real credentials.
- Read all secrets from environment variables.
- Do not log secret values or full tokens.
- If changing config, update `.env.example` and docs with **placeholder** values only.

---

## 5. Change Discipline

- Prefer **focused, minimal** changes over large refactors.
- When changing critical logic (auth, billing, AI gateway, DB migrations):
  - Add or update tests where a test framework exists.
- Always provide **full file contents** in automated changes, not partial edits with `...`.

If anything in this document conflicts with repo-specific architecture docs, the repo-specific docs win, but **never violate the shared DigitalOcean model described above** without explicit human approval.
