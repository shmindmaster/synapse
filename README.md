# 🚀 synapse

This application is part of the **SHTrial Platform**, deployed on DigitalOcean App Platform.

## 🔗 Quick Links

- **Frontend:** [https://synapse.shtrial.com](https://synapse.shtrial.com)
- **API:** [https://api-synapse.shtrial.com](https://api-synapse.shtrial.com)
- **Repository:** [https://github.com/shmindmaster/synapse](https://github.com/shmindmaster/synapse)

## 🛠️ Local Development

### Repository Structure

This repository follows a **Multi-Service Pattern** with independent services:

```
synapse/
├── apps/                    # Independent services
│   ├── backend/            # TypeScript/Fastify API server
│   ├── frontend/           # React/Vite web application
│   ├── cli/                # Command-line interface tool
│   ├── mcp-server/         # Model Context Protocol server
│   └── vscode-extension/   # VS Code extension
├── packages/
│   └── shared/             # Shared utilities and types
├── scripts/                # Deployment and setup scripts
├── prisma/                 # Database schema and migrations
└── app.yaml                # DigitalOcean App Platform config
```

Each service in `/apps` is:
- **Independent**: Has its own `package.json` and dependencies
- **Self-contained**: Can be built and tested independently
- **Properly scoped**: Uses `@synapse/*` namespace

### Development Setup

1. **Install Dependencies:**
   ```bash
   pnpm install
   ```

2. **Generate Environment:**
   ```bash
   # Run from platform root
   python3 scripts/generate-env.py synapse .
   ```

3. **Start Development Server:**
   ```bash
   # Frontend
   cd apps/frontend && pnpm dev
   
   # Backend
   cd apps/backend && pnpm dev
   ```

## 📦 Deployment

### First-Time Setup

**1. Create App Platform App:**
```bash
bash scripts/bootstrap-app.sh
```
This creates the App Platform app from `app.yaml`. Only run once.

**2. Setup DNS Records (after app is deployed):**
```bash
# Wait for app to finish deploying, then:
bash scripts/setup-dns.sh
```

This creates CNAME records in `shtrial.com` zone pointing to your app's default `.ondigitalocean.app` domain:
- `synapse.shtrial.com` → Frontend
- `api-synapse.shtrial.com` → Backend API

**Note:** DNS setup requires the app to be deployed first to get the default `.ondigitalocean.app` domain.

### Automatic Deployment

**Push to `main` branch:**
```bash
git add .
git commit -m "feat: new feature"
git push origin main
# App Platform automatically builds and deploys
```

### Manual Deployment

**Update app configuration:**
```bash
# After modifying app.yaml
bash scripts/deploy.sh
```

**Sync secrets:**
```bash
# View instructions for syncing secrets
bash scripts/sync-secrets.sh
```

**View logs:**
```bash
# Get app ID first
APP_ID=$(doctl apps list --format ID,Spec.Name --no-header | grep synapse | awk '{print $1}')
doctl apps logs $APP_ID --follow
```

## 🧪 Standards

- **Node:** v20 (Alpine)
- **Python:** 3.12 (Slim)
- **Linting:** ESLint + Prettier (Enforced via CI)
- **Deployment:** DigitalOcean App Platform (Automatic on git push)

## 🔄 Script Idempotency

All deployment scripts are **idempotent** - safe to run multiple times without errors:

- **`bootstrap-app.sh`** - Checks if app exists, updates if found, creates if not
- **`deploy.sh`** - Updates existing app configuration (requires app to exist)
- **`setup-dns.sh`** - Updates existing DNS records or creates new ones
- **`migrate.sh`** - Uses `IF NOT EXISTS` patterns, safe to re-run migrations
- **`sync-secrets.sh`** - Read-only instructions, inherently idempotent

**Why this matters:**
- Safe to re-run after template updates
- Safe to re-run after partial failures
- Safe for multiple developers
- Safe for CI/CD pipelines

## ✅ What to Do / What NOT to Do

### Shared Services

**DO:**
- ✅ Use `DATABASE_URL` from environment (shared Postgres cluster)
- ✅ Use `OBJECT_STORAGE_PREFIX` for ALL file uploads
- ✅ Use logical database `{APP_SLUG}` in shared Postgres

**DON'T:**
- ❌ Create app-specific databases or storage buckets
- ❌ Hardcode database connection strings
- ❌ Upload files without `OBJECT_STORAGE_PREFIX`

### Naming Standards

**DO:**
- ✅ Use `{APP_SLUG}` consistently (lowercase, DNS-safe)
- ✅ Use `api-{APP_SLUG}.shtrial.com` (hyphen, NOT dot)
- ✅ Use generic service names: `frontend`, `backend`, `worker`

**DON'T:**
- ❌ Use `api.{APP_SLUG}` (dot notation)
- ❌ Use app-specific service names in app.yaml

### Technical Stack

**DO:**
- ✅ Use environment variables for AI models (`MODEL_CHAT`, `MODEL_FAST`)
- ✅ Use TypeScript/Fastify for backend services
- ✅ Use Node 20 for all services
- ✅ Use context-aware Dockerfiles (build from repo root)

**DON'T:**
- ❌ Hardcode model names or API endpoints
- ❌ Use older Node versions
- ❌ Build Dockerfiles from subdirectories

### Networking

**DO:**
- ✅ Configure CORS in `app.yaml` (not in code)
- ✅ Use internal DNS (`http://backend:8000`) for service-to-service
- ✅ Use `NEXT_PUBLIC_API_URL` or `VITE_API_URL` for browser calls

**DON'T:**
- ❌ Configure CORS in application code
- ❌ Use `localhost` in App Platform

### Deployment

**DO:**
- ✅ Push to `main` branch for automatic deployment
- ✅ Use `bash scripts/bootstrap-app.sh` for first-time setup
- ✅ Use `bash scripts/setup-dns.sh` after deployment

**DON'T:**
- ❌ Manually create DNS A-records
- ❌ Deploy via CI/CD scripts

## 📚 Documentation

- **AI Agents:** See `AGENTS.MD` for detailed AI agent instructions

---

**Platform:** DigitalOcean App Platform v10.0
**Last Updated:** 2025-12-18
