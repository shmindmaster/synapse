#!/usr/bin/env bash
set -euo pipefail

ENV_FILE=".env.shared"
TEMPLATE_FILE="do-app-spec.template.yaml"
SPEC_FILE="do-app-spec.yaml"

echo "🔧 sh-deploy: $(basename "$(pwd)")"

# 1. Load Environment & Check Prerequisites
if [[ ! -f "$ENV_FILE" ]]; then
  echo "❌ ${ENV_FILE} not found."
  exit 1
fi

if ! command -v envsubst >/dev/null 2>&1; then
  echo "❌ 'envsubst' is required. (Install via 'gettext' package)"
  exit 1
fi

set -o allexport
source "$ENV_FILE"
set +o allexport

: "${APP_SLUG:?APP_SLUG required}"
: "${DO_DB_CLUSTER_ID:?DO_DB_CLUSTER_ID required}"
: "${DB_NAME:?DB_NAME required}"

echo "🚀 Starting deployment for app: $APP_SLUG"

# 2. Ensure Database Exists on Shared Cluster
echo "🗄️  Checking database '$DB_NAME'..."

if doctl databases db list "$DO_DB_CLUSTER_ID" --format Name --no-header | grep -qx "$DB_NAME"; then
  echo "   ✅ Database '$DB_NAME' exists."
else
  echo "   ➕ Creating database '$DB_NAME'..."
  doctl databases db create "$DO_DB_CLUSTER_ID" "$DB_NAME"
  echo "   ✅ Database created."
fi

# 3. Generate App Spec
echo "📝 Generating spec from template..."

# Export vars needed for envsubst
export APP_SLUG DO_REGION APP_DOMAIN_BASE \
       DATABASE_URL DO_DATABASE_URL_PRIVATE \
       DO_SPACES_BUCKET DO_SPACES_ENDPOINT DO_SPACES_REGION \
       DO_SPACES_KEY DO_SPACES_SECRET \
       NEXT_PUBLIC_CDN_BASE_URL APP_STORAGE_PREFIX \
       DIGITALOCEAN_INFERENCE_ENDPOINT DIGITALOCEAN_MODEL_KEY AI_MODEL \
       GITHUB_ACCOUNT GITHUB_REPO

envsubst < "$TEMPLATE_FILE" > "$SPEC_FILE"
echo "   ✅ Spec generated ($SPEC_FILE)."

# 4. Deploy to DigitalOcean
echo "☁️  Deploying to App Platform..."

# Check if app exists
EXISTING_APP_ID="$(doctl apps list --format ID,Spec.Name --no-header | awk -v slug="$APP_SLUG" '$2 == slug {print $1}' | head -n1 || true)"

if [[ -n "${EXISTING_APP_ID:-}" ]]; then
  echo "   🔄 Updating existing app (ID: $EXISTING_APP_ID)..."
  doctl apps update "$EXISTING_APP_ID" --spec "$SPEC_FILE" >/dev/null
  APP_ID="$EXISTING_APP_ID"
else
  echo "   🆕 Creating new app..."
  APP_ID="$(doctl apps create --spec "$SPEC_FILE" --format ID --no-header)"
fi

echo "   ✅ App deployment triggered. ID: $APP_ID"

# 5. Summary
echo "🌍 Domains (Managed by DigitalOcean DNS):"
echo "   - https://${APP_SLUG}.${APP_DOMAIN_BASE}"
echo "   - https://api.${APP_SLUG}.${APP_DOMAIN_BASE}"
echo "   (SSL and DNS records will propagate automatically)"
