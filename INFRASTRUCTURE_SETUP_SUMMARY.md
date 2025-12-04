# Multi-App Infrastructure Setup - Summary

## Overview

You now have a complete, standardized framework for deploying 20+ full-stack applications to DigitalOcean App Platform with:

- Consistent domain naming (`[app].shtrial.com` / `api.[app].shtrial.com`)
- Automated deployment scripts
- DNS automation via DigitalOcean API
- Comprehensive documentation
- Ingress routing for frontend/backend/docs/OpenAPI

## Files Created/Updated

### 1. Configuration Template

**File:** `do-app-spec.template.yaml`

- Updated with ingress routing rules
- Supports multi-domain configuration
- Placeholders for all environment variables
- Reusable across all 20+ apps

**Key Features:**

- Frontend + Backend + Docs on separate subdomains
- Health check endpoints
- Shared infrastructure integration
- Auto-scaling ready

### 2. Deployment Scripts

#### `scripts/deploy-app.ps1`

**Purpose:** Deploy any app to DigitalOcean App Platform

**Usage:**

```powershell
.\scripts\deploy-app.ps1 -AppSlug myapp -GitRepo owner/repo
```

**What it does:**

1. Loads environment from `.env.shared`
2. Reads `do-app-spec.template.yaml`
3. Substitutes all placeholders
4. Generates `do-app-spec.myapp.yaml`
5. Deploys via `doctl apps create`
6. Shows next steps for DNS configuration

**Output:** Generates app-specific spec file and deployment status

---

#### `scripts/setup-app-dns.ps1`

**Purpose:** Automate DNS record creation in DigitalOcean

**Usage:**

```powershell
.\scripts\setup-app-dns.ps1 -AppSlug myapp
```

**What it does:**

1. Connects to DigitalOcean API (or uses doctl)
2. Fetches current DNS records for `shtrial.com`
3. Adds CNAME records for frontend and backend
4. Updates DNS records via API
5. Provides verification commands

**Output:** DNS records automatically added to DigitalOcean DNS

---

### 3. Documentation

#### `MULTI_APP_DNS_SETUP.md`

**Purpose:** Comprehensive DNS configuration guide

**Covers:**

- DigitalOcean DNS management
- Manual DNS setup instructions
- Automated DNS setup via API
- DNS propagation monitoring
- Troubleshooting guide
- SSL certificate verification

**For:** 2-5 minute setup, fast SSL propagation

---

#### `MULTI_APP_DEPLOYMENT.md`

**Purpose:** Complete multi-app deployment guide

**Covers:**

- Quick start workflow
- Architecture overview
- File & script descriptions
- Environment configuration
- Step-by-step deployment workflow
- Scaling & management
- Customization guide
- Troubleshooting
- Cost estimation

**For:** End-to-end deployment reference

---

## Standardized Domain Pattern

Every app deployed will follow this pattern:

```
┌─────────────────────────────────────────────────┐
│ https://[app-slug].shtrial.com                  │
│ └─ Frontend Application (React/Next.js)         │
└─────────────────────────────────────────────────┘

┌─────────────────────────────────────────────────┐
│ https://api.[app-slug].shtrial.com              │
│ ├─ /api/*        → Backend API endpoints        │
│ ├─ /docs         → Swagger UI documentation     │
│ └─ /openapi.json → OpenAPI specification       │
└─────────────────────────────────────────────────┘
```

## Quick Deployment Checklist

For each new application:

1. **Prepare Environment**

   - [ ] `GITHUB_TOKEN` set
   - [ ] `DIGITALOCEAN_TOKEN` set
   - [ ] `.env.shared` configured with secrets

2. **Deploy App**

   - [ ] Run `deploy-app.ps1` with app slug and git repo
   - [ ] Verify deployment status
   - [ ] Note the app ID

3. **Configure DNS**

   - [ ] Run `setup-app-dns.ps1` with app slug
   - [ ] Or manually add records in DigitalOcean dashboard

4. **Verify Access**
   - [ ] Wait 2-5 minutes for DNS propagation
   - [ ] Test frontend: `https://[app].shtrial.com`
   - [ ] Test backend: `https://api.[app].shtrial.com/health`
   - [ ] Check docs: `https://api.[app].shtrial.com/docs`

## Environment Variables Required

### Global (in `.env.shared`)

```bash
GITHUB_TOKEN
DIGITALOCEAN_TOKEN
DATABASE_URL
DO_DATABASE_URL_PRIVATE
DO_SPACES_BUCKET
DO_SPACES_KEY
DO_SPACES_SECRET
DIGITALOCEAN_INFERENCE_ENDPOINT
DIGITALOCEAN_MODEL_KEY
AI_MODEL
```

### Automatically Provided to Each App

- `APP_STORAGE_PREFIX` (= app slug)
- `NEXT_PUBLIC_CDN_BASE_URL` (pre-configured)
- `PORT` (3000)
- `NODE_ENV` (production)

## Shared Infrastructure

All 20+ apps share:

- **Database:** `sh-shared-postgres` cluster in nyc3
- **Object Storage:** `sh-storage` bucket in nyc3
- **AI Inference:** DigitalOcean Gradient AI endpoint
- **Registry:** DigitalOcean container registry
- **DNS:** shtrial.com domain on DigitalOcean DNS

## Cost Breakdown (Estimate)

- **Per App:** $5-10/month (basic-xxs instance)
- **20 Apps:** $100-200/month in App Platform instances
- **Shared Resources:** $20-40/month
- **Total:** ~$150-250/month for full infrastructure

## Next Steps

1. **Deploy First Test App:**

   ```powershell
   .\scripts\deploy-app.ps1 -AppSlug testapp -GitRepo your-account/your-repo
   ```

2. **Configure DNS:**

   ```powershell
   .\scripts\setup-app-dns.ps1 -AppSlug testapp
   ```

3. **Verify Access:**

   ```powershell
   nslookup testapp.shtrial.com
   curl -I https://api.testapp.shtrial.com/health
   ```

4. **Scale Out:**
   - Repeat for each new application
   - Scripts are idempotent and reusable

## Important Notes

⚠️ **Secrets Management:**

- Never commit `.env.shared` to git
- Rotate API keys regularly
- Use separate keys per environment

⚠️ **DNS Propagation:**

- Expect 2-5 minutes for DigitalOcean DNS propagation
- Use `nslookup` with public nameservers (8.8.8.8) to verify
- SSL certificates take up to 24 hours (usually minutes)

⚠️ **App Spec Template:**

- Always use placeholders, not hardcoded values
- Test spec generation before deployment
- Keep template updated for all apps

## Support

For issues:

1. Check `MULTI_APP_DNS_SETUP.md` → Troubleshooting
2. Check `MULTI_APP_DEPLOYMENT.md` → Troubleshooting
3. Review app logs: `doctl apps logs get [app-id]`
4. Verify DNS: `nslookup [app].shtrial.com 8.8.8.8`

## Files Reference

```
Synapse/
├── do-app-spec.template.yaml          (Updated - ingress rules added)
├── scripts/
│   ├── deploy-app.ps1                 (New - deployment automation)
│   └── setup-app-dns.ps1              (New - DNS automation)
├── MULTI_APP_DEPLOYMENT.md            (New - complete guide)
└── MULTI_APP_DNS_SETUP.md             (New - DNS reference)
```

---

**Infrastructure is ready for 20+ application deployments! 🚀**
