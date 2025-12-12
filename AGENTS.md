# AGENTS.MD

## Purpose

This file is the **required operating manual** for any coding agent working in this repo: what you may change, how you deploy, and the exact verification gates you must pass before calling work “done”.

---

## Hard Gates (do not violate)

1. **CPU-only.** No GPU dependencies, CUDA, NVIDIA, or GPU inference paths.
2. **Shared infra only.** Do not create new clusters/DBs/buckets/registries/DNS zones/ingress controllers/cert issuers.
3. **No secrets in git.** Secrets live in `.env.shared` locally and/or Kubernetes Secrets at runtime.
4. **HTTPS must be clean.** Public URLs must work without browser security warnings.
5. **No green deploy without verification.** You must:
   - Execute the root `TEST_PLAN.md` end-to-end
   - Run Playwright E2E (CLI + Playwright MCP where needed)
   - Verify Sentry ingestion (using Sentry MCP)

6. **Agents must not propose fixes based on guesses.** Every incident update MUST include:
   - failing command
   - full error output (verbatim)
   - confirmed facts (derived strictly from output)
   - hypotheses (max 3) + one validation command per hypothesis
   - Any recommendation without evidence is invalid and must be rejected.

---

## Shared Cluster Standards (must match other namespaces)

### TLS / cert-manager (use the same cert pattern as other apps)

Each app namespace must have the **same certificate name and shape** used elsewhere on the cluster:

- `Certificate` name: **`wildcard-shtrial-tls`**
- `secretName`: **`wildcard-shtrial-tls`**
- `issuerRef`: **ClusterIssuer `letsencrypt-prod`**
- `dnsNames` (two SANs):
  - `synapse.shtrial.com`
  - `api-synapse.shtrial.com`

**Required manifest** (template; keep in `k8s/05-certificate.yaml` and envsubst it):

```yaml
apiVersion: cert-manager.io/v1
kind: Certificate
metadata:
  name: wildcard-shtrial-tls
  namespace: synapse
spec:
  secretName: wildcard-shtrial-tls
  dnsNames:
    - synapse.shtrial.com
    - api-synapse.shtrial.com
  issuerRef:
    group: cert-manager.io
    kind: ClusterIssuer
    name: letsencrypt-prod
```

**Ingress requirement**

- Ingress must reference:
  - `spec.tls[].secretName: wildcard-shtrial-tls`
  - hosts for `synapse.shtrial.com` and `api-synapse.shtrial.com`

**TLS verification gates**

- `kubectl get certificate wildcard-shtrial-tls -n synapse` shows `Ready=True`
- `kubectl get secret wildcard-shtrial-tls -n synapse` exists with `tls.crt` + `tls.key`
- `curl -I https://synapse.shtrial.com` returns 200/30x without TLS errors
- `curl -I https://api-synapse.shtrial.com/health` returns expected status

---


## Naming Standards (Mandatory - No Placeholders)

### Fixed Infrastructure (Do Not Change)

- **Cluster Name:** `sh-demo-cluster`
- **Cluster ID:** `fa17ab7c-4a61-4c4d-a80a-1fc8bf26d782`
- **Registry:** `registry.digitalocean.com/shtrial-reg`

### Application Identity (Literal Values for Synapse)

- **APP_SLUG:** `synapse`
- **Namespace:** `synapse`
- **Frontend URL:** `https://synapse.shtrial.com`
- **Backend URL:** `https://api-synapse.shtrial.com`

### Container Images (Exact Names Required)

- **Frontend Image:** `registry.digitalocean.com/shtrial-reg/synapse-frontend:latest`
- **Backend Image:** `registry.digitalocean.com/shtrial-reg/synapse-backend:latest`

### Kubernetes Resources (Exact Names Required)

All Kubernetes resources must use these exact names:

**Frontend:**
- Deployment name: `synapse-frontend`
- Service name: `synapse-frontend`
- Container name: `synapse-frontend`
- Labels: `app: synapse-frontend`

**Backend:**
- Deployment name: `synapse-backend`
- Service name: `synapse-backend`
- Container name: `synapse-backend`
- Labels: `app: synapse-backend`

**Prohibited Names:** Do NOT use generic names like `web`, `api`, `frontend`, `backend`, `server`, `client`, `app`, etc. without the app slug prefix.

### Sentry Projects (Sarosh Organization)

- **Frontend Project:** `synapse-frontend`
- **Backend Project:** `synapse-backend`
- **Organization:** `Sarosh`

Each tier must route to its own dedicated Sentry project. No shared DSNs across apps or tiers.

### Verification Requirements

After deployment, verify:

