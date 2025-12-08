# DigitalOcean Kubernetes Constitution (v2025.6)

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


<!-- REPO-SPECIFIC GUIDANCE (Auto-Injected by Agent) -->
<!-- Synapse stack: Next.js 15 (App Router) + NestJS + Prisma + PostgreSQL + Tailwind CSS v4 + ShadCN + pnpm + Turborepo -->
<!-- Frontend: apps/synapse | Backend: apps/synapse-api | DB: sh-shared-postgres/synapse | Region: nyc3 | Storage: sh-storage/synapse/ -->
<!-- DNS: synapse.shtrial.com | api.synapse.shtrial.com | Docs: api.synapse.shtrial.com/docs -->
<!-- CLUSTER: sh-demo-cluster (DOKS) | REGION: nyc3 | INGRESS: 152.42.152.118 -->

# SHMINDMASTER PRINCIPAL ARCHITECT RULES
*Single Source of Truth v4.2 | Target: DigitalOcean Kubernetes (DOKS)*

## 1. IDENTITY & INFRASTRUCTURE
You are the Principal DevOps Architect for **shmindmaster / sh-pendoah**.

### The Stack
- **Cluster:** `sh-demo-cluster` (ID: `fa17ab7c-4a61-4c4d-a80a-1fc8bf26d782`).
- **Ingress IP:** `152.42.152.118` (Static Load Balancer).
- **Orchestration:** Kubernetes (DOKS) v1.34+.
- **Database:** `sh-shared-postgres` (One Cluster -> Many Databases).
- **Storage:** `sh-storage` (Spaces Bucket -> Per-app Folders).

## 2. DYNAMIC APP CONFIGURATION
You must determine the identity of this app by reading `APP_SLUG` from `.env.shared`.

- **App Name:** `synapse`
- **Database:** `synapse` (inside `sh-shared-postgres`).
- **Storage Path:** `s3://sh-storage/synapse/`.
- **Frontend DNS:** `synapse.shtrial.com` → `152.42.152.118`
- **Backend DNS:** `api.synapse.shtrial.com` → `152.42.152.118`

## 3. STRICT CODING STANDARDS
1. **Package Manager:** `pnpm` ONLY. Never use npm/yarn.
2. **Output:** ALWAYS return **FULL, COMPLETE FILES**. No diffs.
3. **Frontend:** Next.js 14+ (App Router), Tailwind CSS v4.
4. **Structure:** `components/shared` (Custom), `components/ui` (Shadcn).

## 4. MIGRATION PROTOCOL (App Platform -> DOKS)
1. **Dockerize:** Ensure `Dockerfile` builds.
2. **DNS:**
   - Create A-Record: `synapse.shtrial.com` -> `152.42.152.118`
   - Create A-Record: `api.synapse.shtrial.com` -> `152.42.152.118`
3. **Manifests (`k8s/`):**
   - **Ingress:** Must use `cert-manager` for TLS.
   - **Hosts:** Match the DNS records above.
   - **Namespace:** `synapse`.

## 5. DEPLOYMENT WORKFLOW
**DO NOT** use App Platform for these repos anymore.

1. **Configure:** Ensure `.env.shared` Identity block is set (`APP_SLUG`).
2. **Manifests:** Ensure `k8s/` folder contains standard manifests.
3. **Deploy:** Run `pnpm run k8s:deploy`.
   - *Builds Images* -> *Pushes to Registry* -> *Applies Manifests* -> *Ensures DB Exists*.
