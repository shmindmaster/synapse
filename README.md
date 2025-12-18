# 🚀 synapse

This application is part of the **SHTrial Platform**, deployed on DigitalOcean App Platform.

## 🔗 Quick Links

- **Frontend:** [https://synapse.shtrial.com](https://synapse.shtrial.com)
- **API:** [https://api-synapse.shtrial.com](https://api-synapse.shtrial.com)
- **Repository:** [https://github.com/shmindmaster/synapse](https://github.com/shmindmaster/synapse)

## 🛠️ Local Development

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
   cd apps/web && pnpm dev
   
   # Backend
   cd apps/backend && uvicorn src.main:app --reload
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
- **Python:** 3.11 (Slim)
- **Linting:** ESLint + Prettier (Enforced via CI)
- **Deployment:** DigitalOcean App Platform (Automatic on git push)

## 📚 Documentation

- **AI Agents:** See `AGENTS.MD` for detailed AI agent instructions
- **Platform Standards:** See `UNIFIED_PLAYBOOK.md` for complete architecture guide

---

**Platform:** DigitalOcean App Platform v10.0
**Last Updated:** 2025-12-18
