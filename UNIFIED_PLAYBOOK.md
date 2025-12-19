# SHTrial Unified Platform Playbook

**Version:** v10.0 (App Platform Edition)  
**Last Updated:** 2025-12-18  
**Status:** Production Ready

---

## Quick Reference

| Resource | Details |
| --- | --- |
| **Platform** | DigitalOcean App Platform (PaaS) |
| **Database** | `sh-shared-postgres` (Postgres 18 + pgvector, cluster ID: `b5d6876f-9b87-4e99-b9bc-f7d5795f6ae8`) |
| **Storage** | `sh-storage` (Spaces, NYC3, CDN enabled) |
| **Embedding Gateway** | `sh-embedding-gateway` (167.71.242.153:12435, Basic Auth) |
| **Deployment** | Automatic on `git push` to `main` |
| **DNS** | `{APP_SLUG}.shtrial.com`, `api-{APP_SLUG}.shtrial.com` |

---

## Architecture

```
DigitalOcean App Platform
├── Frontend (Next.js/Vite) → https://{APP_SLUG}.shtrial.com
├── Backend (FastAPI/Fastify) → https://api-{APP_SLUG}.shtrial.com
└── Worker (optional, background tasks)

Shared Resources:
├── Postgres 18 + pgvector (logical DB per app: {APP_SLUG})
├── Spaces bucket (prefix isolation: {APP_SLUG}/)
└── Embedding Gateway (self-hosted droplet, Basic Auth)
```

---

## Repository Structure

```
{APP_SLUG}/
├── app.yaml              # App Platform spec (source of truth)
├── .env                  # Local dev (not committed)
├── .env.example          # Template (committed)
├── AGENTS.md             # Agent documentation
├── apps/
│   ├── frontend/         # Next.js/Vite app
│   │   ├── Dockerfile
│   │   └── package.json
│   └── backend/          # FastAPI/Fastify app
│       ├── Dockerfile
│       └── src/
└── scripts/
    ├── bootstrap-app.sh  # One-time setup
    ├── setup-dns.sh      # DNS configuration
    ├── deploy.sh         # Update app config
    └── migrate.sh        # DB migrations
```

---

## Naming Standards

### App Identity
- **APP_SLUG:** Lowercase, DNS-safe, matches repo name
- **Canonical Apps (22):** `apexcoachai`, `aura`, `billigent`, `campgen`, `careaxis`, `careiq`, `comminsightsai`, `financeos`, `flashmaster`, `homeiq`, `jurisai`, `lawli`, `magiccommerce`, `omniforge`, `petdnaplus`, `prismiq`, `quantcoach`, `serenemind`, `synapse`, `ummaconnect`, `voxops`, `warrantygains`
- **Static Apps (4):** `mahumtech`, `saroshhussain`, `shtrial`, `tgiagency`

### DNS & Domains
- Frontend: `{APP_SLUG}.shtrial.com`
- Backend: `api-{APP_SLUG}.shtrial.com` (hyphen, NOT dot)
- Platform: `{APP_SLUG}.ondigitalocean.app` (auto-generated)

### App Platform Components
- App Name: `{APP_SLUG}`
- Services: `frontend`, `backend`, `worker` (generic names, scoped to app)
- Internal DNS: `http://backend:8000` (within same app)

### Resources
- GitHub: `sh-pendoah/{APP_SLUG}` or `shmindmaster/{APP_SLUG}`
- Database: `{APP_SLUG}` (logical DB in shared cluster)
- Storage Prefix: `{APP_SLUG}/` (required for isolation)
- Sentry: `{APP_SLUG}-frontend`, `{APP_SLUG}-backend`

---

## app.yaml Template

```yaml
name: __APP_SLUG__
region: nyc

services:
- name: backend
  source_dir: apps/backend
  dockerfile_path: Dockerfile
  github:
    branch: main
    deploy_on_push: true
    repo: sh-pendoah/__APP_SLUG__  # or shmindmaster/__APP_SLUG__
  http_port: 8000
  instance_size_slug: basic-xs
  routes:
  - path: /
  envs:
  - key: APP_SLUG
    value: __APP_SLUG__
  # Secrets injected via App Platform Settings

- name: frontend
  source_dir: apps/frontend
  dockerfile_path: Dockerfile
  github:
    branch: main
    deploy_on_push: true
    repo: sh-pendoah/__APP_SLUG__
  http_port: 3000
  instance_size_slug: basic-xs
  routes:
  - path: /
  envs:
  - key: NEXT_PUBLIC_API_URL
    value: https://api-__APP_SLUG__.shtrial.com

# Optional: Workers & Jobs
workers:
- name: worker
  source_dir: apps/worker
  dockerfile_path: Dockerfile
  github:
    branch: main
    deploy_on_push: true
    repo: sh-pendoah/__APP_SLUG__
  instance_size_slug: basic-xs

jobs:
- name: migrate-db
  kind: POST_DEPLOY
  source_dir: apps/backend
  dockerfile_path: Dockerfile
  run_command: ./scripts/migrate.sh
  instance_size_slug: basic-xs
  github:
    branch: main
    repo: sh-pendoah/__APP_SLUG__
```

