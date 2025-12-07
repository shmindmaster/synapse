#!/usr/bin/env bash
set -euo pipefail

ENV_FILE=".env.shared"
if [[ ! -f "$ENV_FILE" ]]; then echo "âŒ Missing .env.shared"; exit 1; fi
set -o allexport; source "$ENV_FILE"; set +o allexport

echo "ðŸš€ Deploying $APP_SLUG to Kubernetes..."

# 1. Login to Registry
echo "ðŸ”‘ Logging into DigitalOcean Registry..."
doctl registry login

# 2. Build & Push Images
echo "ðŸ“¦ Building Backend..."
docker build -t ${DO_REGISTRY_URL}/${APP_SLUG}-api:latest -f apps/backend/Dockerfile .
docker push ${DO_REGISTRY_URL}/${APP_SLUG}-api:latest

echo "ðŸ“¦ Building Frontend..."
docker build -t ${DO_REGISTRY_URL}/${APP_SLUG}-web:latest -f apps/frontend/Dockerfile .
docker push ${DO_REGISTRY_URL}/${APP_SLUG}-web:latest

# 3. Generate Manifests
echo "ðŸ“ Generating K8s Manifests..."
mkdir -p k8s/generated

# Export vars for envsubst
export APP_SLUG DO_REGISTRY_URL APP_DOMAIN_BASE \
       DATABASE_URL="${DO_DATABASE_URL_PRIVATE}" \
       DO_SPACES_KEY DO_SPACES_SECRET DO_SPACES_BUCKET \
       DO_SPACES_ENDPOINT DO_SPACES_REGION NEXT_PUBLIC_CDN_BASE_URL \
       DIGITALOCEAN_MODEL_KEY DIGITALOCEAN_INFERENCE_ENDPOINT \
       AI_GPU_GATEWAY_URL AI_MODEL APP_STORAGE_PREFIX

for file in k8s/*.yaml; do
  [ -e "$file" ] || continue
  filename=$(basename "$file")
  envsubst < "$file" > "k8s/generated/$filename"
done

# 4. Apply to Cluster
echo "â˜¸ï¸  Authenticating to Cluster ($DO_CLUSTER_NAME)..."
# Force update kubeconfig to ensure we have the latest certs
doctl kubernetes cluster kubeconfig save "$DO_CLUSTER_ID"

# Explicitly use the context name derived from your snippet
kubectl config use-context "$DO_KUBE_CONTEXT"

# Create Namespace
kubectl create namespace $APP_SLUG --dry-run=client -o yaml | kubectl apply -f -

# Apply manifests
kubectl apply -f k8s/generated/ -n $APP_SLUG

# 5. Database Init
echo "ðŸ—„ï¸  Ensuring DB exists..."
doctl databases db create "$DO_DB_CLUSTER_ID" "$DB_NAME" 2>/dev/null || echo "   âœ… DB verified."

echo "âœ… Deployment Complete!"
echo "   - Frontend: https://${APP_SLUG}.${APP_DOMAIN_BASE}"
echo "   - Backend:  https://api.${APP_SLUG}.${APP_DOMAIN_BASE}"


