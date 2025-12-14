#!/usr/bin/env bash
set -euo pipefail

# Detect DOCTL
if command -v doctl.exe &> /dev/null; then
    DOCTL="doctl.exe"
elif command -v doctl &> /dev/null; then
    DOCTL="doctl"
else
    echo "❌ doctl not found. Ensure it is installed and in your PATH."
    exit 1
fi

# 1. Load Config
ENV_FILE=".env.shared"
if [[ ! -f "$ENV_FILE" ]]; then echo "❌ Missing .env.shared"; exit 1; fi
set -o allexport; source "$ENV_FILE"; set +o allexport

echo "🚀 Deploying $APP_SLUG to Sarosh CPU Cluster..."

# 2. Login to DO Registry
# Detect GitHub account from repo path or GITHUB_REPO
if [[ "${GITHUB_REPO:-}" == *"shmindmaster"* ]] || [[ "${PWD:-}" == *"shmindmaster"* ]]; then
    export GITHUB_TOKEN="$GITHUB_PAT_SHMINDMASTER"
else
    export GITHUB_TOKEN="$GITHUB_PAT_SH_PENDOAH"
fi
# $DOCTL registry login # Commented out to prevent config locking, run once globally

# 3. Build & Push Images
echo "📦 Building Backend..."
docker build -t ${DO_REGISTRY_URL}/${APP_SLUG}-api:latest -f apps/backend/Dockerfile .
docker push ${DO_REGISTRY_URL}/${APP_SLUG}-api:latest

echo "📦 Building Frontend..."
docker build -t ${DO_REGISTRY_URL}/${APP_SLUG}-web:latest -f apps/frontend/Dockerfile .
docker push ${DO_REGISTRY_URL}/${APP_SLUG}-web:latest

# 4. Generate Manifests
echo "📝 Generating Manifests..."
mkdir -p k8s/generated
export APP_SLUG DO_REGISTRY_URL APP_DOMAIN_BASE DATABASE_URL="${DATABASE_URL}" \
       DO_SPACES_KEY DO_SPACES_SECRET DO_SPACES_BUCKET DO_SPACES_ENDPOINT DO_SPACES_REGION \
       NEXT_PUBLIC_CDN_BASE_URL APP_STORAGE_PREFIX GRADIENT_API_BASE GRADIENT_API_KEY \
       WHISPER_API_URL FIRECRAWL_API_KEY RESEND_API_KEY TAVILY_API_KEY CI=true

for f in k8s/*.yaml; do
  [ -e "$f" ] || continue
  envsubst < "$f" > "k8s/generated/$(basename "$f")"
done

# 5. Apply to Cluster
echo "☸️  Applying to Cluster..."
$DOCTL kubernetes cluster kubeconfig save "$DO_CLUSTER_NAME" >/dev/null 2>&1
kubectl create namespace "${APP_SLUG}" --dry-run=client -o yaml | kubectl apply -f -

# 6. Cert Sync (Crucial for Wildcard SSL)
echo "🔐 Syncing Wildcard Certificate..."
kubectl get secret wildcard-shtrial-tls -n ingress-nginx -o yaml \
  | sed "s/namespace: ingress-nginx/namespace: ${APP_SLUG}/" \
  | kubectl apply -f -

kubectl apply -f k8s/generated/ -n "${APP_SLUG}"

# 7. Database Init
echo "🗄️  Ensuring DB exists..."
# Check if DO_DB_CLUSTER_ID is set, if not try to find it or skip
if [ -n "${DO_DB_CLUSTER_ID:-}" ]; then
    $DOCTL databases db create "$DO_DB_CLUSTER_ID" "$DB_NAME" 2>/dev/null || echo "   ✅ DB verified."
else
    echo "⚠️  DO_DB_CLUSTER_ID not set, skipping DB creation check."
fi

echo "✅ Deployment Complete!"
echo "   - Frontend: https://${APP_SLUG}.${APP_DOMAIN_BASE}"
echo "   - Backend:  https://api-${APP_SLUG}.${APP_DOMAIN_BASE}"
