# DigitalOcean Infrastructure Setup Guide for Synapse

This document describes how to provision and configure the required DigitalOcean infrastructure for the Synapse application.

## Overview

Synapse uses the following DigitalOcean services:
- **Managed PostgreSQL**: Shared cluster `sh-shared-postgres` with dedicated database `Synapse`
- **Spaces**: S3-compatible object storage bucket `synapse`
- **App Platform**: Frontend and backend services (`synapse-frontend`, `synapse-backend`)
- **Gradient AI**: LLM inference, embeddings, RAG capabilities

---

## 1. Database Setup (sh-shared-postgres)

### 1.1 Create Database

Connect to the `sh-shared-postgres` cluster and create the Synapse database:

```sql
-- Connect to the cluster
psql "postgresql://doadmin:<password>@sh-shared-postgres-do-user-XXXX.f.db.ondigitalocean.com:25060/defaultdb?sslmode=require"

-- Create the Synapse database
CREATE DATABASE "Synapse";

-- Connect to the Synapse database
\c Synapse

-- Enable pgvector extension
CREATE EXTENSION IF NOT EXISTS vector;

-- Verify extension
\dx vector
```

### 1.2 Configure Environment Variables

Update `.env.shared` with the correct connection strings:

```bash
# Public connection (for local development)
DATABASE_URL="postgresql://doadmin:<password>@sh-shared-postgres-do-user-XXXX.f.db.ondigitalocean.com:25060/Synapse?sslmode=require"

# Private connection (for App Platform deployments)
DATABASE_URL_PRIVATE="postgresql://doadmin:<password>@private-sh-shared-postgres-do-user-XXXX.f.db.ondigitalocean.com:25060/Synapse?sslmode=require"
```

### 1.3 Run Prisma Migrations

```bash
# Generate Prisma client
pnpm --filter @synapse/backend db:generate

# Run migrations
pnpm --filter @synapse/backend db:migrate
```

---

## 2. Spaces Setup

### 2.1 Create Spaces Bucket

Using DigitalOcean Console:

1. Navigate to **Spaces Object Storage** → **Create a Space**
2. Configure:
   - **Name**: `synapse`
   - **Region**: `nyc3` (New York 3)
   - **CDN**: Enable
   - **File Listing**: Restrict (recommended for security)
3. Click **Create Space**

### 2.2 Generate Access Keys