1. **Images pushed:**
   - `registry.digitalocean.com/shtrial-reg/synapse-frontend:latest`
   - `registry.digitalocean.com/shtrial-reg/synapse-backend:latest`

2. **Kubernetes resources:**
   `ash
   kubectl get deployment -n synapse
   kubectl get service -n synapse
   kubectl get ingress -n synapse
   `
   
   Should show:
   - `synapse-frontend` (deployment & service)
   - `synapse-backend` (deployment & service)

3. **Sentry projects exist:**
   - `Sarosh/synapse-frontend`
   - `Sarosh/synapse-backend`

4. **Endpoints respond:**
   - `curl -I https://synapse.shtrial.com` (200/30x)
   - `curl -I https://api-synapse.shtrial.com/health` (200)


## Repo Map (where to change things)

### Backend

- API entry: `apps/backend/src/server.ts`
- Agent workflows: `apps/backend/src/` (LangGraph JS)
- Sentry init: `apps/backend/src/lib/sentry.ts` (check existing files for confirmation)

### Frontend

- App root: `apps/frontend/` (Vite SPA)
- E2E tests: `apps/frontend/e2e/`
- Playwright config: `apps/frontend/playwright.config.ts`

### Deployment

- Canonical deploy: `scripts/k8s-deploy.sh`
- K8s templates: `k8s/*.yaml` (rendered to `k8s/generated/*` — never edit generated)

### Test Plan

- **Canonical verification checklist:** `TEST_PLAN.md` (repo root)

---

## Agent Workflow (required order)

### 0) Identify app slug

- `APP_SLUG` = lowercase repo/app slug used for namespace, hosts, and resource names.

### 1) Make the smallest correct change

- No drive-by refactors.
- Keep commits/task scope tight.

### 2) Local build + fast checks (before deploy)

From repo root:

Frontend & Backend:

- `pnpm install`
- `pnpm build` (Runs workspace build)
- `pnpm -C apps/frontend lint`
- `pnpm -C apps/backend lint` (if available)

Stop and fix if any step fails.

### 3) Deploy (only when runtime changes are involved)

From repo root:

```bash
bash scripts/k8s-deploy.sh
```

Rules:

- Do not manually patch `k8s/generated/*`
- TLS must satisfy the cert-manager standard above

---

## Verification (hard gate)

You must run **all** of the following. If any fail: fix + rerun.

### A) Execute `TEST_PLAN.md` (mandatory)

`TEST_PLAN.md` is the authoritative test plan. Execute every step as written, including:

- smoke checks
- critical/golden-path flows
- streaming and routing validation where required
- RAG/citations checks where specified

### B) Playwright E2E (mandatory)

#### Option 1 — CLI (preferred for repeatability)

From repo root:

- `pnpm -C apps/frontend test:e2e`
  OR
- `npx playwright test --config apps/frontend/playwright.config.ts`

Failing tests fail the release.

#### Option 2 — Playwright MCP (mandatory for interactive flow execution / evidence)

Use the Playwright MCP actions you have available (examples):

- `browser_install` (only if needed)
- `browser_tabs`
- `browser_navigate`
- `browser_wait_for`
- `browser_click`
- `browser_fill_form` / `browser_type`
- `browser_network_requests`
- `browser_console_messages`
- `browser_take_screenshot`
- `browser_close`

For each **golden path** in `TEST_PLAN.md`, capture minimum evidence:

- Screenshot at key milestones
- Console messages dump
- Network requests dump (prove correct API calls + status codes)

### C) API contract verification (mandatory)

Run the API calls required by `TEST_PLAN.md`, at minimum:

- `GET /health`
- any required auth/session flows
- core agent/chat routes used by the UI
- verify status codes + response schema expectations from the test plan

### D) Sentry verification using Sentry MCP (mandatory)

Goal: prove monitoring is live after build/deploy.

Required steps:

1. Trigger a controlled **frontend** error event (e.g., via a test button/route).
2. Trigger a controlled **backend** error event (e.g., a guarded test endpoint or deliberate exception path).
3. Use **Sentry MCP** to confirm:
   - event received in the correct project
   - correct environment/release/timestamp
   - event is visible (not dropped / rate-limited unexpectedly)

If Sentry verification fails, treat it as a blocker.

---

## Reporting (required output)

After finishing:

- Summary of changes (files + intent)
- Build results (pass/fail, key logs)
- Deploy results (namespace, URLs, rollout status)
- `TEST_PLAN.md` execution summary (pass/fail per section)
- Playwright results (CLI output and/or MCP evidence)
- Sentry verification proof (event/issue id + timestamp + environment)
- Follow-ups / known gaps (if any)
