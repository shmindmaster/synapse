# Deployment Issues & Solutions

## Current Blocking Issue: DigitalOcean Stuck on Old Commit

### Problem
The DigitalOcean App Platform deployment is stuck building from commit `753f840` (from Jan 2026) where Dockerfiles were located at:
- `apps/backend/Dockerfile`
- `apps/frontend/Dockerfile`

However, after the project restructure, Dockerfiles are now at:
- `src/api/Dockerfile`
- `src/web/Dockerfile`

The `app-spec.yaml` is correctly configured for the new structure, but DigitalOcean isn't fetching the latest commits.

### Root Cause
The app is using generic Git integration (`git: repo_clone_url`) instead of GitHub integration (`github: repo`), which means:
- No automatic deploys on push
- No automatic tracking of latest commits
- Manual deployments may cache old commit references

### Solutions

#### Option 1: Enable GitHub Integration (Recommended)
This requires UI access as it needs OAuth authorization:

1. Go to https://cloud.digitalocean.com/apps/6b9d6ca3-4164-406d-90e7-266626deb18a
2. Click "Settings" → "GitHub"
3. Authorize DigitalOcean to access `shmindmaster/synapse` repository
4. Update app spec to use:
   ```yaml
   github:
     repo: shmindmaster/synapse
     branch: main
     deploy_on_push: true
   ```
5. Save changes - this will trigger a new deployment from the latest commit

**Benefits:**
- Automatic deploys on every push to main
- Always uses latest commit
- Better CI/CD pipeline

#### Option 2: Manual Redeploy from UI
Simpler but requires manual intervention each time:

1. Go to https://cloud.digitalocean.com/apps/6b9d6ca3-4164-406d-90e7-266626deb18a
2. Click the "Deploy" dropdown → "Force Rebuild and Deploy"
3. This should fetch the latest commit from the repository

#### Option 3: Wait for Current Build to Complete
The current build (deployment ID: `7334e475-3c81-4a3f-8976-382a769fbd6e`) is likely to fail because commit `753f840` doesn't have Dockerfiles at the expected paths. After it fails:

1. The error will be visible in the UI
2. You can then manually trigger a new deployment which might pick up the latest commit

### Verification
Once deployed successfully from the latest commit (`1a03709` or later), verify:

```bash
# Check deployment status
doctl apps list

# Test the site
curl -I https://synapse.shtrial.com
curl https://synapse.shtrial.com/api/health

# Check which commit is deployed
doctl apps get 6b9d6ca3-4164-406d-90e7-266626deb18a --format json | jq '.active_deployment.services[].source_commit_hash'
```

Should show: `46d22b7` or `1a03709` or later (not `753f840`)

### Prevention
Once GitHub integration is enabled, all future pushes to main will automatically deploy, preventing this issue.

---

## Historical Context

**Timeline:**
- Jan 2026: Project restructure moved files from `apps/` to `src/`
- Commit `753f840`: Last commit with `apps/` structure
- Commit `fa859f4`: First commit with `src/` structure
- Current: `app-spec.yaml` correctly points to `src/` paths
- Issue: DigitalOcean stuck on old commit before restructure

**Related Commits:**
- `fa859f4` - "refactor: enforce true project independence"
- `51ef023` - "feat: migrate database schema to new structure"
- Current HEAD: Multiple documentation and release preparation commits

---

## Quick Reference

**DigitalOcean App Details:**
- App ID: `6b9d6ca3-4164-406d-90e7-266626deb18a`
- App Name: `synapse`
- Domain: https://synapse.shtrial.com
- Region: NYC
- Current Issue: Stuck on commit `753f840`
- Target Commit: `46d22b7` or later

**CLI Commands for Deployment:**
```bash
# Update app spec
doctl apps update 6b9d6ca3-4164-406d-90e7-266626deb18a --spec app-spec.yaml

# Get deployment status
doctl apps get-deployment 6b9d6ca3-4164-406d-90e7-266626deb18a <deployment-id>

# View deployment logs
doctl apps logs 6b9d6ca3-4164-406d-90e7-266626deb18a --type build --follow
```

**MCP Tools Used:**
```javascript
// Check deployment status
mcp_do-apps_apps-get-deployment-status({ AppID: "6b9d6ca3-4164-406d-90e7-266626deb18a" })

// Get build logs
mcp_do-apps_apps-get-logs({
  AppID: "6b9d6ca3-4164-406d-90e7-266626deb18a",
  Component: "backend",
  DeploymentID: "<deployment-id>",
  LogType: "BUILD"
})
```
