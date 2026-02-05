# Deployment Guide

## ⚡ Quick Start: Deploy in 10 Minutes

Want to get Synapse running immediately? Here is the fastest path.

### Option 1: Vercel (Frontend) + Railway (Backend) - Recommended for Solo Founders

This combination gives you a free global CDN for the frontend and a full Node.js environment with PostgreSQL for the backend.

1.  **Frontend (Vercel)**:
    - Connect GitHub repo to Vercel.
    - Set Root Directory to `apps/frontend`.
    - Deploy.
2.  **Backend (Railway)**:
    - Connect GitHub repo to Railway.
    - Set Root Directory to `apps/backend`.
    - Add PostgreSQL plugin.
    - Set variables: `OPENAI_API_KEY`, `DATABASE_URL` (from plugin).
    - Deploy.
3.  **Link Them**:
    - Add `VITE_API_URL` to Vercel env vars (pointing to Railway URL).
    - Redeploy Frontend.

### Option 2: All-in-One Templates

Choose your deployment method below. Synapse supports cloud platforms (one-click), Docker, and self-hosted options.

## 🚀 One-Click Cloud Deployment (5 minutes)

Deploy to production instantly with pre-configured templates:

<div align="center">

[![Deploy to Azure](https://aka.ms/deploytoazurebutton)](https://portal.azure.com/#create/Microsoft.Template/uri/https%3A%2F%2Fraw.githubusercontent.com%2Fshmindmaster%2Fsynapse%2Fmain%2Fazuredeploy.json)
[![Deploy to DigitalOcean](https://www.deploytodo.com/do-btn-blue.svg)](https://cloud.digitalocean.com/apps/new?repo=https://github.com/shmindmaster/synapse/tree/main)
[![Deploy on Railway](https://railway.app/button.svg)](https://railway.app/template/synapse)
[![Deploy to Render](https://render.com/images/deploy-to-render-button.svg)](https://render.com/deploy?repo=https://github.com/shmindmaster/synapse)
[![Deploy to Heroku](https://www.herokucdn.com/deploy/button.svg)](https://heroku.com/deploy?template=https://github.com/shmindmaster/synapse)

</div>

### ⚠️ Before Deploying

**You need an OpenAI API key** ([get free $5 credits](https://platform.openai.com/api-keys)) - required for chat, embeddings, and search functionality.

**All deployments auto-configure:**

- PostgreSQL 16 with pgvector
- SSL certificates
- Database migrations
- Authentication system
- Demo user (email: demo@synapse.local / password: DemoPassword123!)

### Platform Comparison

| Platform     | Setup Time | Cost                | Uptime     |
| ------------ | ---------- | ------------------- | ---------- |
| Azure        | 5 min      | Pay-as-you-go       | 99.9% SLA  |
| DigitalOcean | 5 min      | $5/mo minimum       | 99.95% SLA |
| Railway      | 5 min      | $5/mo               | 99.9%      |
| Render       | 5 min      | Free tier available | 99.99%     |
| Heroku       | 5 min      | Free tier removed   | High       |

---

---

## Local Development

The simplest way to run Synapse locally:

```bash
# Clone the repository
git clone https://github.com/shmindmaster/synapse.git
cd synapse

# Install dependencies
pnpm install

# Configure environment
cp .env.example .env
# Edit .env with your configuration

# Initialize database
pnpm db:generate
pnpm db:migrate

# Start development servers
pnpm dev
```

Access the application at:

- Frontend: http://localhost:3000
- Backend API: http://localhost:8000

---

## Docker Compose

The easiest way to deploy Synapse with all dependencies:

Create a `docker-compose.yml`:

```yaml
version: '3.8'

services:
  postgres:
    image: pgvector/pgvector:pg16
    environment:
      POSTGRES_DB: synapse
      POSTGRES_USER: synapse
      POSTGRES_PASSWORD: ${DB_PASSWORD}
    volumes:
      - postgres_data:/var/lib/postgresql/data
    ports:
      - '5432:5432'

  backend:
    build:
      context: .
      dockerfile: apps/backend/Dockerfile
    environment:
      DATABASE_URL: postgresql://synapse:${DB_PASSWORD}@postgres:5432/synapse
      OPENAI_API_KEY: ${OPENAI_API_KEY}
      AUTH_SECRET: ${AUTH_SECRET}
    ports:
      - '8000:8000'
    depends_on:
      - postgres

  frontend:
    build:
      context: .
      dockerfile: apps/frontend/Dockerfile
    environment:
      VITE_API_URL: http://backend:8000
    ports:
      - '3000:3000'
    depends_on:
      - backend

volumes:
  postgres_data:
```

Deploy:

```bash
docker-compose up -d
```

---

## Cloud Platforms

### Vercel

**Frontend Deployment:**

1. Connect your GitHub repository to Vercel
2. Configure build settings:
   - Build Command: `pnpm build --filter frontend`
   - Output Directory: `apps/frontend/dist`
3. Set environment variables:
   ```
   VITE_API_URL=https://your-api-url.com
   ```

**Backend Deployment:**

Vercel supports Node.js serverless functions. For the backend, consider using Render or Railway.

---

### Render

**Full-Stack Deployment:**

Create a `render.yaml`:

```yaml
services:
  - type: web
    name: synapse-backend
    env: node
    buildCommand: pnpm install && pnpm build --filter backend
    startCommand: pnpm start --filter backend
    envVars:
      - key: DATABASE_URL
        fromDatabase:
          name: synapse-db
          property: connectionString
      - key: OPENAI_API_KEY
        sync: false
      - key: AUTH_SECRET
        generateValue: true

  - type: web
    name: synapse-frontend
    env: node
    buildCommand: pnpm install && pnpm build --filter frontend
    startCommand: pnpm preview --filter frontend
    envVars:
      - key: VITE_API_URL
        value: https://synapse-backend.onrender.com

databases:
  - name: synapse-db
    databaseName: synapse
    user: synapse
```

Deploy:

```bash
render-cli create --yaml render.yaml
```

---

### Railway

**Deployment:**

1. Install Railway CLI:

   ```bash
   npm install -g @railway/cli
   ```

2. Initialize:

   ```bash
   railway login
   railway init
   ```

3. Add PostgreSQL:

   ```bash
   railway add postgresql
   ```

4. Configure services in `railway.json`:

   ```json
   {
     "build": {
       "builder": "NIXPACKS"
     },
     "deploy": {
       "startCommand": "pnpm start",
       "restartPolicyType": "ON_FAILURE"
     }
   }
   ```

5. Deploy:
   ```bash
   railway up
   ```

---

### DigitalOcean App Platform

Create an `app.yaml` (or use the web console):

```yaml
name: synapse
region: nyc
services:
  - name: backend
    source_dir: apps/backend
    github:
      branch: main
      repo: your-username/synapse
    http_port: 8000
    envs:
      - key: DATABASE_URL
        value: ${db.DATABASE_URL}
      - key: OPENAI_API_KEY
        value: ${OPENAI_API_KEY}

  - name: frontend
    source_dir: apps/frontend
    github:
      branch: main
      repo: your-username/synapse
    http_port: 3000
    envs:
      - key: VITE_API_URL
        value: ${backend.PUBLIC_URL}

databases:
  - name: db
    engine: PG
    version: '14'
```

Deploy:

```bash
doctl apps create --spec app.yaml
```

---

### Heroku

**Deployment:**

1. Create apps:

   ```bash
   heroku create synapse-backend
   heroku create synapse-frontend
   ```

2. Add PostgreSQL:

   ```bash
   heroku addons:create heroku-postgresql:hobby-dev -a synapse-backend
   ```

3. Configure buildpacks:

   ```bash
   heroku buildpacks:add heroku/nodejs -a synapse-backend
   heroku buildpacks:add heroku/nodejs -a synapse-frontend
   ```

4. Deploy:
   ```bash
   git push heroku main
   ```

---

### AWS

**Using AWS Elastic Beanstalk:**

1. Install EB CLI:

   ```bash
   pip install awsebcli
   ```

2. Initialize:

   ```bash
   eb init -p node.js synapse
   ```

3. Create environment:

   ```bash
   eb create synapse-env
   ```

4. Configure environment variables in AWS Console

5. Deploy:
   ```bash
   eb deploy
   ```

**Using ECS/Fargate:**

- Build and push Docker images to ECR
- Create ECS task definitions
- Deploy services with Application Load Balancer
- Configure RDS for PostgreSQL

---

### Google Cloud

**Using Cloud Run:**

1. Build and push container:

   ```bash
   gcloud builds submit --tag gcr.io/PROJECT_ID/synapse-backend
   gcloud builds submit --tag gcr.io/PROJECT_ID/synapse-frontend
   ```

2. Deploy:

   ```bash
   gcloud run deploy synapse-backend \
     --image gcr.io/PROJECT_ID/synapse-backend \
     --platform managed \
     --region us-central1 \
     --set-env-vars DATABASE_URL=$DATABASE_URL

   gcloud run deploy synapse-frontend \
     --image gcr.io/PROJECT_ID/synapse-frontend \
     --platform managed \
     --region us-central1 \
     --set-env-vars VITE_API_URL=$BACKEND_URL
   ```

---

## Self-Hosted

### VPS (Ubuntu/Debian)

**1. Install dependencies:**

```bash
# Update system
sudo apt update && sudo apt upgrade -y

# Install Node.js 20
curl -fsSL https://deb.nodesource.com/setup_20.x | sudo -E bash -
sudo apt install -y nodejs

# Install PostgreSQL 14+
sudo apt install -y postgresql postgresql-contrib

# Install pgvector
sudo apt install -y postgresql-14-pgvector
```

**2. Setup database:**

```bash
sudo -u postgres psql
CREATE DATABASE synapse;
CREATE USER synapse WITH PASSWORD 'your-password';
GRANT ALL PRIVILEGES ON DATABASE synapse TO synapse;
\q
```

**3. Deploy application:**

```bash
# Clone repository
git clone https://github.com/shmindmaster/synapse.git
cd synapse

# Install pnpm
npm install -g pnpm

# Install dependencies
pnpm install

# Configure environment
cp .env.example .env
# Edit .env with your configuration

# Build
pnpm build

# Install PM2 for process management
npm install -g pm2

# Start services
pm2 start "pnpm start --filter backend" --name synapse-backend
pm2 start "pnpm preview --filter frontend" --name synapse-frontend

# Save PM2 configuration
pm2 save
pm2 startup
```

**4. Setup Nginx reverse proxy:**

```nginx
# /etc/nginx/sites-available/synapse
server {
    listen 80;
    server_name your-domain.com;

    location / {
        proxy_pass http://localhost:3000;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host $host;
        proxy_cache_bypass $http_upgrade;
    }

    location /api {
        proxy_pass http://localhost:8000;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host $host;
        proxy_cache_bypass $http_upgrade;
    }
}
```

Enable site:

```bash
sudo ln -s /etc/nginx/sites-available/synapse /etc/nginx/sites-enabled/
sudo nginx -t
sudo systemctl restart nginx
```

**5. Setup SSL with Let's Encrypt:**

```bash
sudo apt install -y certbot python3-certbot-nginx
sudo certbot --nginx -d your-domain.com
```

---

### Kubernetes

Create Kubernetes manifests:

**deployment.yaml:**

```yaml
apiVersion: apps/v1
kind: Deployment
metadata:
  name: synapse-backend
spec:
  replicas: 2
  selector:
    matchLabels:
      app: synapse-backend
  template:
    metadata:
      labels:
        app: synapse-backend
    spec:
      containers:
        - name: backend
          image: your-registry/synapse-backend:latest
          ports:
            - containerPort: 8000
          env:
            - name: DATABASE_URL
              valueFrom:
                secretKeyRef:
                  name: synapse-secrets
                  key: database-url
---
apiVersion: apps/v1
kind: Deployment
metadata:
  name: synapse-frontend
spec:
  replicas: 2
  selector:
    matchLabels:
      app: synapse-frontend
  template:
    metadata:
      labels:
        app: synapse-frontend
    spec:
      containers:
        - name: frontend
          image: your-registry/synapse-frontend:latest
          ports:
            - containerPort: 3000
          env:
            - name: VITE_API_URL
              value: http://synapse-backend-service:8000
```

**service.yaml:**

```yaml
apiVersion: v1
kind: Service
metadata:
  name: synapse-backend-service
spec:
  selector:
    app: synapse-backend
  ports:
    - port: 8000
      targetPort: 8000
---
apiVersion: v1
kind: Service
metadata:
  name: synapse-frontend-service
spec:
  selector:
    app: synapse-frontend
  ports:
    - port: 80
      targetPort: 3000
  type: LoadBalancer
```

Deploy:

```bash
kubectl apply -f deployment.yaml
kubectl apply -f service.yaml
```

---

## Post-Deployment

### Database Migration

After deployment, run migrations:

```bash
pnpm db:migrate
```

Or use the migration script:

```bash
DATABASE_URL="your-connection-string" bash scripts/migrate.sh
```

### Initialize Database

Create the embeddings table:

```bash
DATABASE_URL="your-connection-string" bash scripts/init-database.sh
```

### Health Checks

Verify deployment:

```bash
# Backend health
curl https://your-backend-url/health

# Frontend
curl https://your-frontend-url
```

---

## Environment Variables

Essential environment variables for production:

```bash
# Database
DATABASE_URL="postgresql://user:pass@host:5432/db?sslmode=require"

# Authentication
AUTH_SECRET="generate-a-strong-random-secret"

# AI Provider (choose one or more)
OPENAI_API_KEY="sk-..."
ANTHROPIC_API_KEY="sk-ant-..."
GROQ_API_KEY="gsk_..."

# Models
MODEL_CHAT="gpt-4o"
MODEL_FAST="gpt-3.5-turbo"
MODEL_EMBEDDING="text-embedding-3-small"

# Optional: Object Storage
OBJECT_STORAGE_KEY="..."
OBJECT_STORAGE_SECRET="..."
OBJECT_STORAGE_ENDPOINT="https://..."
OBJECT_STORAGE_BUCKET="synapse-storage"
```

---

## Monitoring & Logging

### Sentry Integration

Add Sentry DSN to environment:

```bash
SENTRY_DSN="https://...@sentry.io/..."
```

### Logging

Logs are output to stdout. Configure your platform's logging service:

- Vercel: Automatically captured
- Render: Available in dashboard
- Railway: Centralized logging
- Self-hosted: Use PM2 logs or systemd journal

---

## Troubleshooting

### Database Connection Issues

```bash
# Test connection
psql "$DATABASE_URL" -c "SELECT 1;"

# Check pgvector extension
psql "$DATABASE_URL" -c "CREATE EXTENSION IF NOT EXISTS vector;"
```

### Build Failures

```bash
# Clear caches
pnpm store prune
rm -rf node_modules pnpm-lock.yaml
pnpm install

# Rebuild
pnpm build
```

### Permission Issues

Ensure the database user has proper permissions:

```sql
GRANT ALL PRIVILEGES ON DATABASE synapse TO your_user;
GRANT ALL ON ALL TABLES IN SCHEMA public TO your_user;
```

---

## Security Considerations

- Always use HTTPS in production
- Use strong, random secrets for AUTH_SECRET
- Enable database SSL (sslmode=require)
- Rotate API keys regularly
- Set up rate limiting
- Enable CORS appropriately
- Use environment variables, never commit secrets

---

## Getting Help

- [GitHub Issues](https://github.com/shmindmaster/synapse/issues)
- [GitHub Discussions](https://github.com/shmindmaster/synapse/discussions)
- [Documentation](../README.md)

---

**Happy Deploying!** 🚀
