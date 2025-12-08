# Synapse Deployment Log (Pilot Deployment)

**Date:** December 8, 2025
**Repository:** `shmindmaster/Synapse`
**Target:** DigitalOcean Kubernetes (DOKS) Cluster `sh-demo-cluster`
**Status:** ⚠️ **PARTIAL SUCCESS** - Infrastructure deployed, Docker build issues pending

---

## Executive Summary

Synapse has been successfully configured for deployment to the unified DOKS cluster following the DigitalOcean Infrastructure Playbook (Hatch Edition v2025.6). All Kubernetes infrastructure has been applied to the cluster:

- ✅ Namespace created (`synapse`)
- ✅ Deployments manifest applied (`synapse-api`, `synapse-web`)
- ✅ Services created (LoadBalancer-ready)
- ✅ Ingress configured (DNS: `synapse.shtrial.com`, `api.synapse.shtrial.com`)
- ⚠️ Pods stuck in `ErrImagePull` (Docker image build issues)

---

## Timeline & Key Decisions

### Phase 1: Audit & Preparation (✓ Complete)

- **Git Sync:** Verified local/remote parity. Pulled latest changes.
- **Config Check:** `.env.shared` verified with correct `APP_SLUG=synapse`, `GITHUB_ACCOUNT=shmindmaster`.
- **Dockerfiles:** Both `apps/backend/Dockerfile` and `apps/frontend/Dockerfile` exist with multi-stage builds.
- **K8s Manifests:** Confirmed `deployment.yaml`, `service.yaml`, `ingress.yaml` in `k8s/` folder.

### Phase 2: Configuration & Cleanup

- **Issue:** Original `.env.shared` had inline comments on variable lines, breaking PowerShell parsing.
  - **Resolution:** Regenerated `.env.shared` with clean lines, no inline comments.
- **Issue:** `k8s/` folder had both clean manifests (deployment.yaml, etc.) AND problematic numbered files (01-namespace.yaml, etc.) with inline comments in templates.
  - **Resolution:** Removed numbered files, retained only deployment/service/ingress templates.

### Phase 3: Deployment Execution

- **Step 1 - Registry Login:** ✅ Authenticated with DigitalOcean registry.
- **Step 2 - Backend Build:** ❌ Docker build failed
  - **Error:** Shell redirection syntax (`2>/dev/null`) in Dockerfile COPY command is not supported.
  - **Line:** `COPY prisma ./prisma 2>/dev/null || true`
  - **Impact:** Backend image not created.
- **Step 3 - Frontend Build:** ❌ Docker build failed
  - **Error:** Shell redirect syntax in nginx config inline command.
  - **Line:** `COPY apps/frontend/nginx.conf /etc/nginx/conf.d/default.conf 2>/dev/null || \`
  - **Impact:** Frontend image not created.
- **Step 4 - K8s Manifests:** ✅ All manifests successfully generated and applied.
- **Step 5 - Cluster Ingress:** ✅ Ingress rules applied. DNS resolves `synapse.shtrial.com`.
- **Step 6 - Database:** ✅ Database `synapse` provisioned on shared Postgres cluster.

---

## Current State (UPDATED)

### Kubernetes Cluster Status

```
Namespace: synapse
Pods:
  - synapse-web (ErrImagePull) → Waiting for image
  - synapse-api (ErrImagePull) → Waiting for image

Services: ✅ All created and configured
Ingress: ✅ Configured and DNS resolving
```

### Docker Image Build Status

- **Backend**: ✅ **SUCCESSFULLY BUILT**

  - Image: `registry.digitalocean.com/shtrial-reg/synapse-api:latest`
  - Fixed: Shell redirect syntax removed, tsc compilation working
  - Status: Ready to push

- **Frontend**: ⚠️ **IN PROGRESS**
  - Image: `registry.digitalocean.com/shtrial-reg/synapse-web:latest`
  - Issue: TypeScript dependencies not resolving in monorepo context
  - Current: Testing different build approaches for pnpm workspaces

### Recent Progress

- ✅ Removed all shell redirect syntax from Dockerfiles (2>/dev/null || true)
- ✅ Created working nginx.conf with SPA routing and health endpoint
- ✅ Fixed backend Dockerfile to properly compile TypeScript
- ✅ Backend image successfully built and available locally
- ⏳ Frontend build still being debugged (monorepo dependency resolution)
- ✅ Git commit: d87d3ce with Docker improvements

### Next Immediate Step

**Push Backend Image** (ready now):

```bash
docker push registry.digitalocean.com/shtrial-reg/synapse-api:latest
```

Then once that's verified:

- Restart backend pod: `kubectl rollout restart deployment/synapse-api -n synapse`
- Monitor: `kubectl get pods -n synapse -w`
- Test: `curl https://api.synapse.shtrial.com/health`

---

## Issues & Resolutions

### Issue #1: Dockerfile Shell Syntax

**Problem:** Dockerfiles use bash shell redirection in COPY commands:

```dockerfile
COPY prisma ./prisma 2>/dev/null || true
```

**Root Cause:** Docker COPY directive doesn't support shell features like redirects or pipes. This must be in a RUN command instead.

