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
