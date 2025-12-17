#!/usr/bin/env bash
set -euo pipefail

# Load .env
if [ -f .env ]; then
  export $(grep -v '^#' .env | xargs)
fi

APP_SLUG="${APP_SLUG:?Set APP_SLUG}"
SVC="${SVC:-web}"
DOCKERFILE="${DOCKERFILE:-Dockerfile}"
REGISTRY="registry.digitalocean.com/shtrial-reg"
GIT_SHA="$(git rev-parse --short HEAD 2>/dev/null || echo nogit)"
TAG="${GIT_SHA}-$(date -u +%Y%m%d%H%M%S)"

IMAGE_NAME="${APP_SLUG}-${SVC}"
FULL_IMAGE="${REGISTRY}/${IMAGE_NAME}:${TAG}"

echo "🚀 Building ${FULL_IMAGE}..."
export DOCKER_BUILDKIT=1
docker build -f ${DOCKERFILE} -t ${FULL_IMAGE} .

echo "📤 Pushing to registry..."
docker push ${FULL_IMAGE}

echo "🔐 Creating namespace and injecting secrets..."
kubectl create namespace ${APP_SLUG} --dry-run=client -o yaml | kubectl apply -f -

kubectl -n ${APP_SLUG} create secret generic app-secrets \
  --from-env-file=.env \
  --dry-run=client -o yaml | kubectl apply -f -

echo "🔄 Updating deployment..."
kubectl -n ${APP_SLUG} set image deployment/${IMAGE_NAME} ${IMAGE_NAME}=${FULL_IMAGE} \
  || echo "⚠️  Deployment not found. Apply k8s manifests first."

echo "✅ Deployed ${FULL_IMAGE}"
