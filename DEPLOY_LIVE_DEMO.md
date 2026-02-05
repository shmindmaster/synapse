# 🌐 Deploy Live Demo to synapse.shtrial.com

**Goal:** Get working demo + API docs + repo docs live at your domain TODAY

---

## Option 1: FASTEST (Vercel) - 10 minutes

### Step 1: Connect Domain

1. Go to https://vercel.com/dashboard
2. Click "Add New" → "Project"
3. Select GitHub repo: `shmindmaster/synapse`
4. Set root directory: `apps/frontend`
5. Click "Deploy"

### Step 2: Point Domain

1. Go to your domain registrar (where you own shtrial.com)
2. Add DNS records Vercel gives you
3. In Vercel, go to project settings → Domains
4. Add `synapse.shtrial.com`

**Done.** Vercel auto-builds on every push to main.

---

## Option 2: Docker (If you have VPS)

```bash
# Build both images
docker build -t synapse-backend:latest apps/backend
docker build -t synapse-frontend:latest apps/frontend

# Push to your registry (Docker Hub, ECR, etc)
docker push yourusername/synapse-backend:latest
docker push yourusername/synapse-frontend:latest

# On your VPS:
docker pull yourusername/synapse-backend:latest
docker pull yourusername/synapse-frontend:latest
docker compose up -d

# Use nginx as reverse proxy pointing to synapse.shtrial.com
```

---

## Option 3: Railway (Simplest with Database)

1. Go to https://railway.app
2. Click "New Project" → "Deploy from GitHub"
3. Select `shmindmaster/synapse`
4. Add environment variables (OPENAI_API_KEY, DATABASE_URL)
5. Click "Deploy"

Railway handles everything (DB, hosting, SSL, domain)

---

## Adding API Documentation (Swagger UI)

Create `apps/backend/src/swagger.ts`:

```typescript
import fastify from 'fastify';
import fastifySwagger from '@fastify/swagger';
import fastifySwaggerUi from '@fastify/swagger-ui';

export async function setupSwagger(app: FastifyInstance) {
  await app.register(fastifySwagger, {
    swagger: {
      info: {
        title: 'Synapse API',
        description: 'Enterprise Code Search API',
        version: '2.0.0',
      },
      host: 'synapse.shtrial.com',
      schemes: ['https'],
      consumes: ['application/json'],
      produces: ['application/json'],
    },
  });

  await app.register(fastifySwaggerUi, {
    routePrefix: '/api/docs',
  });
}
```

Then in `apps/backend/src/server.ts`:

```typescript
import { setupSwagger } from './swagger';

const app = fastify();
await setupSwagger(app);
```

**Result:** API docs auto-generated at `https://synapse.shtrial.com/api/docs`

---

## Linking Everything Together

Update `apps/frontend/src/App.tsx`:

```tsx
export function App() {
  return (
    <div>
      {/* Your existing app */}

      <footer>
        <nav>
          <a href="/api/docs">API Documentation</a>
          <a href="https://github.com/shmindmaster/synapse">GitHub Repository</a>
          <a href="https://github.com/shmindmaster/synapse/tree/main/docs">Documentation</a>
        </nav>
      </footer>
    </div>
  );
}
```

---

## Single Day Deployment Checklist

### Step 1: Choose Hosting (Decision - 2 mins)

- [ ] Vercel (easiest, free tier great)
- [ ] Railway (best if you have DB)
- [ ] Self-hosted (if you have VPS)

**Recommended: Vercel** (free, auto-deploys on push, handles SSL)

### Step 2: Deploy Frontend (10 mins if Vercel)

```bash
# Make sure app builds
pnpm --filter frontend build

# Push to GitHub
git push origin main

# In Vercel UI:
# - New project → shmindmaster/synapse
# - Root: apps/frontend
# - Deploy

# Wait 3-5 mins for deployment
```

### Step 3: Deploy Backend API (15 mins)

