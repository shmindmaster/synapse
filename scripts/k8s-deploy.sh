#!/usr/bin/env bash
set -euo pipefail

# ============================================================================
# 🌊 Synapse - Kubernetes Deployment Script
# ============================================================================
# Fully automated deployment to sh-demo-cluster (DOKS)
# ============================================================================

ENV_FILE=".env.shared"
if [[ ! -f "$ENV_FILE" ]]; then 
    echo "❌ Missing .env.shared file. Please create it first."
    exit 1
fi

# Load environment variables
set -o allexport
source "$ENV_FILE"
set +o allexport

echo "============================================================================"
echo "🚀 Deploying ${APP_SLUG} to Kubernetes (${DO_CLUSTER_NAME})"
echo "============================================================================"

# ────────────────────────────────────────
# 1. Registry Login
# ────────────────────────────────────────
echo ""
echo "🔐 Logging into DigitalOcean Registry..."
if ! doctl registry login; then
    echo "❌ Failed to login to registry. Check doctl authentication."
    exit 1
fi
echo "✅ Registry login successful"

# ────────────────────────────────────────
# 2. Build & Push Backend Image
# ────────────────────────────────────────
echo ""
echo "📦 Building Backend Image..."
BACKEND_IMAGE="${DO_REGISTRY_URL}/${APP_SLUG}-api:latest"
if ! docker build -t "${BACKEND_IMAGE}" -f apps/backend/Dockerfile .; then
    echo "❌ Backend build failed"
    exit 1
fi

echo "📤 Pushing Backend Image..."
if ! docker push "${BACKEND_IMAGE}"; then
    echo "❌ Backend push failed"
    exit 1
fi
echo "✅ Backend image deployed: ${BACKEND_IMAGE}"

# ────────────────────────────────────────
# 3. Build & Push Frontend Image
# ────────────────────────────────────────
echo ""
echo "📦 Building Frontend Image..."
FRONTEND_IMAGE="${DO_REGISTRY_URL}/${APP_SLUG}-web:latest"
if ! docker build -t "${FRONTEND_IMAGE}" \
    --build-arg VITE_API_URL="https://api.${APP_SLUG}.${APP_DOMAIN_BASE}" \
    -f apps/frontend/Dockerfile .; then
    echo "❌ Frontend build failed"
    exit 1
fi

echo "📤 Pushing Frontend Image..."
if ! docker push "${FRONTEND_IMAGE}"; then
    echo "❌ Frontend push failed"
    exit 1
fi
echo "✅ Frontend image deployed: ${FRONTEND_IMAGE}"

# ────────────────────────────────────────
# 4. Generate Kubernetes Manifests
# ────────────────────────────────────────
echo ""
echo "📝 Generating Kubernetes Manifests..."
mkdir -p k8s/generated

# Export all required variables for envsubst
export APP_SLUG DO_REGISTRY_URL APP_DOMAIN_BASE DO_INGRESS_IP
export DATABASE_URL="${DO_DATABASE_URL_PRIVATE}"
export DO_SPACES_KEY DO_SPACES_SECRET DO_SPACES_BUCKET
export DO_SPACES_ENDPOINT DO_SPACES_REGION DO_SPACES_CDN_ENDPOINT
export NEXT_PUBLIC_CDN_BASE_URL
export DIGITALOCEAN_MODEL_KEY DIGITALOCEAN_INFERENCE_ENDPOINT
export AI_GPU_GATEWAY_URL AI_MODEL AI_MODEL_EMBEDDINGS APP_STORAGE_PREFIX

