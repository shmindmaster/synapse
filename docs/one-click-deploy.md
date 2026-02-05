# 🚀 One-Click Deployment Guide

Synapse can be deployed to production in minutes using one-click deployment buttons. No complex configuration required!

## ⚠️ Prerequisites (READ THIS FIRST!)

### Required Before Deploying

**1. OpenAI API Key (CRITICAL - NOT OPTIONAL)**

Without this, **the app will NOT function**. Required for:

- ✅ Semantic search
- ✅ AI chat
- ✅ Document embeddings
- ✅ RAG functionality

**Get your key:** [platform.openai.com/api-keys](https://platform.openai.com/api-keys)

- New accounts get **$5 free credits** (sufficient for testing)
- Cost: ~$2-5/month for personal use

**Don't have OpenAI?** Alternatives:

- **Groq API** (60% cheaper, faster)
- **Google Gemini** (free tier available)
- **Anthropic Claude** (similar pricing)

### Auto-Configured (No Action Needed)

All deployment platforms automatically configure:

- ✅ PostgreSQL database with pgvector
- ✅ SSL certificates
- ✅ Database migrations
- ✅ Authentication secret (JWT)
- ✅ Demo user seeding

---

## 📋 Table of Contents

- [Quick Start](#quick-start)
- [Platform Comparison](#platform-comparison)
- [Deployment Options](#deployment-options)
  - [Azure](#-deploy-to-azure)
  - [DigitalOcean](#-deploy-to-digitalocean-app-platform)
  - [Railway](#-deploy-to-railway)
  - [Render](#-deploy-to-render)
  - [Heroku](#-deploy-to-heroku)
- [Post-Deployment Setup](#post-deployment-setup)
- [Environment Variables](#environment-variables)
- [Cost Estimates](#cost-estimates)
- [Troubleshooting](#troubleshooting)

---

## Quick Start

1. **Choose a platform** from the options below
2. **Click the deployment button**
3. **Configure environment variables** (most are auto-generated)
4. **Wait 5-10 minutes** for deployment
5. **Access your app** at the provided URL
6. **Login** with demo credentials

**Demo Login:**

- Email: `demomaster@pendoah.ai`
- Password: `Pendoah1225`

---

## Platform Comparison

| Platform         | Setup Time | Monthly Cost | Free Tier      | Auto-Scaling | Managed DB | Best For                        |
| ---------------- | ---------- | ------------ | -------------- | ------------ | ---------- | ------------------------------- |
| **Railway**      | 3 min      | $5-20        | ✅ $5 credit   | ✅           | ✅ PG 16   | Hobby projects, fastest setup   |
| **Render**       | 5 min      | $21-50       | ✅ 90 days     | ✅           | ✅ PG 16   | Production apps, simple pricing |
| **DigitalOcean** | 5 min      | $17-40       | ❌             | ✅           | ✅ PG 16   | Predictable pricing, scalable   |
| **Heroku**       | 4 min      | $25-50       | ❌ (retired)   | ✅           | ✅ PG 16   | Enterprise, mature ecosystem    |
| **Azure**        | 10 min     | $30-100      | ✅ $200 credit | ✅           | ✅ PG 16   | Enterprise, compliance needs    |

---

## Deployment Options

### ☁️ Deploy to Azure

**Best for:** Enterprise deployments, compliance requirements, existing Azure infrastructure

**Features:**

- Managed PostgreSQL with pgvector
- App Service with auto-scaling
- Built-in monitoring & alerts
- Azure AD integration
- Compliance certifications

**Deploy Now:**

[![Deploy to Azure](https://aka.ms/deploytoazurebutton)](https://portal.azure.com/#create/Microsoft.Template/uri/https%3A%2F%2Fraw.githubusercontent.com%2Fshmindmaster%2Fsynapse%2Fmain%2Fazuredeploy.json)

**What gets deployed:**

- Azure Database for PostgreSQL Flexible Server (with pgvector)
- 2x Azure App Service (Backend + Frontend)
- App Service Plan
- Automatic SSL certificates

**Post-deployment steps:**

1. Wait for all resources to provision (~10 minutes)
2. Navigate to the Backend App Service
3. Open SSH console and run:
   ```bash
   cd /home/site/wwwroot
   npx prisma migrate deploy
   npx prisma db seed
   ```
4. Access frontend URL from deployment outputs

**Estimated Cost:**

- Development: ~$30/month (Basic tier)
- Production: ~$100/month (Standard tier)
- [Azure Pricing Calculator](https://azure.microsoft.com/en-us/pricing/calculator/)

---

### 🌊 Deploy to DigitalOcean App Platform

**Best for:** Developers who want predictable pricing and simple scaling

**Features:**

- Managed Postgres with pgvector
- Automatic SSL & CDN
- Built-in monitoring
- Deploy hooks for migrations
- No credit card for $200 trial

**Deploy Now:**

[![Deploy to DigitalOcean](https://www.deploytodo.com/do-btn-blue.svg)](https://cloud.digitalocean.com/apps/new?repo=https://github.com/shmindmaster/synapse/tree/main)

**What gets deployed:**

- Managed PostgreSQL database (1 GB RAM, 10 GB storage)
- Backend API service (512 MB RAM)
- Frontend web app (512 MB RAM)
- Automatic deploy hooks run migrations

**Post-deployment steps:**

1. Wait for deployment (~7 minutes)
2. Add your `OPENAI_API_KEY` in the DigitalOcean dashboard (optional)
3. Access your app at the provided URL
4. Migrations run automatically via deploy hooks

**Estimated Cost:**

- Hobby: ~$17/month (Basic tier)
- Production: ~$40/month (Professional tier)
- [DigitalOcean Pricing](https://www.digitalocean.com/pricing/app-platform)

---

### 🚂 Deploy to Railway

**Best for:** Fastest setup, hobby projects, developer experience

**Features:**

- PostgreSQL with pgvector auto-provisioned
- Private networking between services
- Auto-scaling based on traffic
- $5 starting credit
- Excellent developer UX

**Deploy Now:**

[![Deploy on Railway](https://railway.app/button.svg)](https://railway.app/template/synapse)

**What gets deployed:**

- PostgreSQL database (pgvector enabled)
- Backend API service
- Frontend web app
- All services connected via private network

**Post-deployment steps:**

1. Connect your GitHub account
2. Configure environment variables (Railway will prompt)
3. Wait for deployment (~5 minutes)
4. Run migrations via Railway CLI:
   ```bash
   railway login
   railway link
   railway run npx prisma migrate deploy
   railway run npx prisma db seed
   ```

**Estimated Cost:**

- Hobby: ~$5/month (Developer plan)
- Production: ~$20/month
- [Railway Pricing](https://railway.app/pricing)

---

### 🎨 Deploy to Render

**Best for:** Production apps with simple, transparent pricing

**Features:**

- Managed PostgreSQL with pgvector
- Auto-scaling & load balancing
- DDoS protection
- 90-day free PostgreSQL trial
- Zero-downtime deploys

**Deploy Now:**

[![Deploy to Render](https://render.com/images/deploy-to-render-button.svg)](https://render.com/deploy?repo=https://github.com/shmindmaster/synapse)

**What gets deployed:**

- PostgreSQL database (with pgvector)
- Backend API service
- Frontend static site
- Automatic SSL certificates

**Post-deployment steps:**

1. Wait for all services to deploy (~8 minutes)
2. Migrations run automatically in backend start command
3. Add your `OPENAI_API_KEY` in Render dashboard (optional)
4. Access your app at the frontend URL

**Estimated Cost:**

- Starter: ~$21/month (includes 90-day free PG trial, then $7/mo)
- Professional: ~$60/month
- [Render Pricing](https://render.com/pricing)

---

### 💜 Deploy to Heroku

**Best for:** Teams familiar with Heroku, mature app ecosystem

**Features:**

- Managed PostgreSQL with pgvector
- Add-on marketplace
- Heroku CLI & CI/CD
- Mature ecosystem
- Enterprise support available

**Deploy Now:**

[![Deploy to Heroku](https://www.herokucdn.com/deploy/button.svg)](https://heroku.com/deploy?template=https://github.com/shmindmaster/synapse)

**What gets deployed:**

- Heroku Postgres Essential (PostgreSQL 16)
- Backend + Frontend combined dyno
- Post-deploy script runs migrations automatically

**Post-deployment steps:**

1. Create Heroku account or login
2. Click "Deploy App"
3. Wait for build & deployment (~6 minutes)
4. Migrations run automatically via postdeploy script
5. Add `OPENAI_API_KEY` via Heroku dashboard (optional)

**Estimated Cost:**

- Hobby: ~$25/month (Basic dyno + Essential Postgres)
- Production: ~$50/month (Professional dyno)
- [Heroku Pricing](https://www.heroku.com/pricing)

---

## Post-Deployment Setup

### 1. Verify Deployment

After deployment completes, verify all services are running:

```bash
# Check backend health
curl https://your-backend-url.com/health

# Expected response:
{
  "status": "healthy",
  "service": "Synapse API",
  "timestamp": "2026-02-05T...",
  "version": "2.0.0"
}
```

### 2. Add OpenAI API Key (Optional)

AI features require an OpenAI API key:

1. Get your API key from [OpenAI Platform](https://platform.openai.com/api-keys)
2. Add to your deployment platform:
   - **Azure:** App Service → Configuration → Application Settings
   - **DigitalOcean:** App → Settings → Environment Variables
   - **Railway:** Service → Variables
   - **Render:** Service → Environment
   - **Heroku:** App → Settings → Config Vars

3. Set `OPENAI_API_KEY=sk-...`
4. Restart your backend service

### 3. Login and Test

1. Navigate to your frontend URL
2. Login with demo credentials:
   - Email: `demomaster@pendoah.ai`
   - Password: `Pendoah1225`
3. Try uploading a document or searching
4. Test the chat interface

### 4. Create Your Own Admin Account

```bash
# Connect to your backend service
# Railway example:
railway shell -s backend

# Run the seed script with your own details
# Or register via the UI at /register
```

---

## Environment Variables

### Required Variables

| Variable       | Description                  | Example                               | Auto-Generated?   |
| -------------- | ---------------------------- | ------------------------------------- | ----------------- |
| `DATABASE_URL` | PostgreSQL connection string | `postgresql://user:pass@host:5432/db` | ✅ All platforms  |
| `AUTH_SECRET`  | JWT signing secret           | `your-secret-key-here`                | ✅ Most platforms |

### Optional Variables

| Variable          | Description     | Default                  | Required For      |
| ----------------- | --------------- | ------------------------ | ----------------- |
| `OPENAI_API_KEY`  | OpenAI API key  | -                        | AI features       |
| `MODEL_CHAT`      | Chat model      | `gpt-4o`                 | AI chat           |
| `MODEL_FAST`      | Fast model      | `gpt-3.5-turbo`          | Quick operations  |
| `MODEL_EMBEDDING` | Embedding model | `text-embedding-3-small` | Semantic search   |
| `NODE_ENV`        | Environment     | `production`             | Performance       |
| `PORT`            | Backend port    | `8000`                   | Platform-specific |

### Generating Secrets

```bash
# Generate AUTH_SECRET
openssl rand -base64 32

# Or use Node.js
node -e "console.log(require('crypto').randomBytes(32).toString('base64'))"
```

---

## Cost Estimates

### Monthly Cost Breakdown

**Hobby/Development ($5-25/month):**

- Railway: $5 (includes $5 credit)
- DigitalOcean: $17 (Basic tier)
- Render: $21 (includes 90-day free PG)
- Heroku: $25 (Eco dyno + Postgres)

**Production ($30-100/month):**

- Azure: $30-100 (depends on tier)
- DigitalOcean: $40 (Professional tier)
- Railway: $20-50 (depends on usage)
- Render: $60 (Standard tier)
- Heroku: $50-100 (Performance dyno)

**Enterprise ($100+/month):**

- All platforms offer enterprise pricing
- Azure: Best for large enterprises
- Heroku: Mature enterprise features
- DigitalOcean: Simple enterprise pricing

### Free Tier Options

- **Railway:** $5 credit (enough for 1-2 months hobby use)
- **Render:** 90-day free PostgreSQL trial
- **Azure:** $200 credit for 30 days (new accounts)

---

## Troubleshooting

### Common Issues

#### 1. Database Connection Errors

**Symptom:** Backend fails to start, `ECONNREFUSED` errors

**Solution:**

- Verify `DATABASE_URL` is set correctly
- Check database is fully provisioned (can take 2-3 minutes)
- Ensure pgvector extension is installed
- Check firewall rules allow connections from app

```bash
# Test database connection
psql $DATABASE_URL -c "SELECT version();"
```

#### 2. Migrations Not Running

**Symptom:** Database tables don't exist, Prisma errors

**Solution:**

- Check post-deploy logs for migration errors
- Manually run migrations:
  ```bash
  npx prisma migrate deploy
  npx prisma db seed
  ```
- Verify `DATABASE_URL` has write permissions

#### 3. Frontend Can't Reach Backend

**Symptom:** API calls fail, CORS errors

**Solution:**

- Verify `VITE_API_URL` points to correct backend URL
- Check backend health endpoint: `curl https://backend-url/health`
- Ensure CORS is configured properly (already done in code)
- Check both services are on same network (Railway, Railway)

#### 4. Build Failures

**Symptom:** Deployment fails during build phase

**Solution:**

- Check you're using Node 20+
- Verify `pnpm` is available (some platforms need explicit installation)
- Check build logs for specific errors
- Ensure all dependencies are in package.json

```bash
# For Azure/Heroku, may need to install pnpm
npm install -g pnpm@10.23.0
```

#### 5. High Memory Usage / Crashes

**Symptom:** App crashes, out of memory errors

**Solution:**

- Upgrade to higher tier with more RAM
- Check for memory leaks in application logs
- Reduce concurrent operations
- Consider adding Redis for caching

### Platform-Specific Issues

#### Azure

- **ARM template validation fails:** Ensure all parameters are provided
- **Resource quota exceeded:** Check Azure subscription quotas
- **pgvector not available:** Verify extension is enabled in configuration

#### DigitalOcean

- **Deploy hook fails:** Check logs in App Platform console
- **Buildpack detection fails:** Ensure package.json is at correct path

#### Railway

- **Health check failing:** Must listen on `0.0.0.0`, not `localhost`
- **Environment variables not available:** Use correct reference syntax `${{Postgres.DATABASE_URL}}`

#### Render

- **Build timeout:** Increase build timeout or optimize build
- **Health check fails:** Verify `/health` endpoint returns 200

#### Heroku

- **Postdeploy script fails:** Check Heroku logs `heroku logs --tail`
- **Buildpack not detected:** Ensure package.json is at repo root

---

## Support

### Get Help

- **GitHub Issues:** [Report bugs](https://github.com/shmindmaster/synapse/issues)
- **Discussions:** [Ask questions](https://github.com/shmindmaster/synapse/discussions)
- **Documentation:** [Full docs](https://github.com/shmindmaster/synapse/tree/main/docs)

### Platform Support

- **Azure:** [Azure Support](https://azure.microsoft.com/en-us/support/)
- **DigitalOcean:** [DO Support](https://www.digitalocean.com/support)
- **Railway:** [Railway Discord](https://railway.app/discord)
- **Render:** [Render Docs](https://render.com/docs)
- **Heroku:** [Heroku Support](https://help.heroku.com/)

---

## Next Steps

After successful deployment:

1. **Customize your instance**
   - Change default admin credentials
   - Configure custom domain
   - Set up monitoring & alerts

2. **Index your documents**
   - Upload documents via UI
   - Use CLI for bulk uploads
   - Configure file watchers

3. **Integrate with your workflow**
   - Install VS Code extension
   - Set up MCP server for AI agents
   - Configure webhooks

4. **Scale as needed**
   - Monitor resource usage
   - Upgrade tiers when needed
   - Add caching layer (Redis)

---

**🎉 Congratulations!** Your Synapse instance is now running in production with zero infrastructure management!

[Back to Main README](../README.md) | [Architecture Docs](./architecture.md) | [API Reference](./api-reference.md)
