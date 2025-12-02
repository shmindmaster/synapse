$ErrorActionPreference = "Stop"

# Configuration
$AppName = "swa-synapse-web"
$ResourceGroup = "rg-shared-web"
$FrontendPath = "."
$BuildCmd = "pnpm build" # Default, may need adjustment
$DistDir = "dist" # Default

Write-Host "--- Deploying Frontend (SWA): $AppName ---" -ForegroundColor Cyan

# 1. Login
try { az account show | Out-Null } catch { az login | Out-Null }

# 2. Build
Push-Location $FrontendPath
try {
    if (Test-Path "pnpm-lock.yaml") {
        Write-Host "Installing dependencies..."
        pnpm install
        Write-Host "Building..."
        Invoke-Expression $BuildCmd
    } elseif (Test-Path "package-lock.json") {
        Write-Host "Installing dependencies..."
        npm install
        Write-Host "Building..."
        npm run build
    } else {
        Write-Host "No package manager lockfile found. Assuming npm..."
        npm install
        npm run build
    }
} finally {
    Pop-Location
}

# 3. Deploy
$DistPath = Join-Path $FrontendPath $DistDir
# Special case for Next.js static export 'out'
if (-not (Test-Path $DistPath) -and (Test-Path (Join-Path $FrontendPath "out"))) {
    $DistPath = Join-Path $FrontendPath "out"
}

if (-not (Test-Path $DistPath)) { throw "Dist directory '$DistPath' not found. Build may have failed or output dir is different." }

Write-Host "Retrieving deployment token..."
$token = az staticwebapp secrets list --name $AppName --resource-group $ResourceGroup --query "properties.apiKey" -o tsv 2>$null

if (-not $token) {
    Write-Host "SWA '$AppName' not found. Please ensure it is created in '$ResourceGroup'."
    exit 1
}

if (-not (Get-Command "swa" -ErrorAction SilentlyContinue)) {
    Write-Host "Installing SWA CLI..."
    npm install -g @azure/static-web-apps-cli
}

Write-Host "Deploying to SWA..."
swa deploy $DistPath --deployment-token $token --app-name $AppName --env production

Write-Host "Frontend Deployment Complete!" -ForegroundColor Green

