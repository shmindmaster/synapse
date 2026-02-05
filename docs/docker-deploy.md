# ⚡ Quick Docker Deploy Guide

## 🐳 One-Command Local Deployment

The **fastest way** to get Synapse running locally with zero configuration!

### What You Need

- Docker Desktop installed ([get it here](https://docs.docker.com/get-docker/))
- OpenAI API key ([get free $5 credit](https://platform.openai.com/api-keys))

### Start in 3 Commands

```bash
# 1. Clone
git clone https://github.com/shmindmaster/synapse.git && cd synapse

# 2. Add API key (REQUIRED)
echo "OPENAI_API_KEY=sk-your-key-here" > .env

# 3. Start everything
./quick-start.sh  # Linux/Mac
quick-start.bat   # Windows
```

**That's it!** 🎉

### What Gets Deployed

```
Container: synapse-postgres
├─ PostgreSQL 16 with pgvector
├─ Port: 5432
└─ Auto-configured extensions

Container: synapse-backend
├─ Node.js API server
├─ Port: 8000
├─ Auto-runs migrations
└─ Auto-seeds demo user

Container: synapse-frontend
├─ React web app
├─ Port: 3000
└─ Hot reload enabled
```

### Access Your App

Open in browser: **http://localhost:3000**

Login with:

- **Email:** `demomaster@pendoah.ai`
- **Password:** `Pendoah1225`

### Common Commands

```bash
# View logs
docker compose logs -f

# View backend logs only
docker compose logs -f backend

# Stop everything
docker compose down

# Stop and remove data
docker compose down -v

# Rebuild after code changes
docker compose up --build

# Run commands in backend
docker compose exec backend sh
# Then: npx prisma migrate deploy
```

### Environment Variables

Edit `.env` file for configuration:

```bash
# Required
OPENAI_API_KEY=sk-...                    # Your OpenAI key

# Optional (has defaults)
MODEL_CHAT=gpt-4o                        # Chat model
MODEL_FAST=gpt-3.5-turbo                 # Fast model
MODEL_EMBEDDING=text-embedding-3-small   # Embeddings
POSTGRES_PASSWORD=synapse                # DB password
POSTGRES_PORT=5432                       # DB port
BACKEND_PORT=8000                        # API port
FRONTEND_PORT=3000                       # Web port
```

### Troubleshooting

#### Backend won't start

```bash
# Check backend logs
docker compose logs backend

# Common issue: Missing API key
# Solution: Check .env has OPENAI_API_KEY set
```

#### Database connection failed

```bash
# Wait for postgres to be ready (takes ~10 seconds)
docker compose ps

# Ensure postgres is "healthy"
docker compose ps postgres
```

#### Port already in use

```bash
# Change ports in .env
echo "FRONTEND_PORT=3001" >> .env
echo "BACKEND_PORT=8001" >> .env

# Restart
docker compose down && docker compose up
```

#### Fresh start (remove all data)

```bash
# Stop and remove everything including volumes
docker compose down -v

# Restart from scratch
./quick-start.sh
```

### Development Mode

```bash
# Start with hot reload
docker compose up

# Code changes auto-reload in:
# - Backend: apps/backend/**
# - Frontend: apps/frontend/**

# Database persists between restarts
# To reset database:
docker compose down -v
```

### Production Mode

For production, use cloud deployment instead:

- See [one-click-deploy.md](./docs/one-click-deploy.md)
- Docker Compose is meant for local development

### Manual Database Commands

```bash
# Connect to postgres
docker compose exec postgres psql -U synapse -d synapse

# Run migrations
docker compose exec backend npx prisma migrate deploy

# Seed database
docker compose exec backend npx prisma db seed

# Check pgvector extension
docker compose exec postgres psql -U synapse -d synapse -c "SELECT * FROM pg_extension WHERE extname='vector';"
```

### Customization

#### Use different PostgreSQL version

Edit `docker-compose.yml`:

```yaml
services:
  postgres:
    image: pgvector/pgvector:pg15 # Change to pg15
```

#### Use different Node.js version

Edit `apps/backend/Dockerfile` and `apps/frontend/Dockerfile`:

```dockerfile
FROM node:20-alpine  # Change to node:18-alpine
```

#### Add custom environment variables

Edit `docker-compose.yml`:

```yaml
services:
  backend:
    environment:
      - MY_CUSTOM_VAR=value
```

### CI/CD Integration

#### GitHub Actions

```yaml
name: Docker Test
on: [push]
jobs:
  test:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v3
      - name: Test with Docker Compose
        env:
          OPENAI_API_KEY: ${{ secrets.OPENAI_API_KEY }}
        run: |
          echo "OPENAI_API_KEY=$OPENAI_API_KEY" > .env
          docker compose up -d
          sleep 30  # Wait for services
          curl -f http://localhost:8000/health
```

### Performance Tips

**For development:**

```bash
# Use volume mounts for hot reload (default)
# Edit code directly, changes auto-reload
```

**For faster rebuilds:**

```bash
# Use BuildKit
export DOCKER_BUILDKIT=1
docker compose build
```

**For resource constraints:**

```bash
# Limit memory
docker compose up --memory=2g
```

### Next Steps

After running locally:

1. **Index documents** - Use CLI or web UI to add documents
2. **Test features** - Try search, chat, document analysis
3. **Deploy to cloud** - See [one-click-deploy.md](./one-click-deploy.md)
4. **Customize** - Modify for your use case

### Comparison: Docker vs Cloud

| Feature           | Docker (Local)               | Cloud (1-Click)  |
| ----------------- | ---------------------------- | ---------------- |
| Setup time        | 3 min                        | 5-10 min         |
| Cost              | Free                         | $5-30/mo         |
| Internet required | Only for AI API              | Yes              |
| Persistent data   | Until docker-compose down -v | Always persisted |
| SSL/HTTPS         | No                           | Auto-configured  |
| Public URL        | No                           | Yes              |
| Best for          | Development                  | Production       |

### FAQ

**Q: Do I need to install PostgreSQL separately?**
A: No, Docker Compose handles everything.

**Q: Will my data persist between restarts?**
A: Yes, unless you run `docker compose down -v`

**Q: Can I use this in production?**
A: Not recommended. Use cloud deployment for production.

**Q: How much disk space needed?**
A: ~2GB for images + your data

**Q: Can I run without Docker?**
A: Yes, see the main [README](../README.md) for manual setup instructions.
**Q: Is it safe to commit `.env` file?**
A: NO! Never commit files with API keys!

---

**Need help?** [Open an issue](https://github.com/shmindmaster/synapse/issues) or [Join discussions](https://github.com/shmindmaster/synapse/discussions)

[← Back to README](../README.md) | [Cloud Deployment →](./one-click-deploy.md)