---

## Environment Variables

### Master Template (`H:\Repos\sh\.env`)
Contains all shared infrastructure config. App-specific `.env` files are generated from this template.

### Required Variables

**Identity & Routing:**
```env
APP_SLUG={APP_SLUG}
NEXT_PUBLIC_API_URL=https://api-{APP_SLUG}.shtrial.com
```

**Database:**
```env
DATABASE_URL=postgresql://.../{APP_SLUG}?sslmode=require
PGDATABASE={APP_SLUG}
VECTOR_STORE_CONNECTION_STRING=${DATABASE_URL}
```

**Storage:**
```env
OBJECT_STORAGE_PREFIX={APP_SLUG}/
AWS_BUCKET_NAME=sh-storage
AWS_ENDPOINT_URL=https://nyc3.digitaloceanspaces.com
```

**AI Models (use env vars, never hardcode):**
```env
MODEL_CHAT=openai-gpt-oss-120b
MODEL_FAST=openai-gpt-oss-20b
MODEL_IMAGE=fal-ai/fast-sdxl
MODEL_TTS=fal-ai/elevenlabs/tts/multilingual-v2
```

**Embedding Gateway:**
```env
EMBEDDING_API_BASE=http://167.71.242.153:12435/engines/v1
EMBEDDING_MODEL_NAME=ai/embeddinggemma
EMBEDDING_DIM=768
EMBEDDING_BASIC_USER=embeddings
EMBEDDING_BASIC_PASS=<password>
```

**Sentry:**
```env
NEXT_PUBLIC_SENTRY_DSN=<frontend-dsn>
SENTRY_DSN=<backend-dsn>
SENTRY_RELEASE=${COMMIT_HASH}  # Auto-injected by App Platform
```

### Auto-Injected (App Platform)
- `APP_URL` - Default `.ondigitalocean.app` URL
- `COMMIT_HASH` - Git SHA for release tracking

---

## Infrastructure Resources

### Database
- **Cluster:** `sh-shared-postgres` (Postgres 18, NYC3)
- **Cluster ID:** `b5d6876f-9b87-4e99-b9bc-f7d5795f6ae8`
- **Isolation:** Logical database `{APP_SLUG}` per app
- **Extensions:** `pgvector` enabled on all databases

**Create DB:**
```bash
doctl databases db create b5d6876f-9b87-4e99-b9bc-f7d5795f6ae8 <app_slug>
```

### Storage
- **Bucket:** `sh-storage` (NYC3, CDN enabled)
- **Prefix:** `{APP_SLUG}/` (required for all uploads)
- **CDN:** `https://sh-storage.nyc3.cdn.digitaloceanspaces.com/{APP_SLUG}/`

**Critical:** Always use `OBJECT_STORAGE_PREFIX`:
```python
key = f"{os.getenv('OBJECT_STORAGE_PREFIX')}myfile.pdf"  # {APP_SLUG}/myfile.pdf
s3.upload_file("/tmp/myfile.pdf", os.getenv("AWS_BUCKET_NAME"), key)
```

### Embedding Gateway
- **Droplet:** `sh-embedding-gateway` (167.71.242.153:12435)
- **Model:** `ai/embeddinggemma` (768 dimensions)
- **Auth:** Basic Auth (use env vars)

**Usage:**
```typescript
const response = await fetch(process.env.EMBEDDING_API_BASE + '/embeddings', {
  method: 'POST',
  headers: {
    'Content-Type': 'application/json',
    'Authorization': `Basic ${btoa(`${process.env.EMBEDDING_BASIC_USER}:${process.env.EMBEDDING_BASIC_PASS}`)}`
  },
  body: JSON.stringify({
    model: process.env.EMBEDDING_MODEL_NAME,
    input: 'Text to embed'
  })
});
```

---

## Deployment

### Initial Setup
```bash
# 1. Create app from app.yaml
bash scripts/bootstrap-app.sh

# 2. Setup DNS (after deployment)
bash scripts/setup-dns.sh

# 3. Sync secrets
bash scripts/sync-app-secrets.sh <app-slug>
```

### Daily Workflow
```bash
# Local development
cd apps/backend && poetry run python src/main.py
cd apps/frontend && pnpm dev

# Deploy (automatic on push)
git add .
git commit -m "feat: new feature"
git push origin main
# App Platform automatically builds and deploys
```

### Manual Updates
```bash
# Update app config
bash scripts/deploy.sh

# Force rebuild
doctl apps create-deployment $(doctl apps list --format ID --no-header | grep <app-slug>)
```

---

## Dependency Management

### Node.js (pnpm)
```bash
pnpm add <package>           # Add dependency
pnpm add -D <package>        # Add dev dependency
pnpm update                  # Update all
pnpm update <package>        # Update specific
pnpm remove <package>        # Remove
pnpm audit                   # Security audit
pnpm audit --fix             # Auto-fix vulnerabilities
```

