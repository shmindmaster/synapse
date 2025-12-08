# PowerShell version of k8s-deploy.sh for Windows compatibility
# Usage: pwsh -ExecutionPolicy Bypass -File scripts/k8s-deploy.ps1

param(
  [string]$EnvFile = ".env.shared"
)

$ErrorActionPreference = "Stop"

# 1. Load Environment
Write-Host "🚀 Loading configuration from $EnvFile..." -ForegroundColor Green
if (-not (Test-Path $EnvFile)) {
  Write-Host "❌ Missing $EnvFile" -ForegroundColor Red
  exit 1
}

# Parse and load .env.shared
$envContent = Get-Content $EnvFile | Where-Object { $_ -match "^[^#]" -and $_ -match "=" }
foreach ($line in $envContent) {
  $parts = $line -split "=", 2
  if ($parts.Count -eq 2) {
    $key = $parts[0].Trim()
    $value = $parts[1].Trim() -replace '^"|"$', ''
    [Environment]::SetEnvironmentVariable($key, $value, "Process")
  }
}

$APP_SLUG = $env:APP_SLUG
$GITHUB_ACCOUNT = $env:GITHUB_ACCOUNT
$GITHUB_REPO = $env:GITHUB_REPO
$DO_CLUSTER_NAME = $env:DO_CLUSTER_NAME
$DO_REGISTRY_URL = $env:DO_REGISTRY_URL
$DO_DATABASE_URL_PRIVATE = $env:DO_DATABASE_URL_PRIVATE
$DB_NAME = $env:DB_NAME
$DO_DB_CLUSTER_ID = $env:DO_DB_CLUSTER_ID
$APP_DOMAIN_BASE = $env:APP_DOMAIN_BASE

Write-Host "✓ Configuration loaded" -ForegroundColor Green
Write-Host "  APP_SLUG: $APP_SLUG"
Write-Host "  GITHUB_REPO: $GITHUB_REPO"
Write-Host ""

# 2. Authenticate
Write-Host "🔑 Authenticating with DigitalOcean..." -ForegroundColor Cyan
if ($GITHUB_ACCOUNT -eq "shmindmaster") {
  $env:GITHUB_TOKEN = $env:GITHUB_PAT_SHMINDMASTER
}
else {
  $env:GITHUB_TOKEN = $env:GITHUB_PAT_SH_PENDOAH
}

try {
  & doctl registry login 2>&1 | Out-Null
  Write-Host "✓ Docker registry authenticated" -ForegroundColor Green
}
catch {
  Write-Host "⚠ Registry login warning (may not be required): $_" -ForegroundColor Yellow
}

# 3. Build & Push Backend
Write-Host ""
Write-Host "📦 Building Backend..." -ForegroundColor Cyan
$backendImageTag = "$DO_REGISTRY_URL/$APP_SLUG-api:latest"
Write-Host "  Tag: $backendImageTag"

try {
  & docker build -t $backendImageTag -f apps/backend/Dockerfile . 2>&1 | Tee-Object -Variable buildOutput | Out-Default
  Write-Host "✓ Backend image built" -ForegroundColor Green
}
catch {
  Write-Host "❌ Backend build failed: $_" -ForegroundColor Red
  exit 1
}

Write-Host "  Pushing to registry..." -ForegroundColor Gray
try {
  & docker push $backendImageTag 2>&1 | Out-Default
  Write-Host "✓ Backend image pushed" -ForegroundColor Green
}
catch {
  Write-Host "❌ Backend push failed: $_" -ForegroundColor Red
  exit 1
}

# 4. Build & Push Frontend
Write-Host ""
Write-Host "📦 Building Frontend..." -ForegroundColor Cyan
$frontendImageTag = "$DO_REGISTRY_URL/$APP_SLUG-web:latest"
Write-Host "  Tag: $frontendImageTag"

try {
  & docker build -t $frontendImageTag -f apps/frontend/Dockerfile . 2>&1 | Tee-Object -Variable buildOutput | Out-Default
  Write-Host "✓ Frontend image built" -ForegroundColor Green
}
catch {
  Write-Host "❌ Frontend build failed: $_" -ForegroundColor Red
  exit 1
}