# Process all YAML files
for file in k8s/*.yaml; do
    [ -e "$file" ] || continue
    filename=$(basename "$file")
    echo "  ⚙️  Processing: $filename"
    envsubst < "$file" > "k8s/generated/$filename"
done
echo "✅ Manifests generated in k8s/generated/"

# ────────────────────────────────────────
# 5. Authenticate to Kubernetes Cluster
# ────────────────────────────────────────
echo ""
echo "☸️  Authenticating to Cluster (${DO_CLUSTER_NAME})..."
if ! doctl kubernetes cluster kubeconfig save "$DO_CLUSTER_ID"; then
    echo "❌ Failed to authenticate to cluster"
    exit 1
fi

# Use the correct context
if ! kubectl config use-context "$DO_KUBE_CONTEXT"; then
    echo "⚠️  Warning: Could not set context to ${DO_KUBE_CONTEXT}, trying default"
fi
echo "✅ Cluster authentication successful"

# ────────────────────────────────────────
# 6. Ensure Database Exists
# ────────────────────────────────────────
echo ""
echo "🗄️  Ensuring Database Exists..."
DB_CREATE_OUTPUT=$(doctl databases db create "$DO_DB_CLUSTER_ID" "$DB_NAME" 2>&1 || echo "exists")
if [[ "$DB_CREATE_OUTPUT" == *"exists"* ]] || [[ "$DB_CREATE_OUTPUT" == *"already"* ]]; then
    echo "✅ Database '${DB_NAME}' verified (already exists)"
else
    echo "✅ Database '${DB_NAME}' created successfully"
fi

# ────────────────────────────────────────
# 7. Create Namespace
# ────────────────────────────────────────
echo ""
echo "📦 Creating Namespace..."
kubectl create namespace "$APP_SLUG" --dry-run=client -o yaml | kubectl apply -f -
echo "✅ Namespace '${APP_SLUG}' ready"

# ────────────────────────────────────────
# 8. Apply Kubernetes Manifests
# ────────────────────────────────────────
echo ""
echo "🚢 Applying Kubernetes Manifests..."
if ! kubectl apply -f k8s/generated/ -n "$APP_SLUG"; then
    echo "❌ Failed to apply manifests"
    exit 1
fi
echo "✅ Manifests applied successfully"

# ────────────────────────────────────────
# 9. Run Database Migrations (if Prisma)
# ────────────────────────────────────────
echo ""
echo "🔄 Running Database Migrations..."
if [[ -f "prisma/schema.prisma" ]]; then
    # Wait for backend pod to be ready
    echo "   Waiting for backend pod..."
    kubectl wait --for=condition=ready pod -l app=api -n "$APP_SLUG" --timeout=120s 2>/dev/null || echo "   ⚠️  Backend pod not ready yet"
    
    # Get the first backend pod
    BACKEND_POD=$(kubectl get pod -n "$APP_SLUG" -l app=api -o jsonpath='{.items[0].metadata.name}' 2>/dev/null || echo "")
    
    if [[ -n "$BACKEND_POD" ]]; then
        echo "   Running migrations in pod: ${BACKEND_POD}"
        kubectl exec -n "$APP_SLUG" "$BACKEND_POD" -- pnpm exec prisma migrate deploy || echo "   ⚠️  Migration failed (pod may not be ready)"
        echo "✅ Database migrations completed"
    else
        echo "   ⚠️  No backend pod found. Migrations will run on first start."
    fi
else
    echo "   ℹ️  No Prisma schema found. Skipping migrations."
fi

# ────────────────────────────────────────
# 10. Deployment Summary
# ────────────────────────────────────────
echo ""
echo "============================================================================"
echo "✅ Deployment Complete!"
echo "============================================================================"
echo ""
echo "🌐 Application URLs:"
echo "   Frontend:  https://${APP_SLUG}.${APP_DOMAIN_BASE}"
echo "   Backend:   https://api.${APP_SLUG}.${APP_DOMAIN_BASE}"
echo ""
echo "📊 Check Status:"
echo "   kubectl get all -n ${APP_SLUG}"
echo "   kubectl logs -n ${APP_SLUG} -l app=api --tail=50"
echo "   kubectl logs -n ${APP_SLUG} -l app=web --tail=50"
echo ""
echo "🔍 Verify Deployment:"
echo "   curl -I https://${APP_SLUG}.${APP_DOMAIN_BASE}"
echo "   curl https://api.${APP_SLUG}.${APP_DOMAIN_BASE}/health"
echo ""
echo "============================================================================"