### Python (Poetry - Preferred)
```bash
poetry add <package>                    # Add dependency
poetry add --group dev <package>         # Add dev dependency
poetry update                            # Update all
poetry update <package>                  # Update specific
poetry remove <package>                  # Remove
poetry show --outdated                   # Check outdated
```

### Python (pip)
```bash
pip install <package>                    # Install
pip install --upgrade <package>          # Update
pip freeze > requirements.txt            # Update requirements
pip-audit -r requirements.txt           # Security audit
```

### Automated Updates
- **Renovate** configured via `renovate.json`
- Creates PRs for dependency updates
- Auto-merges security patches (if configured)

---

## Code Standards

### Frontend Stack
- **Next.js:** 16+ (App Router) or **Vite:** 7+
- **React:** 19
- **Tailwind CSS:** 4.1.x (token-based theming)
- **shadcn/ui:** CSS variable theming
- **Required Pages:** Landing, Login
- **Auth:** Auth.js (Next.js) or custom (FastAPI)

### Backend Stack
- **Python:** 3.12+ (FastAPI) or **Node:** 22 (Fastify)
- **AI Orchestration:** LangGraph (vendor-neutral)
- **Package Management:** Poetry (Python) / pnpm (TypeScript)

### Code Patterns

**DO:**
- ✅ Use env vars for models (`MODEL_CHAT`, `EMBEDDING_API_BASE`)
- ✅ Use `OBJECT_STORAGE_PREFIX` for all file uploads
- ✅ Use internal DNS (`http://backend:8000`) for service-to-service
- ✅ Use `api-{APP_SLUG}.shtrial.com` (hyphen, not dot)
- ✅ Build Dockerfiles from repo root context
- ✅ Set `PYTHONPATH=/app` in backend Dockerfile

**DON'T:**
- ❌ Hardcode model names or endpoints
- ❌ Upload files without `OBJECT_STORAGE_PREFIX`
- ❌ Use `localhost` in App Platform
- ❌ Use `api.{APP_SLUG}` (dot notation)
- ❌ Build Dockerfiles from subdirectories

---

## Troubleshooting

### View Logs
```bash
APP_ID=$(doctl apps list --format ID,Spec.Name --no-header | grep <app-slug> | awk '{print $1}')
doctl apps logs $APP_ID --follow
doctl apps logs $APP_ID --component backend --follow
```

### Common Issues

| Issue | Cause | Fix |
| --- | --- | --- |
| **Build Failed** | Dockerfile error | Test locally: `docker build .` |
| **Application Error** | Missing env var | Check App Platform Settings, run `sync-app-secrets.sh` |
| **Database Connection Failed** | IP not trusted | Enable "App Platform" in DB Trusted Sources |
| **CORS Error** | Origin not allowed | Add domains to `ALLOW_ORIGINS` env var |
| **Out of Memory** | Instance too small | Upgrade `instance_size_slug` in `app.yaml` |
| **Health Check Failed** | App not listening | Ensure listens on `0.0.0.0`, not `127.0.0.1` |

---

## Scripts Reference

All scripts are **idempotent** (safe to re-run):

- **`bootstrap-app.sh`** - Create App Platform app (one-time)
- **`setup-dns.sh`** - Configure DNS CNAMEs (after deployment)
- **`deploy.sh`** - Update app config from `app.yaml`
- **`sync-app-secrets.sh`** - Sync env vars from master `.env`
- **`migrate.sh`** - Run database migrations (auto-run on deploy)

---

## Critical Rules

1. **Storage:** Always use `OBJECT_STORAGE_PREFIX` - prevents cross-app contamination
2. **Models:** Never hardcode - use `MODEL_CHAT`, `MODEL_FAST`, `EMBEDDING_API_BASE`
3. **Internal Calls:** Use `http://backend:8000` (App Platform DNS)
4. **External Calls:** Use `NEXT_PUBLIC_API_URL` (from browser)
5. **Embeddings:** Use Basic Auth with env vars
6. **Database:** Use `DATABASE_URL` (shared cluster, logical DB per app)
7. **Deployment:** Just `git push` - App Platform handles the rest

---

## Quick Commands

```bash
# Get app ID
APP_ID=$(doctl apps list --format ID,Spec.Name --no-header | grep <app-slug> | awk '{print $1}')

# View logs
doctl apps logs $APP_ID --follow

# Create database
doctl databases db create b5d6876f-9b87-4e99-b9bc-f7d5795f6ae8 <app_slug>

# Enable pgvector
python scripts/infrastructure/enable-pgvector-all.py

# Sync secrets
bash scripts/sync-app-secrets.sh <app-slug>

# Update all .env files
python scripts/infrastructure/generate-app-env-files.py
```

---

**For questions:** Sarosh Hussain (sarosh.hussain@mahumtech.com)
