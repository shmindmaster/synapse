# DigitalOcean Kubernetes Constitution (v2025.6)

---

## REPO-SPECIFIC GUIDANCE (Synapse)

### Stack Analysis
* **Frontend:** React 19.2 (Vite SPA), TypeScript 5.9.3
* **Backend:** Express 5.2.1 (Node.js), TypeScript 5.9.3
* **UI Standard:** Tailwind CSS 3.4.1 + Custom components in `components/shared` (flat structure)
* **Database:** PostgreSQL + Prisma 6.0/7.0 with pgvector extension
* **AI:** DigitalOcean Gradient (Llama 3.1 70B Instruct via OpenAI SDK)
* **Monorepo:** pnpm workspaces (apps/frontend, apps/backend, apps/cli, apps/mcp-server, apps/vscode-extension)

### Local Run
* `pnpm dev` - Starts both frontend (port 5173) and backend (port 3001) via concurrently
* `pnpm build` - Builds backend TypeScript then frontend Vite bundle
* `pnpm server` - Starts backend server only
* `pnpm db:migrate` - Runs Prisma migrations
* `pnpm db:generate` - Generates Prisma client
* `pnpm cli` - Runs CLI tool
* `pnpm mcp:dev` - Runs MCP server in development mode

### Gotchas
* Frontend is a Vite SPA (NOT Next.js) - uses standard React Router patterns
* Backend API port is 3001 in development, 3000 in production
* API calls use relative paths in development (Vite proxy) and full URLs in production
* Prisma client requires Alpine binary targets for Docker: `["native", "linux-musl-openssl-3.0.x"]`
* Components follow flat structure in `components/shared/` - no deep nesting
* Uses Lucide React for icons, not Font Awesome or Material Icons
* Vector embeddings are stored in PostgreSQL with pgvector extension

---

## 1. Core Philosophy: The Unified Stack
We operate 24+ applications on a **Single DigitalOcean Kubernetes (DOKS)** cluster to maximize Hatch credits.

### The Stack
* **Cluster:** `sh-demo-cluster` (`nyc3`).
* **Compute:** Shared Node Pools (CPU + Scale-to-Zero GPU).
* **Data:** Shared Postgres + Shared Spaces.
* **DNS:** `*.shtrial.com` (Managed via DO Networking).

## 2. Infrastructure Rules (Non-Negotiable)

### A. Database
* **Connection:** Use `DATABASE_URL` from `.env.shared` (Logical DB per app).
* **Isolation:** DB Name MUST be `${APP_SLUG}`.
* **Prohibition:** Do **NOT** provision new Database Clusters. Use the shared one.

### B. Storage
* **Bucket:** `sh-storage`.
* **Isolation:** Prefix `/${APP_SLUG}/`.
* **Access:** Use `NEXT_PUBLIC_CDN_BASE_URL` for frontend.

### C. Networking
* **Frontend:** `https://${APP_SLUG}.shtrial.com`.
* **Backend:** `https://api.${APP_SLUG}.shtrial.com`.
* **Ingress:** Handled via Cluster Ingress. Do NOT create Load Balancers.

## 3. AI Implementation Patterns

### Standard (Text/Logic)
* **Provider:** Gradient Serverless (`DIGITALOCEAN_INFERENCE_ENDPOINT`).
* **Models:** `llama-3.1-70b-instruct` (Smart), `llama-3.1-8b-instruct` (Fast).

### Premium (Voice/Video)
* **Provider:** Internal GPU Gateway (`AI_GPU_GATEWAY_URL`).
* **Usage:** Only for real-time latency-sensitive features. Requires GPU Pool activation.

## 4. Coding Standards
* **Manager:** `pnpm` ONLY.
* **Containerization:** MUST have `apps/frontend/Dockerfile` and `apps/backend/Dockerfile`.
* **Secrets:** Never commit. Read from `.env.shared` locally.
* **Deploy:** Run `pnpm run k8s:deploy`.
