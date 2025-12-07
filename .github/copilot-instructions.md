# DigitalOcean Kubernetes Constitution (v2025.5)

## 1. Core Philosophy: The Unified Stack

We operate 24+ applications on a **Single DigitalOcean Kubernetes (DOKS)** cluster to maximize efficiency and consolidate management.

### The Stack

* **Cluster:** `sh-demo-cluster` (ID: `fa17ab7c-4a61-4c4d-a80a-1fc8bf26d782` in `nyc3`). **STATUS: ACTIVE/PROVISIONED.**
* **Connectivity:** Run `doctl kubernetes cluster kubeconfig save fa17ab7c-4a61-4c4d-a80a-1fc8bf26d782` to authenticate.

* **Compute:**
    * **Apps:** Shared `demo-cpu-pool` (Standard Nodes).
    * **AI:** Shared `demo-gpu-pool` (H100/RTX4000 - Scale-to-Zero).

* **Data:**
    * **DB:** `sh-shared-postgres` (Managed Cluster).
    * **Files:** `sh-storage` (Spaces Bucket).

* **DNS:** `*.shtrial.com` (Managed via DO Networking).

## 2. Infrastructure Rules (Non-Negotiable)

### A. Database

* **Connection:** Use `DATABASE_URL` from `.env.shared`.

* **Isolation:** Every app connects to a **Logical Database** named `${APP_SLUG}`.

* **Prohibition:** Do **NOT** provision new Database Clusters. Use the shared one.

### B. Storage

* **Bucket:** Use `sh-storage`.

* **Isolation:** All assets must live under the prefix `/${APP_SLUG}/`.

* **Access:** Use `NEXT_PUBLIC_CDN_BASE_URL` for frontend display.

### C. Networking

* **Frontend:** `https://${APP_SLUG}.shtrial.com`

* **Backend:** `https://api.${APP_SLUG}.shtrial.com`

* **Ingress:** Handled via NGINX Controller on the cluster. Do not create new Load Balancers manually.

## 3. AI Implementation Patterns

### Standard (Text/Logic)

* **Provider:** DigitalOcean Gradient Serverless.

* **Endpoint:** `DIGITALOCEAN_INFERENCE_ENDPOINT`.

* **Models:** `llama-3.1-70b-instruct` (Smart).

### Premium (Voice/Video)

* **Provider:** Internal GPU Gateway.

* **Endpoint:** `AI_GPU_GATEWAY_URL` (Internal Cluster DNS).

* **Usage:** Only for real-time latency-sensitive features.

## 4. Coding Standards

* **Package Manager:** `pnpm` ONLY.

* **Monorepo Structure:**
    * `apps/frontend` (Next.js/Vite)
    * `apps/backend` (NestJS/FastAPI/Node)

* **Containerization:**
    * MUST have `apps/frontend/Dockerfile` (Multi-stage).
    * MUST have `apps/backend/Dockerfile` (Multi-stage).

* **Secrets:** Never commit secrets. Read from `.env.shared` locally or K8s Secrets in prod.

## 5. Deployment Workflow

**DO NOT** use App Platform for these repos anymore.

1.  **Configure:** Ensure `.env.shared` Identity block is set (`APP_SLUG`).

2.  **Manifests:** Ensure `k8s/` folder contains standard manifests generated via `envsubst`.

3.  **Deploy:** Run `pnpm run k8s:deploy`.

    * *Builds Images* -> *Pushes to Registry* -> *Applies Manifests* -> *Ensures DB Exists*.


