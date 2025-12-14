# DigitalOcean Platform Setup - AI Agent Instructions

> **For AI Agents (Claude, Devin, MCP):** This document contains the DigitalOcean platform architecture, configuration standards, and deployment procedures for this application.

---

## Platform Overview

This application runs on a **shared DigitalOcean infrastructure** following the v8.3 standard:

### Shared Infrastructure

- **Kubernetes Cluster**: `sh-demo-cluster` (namespace: `synapse`)
- **Postgres Cluster**: `sh-shared-postgres` (database: `synapse`)
- **Spaces Bucket**: `sh-storage` (prefix: `raw/synapse/`)
- **Container Registry**: `shtrial-reg` (images: `synapse-api`, `synapse-web`)
- **TLS Certificate**: Per-app TLS certificate (standard): Each app namespace must have a cert-manager Certificate named wildcard-shtrial-tls issuing a TLS secret wildcard-shtrial-tls for synapse.shtrial.com and api-synapse.shtrial.com using ClusterIssuer/letsencrypt-prod (HTTP-01). Do not create *.shtrial.com wildcard certificates.
- **Domains**: 
  - Frontend: `synapse.shtrial.com`
  - Backend: `api-synapse.shtrial.com`

### Architecture Principles

1. **Single shared plane per type** - One K8s cluster, one Postgres cluster, one Spaces bucket, one registry
2. **Per-app logical isolation** - Each app has its own namespace, database, and storage prefix
3. **Consistent naming** - All lowercase, hyphen-separated slugs
4. **pgvector for vectors** - All vector data stored in shared Postgres with `pgvector` extension

---

## App-Specific Configuration

### Application Identity

- **App Slug**: `synapse` (lowercase, matches repository folder name)
- **GitHub Repository**: `Synapse` (case-sensitive)
- **Kubernetes Namespace**: `synapse`
- **Database Name**: `synapse` (in `sh-shared-postgres` cluster)

### Environment Variables

All configuration is stored in `.env.shared` at the repository root. Key variables:

```bash
# App Identity
APP_SLUG=synapse
GITHUB_REPO=Synapse

# Shared Infrastructure
DO_CLUSTER_NAME=sh-demo-cluster
DO_DB_CLUSTER_NAME=sh-shared-postgres
DB_NAME=synapse
DB_HOST=sh-shared-postgres-do-user-29516566-0.f.db.ondigitalocean.com
DO_SPACES_BUCKET=sh-storage
DO_SPACES_ENDPOINT=https://sh-storage.nyc3.digitaloceanspaces.com
RAW_PREFIX=raw/synapse/

# Registry
DO_REGISTRY_URL=registry.digitalocean.com/shtrial-reg

# Domains
APP_DOMAIN_BASE=shtrial.com
NEXT_PUBLIC_URL=https://synapse.shtrial.com
NEXT_PUBLIC_API_URL=https://api-synapse.shtrial.com
```

**Full configuration**: See `.env.shared` file for complete list of environment variables.

---

## Deployment Guidelines

### Quick Deploy

```bash
# Primary deployment method
bash scripts/k8s-deploy.sh
```

The deployment script automatically:
1. Loads configuration from `.env.shared`
2. Builds and pushes Docker images to registry
3. Generates K8s manifests using `envsubst`
4. Creates namespace if needed
5. Syncs per-app TLS certificate (standard)
6. Applies all manifests
7. Ensures database exists

### Kubernetes Resources

Standard resources in `k8s/` directory:
- `01-namespace.yaml` - App namespace
- `02-secret.yaml` - Environment variables and secrets
- `03-backend.yaml` - Backend deployment and service
- `04-frontend.yaml` - Frontend deployment and service
- `07-ingress.yaml` - Ingress with TLS configuration

**Naming Convention**:
- Deployments: `backend`, `frontend` (lowercase, no variations)
- Services: `backend`, `frontend` (must match deployment names)
- Ingress: `app-ingress`
- Secret: `app-secrets`

