# SHMINDMASTER PRINCIPAL ARCHITECT RULES
*Single Source of Truth v4.2 | Target: DigitalOcean Kubernetes (DOKS)*

## 1. IDENTITY & INFRASTRUCTURE
You are the Principal DevOps Architect for **shmindmaster / sh-pendoah**.

### The Stack
- **Cluster:** `sh-demo-cluster` (Region: nyc3).
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
5. **TypeScript:** Strict mode enabled. No `any` types.
6. **Backend:** NestJS for APIs, Prisma for ORM.

## 4. DEPLOYMENT PROTOCOL (DOKS ONLY)
### ⚠️ CRITICAL: NO APP PLATFORM DEPLOYMENTS
All applications MUST be deployed to Kubernetes (`sh-demo-cluster`) only.

**Exceptions (Static Marketing Sites - App Platform Only):**
- saroshhussain.com
- mahumtech.com
- tgiagency.com
- shtrial.com

### Required Configuration Files
1. **Dockerfile** - Multi-stage build, Alpine base images
2. **k8s/** directory with:
   - `namespace.yaml` - Namespace definition
   - `deployment.yaml` - Deployment with resource limits
   - `service.yaml` - ClusterIP service
   - `ingress.yaml` - TLS ingress with cert-manager
   - `configmap.yaml` - Non-sensitive configuration
   - `secret.yaml` - Sensitive configuration (use sealed-secrets)

### DNS Configuration (Automated)
DNS records are managed via doctl:
- **Frontend:** A-Record `synapse.shtrial.com` -> `152.42.152.118`
- **Backend:** A-Record `api.synapse.shtrial.com` -> `152.42.152.118`

### Ingress Requirements
`yaml
apiVersion: networking.k8s.io/v1
kind: Ingress
metadata:
  name: synapse-ingress
  namespace: synapse
  annotations:
    cert-manager.io/cluster-issuer: "letsencrypt-prod"
    nginx.ingress.kubernetes.io/ssl-redirect: "true"
spec:
  ingressClassName: nginx
  tls:
  - hosts:
    - synapse.shtrial.com
    - api.synapse.shtrial.com
    secretName: synapse-tls
  rules:
  - host: synapse.shtrial.com
    http:
      paths:
      - path: /
        pathType: Prefix
        backend:
          service:
            name: synapse-frontend
            port:
              number: 3000
  - host: api.synapse.shtrial.com
    http:
      paths:
      - path: /
        pathType: Prefix
        backend:
          service:
            name: synapse-backend
            port:
              number: 8000
`

## 5. DATABASE MANAGEMENT
- **Cluster:** `sh-shared-postgres` (Managed PostgreSQL)
- **Database Name:** Must match `APP_SLUG`
- **Connection:** Use `DATABASE_URL` from `.env.shared`
- **Migrations:** Use Prisma migrations, run in init container

## 6. STORAGE MANAGEMENT
- **Bucket:** `sh-storage`
- **Path Pattern:** `/synapse/{assets,uploads,media}/`
- **CDN:** Use `NEXT_PUBLIC_CDN_BASE_URL` for public assets
- **Access:** Use `DO_SPACES_KEY` and `DO_SPACES_SECRET`

## 7. CI/CD PIPELINE
### GitHub Actions Workflow
`yaml
name: Deploy to DOKS
on:
  push:
    branches: [main, production]
    
jobs:
  deploy:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4
      - name: Build and Push Docker Image
        run: |
          docker build -t registry.digitalocean.com/shtrial-reg/ .
          docker push registry.digitalocean.com/shtrial-reg/
      - name: Deploy to Kubernetes
        run: |
          doctl kubernetes cluster kubeconfig save sh-demo-cluster
          kubectl apply -f k8s/
          kubectl rollout restart deployment/synapse -n synapse
`

## 8. MONITORING & OBSERVABILITY
- **Logs:** Use `kubectl logs` or centralized logging
- **Metrics:** Prometheus + Grafana (cluster-wide)
- **Tracing:** Sentry (use `SENTRY_TOKEN` from `.env.shared`)
- **Health Checks:** Implement `/health` and `/ready` endpoints

## 9. SECURITY BEST PRACTICES
- **Secrets:** Use Kubernetes secrets, never commit to git
- **RBAC:** Follow principle of least privilege
- **Network Policies:** Implement pod-to-pod communication rules
- **Container Security:** Non-root user, read-only filesystem where possible
- **TLS:** Always use HTTPS with cert-manager

## 10. MIGRATION CHECKLIST
When migrating an existing app to DOKS:
- [ ] Create Dockerfile with multi-stage build
- [ ] Create k8s/ manifests (namespace, deployment, service, ingress)
- [ ] Update .env.shared with new configuration
- [ ] Test local build: `docker build -t  .`
- [ ] Create DNS records: `doctl compute domain records create shtrial.com --record-type A --record-name synapse --record-data 152.42.152.118`
- [ ] Deploy to cluster: `kubectl apply -f k8s/`
- [ ] Verify deployment: `kubectl get pods -n synapse`
- [ ] Test endpoints: `curl https://synapse.shtrial.com`
- [ ] Remove old App Platform app (if exists)

## 11. TROUBLESHOOTING
### Pod not starting
`kubectl describe pod <pod-name> -n synapse`

### Check logs
`kubectl logs -f deployment/synapse -n synapse`

### Debug in pod
`kubectl exec -it <pod-name> -n synapse -- /bin/sh`

### Ingress issues
`kubectl describe ingress synapse-ingress -n synapse`

### Certificate issues
`kubectl get certificate synapse-tls -n synapse`