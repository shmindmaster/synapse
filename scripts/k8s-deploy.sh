#!/usr/bin/env bash
set -euo pipefail

ENV_FILE=".env.shared"
if [[ ! -f "$ENV_FILE" ]]; then echo "❌ Missing .env.shared"; exit 1; fi
set -o allexport; source "$ENV_FILE"; set +o allexport

echo "🚀 Deploying $APP_SLUG to DOKS..."

# 1. Login
if [[ "$GITHUB_ACCOUNT" == "shmindmaster" ]]; then
    export GITHUB_TOKEN="$GITHUB_PAT_SHMINDMASTER"
else
    export GITHUB_TOKEN="$GITHUB_PAT_SH_PENDOAH"
fi
doctl registry login

# 2. Build & Push
echo "📦 Building Backend..."
docker build -t ${DO_REGISTRY_URL}/${APP_SLUG}-api:latest -f apps/backend/Dockerfile .
docker push ${DO_REGISTRY_URL}/${APP_SLUG}-api:latest

echo "📦 Building Frontend..."
docker build -t ${DO_REGISTRY_URL}/${APP_SLUG}-web:latest -f apps/frontend/Dockerfile .
docker push ${DO_REGISTRY_URL}/${APP_SLUG}-web:latest

# 3. Generate Manifests
echo "📝 Generating Manifests..."
mkdir -p k8s/generated
export APP_SLUG DO_REGISTRY_URL APP_DOMAIN_BASE DATABASE_URL="${DO_DATABASE_URL_PRIVATE}" \
       DO_SPACES_KEY DO_SPACES_SECRET DO_SPACES_BUCKET DO_SPACES_ENDPOINT DO_SPACES_REGION \
       NEXT_PUBLIC_CDN_BASE_URL APP_STORAGE_PREFIX DIGITALOCEAN_INFERENCE_ENDPOINT \
       DIGITALOCEAN_MODEL_KEY AI_MODEL AI_GPU_GATEWAY_URL

for f in k8s/*.yaml; do
  [ -e "$f" ] || continue
  envsubst < "$f" > "k8s/generated/$(basename "$f")"
done

# 4. Apply to Cluster
echo "☸️  Applying to Cluster..."
doctl kubernetes cluster kubeconfig save "$DO_CLUSTER_NAME" >/dev/null 2>&1
kubectl create namespace "${APP_SLUG}" --dry-run=client -o yaml | kubectl apply -f -
kubectl apply -f k8s/generated/ -n "${APP_SLUG}"

# 5. Database Init
echo "🗄️  Ensuring DB exists..."
doctl databases db create "$DO_DB_CLUSTER_ID" "$DB_NAME" 2>/dev/null || echo "   ✅ DB verified."

echo "✅ Deployment Complete!"
echo "   - Frontend: https://${APP_SLUG}.${APP_DOMAIN_BASE}"
echo "   - Backend:  https://api.${APP_SLUG}.${APP_DOMAIN_BASE}"
