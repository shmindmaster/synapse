#!/bin/bash
set -e

# ==========================================
# SETUP DNS RECORDS (Per-Repo)
# ==========================================
# Purpose: Create/update CNAME records in shtrial.com zone for this app's
#          frontend and backend subdomains, pointing to App Platform endpoints
# Usage: Run this AFTER deploying the app to App Platform
#        bash scripts/setup-dns.sh

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
REPO_DIR="$(cd "$SCRIPT_DIR/.." && pwd)"
cd "$REPO_DIR"

# Get APP_SLUG from app.yaml or environment
if [ -f "app.yaml" ]; then
  APP_SLUG=$(grep "^name:" app.yaml | awk '{print $2}' | tr -d '"' || echo "")
fi

if [ -z "$APP_SLUG" ]; then
  APP_SLUG=$(basename "$REPO_DIR")
fi

DOMAIN="shtrial.com"
FRONTEND_SUBDOMAIN="${APP_SLUG}.shtrial.com"
BACKEND_SUBDOMAIN="api-${APP_SLUG}.shtrial.com"

# Extract just the subdomain name for DNS record (without .shtrial.com)
FRONTEND_RECORD_NAME="$APP_SLUG"
BACKEND_RECORD_NAME="api-$APP_SLUG"

echo "=========================================="
echo "🌐 SETTING UP DNS RECORDS"
echo "   App: $APP_SLUG"
echo "   Domain Zone: $DOMAIN"
echo "=========================================="
echo ""

# Verify doctl - handle Windows paths
DOCTL_CMD="doctl"
if ! command -v doctl &> /dev/null; then
  # Try Windows-specific paths
  if [ -f "/mnt/c/Users/SaroshHussain/AppData/Local/Microsoft/WinGet/Links/doctl.exe" ]; then
    DOCTL_CMD="/mnt/c/Users/SaroshHussain/AppData/Local/Microsoft/WinGet/Links/doctl.exe"
  elif [[ -n "$WINDIR" ]] || [[ "$OSTYPE" == "msys" ]] || [[ "$OSTYPE" == "cygwin" ]]; then
    WIN_USER=$(powershell -NoProfile -Command "[System.Environment]::UserName" 2>/dev/null | tr -d '\r\n' || echo "$USER")
    
    DOCTL_PATHS=(
      "/mnt/c/Users/$WIN_USER/AppData/Local/Microsoft/WinGet/Links/doctl.exe"
      "C:/Users/SaroshHussain/AppData/Local/Microsoft/WinGet/Links/doctl.exe"
      "C:/Users/$WIN_USER/AppData/Local/Microsoft/WinGet/Links/doctl.exe"
      "/c/Users/SaroshHussain/AppData/Local/Microsoft/WinGet/Links/doctl.exe"
      "/c/Users/$WIN_USER/AppData/Local/Microsoft/WinGet/Links/doctl.exe"
    )
    
    for path in "${DOCTL_PATHS[@]}"; do
      if [ -f "$path" ] 2>/dev/null; then
        DOCTL_CMD="$path"
        break
      fi
    done
    
    if [ "$DOCTL_CMD" = "doctl" ]; then
      DOCTL_WIN_PATH=$(powershell -NoProfile -Command "(Get-Command doctl -ErrorAction SilentlyContinue).Source" 2>/dev/null | tr -d '\r\n')
      if [ -n "$DOCTL_WIN_PATH" ]; then
        DOCTL_BASH_PATH1=$(echo "$DOCTL_WIN_PATH" | sed 's|^C:|/mnt/c|' | sed 's|\\\\|/|g' | sed 's|\\|/|g')
        DOCTL_BASH_PATH2=$(echo "$DOCTL_WIN_PATH" | sed 's|^C:|/c|' | sed 's|\\\\|/|g' | sed 's|\\|/|g')
        if [ -f "$DOCTL_BASH_PATH1" ]; then
          DOCTL_CMD="$DOCTL_BASH_PATH1"
        elif [ -f "$DOCTL_BASH_PATH2" ]; then
          DOCTL_CMD="$DOCTL_BASH_PATH2"
        fi
      fi
    fi
  fi
  
  if [ "$DOCTL_CMD" = "doctl" ] || [ ! -f "$DOCTL_CMD" ] 2>/dev/null; then
    echo "❌ doctl not found. Install doctl first."
    echo "   Expected: /mnt/c/Users/SaroshHussain/AppData/Local/Microsoft/WinGet/Links/doctl.exe"
    echo "   Run: winget install DigitalOcean.doctl"
    exit 1
  fi
fi

# Check authentication
if ! $DOCTL_CMD auth list >/dev/null 2>&1; then
  echo "❌ doctl not authenticated. Run: $DOCTL_CMD auth init"
  exit 1
