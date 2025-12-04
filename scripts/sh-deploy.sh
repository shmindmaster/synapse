#!/usr/bin/env bash
set -euo pipefail

ENV_FILE=".env.shared"
TEMPLATE_FILE="do-app-spec.template.yaml"
SPEC_FILE="do-app-spec.yaml"

echo "🔧 sh-deploy: $(basename "$(pwd)")"

# 1. Load Environment
if [[ ! -f "$ENV_FILE" ]]; then
  echo "❌ ${ENV_FILE} not found."
  exit 1
fi

if ! command -v envsubst >/dev/null 2>&1; then
  echo "❌ 'envsubst' is required."
  exit 1
fi

set -o allexport
source "$ENV_FILE"
set +o allexport

: "${APP_SLUG:?APP_SLUG required}"
: "${GITHUB_ACCOUNT:?GITHUB_ACCOUNT required}"
: "${GITHUB_REPO:?GITHUB_REPO required}"

echo "🚀 Starting deployment for: $APP_SLUG"
echo "   Account: $GITHUB_ACCOUNT"
echo "   Repo:    $GITHUB_REPO"

# 2. Determine GitHub Token (Token Switching Logic)
if [ "$GITHUB_ACCOUNT" = "shmindmaster" ]; then
    echo "🔑 Identity: Using shmindmaster PAT"
    export GITHUB_TOKEN="$GITHUB_PAT_SHMINDMASTER"
elif [ "$GITHUB_ACCOUNT" = "sh-pendoah" ] || [ "$GITHUB_ACCOUNT" = "sh_pendoah" ] || [ "$GITHUB_ACCOUNT" = "pendoah" ]; then
    echo "🔑 Identity: Using sh-pendoah PAT (covers Personal + Org)"
    export GITHUB_TOKEN="$GITHUB_PAT_SH_PENDOAH"
else
    echo "⚠️  Unknown account '$GITHUB_ACCOUNT'. Fallback to shmindmaster PAT."
    export GITHUB_TOKEN="$GITHUB_PAT_SHMINDMASTER"
fi

if [[ -z "$GITHUB_TOKEN" ]]; then
  echo "❌ Error: Selected GITHUB_TOKEN is empty. Check .env.shared."
  exit 1
fi

# 3. Ensure Database Exists
echo "🗄️  Checking database '$DB_NAME'..."
if doctl databases db list "$DO_DB_CLUSTER_ID" --format Name --no-header | grep -qx "$DB_NAME"; then
  echo "   ✅ Database exists."
else
  echo "   ➕ Creating database..."
  doctl databases db create "$DO_DB_CLUSTER_ID" "$DB_NAME"
fi

# 4. Generate App Spec
echo "📝 Generating spec..."

# Export vars for envsubst
export APP_SLUG DO_REGION APP_DOMAIN_BASE \
       DATABASE_URL DO_DATABASE_URL_PRIVATE \
       DO_SPACES_BUCKET DO_SPACES_ENDPOINT DO_SPACES_REGION \
       DO_SPACES_KEY DO_SPACES_SECRET \
       NEXT_PUBLIC_CDN_BASE_URL APP_STORAGE_PREFIX \
       DIGITALOCEAN_INFERENCE_ENDPOINT DIGITALOCEAN_MODEL_KEY AI_MODEL \
       GITHUB_ACCOUNT GITHUB_REPO GITHUB_TOKEN

envsubst < "$TEMPLATE_FILE" > "$SPEC_FILE"

echo "   ✅ Spec generated."

# 5. Deploy
echo "☁️  Deploying to DigitalOcean..."

EXISTING_APP_ID="$(doctl apps list --format ID,Spec.Name --no-header | awk -v slug="$APP_SLUG" '$2 == slug {print $1}' | head -n1 || true)"

if [[ -n "${EXISTING_APP_ID:-}" ]]; then
  echo "   🔄 Updating existing app (ID: $EXISTING_APP_ID)..."
  doctl apps update "$EXISTING_APP_ID" --spec "$SPEC_FILE" >/dev/null
  APP_ID="$EXISTING_APP_ID"
else
  echo "   🆕 Creating new app..."
  APP_ID="$(doctl apps create --spec "$SPEC_FILE" --format ID --no-header)"
fi

echo "   ✅ App ID: $APP_ID"

echo "🌍 Domains (Automated via DO DNS):"
echo "   - https://${APP_SLUG}.${APP_DOMAIN_BASE}"
echo "   - https://api.${APP_SLUG}.${APP_DOMAIN_BASE}"

