#!/usr/bin/env bash
set -euo pipefail

# 1. Load Config
ENV_FILE=".env.shared"
if [[ ! -f "$ENV_FILE" ]]; then echo "âŒ Missing .env.shared"; exit 1; fi
set -o allexport; source "$ENV_FILE"; set +o allexport

echo "ðŸš€ Deploying $APP_SLUG to Sarosh CPU Cluster..."

# 2. Login to DO Registry
if [[ "$GITHUB_ACCOUNT" == "shmindmaster" ]]; then
    export GITHUB_TOKEN="$GITHUB_PAT_SHMINDMASTER"
else
    export GITHUB_TOKEN="$GITHUB_PAT_SH_PENDOAH"
fi
doctl registry login

# 3. Build & Push Images
echo "ðŸ“¦ Building Backend..."
docker build -t registry.digitalocean.com/shtrial-reg/synapse-backend:latest -f apps/backend/Dockerfile .
docker push registry.digitalocean.com/shtrial-reg/synapse-backend:latest

echo "ðŸ“¦ Building Frontend..."
docker build -t registry.digitalocean.com/shtrial-reg/synapse-frontend:latest -f apps/frontend/Dockerfile .
docker push registry.digitalocean.com/shtrial-reg/synapse-frontend:latest

# 4. Generate Manifests
echo "ðŸ“ Generating Manifests..."
mkdir -p k8s/generated
export APP_SLUG DO_REGISTRY_URL APP_DOMAIN_BASE DATABASE_URL="${DO_DATABASE_URL_PRIVATE}" \
       DO_SPACES_KEY DO_SPACES_SECRET DO_SPACES_BUCKET DO_SPACES_ENDPOINT DO_SPACES_REGION \
       NEXT_PUBLIC_CDN_BASE_URL APP_STORAGE_PREFIX GRADIENT_API_BASE GRADIENT_API_KEY \
       WHISPER_API_URL FIRECRAWL_API_KEY RESEND_API_KEY TAVILY_API_KEY

for f in k8s/*.yaml; do
  [ -e "$f" ] || continue
  envsubst < "$f" > "k8s/generated/$(basename "$f")"
done

# 5. Apply to Cluster
echo "â˜¸ï¸  Applying to Cluster..."
doctl kubernetes cluster kubeconfig save "$DO_CLUSTER_NAME" >/dev/null 2>&1
kubectl create namespace "${APP_SLUG}" --dry-run=client -o yaml | kubectl apply -f -

# 6. Cert Sync (Crucial for Wildcard SSL)
echo "ðŸ” Syncing Wildcard Certificate..."
kubectl get secret wildcard-shtrial-tls -n ingress-nginx -o yaml \
  | sed "s/namespace: ingress-nginx/namespace: ${APP_SLUG}/" \
  | kubectl apply -f -

# 7. Create App Secrets (v8.6 Standard)
echo "Creating App Secrets..."
kubectl create secret generic app-secrets \
  --namespace "${APP_SLUG}" \
  --from-literal=DATABASE_URL="${DO_DATABASE_URL_PRIVATE}" \
  --from-literal=GRADIENT_API_KEY="${GRADIENT_API_KEY}" \
  --from-literal=GRADIENT_API_BASE="${GRADIENT_API_BASE}" \
  --from-literal=DO_SPACES_KEY="${DO_SPACES_KEY}" \
  --from-literal=DO_SPACES_SECRET="${DO_SPACES_SECRET}" \
  --dry-run=client -o yaml | kubectl apply -f -

# 8. Apply Manifests
kubectl apply -f k8s/generated/ -n "${APP_SLUG}"

# 9. Database Init
echo "ðŸ—„ï¸  Ensuring DB exists..."
doctl databases db create "$DO_DB_CLUSTER_ID" "$DB_NAME" 2>/dev/null || echo "   âœ… DB verified."

echo "âœ… Deployment Complete!"
echo "   - Frontend: https://${APP_SLUG}.${APP_DOMAIN_BASE}"
echo "   - Backend:  https://api-${APP_SLUG}.${APP_DOMAIN_BASE}"