**Option A: Same Vercel project (Serverless)**

- Vercel supports Node.js APIs in `/api` folder
- Need to restructure backend slightly

**Option B: Separate Railway project (Recommended)**

```bash
# Go to railway.app
# New Project → GitHub → select synapse
# Select root directory: apps/backend
# Add env vars (OPENAI_API_KEY, DATABASE_URL)
# Deploy
```

### Step 4: Add API Docs (15 mins)

- Add swagger.ts file (see above)
- Install dependencies: `pnpm add @fastify/swagger @fastify/swagger-ui`
- Push to GitHub
- Auto-deploys

### Step 5: Point Domain (10 mins)

- Buy/register domain: synapse.shtrial.com
- In Vercel/Railway: add custom domain
- Update DNS records at registrar
- Wait 5-30 mins for DNS propagation

### Step 6: Test Live Demo (5 mins)

```bash
# Visit in browser
https://synapse.shtrial.com

# Check API docs
https://api.synapse.shtrial.com/api/docs

# Try search/chat
[use UI to verify it works]
```

---

## Why Vercel + Railway Combined

| What               | Where               | Why                               |
| ------------------ | ------------------- | --------------------------------- |
| Frontend React app | Vercel              | Auto-deploys, CDN, free tier      |
| Backend API        | Railway             | Full Node.js runtime, DB, simpler |
| API Docs           | Auto-generated      | Swagger/OpenAPI                   |
| Repo docs          | Link back to GitHub | Single source of truth            |

---

## Faster Alternative: Everything on Railway

```yaml
# railway.toml (create this in root)
[build]
builder = "dockerfile"

[deploy]
startCommand = "pnpm --filter backend start"

[env]
OPENAI_API_KEY = ""
DATABASE_URL = ""
NODE_ENV = "production"
```

Then Railway handles frontend builds + serves at synapse.shtrial.com

---

## Cheapest (GitHub Pages + Lambda)

Front: GitHub Pages (free)
Back: AWS Lambda (free tier covers most usage)

But this requires more setup. **Vercel + Railway is best for solo founder today.**

---

## Register Domain

1. Go to https://namecheap.com or https://vercel.com/domains
2. Search: `synapse.shtrial.com`
3. Buy ($12/year typical)
4. In registrar → manage DNS
5. Point to Vercel nameservers (if using Vercel)

---

## Total Cost (per month)

| Service           | Cost            | Notes                           |
| ----------------- | --------------- | ------------------------------- |
| Vercel (frontend) | $0              | Free tier works for this        |
| Railway (backend) | $5-15           | Includes 500 credits/month free |
| Domain            | $1              | annual (~12/year)               |
| **TOTAL**         | **~$1-2/month** |                                 |

Vercel paid tiers start at $20, but free tier is perfectly fine for launch.

---

## Next Steps After Deploy

1. **Update README to link to live demo:**

```markdown
### Live Demo

Try it at: https://synapse.shtrial.com

API Docs: https://synapse.shtrial.com/api/docs
Repo: https://github.com/shmindmaster/synapse
```

2. **In launch tweets:**

```
Try the live demo: synapse.shtrial.com
```

3. **Monitor uptime:**

```
Uptime monitoring: https://status.synapse.shtrial.com (optional)
```

---

## Deploy Right Now (Do This Today)

```bash
# Option 1: Vercel (easiest)
git push origin main
# Go to https://vercel.com
# New Project → select repo → deploy
# Takes 3 mins

# Option 2: Railway
# Go to https://railway.app
# New Project → import GitHub repo
# Add env vars
# Deploy
# Takes 5 mins
```

**Both work. Pick one. Do it now.**

---

**Timeline:**

- 5 mins: Choose hosting
- 10 mins: Deploy frontend
- 15 mins: Deploy backend
- 10 mins: Setup domain
- 30 mins total

Then add to launch checklist: "Live demo at synapse.shtrial.com ✅"
