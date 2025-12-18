#!/bin/bash
set -e

# ==========================================
# BOOTSTRAP APP PLATFORM APP (v10.0)
# ==========================================
# One-time App Platform app creation script
# Run this once per repository to create the App Platform app
# This script is self-contained and handles Windows/Git Bash paths
#
# Idempotency: YES - Safe to run multiple times
# - Checks if app exists before creating
# - Updates existing app if found (no duplicates created)
# - Safe to re-run after app creation or configuration changes

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
REPO_ROOT="$(cd "$SCRIPT_DIR/.." && pwd)"
cd "$REPO_ROOT"

# Auto-detect app slug from directory name
APP_SLUG=$(basename "$REPO_ROOT")

echo "=========================================="
echo "🚀 BOOTSTRAP APP PLATFORM APP"
echo "   App: $APP_SLUG"
echo "=========================================="
echo ""

# Verify doctl - handle Windows paths
DOCTL_CMD="doctl"
if ! command -v doctl &> /dev/null; then
  # Try Windows-specific paths - check /mnt/c first (WSL/Git Bash standard)
  if [ -f "/mnt/c/Users/SaroshHussain/AppData/Local/Microsoft/WinGet/Links/doctl.exe" ]; then
    DOCTL_CMD="/mnt/c/Users/SaroshHussain/AppData/Local/Microsoft/WinGet/Links/doctl.exe"
  else
    if [[ -n "$WINDIR" ]] || [[ "$OSTYPE" == "msys" ]] || [[ "$OSTYPE" == "cygwin" ]]; then
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
    
    # If still not found, try PowerShell detection
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

# Check for app.yaml
if [ ! -f "app.yaml" ]; then
  echo "❌ app.yaml not found in repository root"
  echo "   This repository needs to be standardized first."
  echo "   Contact platform team or run standardization script."
  exit 1
fi

echo "✅ app.yaml found"
echo ""

# Check if app already exists
APP_ID=$($DOCTL_CMD apps list --format ID,Spec.Name --no-header 2>/dev/null | grep "[[:space:]]*${APP_SLUG}$" | awk '{print $1}' | head -1)

if [ -n "$APP_ID" ]; then
  echo "⚠️  App Platform app already exists (ID: $APP_ID)"
  echo "   Updating with current app.yaml..."
  if $DOCTL_CMD apps update "$APP_ID" --spec app.yaml; then
    echo "✅ App updated successfully"
    echo ""
    echo "📋 App Details:"
    echo "   ID: $APP_ID"
    echo "   Name: $APP_SLUG"
    echo "   Dashboard: https://cloud.digitalocean.com/apps/$APP_ID"
    exit 0
  else
    echo "❌ Failed to update app"
    exit 1
  fi
fi

# Create new app
echo "Creating new App Platform app..."
if $DOCTL_CMD apps create --spec app.yaml; then
  echo "✅ App created successfully"
  echo ""
  
  # Get the new app ID
  APP_ID=$($DOCTL_CMD apps list --format ID,Spec.Name --no-header 2>/dev/null | grep "[[:space:]]*${APP_SLUG}$" | awk '{print $1}' | head -1)
  
  if [ -n "$APP_ID" ]; then
    echo "📋 App Details:"
    echo "   ID: $APP_ID"
    echo "   Name: $APP_SLUG"
    echo "   Dashboard: https://cloud.digitalocean.com/apps/$APP_ID"
    echo ""
    echo "💡 Next Steps:"
    echo "   1. App Platform will automatically deploy on next git push to main"
    echo "   2. Sync secrets: bash scripts/sync-secrets.sh"
    echo "   3. View logs: $DOCTL_CMD apps logs $APP_ID --follow"
  fi
  exit 0
else
  echo "❌ Failed to create app"
  echo "   Check app.yaml for errors"
  exit 1
fi
