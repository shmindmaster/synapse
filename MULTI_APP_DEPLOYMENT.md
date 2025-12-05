# Multi-App Deployment Guide for DigitalOcean App Platform

# Deploy 20+ Full-Stack Applications with Standardized Infrastructure

## Quick Start

### 1. Deploy a New Application

```powershell
# Prerequisites: Set environment variables
$env:GITHUB_TOKEN = "your-github-token"
$env:DIGITALOCEAN_TOKEN = "your-do-token"

# Deploy the app to DigitalOcean App Platform
.\scripts\deploy-app.ps1 `
  -AppSlug myapp `
  -GitRepo owner/repo `
  -GitBranch main

# Configure DNS records in DigitalOcean
.\scripts\setup-app-dns.ps1 `
  -AppSlug myapp
```

### 2. Manual DNS Setup (Alternative)

If you prefer to set up DNS manually in DigitalOcean:

1. Log into DigitalOcean: https://cloud.digitalocean.com/
2. Go to **Networking** → **Domains** → `shtrial.com`
3. Add CNAME records:
   - Hostname: `myapp` → `origin-apps.ondigitalocean.com.`
   - Hostname: `api.myapp` → `origin-apps.ondigitalocean.com.`
4. Wait 2-5 minutes for propagation

### 3. Access Your Application

Once DNS propagates:

- **Frontend:** https://myapp.shtrial.com
- **Backend API:** https://api.myapp.shtrial.com
- **API Docs:** https://api.myapp.shtrial.com/docs
- **OpenAPI Schema:** https://api.myapp.shtrial.com/openapi.json

## Architecture Overview

### Domain Structure

All 20+ applications follow this standardized pattern:

```
shtrial.com (root domain)
├── [app-slug].shtrial.com              (Frontend - React/Next.js)
│   └── Serves UI via DigitalOcean App Platform
│
└── api.[app-slug].shtrial.com          (Backend - Node.js/API)
    ├── /api/*                          (API endpoints)
    ├── /docs                           (Swagger UI - interactive testing)
    ├── /redoc                          (ReDoc - FastAPI only, clean docs)
    └── /openapi.json                   (OpenAPI specification)
```

### Infrastructure Components

```
┌─────────────────────────────────────────────────────────────┐
│ DigitalOcean DNS (shtrial.com)                              │
│ ├── CNAME: [app-slug] → origin-apps.ondigitalocean.com.    │
│ └── CNAME: api.[app-slug] → origin-apps.ondigitalocean.com.│
└─────────────┬───────────────────────────────────────────────┘
              │
              ▼
┌─────────────────────────────────────────────────────────────┐
│ DigitalOcean App Platform (nyc3 region)                     │
│ ├── App Ingress (SSL + Load Balancing)                      │
│ ├── Service: web (Node.js app)                              │
│ │   ├── Port: 3000                                          │
│ │   └── Health Check: /api/health                           │
│ └── Databases & Integrations                                │
│     ├── PostgreSQL (sh-shared-postgres)                     │
│     ├── Spaces (sh-storage)                                 │
│     ├── DigitalOcean Inference (Gradient AI)                │
│     └── Container Registry (registry.digitalocean.com)      │
└─────────────────────────────────────────────────────────────┘
```

## Files & Scripts

### Configuration

- **`do-app-spec.template.yaml`** - Standardized app spec template with:
  - Multi-domain ingress routing
  - Shared infrastructure references
  - Environment variable placeholders
  - Health checks and deployment settings

### Deployment Scripts

- **`scripts/deploy-app.ps1`** - Main deployment script

  - Generates app spec from template
  - Deploys to DigitalOcean App Platform
  - Shows deployment status and next steps

- **`scripts/setup-app-dns.ps1`** - DNS automation script
  - Creates DNS records via DigitalOcean API or doctl
  - Idempotent (safe to run multiple times)
  - Verifies DNS records before updating

### Documentation

- **`MULTI_APP_DNS_SETUP.md`** - Comprehensive DNS guide
  - DNS architecture options
  - Manual setup instructions
  - Troubleshooting guide
  - Verification procedures

## Environment Configuration

### Required Environment Variables

Create a `.env.shared` file in the root directory:

```bash
# GitHub
export GITHUB_TOKEN="ghp_xxxxxxxxxxxxx"

# DigitalOcean
export DIGITALOCEAN_TOKEN="dop_xxxxxxxxxxxxx"
export DO_REGION="nyc3"
export DO_SPACES_BUCKET="sh-storage"
export DO_SPACES_KEY="xxxxxxxxxxxxx"
export DO_SPACES_SECRET="xxxxxxxxxxxxx"
export DIGITALOCEAN_INFERENCE_ENDPOINT="https://inference.do-ai.run/v1"
export DIGITALOCEAN_MODEL_KEY="sk-do-xxxxxxxxxxxxx"

# Database
export DATABASE_URL="postgresql://doadmin:password@...nyc3.db.ondigitalocean.com:25060/db?sslmode=require"
export DO_DATABASE_URL_PRIVATE="postgresql://doadmin:password@...f.db.ondigitalocean.com:25060/db?sslmode=require"
```