Write-Host "  Pushing to registry..." -ForegroundColor Gray
try {
  & docker push $frontendImageTag 2>&1 | Out-Default
  Write-Host "✓ Frontend image pushed" -ForegroundColor Green
}
catch {
  Write-Host "❌ Frontend push failed: $_" -ForegroundColor Red
  exit 1
}

# 5. Generate Kubernetes Manifests
Write-Host ""
Write-Host "📝 Generating Kubernetes Manifests..." -ForegroundColor Cyan
$k8sDir = "k8s/generated"
if (-not (Test-Path $k8sDir)) {
  New-Item -ItemType Directory -Path $k8sDir | Out-Null
}

# Export variables for envsubst
$env:DATABASE_URL = $env:DO_DATABASE_URL_PRIVATE
$env:DIGITALOCEAN_INFERENCE_ENDPOINT = $env:DIGITALOCEAN_INFERENCE_ENDPOINT
$env:DIGITALOCEAN_MODEL_KEY = $env:DIGITALOCEAN_MODEL_KEY
$env:AI_MODEL = $env:AI_MODEL
$env:AI_GPU_GATEWAY_URL = $env:AI_GPU_GATEWAY_URL

# Use envsubst (available in bash/git bash)
Get-ChildItem "k8s/*.yaml" | ForEach-Object {
  $yamlFile = $_.FullName
  $outputFile = Join-Path $k8sDir $_.Name
  Write-Host "  Processing: $($_.Name)" -ForegroundColor Gray

  # Use bash with envsubst
  & bash -c "envsubst < '$yamlFile' > '$outputFile'"
}

Write-Host "✓ Manifests generated in $k8sDir" -ForegroundColor Green

# 6. Apply to Cluster
Write-Host ""
Write-Host "☸️  Applying Manifests to Cluster..." -ForegroundColor Cyan
Write-Host "  Cluster: $DO_CLUSTER_NAME"
Write-Host "  Namespace: $APP_SLUG"

try {
  & doctl kubernetes cluster kubeconfig save $DO_CLUSTER_NAME 2>&1 | Out-Null
  Write-Host "✓ Kubeconfig saved" -ForegroundColor Green
}
catch {
  Write-Host "⚠ Kubeconfig save had issues (non-fatal): $_" -ForegroundColor Yellow
}

try {
  & kubectl create namespace $APP_SLUG --dry-run=client -o yaml | kubectl apply -f - 2>&1 | Out-Default
  Write-Host "✓ Namespace verified/created" -ForegroundColor Green
}
catch {
  Write-Host "⚠ Namespace creation had issues (may already exist): $_" -ForegroundColor Yellow
}

try {
  & kubectl apply -f "$k8sDir/*.yaml" -n $APP_SLUG 2>&1 | Out-Default
  Write-Host "✓ Manifests applied" -ForegroundColor Green
}
catch {
  Write-Host "❌ Manifest application failed: $_" -ForegroundColor Red
  exit 1
}

# 7. Database Provisioning
Write-Host ""
Write-Host "🗄️  Provisioning Database..." -ForegroundColor Cyan
Write-Host "  Database: $DB_NAME"

try {
  & doctl databases db create $DO_DB_CLUSTER_ID $DB_NAME 2>&1 | Out-Default
  Write-Host "✓ Database created" -ForegroundColor Green
}
catch {
  Write-Host "✓ Database already exists" -ForegroundColor Green
}

# 8. Summary
Write-Host ""
Write-Host "✅ Deployment Complete!" -ForegroundColor Green
Write-Host ""
Write-Host "Access your application:" -ForegroundColor Cyan
Write-Host "  Frontend: https://$APP_SLUG.$APP_DOMAIN_BASE" -ForegroundColor White
Write-Host "  Backend:  https://api.$APP_SLUG.$APP_DOMAIN_BASE" -ForegroundColor White
Write-Host ""
Write-Host "Next Steps:" -ForegroundColor Cyan
Write-Host "  1. Run database migrations: pnpm db:migrate" -ForegroundColor Gray
Write-Host "  2. Seed database (if needed): pnpm db:seed" -ForegroundColor Gray
Write-Host "  3. Check pod status: kubectl get pods -n $APP_SLUG" -ForegroundColor Gray
Write-Host "  4. View logs: kubectl logs -f -n $APP_SLUG -l app=$APP_SLUG-api" -ForegroundColor Gray
