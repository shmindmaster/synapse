# Multi-App Deployment Quick Reference

## One-Command Deployment

```powershell
# Deploy new app in under 5 minutes
.\scripts\deploy-app.ps1 -AppSlug myapp -GitRepo owner/repo

# Then configure DNS (automated via DigitalOcean API)
.\scripts\setup-app-dns.ps1 -AppSlug myapp

# Then verify (after 2-5 min DNS propagation)
nslookup myapp.shtrial.com
curl -I https://api.myapp.shtrial.com/health
```

## Domain Pattern

| Component   | URL                                          | Notes             |
| ----------- | -------------------------------------------- | ----------------- |
| Frontend    | `https://[app].shtrial.com`                  | React/Next.js UI  |
| Backend API | `https://api.[app].shtrial.com/api`          | All API endpoints |
| API Docs    | `https://api.[app].shtrial.com/docs`         | Swagger UI        |
| OpenAPI     | `https://api.[app].shtrial.com/openapi.json` | OpenAPI spec      |

## Environment Variables (`.env.shared`)

```bash
# Required for deployment
GITHUB_TOKEN="ghp_xxx"
DIGITALOCEAN_TOKEN="dop_xxx"

# Database
DATABASE_URL="postgresql://..."
DO_DATABASE_URL_PRIVATE="postgresql://..."

# Storage
DO_SPACES_BUCKET="sh-storage"
DO_SPACES_KEY="xxx"
DO_SPACES_SECRET="xxx"

# AI
DIGITALOCEAN_INFERENCE_ENDPOINT="https://inference.do-ai.run/v1"
DIGITALOCEAN_MODEL_KEY="sk-do-xxx"
AI_MODEL="llama-3.1-70b-instruct"
```

## Scripts

| Script              | Purpose                       | Usage                                                         |
| ------------------- | ----------------------------- | ------------------------------------------------------------- |
| `deploy-app.ps1`    | Deploy to App Platform        | `.\scripts\deploy-app.ps1 -AppSlug myapp -GitRepo owner/repo` |
| `setup-app-dns.ps1` | Configure DNS in DigitalOcean | `.\scripts\setup-app-dns.ps1 -AppSlug myapp`                  |

## Useful Commands

```powershell
# List all deployed apps
doctl apps list --format ID,Spec.Name,DefaultIngress,Updated

# Get app details
doctl apps get [app-id]

# View deployment logs
doctl apps logs get [app-id] --deployment-id [id] --component web

# Check DNS resolution
nslookup myapp.shtrial.com
nslookup myapp.shtrial.com 8.8.8.8  # Google DNS

# Test API
curl -I https://api.myapp.shtrial.com/health
curl https://api.myapp.shtrial.com/docs
```

## Troubleshooting

| Issue             | Solution                                        |
| ----------------- | ----------------------------------------------- |
| DNS not resolving | Wait 2-5 min, clear cache: `ipconfig /flushdns` |
| App not starting  | Check logs: `doctl apps logs get [app-id]`      |
| SSL not issued    | Wait up to 24h, verify DNS resolves             |
| API 502 error     | Check health endpoint, view deployment logs     |

## Shared Infrastructure

- **Database:** `sh-shared-postgres` (nyc3)
- **Storage:** `sh-storage` (nyc3)
- **AI:** DigitalOcean Gradient AI
- **Registry:** `registry.digitalocean.com/shtrial-reg`
- **DNS:** `shtrial.com` (DigitalOcean DNS)
- **Region:** `nyc3`

## Cost (20 apps)

- Per app instance: $5-10/mo
- Shared resources: $20-40/mo
- **Total:** ~$150-250/mo

## Files

- `do-app-spec.template.yaml` - App configuration template
- `scripts/deploy-app.ps1` - Deployment automation
- `scripts/setup-app-dns.ps1` - DNS automation
- `MULTI_APP_DEPLOYMENT.md` - Full deployment guide
- `MULTI_APP_DNS_SETUP.md` - DNS reference guide
- `INFRASTRUCTURE_SETUP_SUMMARY.md` - Setup overview

## Deployment Checklist

- [ ] `.env.shared` configured with all secrets
- [ ] GitHub repo ready (main branch contains deployment code)
- [ ] Run `deploy-app.ps1`
- [ ] Run `setup-app-dns.ps1`
- [ ] Wait 2-5 minutes
- [ ] Verify: `nslookup [app].shtrial.com`
- [ ] Test: `curl -I https://api.[app].shtrial.com/health`
- [ ] Done! 🎉

## App Spec Template Placeholders

All variables in `do-app-spec.template.yaml` are automatically substituted:

- `${APP_SLUG}` - Your app name
- `${DO_REGION}` - Deployment region (nyc3)
- `${APP_DOMAIN_BASE}` - Domain (shtrial.com)
- `${DATABASE_URL}` - PostgreSQL connection string
- `${DO_SPACES_*}` - Object storage credentials
- `${GITHUB_*}` - GitHub repository info
- `${DIGITALOCEAN_*}` - DigitalOcean API credentials
- `${AI_MODEL}` - AI model selection

## Ingress Routing

The template automatically configures:

```yaml
# api.[app].shtrial.com → Backend
/api/*              → web service
/docs               → web service
/openapi.json       → web service

# [app].shtrial.com → Same service (frontend)
/                   → web service
```

## What's Included in Each Deploy

Each app automatically gets:

- ✅ Custom domain (frontend + backend)
- ✅ SSL/TLS certificates (free)
- ✅ Auto-scaling ready configuration
- ✅ Health checks enabled
- ✅ Database access
- ✅ Storage bucket access
- ✅ AI inference endpoint access
- ✅ Environment variable injection
- ✅ Git auto-deploy on push
- ✅ Deployment logging

---

**Print this card and keep it handy for quick reference!**
