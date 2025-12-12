#!/usr/bin/env pwsh
# ============================================================================
# Deploy synapse to DigitalOcean Kubernetes
# ============================================================================

Set-StrictMode -Version Latest
$ErrorActionPreference = "Stop"

# Fixed values
$APP_SLUG = "synapse"
$REGISTRY = "registry.digitalocean.com/shtrial-reg"
$CLUSTER_NAME = "sh-demo-cluster"

Write-Host "============================================================================" -ForegroundColor Cyan
Write-Host "Deploying $APP_SLUG to $CLUSTER_NAME" -ForegroundColor Cyan
Write-Host "============================================================================" -ForegroundColor Cyan

# Verify naming compliance
Write-Host "
Verifying naming compliance..." -ForegroundColor Yellow

$frontendImage = "${REGISTRY}/${APP_SLUG}-frontend:latest"
$backendImage = "${REGISTRY}/${APP_SLUG}-backend:latest"

Write-Host "  Frontend image: $frontendImage" -ForegroundColor Gray
Write-Host "  Backend image: $backendImage" -ForegroundColor Gray

# Build and push images
Write-Host "
Building and pushing images..." -ForegroundColor Yellow

Push-Location (Join-Path $PSScriptRoot ".." "apps" "frontend")
docker build -t $frontendImage .
if ($LASTEXITCODE -ne 0) { throw "Frontend build failed" }
docker push $frontendImage
if ($LASTEXITCODE -ne 0) { throw "Frontend push failed" }
Pop-Location

Push-Location (Join-Path $PSScriptRoot ".." "apps" "backend")
docker build -t $backendImage .
if ($LASTEXITCODE -ne 0) { throw "Backend build failed" }
docker push $backendImage
if ($LASTEXITCODE -ne 0) { throw "Backend push failed" }
Pop-Location

Write-Host "✓ Images built and pushed" -ForegroundColor Green

# Create namespace if needed
Write-Host "
Creating namespace..." -ForegroundColor Yellow
kubectl create namespace $APP_SLUG --dry-run=client -o yaml | kubectl apply -f -

# Apply manifests
Write-Host "
Applying Kubernetes manifests..." -ForegroundColor Yellow
kubectl apply -f (Join-Path $PSScriptRoot ".." "k8s")

# Wait for certificate (first deployment)
Write-Host "
Waiting for certificate..." -ForegroundColor Yellow
Write-Host "  Note: First deployment takes 60-120s for cert-manager to issue certificate" -ForegroundColor Gray

$maxWait = 120
$waited = 0
while ($waited -lt $maxWait) {
    $certReady = kubectl get certificate wildcard-shtrial-tls -n $APP_SLUG -o jsonpath='{.status.conditions[?(@.type=="Ready")].status}' 2>$null
    if ($certReady -eq "True") {
        Write-Host "✓ Certificate ready" -ForegroundColor Green
        break
    }
    Start-Sleep -Seconds 5
    $waited += 5
    Write-Host "  Waiting... ($waited/$maxWait seconds)" -ForegroundColor Gray
}

# Wait for rollout
Write-Host "
Waiting for deployments..." -ForegroundColor Yellow
kubectl rollout status deployment/${APP_SLUG}-frontend -n $APP_SLUG --timeout=300s
kubectl rollout status deployment/${APP_SLUG}-backend -n $APP_SLUG --timeout=300s

Write-Host "
============================================================================" -ForegroundColor Cyan
Write-Host "Deployment Complete!" -ForegroundColor Green
Write-Host "============================================================================" -ForegroundColor Cyan

Write-Host "
Deployed Resources:" -ForegroundColor Yellow
Write-Host "  Images:" -ForegroundColor Gray
Write-Host "    - $frontendImage" -ForegroundColor White
Write-Host "    - $backendImage" -ForegroundColor White
Write-Host "
  Kubernetes:" -ForegroundColor Gray
Write-Host "    - Namespace: $APP_SLUG" -ForegroundColor White
Write-Host "    - Deployments: ${APP_SLUG}-frontend, ${APP_SLUG}-backend" -ForegroundColor White
Write-Host "    - Services: ${APP_SLUG}-frontend, ${APP_SLUG}-backend" -ForegroundColor White
Write-Host "    - Ingress: ${APP_SLUG}-ingress" -ForegroundColor White
Write-Host "
  URLs:" -ForegroundColor Gray
Write-Host "    - Frontend: https://${APP_SLUG}.shtrial.com" -ForegroundColor White
Write-Host "    - Backend: https://api-${APP_SLUG}.shtrial.com" -ForegroundColor White
Write-Host "
  Sentry Projects (Sarosh org):" -ForegroundColor Gray
Write-Host "    - ${APP_SLUG}-frontend" -ForegroundColor White
Write-Host "    - ${APP_SLUG}-backend" -ForegroundColor White

Write-Host "
✓ Deployment successful!" -ForegroundColor Green