fi

echo "✅ doctl configured and authenticated"
echo ""

# Function to get app ID by slug
get_app_id() {
  local app_slug="$1"
  $DOCTL_CMD apps list --format ID,Spec.Name --no-header 2>/dev/null | \
    awk -v slug="$app_slug" 'tolower($2) == tolower(slug) {print $1; exit}'
}

# Function to get app's default .ondigitalocean.app domain
get_app_default_domain() {
  local app_id="$1"
  $DOCTL_CMD apps get "$app_id" --format Spec.Domains --no-header 2>/dev/null | \
    grep -oE '[a-z0-9-]+\.ondigitalocean\.app' | head -n1
}

# Function to check if DNS record exists
record_exists() {
  local record_name="$1"
  local record_type="$2"
  $DOCTL_CMD compute domain records list "$DOMAIN" --format Name,Type --no-header 2>/dev/null | \
    grep -q "^${record_name}[[:space:]]*${record_type}$" || return 1
}

# Function to get DNS record ID
get_record_id() {
  local record_name="$1"
  local record_type="$2"
  $DOCTL_CMD compute domain records list "$DOMAIN" --format ID,Name,Type --no-header 2>/dev/null | \
    grep "^[0-9]*[[:space:]]*${record_name}[[:space:]]*${record_type}$" | awk '{print $1}' | head -n1
}

# Function to create or update CNAME record
create_or_update_cname() {
  local record_name="$1"
  local target_domain="$2"
  local record_id
  
  if record_exists "$record_name" "CNAME"; then
    record_id=$(get_record_id "$record_name" "CNAME")
    if [ -n "$record_id" ]; then
      echo "   🔄 Updating existing CNAME: $record_name -> $target_domain"
      $DOCTL_CMD compute domain records update "$DOMAIN" "$record_id" \
        --record-name "$record_name" \
        --record-type CNAME \
        --record-data "$target_domain" \
        --force 2>/dev/null
      return $?
    fi
  else
    echo "   ➕ Creating CNAME: $record_name -> $target_domain"
    $DOCTL_CMD compute domain records create "$DOMAIN" \
      --record-type CNAME \
      --record-name "$record_name" \
      --record-data "$target_domain" 2>/dev/null
    return $?
  fi
}

# Get app ID
echo "🔍 Looking up App Platform app: $APP_SLUG"
APP_ID=$(get_app_id "$APP_SLUG")
if [ -z "$APP_ID" ]; then
  echo "❌ App '$APP_SLUG' not found in App Platform."
  echo ""
  echo "💡 Deploy the app first:"
  echo "   bash scripts/bootstrap-app.sh"
  exit 1
fi

echo "   ✅ Found app ID: $APP_ID"
echo ""

# Get app's default .ondigitalocean.app domain
echo "📡 Getting app's default domain..."
APP_DEFAULT_DOMAIN=$(get_app_default_domain "$APP_ID")
if [ -z "$APP_DEFAULT_DOMAIN" ]; then
  echo "❌ Could not determine app's default domain."
  echo "   The app may still be deploying. Wait a few minutes and try again."
  exit 1
fi

echo "   ✅ App Platform domain: $APP_DEFAULT_DOMAIN"
echo ""

# Create/update frontend CNAME
echo "🌐 Setting up frontend DNS: $FRONTEND_SUBDOMAIN"
if create_or_update_cname "$FRONTEND_RECORD_NAME" "$APP_DEFAULT_DOMAIN"; then
  echo "   ✅ Frontend DNS configured"
else
  echo "   ❌ Failed to configure frontend DNS"
  exit 1
fi

echo ""

# Create/update backend CNAME
echo "🌐 Setting up backend DNS: $BACKEND_SUBDOMAIN"
if create_or_update_cname "$BACKEND_RECORD_NAME" "$APP_DEFAULT_DOMAIN"; then
  echo "   ✅ Backend DNS configured"
else
  echo "   ❌ Failed to configure backend DNS"
  exit 1
fi

echo ""
echo "=========================================="
echo "✅ DNS SETUP COMPLETE"
echo "=========================================="
echo ""
echo "Your app is now accessible at:"
echo "  • Frontend: https://$FRONTEND_SUBDOMAIN"
echo "  • API: https://$BACKEND_SUBDOMAIN"
echo "  • API Docs: https://$BACKEND_SUBDOMAIN/docs"
echo "  • Health: https://$BACKEND_SUBDOMAIN/health"
echo ""
echo "⏳ DNS propagation may take a few minutes."
echo "   You can verify with: dig $FRONTEND_SUBDOMAIN"
echo ""
