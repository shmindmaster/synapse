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

**Automatic:** Push to `main`.

**Manual Config Update:**
If you change `app.yaml` or need to update secrets:
```bash
# Apply config changes
doctl apps update $(doctl apps list --format ID --no-header | grep synapse) --spec app.yaml

# Sync Secrets
bash scripts/sync-app-secrets.sh synapse
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