### Per-Application Environment Variables

Each app automatically receives:

- `DATABASE_URL` - Shared PostgreSQL cluster connection
- `DO_SPACES_*` - Shared object storage access
- `DIGITALOCEAN_INFERENCE_ENDPOINT` - Gradient AI inference endpoint
- `AI_MODEL` - Model identifier (e.g., llama-3.1-70b-instruct)
- `APP_STORAGE_PREFIX` - App-specific storage folder
- `NEXT_PUBLIC_CDN_BASE_URL` - CDN endpoint for frontend assets

## Deployment Workflow

### Step 1: Prepare

```bash
# Clone repository
git clone https://github.com/shmindmaster/[app-name].git
cd [app-name]

# Copy template (if not using monorepo)
cp ../Synapse/do-app-spec.template.yaml ./
```

### Step 2: Deploy

```powershell
# Run deployment script
.\scripts\deploy-app.ps1 `
  -AppSlug myapp `
  -GitRepo owner/repo `
  -GitBranch main
```

The script will:

1. Read `do-app-spec.template.yaml`
2. Replace all placeholders with environment values
3. Generate `do-app-spec.myapp.yaml`
4. Deploy using `doctl apps create --spec do-app-spec.myapp.yaml`
5. Display app ID, ingress, and next steps

### Step 3: Configure DNS

```powershell
# Automated (uses DigitalOcean API or doctl)
.\scripts\setup-app-dns.ps1 -AppSlug myapp

# Or manually via DigitalOcean dashboard
# See MULTI_APP_DNS_SETUP.md for instructions
```

### Step 4: Verify

```powershell
# Wait 2-5 minutes for DNS propagation (DigitalOcean DNS is fast)

# Check DNS resolution
nslookup myapp.shtrial.com
nslookup api.myapp.shtrial.com

# Test application
curl -I https://myapp.shtrial.com
curl -I https://api.myapp.shtrial.com/health
curl https://api.myapp.shtrial.com/docs
```

## Scaling & Management

### View All Deployed Apps

```bash
doctl apps list --format ID,Spec.Name,DefaultIngress,Updated
```

### Get App Details

```bash
doctl apps get [app-id]
```

### View Deployment Logs

```bash
# Get deployment logs
doctl apps logs get [app-id] --deployment-id [id] --component web --follow

# View build logs
doctl apps logs get [app-id] --deployment-id [id] --component web --log-type BUILD
```

### Manage DNS Records

```bash
# List all DNS records for shtrial.com
doctl compute domain records list shtrial.com

# Add new DNS record
doctl compute domain records create shtrial.com --record-name myapp --record-type CNAME --record-data origin-apps.ondigitalocean.com
```

## App Spec Customization

### Ingress Rules (Authority-Based Matching)

The template uses modern authority-based routing (replaces deprecated `routes` field):

```yaml
ingress:
  rules:
    # Route api subdomain to backend service
    - match:
        authority:
          exact: api.${APP_SLUG}.${APP_DOMAIN_BASE}
        path:
          prefix: /api
      component:
        name: api # or 'web' for unified service
    - match:
        authority:
          exact: api.${APP_SLUG}.${APP_DOMAIN_BASE}
        path:
          prefix: /docs
      component:
        name: api
    - match:
        authority:
          exact: api.${APP_SLUG}.${APP_DOMAIN_BASE}
        path:
          prefix: /openapi.json
      component:
        name: api
    - match:
        authority:
          exact: api.${APP_SLUG}.${APP_DOMAIN_BASE}
      component:
        name: api
    # Route main domain to frontend
    - match:
        authority:
          exact: ${APP_SLUG}.${APP_DOMAIN_BASE}
      component:
        name: web
```

**Key Points:**

- Uses `authority.exact` for subdomain matching (modern approach)
- Separate rules for `/api`, `/docs`, `/openapi.json`
- Fallback rule for api subdomain root
- Frontend gets all traffic on main domain

### Service Patterns

We use two standard patterns across all 20+ apps:

#### Pattern 1: Separate Services (NestJS/FastAPI - Most Apps)

```yaml
services:
  - name: api
    http_port: 3000
    dockerfile_path: apps/backend/Dockerfile
    # ... backend config

