$ErrorActionPreference = "Stop"

# Configuration
$AppName = "ca-synapse-api"
$ResourceGroup = "rg-shared-container-apps"
$ContainerAppEnv = "cae-shared-apps-prod"
$AcrName = "acrsharedapps"
$ImageName = "synapse-api"
$BackendPath = "."

Write-Host "--- Deploying Backend: $AppName ---" -ForegroundColor Cyan

# 1. Login to Azure
try { az account show | Out-Null } catch { az login | Out-Null }

# 2. Login to ACR
Write-Host "Logging into ACR $AcrName..."
az acr login --name $AcrName

# 3. Build Docker Image
$AcrServer = "$AcrName.azurecr.io"
$FullImage = "$AcrServer/$ImageName`:$((Get-Date).ToString('yyyyMMddHHmm'))"
$LatestImage = "$AcrServer/$ImageName`:latest"

Write-Host "Building Docker image $FullImage..."

# Determine Dockerfile
$Dockerfile = "Dockerfile"
if (Test-Path "Dockerfile.prod") { $Dockerfile = "Dockerfile.prod" }
elseif (Test-Path "Dockerfile.production") { $Dockerfile = "Dockerfile.production" }

if (-not (Test-Path $Dockerfile)) { throw "Dockerfile not found at $Dockerfile" }

docker build -f $Dockerfile -t $FullImage -t $LatestImage .

# 4. Push Image
Write-Host "Pushing image to ACR..."
docker push $FullImage
docker push $LatestImage

# 5. Deploy Container App
Write-Host "Deploying Container App $AppName..."

# Check existence
$exists = az containerapp show --name $AppName --resource-group $ResourceGroup --query "id" -o tsv 2>$null

if ($exists) {
    Write-Host "Updating existing app..."
    az containerapp update `
        --name $AppName `
        --resource-group $ResourceGroup `
        --image $FullImage `
        --cpu 0.25 --memory 0.5Gi `
        --min-replicas 0 --max-replicas 3 `
        --query "properties.configuration.ingress.fqdn"
} else {
    Write-Host "Creating new app..."
    az containerapp create `
        --name $AppName `
        --resource-group $ResourceGroup `
        --environment $ContainerAppEnv `
        --image $FullImage `
        --target-port 3001 `
        --ingress external `
        --cpu 0.25 --memory 0.5Gi `
        --min-replicas 0 --max-replicas 3 `
        --query "properties.configuration.ingress.fqdn"
}

Write-Host "Backend Deployment Complete!" -ForegroundColor Green

