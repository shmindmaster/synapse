# AGENTS.md

## DigitalOcean Platform Standard

This repository adheres to the **v8.3 DigitalOcean Standard** for the **shmindmaster / sh-pendoah** portfolio.

### Core Architecture
- **Cluster:** `sh-demo-cluster` (DOKS)
- **Database:** `sh-shared-postgres` (Database: `synapse`)
- **Storage:** `sh-storage` (Prefix: `raw/synapse/`)
- **Registry:** `shtrial-reg`
- **Domain:** `synapse.shtrial.com` (Frontend), `api-synapse.shtrial.com` (Backend)

### Deployment
To deploy this application, run:
```bash
./scripts/k8s-deploy.sh
```
This script handles building, pushing, manifest generation, and applying to Kubernetes.

### Environment Configuration
All environment variables are managed in `.env.shared`.
**DO NOT** hardcode secrets in code or K8s manifests. Use the variables from `.env.shared` which are injected during deployment.

### Agent Instructions
- **Infrastructure:** Do not create new clusters or load balancers. Use the shared resources defined in `.env.shared`.
- **Database:** Use `DATABASE_URL` for connection. The database is pre-provisioned.
- **State:** Keep application stateless. Use S3 (Spaces) for file storage.