1. Navigate to **API** → **Spaces Access Keys**
2. Click **Generate New Key**
3. Name: `synapse-app-access`
4. Copy the **Access Key** and **Secret Key** (save securely, you can't see the secret again)

### 2.3 Configure Environment Variables

Update `.env.shared` with the Spaces credentials:

```bash
DO_SPACES_ENDPOINT=https://nyc3.digitaloceanspaces.com
DO_SPACES_BUCKET=synapse
DO_SPACES_KEY=<your-access-key>
DO_SPACES_SECRET=<your-secret-key>
DO_SPACES_REGION=nyc3
DO_SPACES_CDN_ENDPOINT=https://synapse.nyc3.cdn.digitaloceanspaces.com

# Public CDN URL (for frontend use)
NEXT_PUBLIC_CDN_BASE_URL=https://synapse.nyc3.cdn.digitaloceanspaces.com
```

### 2.4 Configure CORS (if needed for direct browser uploads)

Using `doctl` CLI:

```bash
# Install doctl if not already installed
brew install doctl  # macOS
# or download from https://docs.digitalocean.com/reference/doctl/how-to/install/

# Authenticate
doctl auth init

# Configure CORS
doctl spaces cors set synapse --region nyc3 --cors-rules '{
  "CORSRules": [{
    "AllowedOrigins": ["https://synapse.shtrial.com"],
    "AllowedMethods": ["GET", "PUT", "POST", "DELETE"],
    "AllowedHeaders": ["*"],
    "MaxAgeSeconds": 3600
  }]
}'
```

---

## 3. Gradient AI Setup

### 3.1 Enable Gradient AI

1. Navigate to **Gradient AI** in DigitalOcean Console
2. Enable the service if not already enabled
3. Generate an API key:
   - Navigate to **API** → **Gradient AI**
   - Click **Generate New Key**
   - Name: `synapse-gradient-ai`
   - Copy the key (save securely)

### 3.2 Configure Environment Variables

Update `.env.shared` with the Gradient AI credentials:

```bash
# Inference Endpoint (OpenAI-compatible)
DIGITALOCEAN_INFERENCE_ENDPOINT=https://inference.do-ai.run/v1
AI_PROVIDER=digitalocean

# Model Configuration
AI_MODEL_CORE=llama-3.1-70b-instruct
AI_MODEL_EMBEDDING=text-embedding-3-small

# Gradient AI API Key
DIGITALOCEAN_MODEL_KEY=<your-gradient-ai-key>
```

### 3.3 Test Gradient AI Connection

```bash
# Test with curl
curl -X POST https://inference.do-ai.run/v1/chat/completions \
  -H "Authorization: Bearer <your-gradient-ai-key>" \
  -H "Content-Type: application/json" \
  -d '{
    "model": "llama-3.1-70b-instruct",
    "messages": [{"role": "user", "content": "Hello!"}]
  }'
```

---

## 4. App Platform Setup

### 4.1 Create App Platform App

Using DigitalOcean Console:

1. Navigate to **Apps** → **Create App**
2. Choose **GitHub** as source
3. Connect repository: `shmindmaster/Synapse`
4. Configure components:

#### Frontend Component (`synapse-frontend`)
- **Type**: Web Service
- **Name**: `synapse-frontend`
- **Source Directory**: `/apps/frontend`
- **Build Command**: `pnpm build`
- **Run Command**: `pnpm preview --host 0.0.0.0 --port 8080`
- **HTTP Port**: `8080`
- **Environment Variables**: Add from `.env.shared` (public vars only)

#### Backend Component (`synapse-backend`)
- **Type**: Web Service
- **Name**: `synapse-backend`
- **Source Directory**: `/apps/backend`
- **Build Command**: `pnpm install && pnpm db:generate`
- **Run Command**: `pnpm start`
- **HTTP Port**: `3000`
- **Environment Variables**: Add from `.env.shared` (use `DATABASE_URL_PRIVATE` for database)

### 4.2 Configure Environment Variables in App Platform

Add the following environment variables to each component (encrypted for secrets):

**Frontend**:
- `NEXT_PUBLIC_CDN_BASE_URL` (public)

**Backend**:
- `DATABASE_URL` → Use `DATABASE_URL_PRIVATE` value (encrypted)
- `DO_SPACES_ENDPOINT` (public)
- `DO_SPACES_BUCKET` (public)
- `DO_SPACES_KEY` (encrypted)
- `DO_SPACES_SECRET` (encrypted)
- `DO_SPACES_REGION` (public)
- `DIGITALOCEAN_INFERENCE_ENDPOINT` (public)
- `DIGITALOCEAN_MODEL_KEY` (encrypted)
- `AI_MODEL_CORE` (public)
- `AI_MODEL_EMBEDDING` (public)

### 4.3 Deploy

Click **Create Resources** to deploy the application.

---

## 5. DNS Configuration (Optional)

If you want to use custom domains:

### 5.1 Add Domain to DigitalOcean DNS

1. Navigate to **Networking** → **Domains**
2. Click **Add Domain**
3. Enter: `synapse.shtrial.com`
4. Click **Add Domain**

### 5.2 Configure DNS Records

Add the following records:

```
# Frontend
A     synapse.shtrial.com      → <app-platform-ip>
CNAME www.synapse.shtrial.com  → synapse.shtrial.com

# Backend API
A     api.synapse.shtrial.com  → <app-platform-ip>
```

### 5.3 Add Custom Domains to App Platform

1. Navigate to your App in App Platform
2. Click **Settings** → **Domains**
3. Add:
   - `synapse.shtrial.com` → `synapse-frontend`
   - `api.synapse.shtrial.com` → `synapse-backend`
4. Click **Add Domain**
5. Wait for SSL certificates to be provisioned

---

## 6. Verify Deployment

### 6.1 Database Connection

```bash
# From local development
pnpm --filter @synapse/backend db:studio

# Or test connection
psql "$DATABASE_URL"
```

### 6.2 Spaces Access

```bash
# Using AWS CLI (S3-compatible)
aws s3 ls s3://synapse \
  --endpoint-url=https://nyc3.digitaloceanspaces.com \
  --profile digitalocean
```

### 6.3 Gradient AI

```bash
# Test inference
curl -X POST https://inference.do-ai.run/v1/chat/completions \
  -H "Authorization: Bearer $DIGITALOCEAN_MODEL_KEY" \
  -H "Content-Type: application/json" \
  -d '{
    "model": "llama-3.1-70b-instruct",
    "messages": [{"role": "user", "content": "Test message"}]
  }'
```

### 6.4 Frontend & Backend

```bash
# Frontend
curl https://synapse.shtrial.com

# Backend API
curl https://api.synapse.shtrial.com/health
```

---

## 7. Maintenance & Operations

### 7.1 Database Backups

DigitalOcean Managed PostgreSQL provides:
- Automatic daily backups (retained for 7 days)
- Point-in-time recovery
- Manual snapshots on demand

### 7.2 Spaces Versioning

Enable versioning for critical buckets:

```bash
doctl spaces versioning enable synapse --region nyc3
```

### 7.3 Monitoring

- **App Platform**: Built-in metrics and logs in DigitalOcean Console
- **Database**: Monitor connections, query performance in DB cluster dashboard
- **Spaces**: Monitor bandwidth and request metrics in Spaces dashboard

### 7.4 Scaling

**Database**:
- Scale vertically (increase RAM/CPU) in cluster settings
- Add read replicas if needed

**App Platform**:
- Scale horizontally (increase instance count) in component settings
- Scale vertically (change instance size) if needed

---

## 8. Cost Optimization

### Current Infrastructure

- **PostgreSQL** (sh-shared-postgres): ~$15/month (shared across all repos)
- **Spaces** (synapse): $5/month (includes 250 GB storage + 1 TB transfer)
- **App Platform**:
  - Frontend: $5/month (512 MB RAM)
  - Backend: $12/month (1 GB RAM)
- **Gradient AI**: Pay-per-use (varies by model and usage)

**Total**: ~$37/month + AI usage

### Optimization Tips

1. Use CDN to reduce origin requests
2. Enable Spaces lifecycle policies to archive old files
3. Right-size App Platform instances (start small, scale up)
4. Use Gradient AI efficiently (cache responses, batch requests)

---

## 9. Troubleshooting

### Database Connection Issues

```bash
# Test public connection
psql "$DATABASE_URL"

# Test private connection (from App Platform)
# Use App Platform console to run:
psql "$DATABASE_URL_PRIVATE"
```

### Spaces Access Issues

```bash
# Verify credentials
aws s3 ls s3://synapse \
  --endpoint-url=https://nyc3.digitaloceanspaces.com \
  --profile digitalocean

# Check CORS configuration
doctl spaces cors get synapse --region nyc3
```

### Gradient AI Issues

```bash
# Verify API key
curl -X GET https://inference.do-ai.run/v1/models \
  -H "Authorization: Bearer $DIGITALOCEAN_MODEL_KEY"
```

---

## 10. Security Best Practices

1. **Never commit `.env.shared` with real secrets** to version control
2. Use **App Platform encrypted environment variables** for all secrets
3. Rotate **Spaces access keys** every 90 days
4. Enable **database connection pooling** to prevent exhaustion
5. Use **private networking** between App Platform and database
6. Enable **CORS restrictions** on Spaces for browser uploads
7. Implement **rate limiting** on backend APIs
8. Monitor **audit logs** for suspicious activity

---

## Support & Resources

- **DigitalOcean Docs**: https://docs.digitalocean.com
- **Prisma Docs**: https://www.prisma.io/docs
- **Gradient AI Docs**: https://docs.digitalocean.com/products/gradient-ai/
- **App Platform Docs**: https://docs.digitalocean.com/products/app-platform/

For issues, contact:
- DigitalOcean Support: https://cloud.digitalocean.com/support
- GitHub Issues: https://github.com/shmindmaster/Synapse/issues
