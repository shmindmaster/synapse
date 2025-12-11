#!/usr/bin/env bash
set -euo pipefail

# 1. Load the Golden Config
ENV_FILE=".env.shared"
if [[ ! -f "$ENV_FILE" ]]; then echo "❌ Missing .env.shared"; exit 1; fi
set -o allexport; source "$ENV_FILE"; set +o allexport

echo "🚀 Deploying $APP_SLUG ($GITHUB_REPO) to DOKS..."

# 2. Login (Using Token as Password)
echo "$DO_REGISTRY_PASS" | docker login $DO_REGISTRY_URL -u "$DO_REGISTRY_USER" --password-stdin

# 3. Build & Push
echo "📦 Building Backend..."
docker build -t ${DO_REGISTRY_URL}/${APP_SLUG}-api:latest -f apps/backend/Dockerfile apps/backend
docker push ${DO_REGISTRY_URL}/${APP_SLUG}-api:latest

echo "📦 Building Frontend..."
docker build -t ${DO_REGISTRY_URL}/${APP_SLUG}-web:latest -f apps/frontend/Dockerfile apps/frontend
docker push ${DO_REGISTRY_URL}/${APP_SLUG}-web:latest

# 4. Generate Manifests
echo "📝 Generating Manifests..."
mkdir -p k8s/generated
# Export explicit list of vars to ensure envsubst catches them all
export APP_SLUG DO_REGISTRY_URL APP_DOMAIN_BASE DATABASE_URL \
       DO_SPACES_KEY DO_SPACES_SECRET GRADIENT_API_KEY WHISPER_API_URL \
       LLM_MODEL_ID NEXT_PUBLIC_API_URL NEXT_PUBLIC_CDN_BASE_URL \
       FIRECRAWL_API_KEY TAVILY_API_KEY RESEND_API_KEY SENTRY_DSN \
       EMBED_MODEL_ID GRADIENT_API_BASE DO_SPACES_ENDPOINT DO_SPACES_BUCKET

for f in k8s/*.yaml; do envsubst < "$f" > "k8s/generated/$(basename "$f")"; done

# 5. Apply & Cert Sync
doctl kubernetes cluster kubeconfig save "$DO_CLUSTER_NAME" >/dev/null 2>&1
kubectl create namespace "${APP_SLUG}" --dry-run=client -o yaml | kubectl apply -f -

echo "🔐 Syncing Wildcard Certificate..."
kubectl get secret wildcard-shtrial-tls -n ingress-nginx -o yaml \
  | sed "s/namespace: ingress-nginx/namespace: ${APP_SLUG}/" \
  | kubectl apply -f -

kubectl apply -f k8s/generated/ -n "${APP_SLUG}"

# 6. DB Init
doctl databases db create $DO_DB_CLUSTER_ID $DB_NAME 2>/dev/null || true

echo "✅ Success! Frontend: https://${APP_SLUG}.${APP_DOMAIN_BASE}"
echo "✅ Backend API: https://api-${APP_SLUG}.${APP_DOMAIN_BASE}"