### Database Setup

The database `synapse` is automatically created in `sh-shared-postgres` during deployment. The `pgvector` extension is enabled for vector/RAG operations.

**Connection**:
- Host: `sh-shared-postgres-do-user-29516566-0.f.db.ondigitalocean.com`
- Port: `25060` (Transaction pool for writes)
- SSL: Required (`sslmode=require`)
- Database: `synapse`

---

## AI Agent Instructions

### When Working on This Repository

1. **Always source `.env.shared`** before running commands:
   ```bash
   set -o allexport; source .env.shared; set +o allexport
   ```

2. **Use standardized naming**:
   - App slug must be lowercase and match repo folder name
   - All K8s resources use `synapse` namespace
   - Service names are `backend` and `frontend` only

3. **Deployment process**:
   - Never hardcode values - use environment variables
   - Always use `scripts/k8s-deploy.sh` for deployments
   - Verify `.env.shared` exists and is complete before deploying

4. **Database operations**:
   - Use `DATABASE_URL` from `.env.shared`
   - Run migrations before deploying new code
   - Never use `prisma migrate dev` on production database

5. **Storage operations**:
   - Use `raw/synapse/` prefix for uploaded files
   - Access via `DO_SPACES_ENDPOINT` and `DO_SPACES_BUCKET`
   - CDN URL: `NEXT_PUBLIC_CDN_BASE_URL`

6. **TLS and Ingress**:
   - Always use Per-app TLS certificate (standard): Each app namespace must have a cert-manager Certificate named wildcard-shtrial-tls issuing a TLS secret wildcard-shtrial-tls for synapse.shtrial.com and api-synapse.shtrial.com using ClusterIssuer/letsencrypt-prod (HTTP-01). Do not create *.shtrial.com wildcard certificates.
   - Never create per-app certificates
   - Use hostname pattern: `synapse.shtrial.com` and `api-synapse.shtrial.com`

### Forbidden Actions

❌ **DO NOT**:
- Create separate infrastructure resources (use shared resources)
- Hardcode credentials or connection strings
- Create per-app TLS certificates (use Per-app TLS certificate (standard): Each app namespace must have a cert-manager Certificate named wildcard-shtrial-tls issuing a TLS secret wildcard-shtrial-tls for synapse.shtrial.com and api-synapse.shtrial.com using ClusterIssuer/letsencrypt-prod (HTTP-01). Do not create *.shtrial.com wildcard certificates.)

✅ **DO**:
- Use environment variables from `.env.shared`
- Follow naming conventions strictly
- Use shared wildcard TLS certificate
- Deploy via `scripts/k8s-deploy.sh`
- Test locally before deploying

---

## Troubleshooting

### App Not Accessible

1. Check pods: `kubectl get pods -n synapse`
2. Check logs: `kubectl logs deployment/backend -n synapse`
3. Check ingress: `kubectl get ingress -n synapse`
4. Verify TLS secret: `kubectl get secret wildcard-shtrial-tls -n synapse`

### Database Connection Issues

1. Verify database exists: `doctl databases db list ${DO_DB_CLUSTER_ID}`
2. Check connection string: `echo $DATABASE_URL`
3. Test connection: `psql "$DATABASE_URL" -c "SELECT 1"`

### Deployment Failures

1. Check build logs: Review Docker build output
2. Verify registry access: `doctl registry login`
3. Check manifest generation: Review `k8s/generated/` files
4. Verify environment variables: `env | grep APP_SLUG`

---

## References

- **Platform Standards**: `platform/docs/DO_PLATFORM_STANDARDS.md`
- **Technical Bible**: `platform/docs/03-infrastructure-baseline.md`
- **Deployment Playbook**: `platform/docs/06-deployment-playbook.md`
- **K8s Templates**: `platform/templates/k8s/`
- **Docker Templates**: `platform/templates/docker/`

---

**Last Updated**: December 2025  
**Version**: v8.3  
**Cluster**: sh-demo-cluster (NYC3)