static_sites: # or another service
  - name: web
    # ... frontend config
```

**Benefits:** Independent scaling, separate deployments, cleaner separation

#### Pattern 2: Unified Service (Synapse)

```yaml
services:
  - name: web
    http_port: 3000
    dockerfile_path: Dockerfile
    # Serves both frontend and backend
```

**Benefits:** Simpler for monolithic apps, single deployment

### FastAPI Apps: Additional Documentation Endpoints

FastAPI automatically generates two documentation UIs:

| Endpoint        | Description                                | Use Case                              |
| --------------- | ------------------------------------------ | ------------------------------------- |
| `/docs`         | **Swagger UI** - Interactive API explorer  | Testing endpoints directly in browser |
| `/redoc`        | **ReDoc** - Clean, read-only documentation | Beautiful API reference for consumers |
| `/openapi.json` | OpenAPI 3.x schema                         | Codegen, SDK generation, integrations |

**Add `/redoc` to ingress for FastAPI apps:**

```yaml
ingress:
  rules:
    # ... existing rules ...
    - match:
        authority:
          exact: api.${APP_SLUG}.${APP_DOMAIN_BASE}
        path:
          prefix: /redoc
      component:
        name: api
```

**FastAPI configuration options:**

```python
from fastapi import FastAPI

app = FastAPI(
    title="My API",
    docs_url="/docs",        # Swagger UI (default)
    redoc_url="/redoc",      # ReDoc (default)
    openapi_url="/openapi.json"  # OpenAPI schema (default)
)
```

**Disable documentation in production (optional):**

```python
app = FastAPI(
    docs_url=None if os.environ.get("ENV") == "production" else "/docs",
    redoc_url=None if os.environ.get("ENV") == "production" else "/redoc"
)
```

### Database Connection Strategy

All apps use environment variables for database connection (no `databases` section in app spec):

```yaml
envs:
  - key: DATABASE_URL
    scope: RUN_AND_BUILD_TIME
    type: SECRET
    value: ${DATABASE_URL}
  - key: DO_DATABASE_URL_PRIVATE
    scope: RUN_AND_BUILD_TIME
    type: SECRET
    value: ${DO_DATABASE_URL_PRIVATE}
```

**Rationale:**

- Simpler for shared infrastructure (`sh-shared-postgres`)
- More flexible for environment changes
- No cluster references to manage per app

### Environment Variables

Add per-app secrets:

```yaml
envs:
  - key: CUSTOM_API_KEY
    scope: RUN_AND_BUILD_TIME
    type: SECRET
    value: 'secret-value'
```

### Instance Sizing

Default: `basic-xxs` (budget tier)

Available sizes:

- `basic-xs` - $6/mo
- `basic-s` - $12/mo
- `basic-m` - $24/mo
- `professional-s` - $12/mo
- `professional-m` - $24/mo
- etc.

Update in app spec:

```yaml
services:
  - name: web
    instance_size_slug: basic-s # Change here
    instance_count: 2 # Add auto-scaling
```

## Troubleshooting

### Deployment Fails

```powershell
# Check doctl is installed and authenticated
doctl auth list

# Verify app spec is valid
cat do-app-spec.myapp.yaml | doctl apps validate -

# Check account has capacity
doctl account get
```

### App Not Accessible

```powershell
# 1. Verify DNS
nslookup myapp.shtrial.com 8.8.8.8

# 2. Check app status
doctl apps get [app-id]

# 3. View deployment status
doctl apps get [app-id] --format Spec.Name,ActiveDeployment.Status

# 4. Check logs
doctl apps logs get [app-id] --log-type DEPLOY
```

### SSL Certificate Not Issued

```powershell
# Wait up to 24 hours for Let's Encrypt validation
# Check certificate status in App Platform dashboard
# Verify domain resolves correctly
nslookup myapp.shtrial.com
```

## Cost Estimation

For 20+ applications (assuming `basic-xxs` instances):

- **Per App:**

  - App Platform instance: ~$5-10/mo
  - SSL certificate: Free (Let's Encrypt)
  - DNS records: Free (DigitalOcean DNS)

- **Shared Resources:**

  - PostgreSQL cluster: ~$15-30/mo
  - Object Storage (100GB): ~$5/mo
  - Inference API: Usage-based (Hatch billing)

- **Total Estimated:** $150-300/mo for 20 apps

## Support & Resources

- [DigitalOcean App Platform Docs](https://docs.digitalocean.com/products/app-platform/)
- [DigitalOcean DNS Docs](https://docs.digitalocean.com/products/networking/dns/)
- [doctl CLI Reference](https://docs.digitalocean.com/reference/doctl/)
- [DNS Propagation Checker](https://www.whatsmydns.net/)
