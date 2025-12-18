#!/bin/bash
set -e

# ==========================================
# DEPLOY TO APP PLATFORM (v10.0)
# ==========================================
# Deploy this repository to App Platform
# This script updates the App Platform app with the current app.yaml
# Run this when you need to manually trigger a deployment or update config

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
REPO_ROOT="$(cd "$SCRIPT_DIR/.." && pwd)"
cd "$REPO_ROOT"

# Auto-detect app slug from directory name
APP_SLUG=$(basename "$REPO_ROOT")

echo "=========================================="
echo "🚀 DEPLOY TO APP PLATFORM"
echo "   App: $APP_SLUG"
echo "=========================================="
echo ""

# Verify doctl - handle Windows paths
DOCTL_CMD="doctl"
if ! command -v doctl &> /dev/null; then
  # Try Windows-specific paths - check /mnt/c first (WSL/Git Bash standard)
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

# Check for app.yaml
if [ ! -f "app.yaml" ]; then
  echo "❌ app.yaml not found in repository root"
  echo "   This repository needs to be standardized first."
  exit 1
fi

# Get app ID
APP_ID=$($DOCTL_CMD apps list --format ID,Spec.Name --no-header 2>/dev/null | grep "[[:space:]]*${APP_SLUG}$" | awk '{print $1}' | head -1)

if [ -z "$APP_ID" ]; then
  echo "⚠️  App Platform app not found for $APP_SLUG"
  echo "   Run 'bash scripts/bootstrap-app.sh' first to create the app"
  exit 1
fi

echo "✅ Found app: $APP_ID"
echo "   Updating with current app.yaml..."
echo ""

# Update app
if $DOCTL_CMD apps update "$APP_ID" --spec app.yaml; then
  echo "✅ App updated successfully"
  echo ""
  echo "📋 Deployment Info:"
  echo "   App ID: $APP_ID"
  echo "   Dashboard: https://cloud.digitalocean.com/apps/$APP_ID"
  echo ""
  echo "💡 Note: App Platform will automatically build and deploy on git push to main"
  echo "   To view logs: $DOCTL_CMD apps logs $APP_ID --follow"
  exit 0
else
  echo "❌ Failed to update app"
  echo "   Check app.yaml for errors"
  exit 1
fi