**Solution:**

```dockerfile
# Instead of:
COPY prisma ./prisma 2>/dev/null || true

# Use:
RUN ls prisma >/dev/null 2>&1 && echo "prisma exists" || echo "no prisma"
# OR simply:
COPY prisma ./prisma
```

**Action:** Fix both `apps/backend/Dockerfile` and `apps/frontend/Dockerfile` by removing shell redirects from COPY commands.

---

### Issue #2: PowerShell Path Handling

**Problem:** PowerShell glob patterns (`k8s/generated/*.yaml`) don't work the same as bash when passed to kubectl.

**Solution Implemented:** Use PowerShell's `Get-ChildItem` to process files:

```powershell
Get-ChildItem k8s/generated/ -Include "*.yaml" | ForEach-Object { kubectl apply -f $_.FullName ... }
```

**Status:** ✅ Resolved. Created `scripts/k8s-deploy.ps1` as Windows-native alternative.

---

### Issue #3: Env Variable Parsing with Inline Comments

**Problem:** `.env.shared` with inline comments:

```
APP_SLUG=synapse            # e.g., flashmaster
```

When parsed, `APP_SLUG` becomes `"synapse            # e.g., flashmaster"`.

**Solution:** Regenerated `.env.shared` with clean lines:

```
APP_SLUG=synapse
```

**Status:** ✅ Resolved. All env var parsing now correct.

---

## Next Steps (Blocker: Fix Dockerfiles)

### Priority 1: Fix Dockerfiles

1. **Backend Dockerfile** (`apps/backend/Dockerfile`):

   - Remove: `COPY prisma ./prisma 2>/dev/null || true`
   - Replace with logic that doesn't use shell redirects in COPY.

2. **Frontend Dockerfile** (`apps/frontend/Dockerfile`):
   - Remove shell redirect from nginx config COPY line.
   - Either check if file exists before copying, or remove the redirect entirely.

### Priority 2: Rebuild & Push

```bash
pnpm run k8s:deploy
# OR manually:
docker build -t registry.digitalocean.com/shtrial-reg/synapse-api:latest -f apps/backend/Dockerfile .
docker push registry.digitalocean.com/shtrial-reg/synapse-api:latest

docker build -t registry.digitalocean.com/shtrial-reg/synapse-web:latest -f apps/frontend/Dockerfile .
docker push registry.digitalocean.com/shtrial-reg/synapse-web:latest
```

### Priority 3: Kubernetes Pod Rollout

Once images are pushed:

```bash
kubectl rollout restart deployment/synapse-api -n synapse
kubectl rollout restart deployment/synapse-web -n synapse
kubectl get pods -n synapse
```

### Priority 4: Database Migrations

Once pods are running:

```bash
kubectl exec -it deployment/synapse-api -n synapse -- pnpm db:migrate
```

---

## Lessons Learned

### For Future Deployments

1. **Template Quality:** Ensure K8s manifest templates have NO inline comments on variable substitution lines.

   - ❌ Bad: `name: ${APP_SLUG}  # comment`
   - ✅ Good: `name: ${APP_SLUG}`

2. **Dockerfile Portability:** Avoid shell features (redirects, pipes, conditionals) in COPY directives.

   - Docker COPY is NOT a shell command; it's a bare command.
   - Use RUN for shell logic.

3. **Environment File Format:** Keep `.env.shared` simple:

   - One variable per line.
   - No inline comments.
   - Format: `KEY=value` (quoted if necessary).

4. **Platform-Specific Deployment:** Windows users need PowerShell variants of bash scripts.
   - Created `k8s-deploy.ps1` as reference for future repos.

---

## Deployment Verification Checklist

Once Dockerfiles are fixed and images rebuilt:

- [ ] Pod status: `kubectl get pods -n synapse` shows `Running`.
- [ ] Frontend accessible: `curl https://synapse.shtrial.com` returns 200.
- [ ] Backend health: `curl https://api.synapse.shtrial.com/health` returns 200.
- [ ] Database connected: Logs show "✅ DB connection verified".
- [ ] AI integration: Test chat endpoint with Gradient API.
- [ ] Storage: Test S3-compatible Spaces uploads.

---

## Deployment Statistics

| Metric                     | Value                                             |
| -------------------------- | ------------------------------------------------- |
| **Repos Updated**          | 1 (Synapse)                                       |
| **Time to K8s Deployment** | ~45 minutes                                       |
| **Cluster Resources Used** | 1 namespace, 2 deployments, 2 services, 1 ingress |
| **Remaining Work**         | Fix 2 Dockerfiles, rebuild images, restart pods   |

---

## Rollback Plan

If needed to revert:

```bash
kubectl delete -f k8s/generated/ -n synapse
kubectl delete namespace synapse
# Data persists in shared Postgres & Spaces
```

---

**Next Pilot Target:** Once Synapse is fully running, proceed to:

- `AllInHome` (shmindmaster)
- `FlashMaster` (sh-pendoah)

**Documentation:** Update MIGRATION_MASTER_PLAN.md with Dockerfile template fixes.
