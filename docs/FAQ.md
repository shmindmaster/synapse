# Frequently Asked Questions

## Installation

### How long does setup take?

**3-5 minutes** on a typical machine. Most time is spent downloading Docker images (PostgreSQL, Node.js) on first run. Subsequent starts take 30-60 seconds.

### Do I need to install Node.js or PostgreSQL?

**No!** Docker handles everything. You only need [Docker Desktop](https://docs.docker.com/get-docker/) installed and running.

### What if quick-start.sh fails?

Try these steps:

1. **Make sure Docker Desktop is running**

   ```bash
   docker --version  # Should show Docker version
   ```

2. **Stop any existing instances**

   ```bash
   docker compose down
   ```

3. **Try again**

   ```bash
   ./quick-start.sh
   ```

4. **Check logs if it still fails**
   ```bash
   docker compose logs backend
   docker compose logs frontend
   ```

### Can I run on Windows?

**Yes!** Use the included `quick-start.bat` file or run `docker compose up` directly in PowerShell/Command Prompt.

### Can I run on Mac?

**Yes!** Same process as Linux. Make sure Docker Desktop for Mac is installed and running.

### What are the system requirements?

**Minimum:**

- Docker Desktop installed
- 4GB RAM available
- 2GB disk space

**Recommended:**

- 8GB+ RAM
- 5GB+ disk space (for better performance with larger documents)

---

## Usage

### What's the demo user for?

To let you try Synapse **immediately** without creating an account. It's pre-configured with:

- Username: `demo@synapse.local`
- Password: `DemoPassword123!`
- Pre-seeded demo data

### Can I create my own users?

**Yes!** User management is available in the application. You can:

- Create new users with different roles (Admin, Developer, Integrator, Viewer)
- Manage permissions
- Change passwords

### How do I add my documents?

1. Login to the UI at http://localhost:3000
2. Navigate to **Documents** section
3. Click **Upload**
4. Select your files (PDF, Word, Text, Markdown, Code, etc.)
5. Click **Index** to process them

The documents will be semantically indexed and available for search and chat.

### Is my data safe?

**Yes!** Synapse is **privacy-first**:

- Everything runs **locally** on your machine
- **No cloud access** - your data never leaves your infrastructure
- **No telemetry** - we don't collect any data
- **Open source** - inspect the code yourself

Perfect for sensitive documents, proprietary codebases, and compliance-critical environments.

---

## Troubleshooting

### Backend won't start

**Check logs:**

```bash
docker compose logs backend
```

**Common causes:**

1. **Port 8000 already in use**
   - Stop other services using port 8000
   - Or change `BACKEND_PORT` in docker-compose.yml

2. **Database connection failed**
   - Wait for PostgreSQL to fully start (check `docker compose logs postgres`)
   - The backend auto-retries connection every 5 seconds

3. **Prisma migration failed**
   - Check if database is accessible
   - Try rebuilding: `docker compose up --build`

### Frontend won't load

**Check logs:**

```bash
docker compose logs frontend
```

**Common causes:**

1. **Backend not ready**
   - Verify backend health: `curl http://localhost:8000/api/health`
   - Should return: `{"status":"healthy","service":"Synapse API"}`

2. **Port 3000 already in use**
   - Stop other services using port 3000
   - Or change `FRONTEND_PORT` in docker-compose.yml

3. **Build failed**
   - Rebuild containers: `docker compose up --build`

### Database migration failed

The initialization script auto-retries up to 5 times. If it still fails:

```bash
# Stop everything
docker compose down

# Remove database volume (this deletes all data!)
docker volume rm synapse_postgres_data

# Start fresh
docker compose up --build
```

The database will be recreated and auto-seeded with demo data.

### Port conflicts

If port 3000 or 8000 is already in use:

**Option 1: Stop conflicting service**

```bash
# Find what's using the port
lsof -i :3000  # Mac/Linux
netstat -ano | findstr :3000  # Windows

# Stop that service
```

**Option 2: Change Synapse ports**

Edit `docker-compose.yml`:

```yaml
services:
  backend:
    ports:
      - '8001:8000' # Changed from 8000:8000

  frontend:
    ports:
      - '3001:3000' # Changed from 3000:3000
```

Then:

```bash
docker compose up --build
```

Access at: http://localhost:3001

### "Cannot connect to Docker daemon" error

**Mac/Windows:**

- Open Docker Desktop application
- Wait for it to fully start (whale icon in system tray should be steady, not animated)

**Linux:**

```bash
# Start Docker service
sudo systemctl start docker

# Enable Docker to start on boot
sudo systemctl enable docker
```

### Services start but login doesn't work

**Check if database was seeded:**

```bash
docker compose logs backend | grep "Synapse demo account ready"
```

Should see: `"🎉 Synapse demo account ready!"`

**If not seeded, manually seed:**

```bash
docker compose exec backend pnpm db:seed
```

Then try logging in again.

---

## Development

### Where do I make code changes?

**Backend API:**

- Location: `src/api/src/`
- Main server: `src/api/src/server.ts`
- Routes: `src/api/src/routes/`
- Services: `src/api/src/services/`

**Frontend UI:**

- Location: `src/web/src/`
- Main app: `src/web/src/App.tsx`
- Components: `src/web/src/components/`
- Pages: `src/web/src/pages/`

**Database Schema:**

- Location: `src/api/prisma/schema.prisma`
- After changes, run: `cd src/api && npm run db:migrate`

### How do I reload changes?

With `docker compose up`, **changes auto-reload**:

- **Backend:** 1-2 seconds (hot reload with tsx)
- **Frontend:** 1-2 seconds (Vite HMR)

No need to restart Docker containers!

### How do I add a new npm package?

**From host machine:**

```bash
# For backend
cd src/api
npm add <package-name>

# For frontend
cd src/web
npm add <package-name>
```

Docker volumes are mounted, so changes reflect immediately.

### How do I reset the database?

**This deletes all data!**

```bash
# Stop containers
docker compose down

# Remove database volume
docker volume rm synapse_postgres_data

# Start fresh (will auto-migrate and seed)
docker compose up
```

Database will be recreated with demo user.

### How do I run tests?

**Backend E2E tests:**

```bash
cd src/api
npm test
```

**Specific test suites:**

```bash
pnpm test:service-health   # Health checks
pnpm test:suite-a          # Core UX
pnpm test:suite-b          # Workflows
pnpm test:suite-c          # Neural core
pnpm test:suite-d          # AI features
pnpm test:suite-e          # UI/UX
```

### How do I access the database directly?

**Using Prisma Studio:**

```bash
pnpm db:studio
```

Opens at: http://localhost:5555

**Using psql:**

```bash
docker compose exec postgres psql -U synapse -d synapse
```

---

## Performance

### Search is slow

**Causes:**

1. **Large number of documents** - Indexing takes time proportional to corpus size
2. **No OpenAI API key** - Some features require OpenAI for embeddings
3. **Resource constraints** - Increase Docker Desktop memory allocation

**Solutions:**

- Use semantic search for better results with fewer queries
- Ensure `OPENAI_API_KEY` is set in `.env` (if using OpenAI)
- Allocate more memory to Docker (8GB+ recommended)

### High memory usage

**Normal:** Synapse loads embeddings into memory for fast search.

**Reduce memory:**

1. Index fewer documents
2. Use smaller embedding models
3. Increase Docker memory limits if hitting constraints

### Docker images are large

**Why:** Multi-stage builds include dependencies for production.

**Reduce size:**

- Use optimized production configuration from the [Deployment Guide](deployment.md)
- Prune unused images: `docker system prune -a`

---

## API & Integration

### Can I use Synapse programmatically?

**Yes!** Synapse exposes a full REST API.

**API Documentation:** See [API Reference](api-reference.md)

**Example:**

```bash
# Health check
curl http://localhost:8000/api/health

# Search (requires auth token)
curl http://localhost:8000/api/search?q=authentication \
  -H "Authorization: Bearer <your-token>"
```

### Can I integrate with my IDE?

**Yes!** Synapse includes:

1. **VS Code Extension** - See [docs/vscode-extension.md](vscode-extension.md)
2. **MCP Server** - For AI agents like Claude Desktop - See [docs/mcp-server.md](mcp-server.md)

### Can I deploy to production?

**Yes!** See [Deployment Guide](deployment.md) for:

- Production Docker Compose setup
- Kubernetes deployment
- Cloud platform guides (AWS, GCP, Azure)
- Scaling strategies
- Security hardening

---

## Still Need Help?

1. **Check existing issues:** [GitHub Issues](https://github.com/shmindmaster/synapse/issues)
2. **Open a new issue:** [New Issue](https://github.com/shmindmaster/synapse/issues/new)
3. **Discussions:** [GitHub Discussions](https://github.com/shmindmaster/synapse/discussions)

We're here to help! 🚀
