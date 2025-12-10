#!/usr/bin/env pwsh
# Docker Build and Push Script for Synapse

Write-Host "Loading configuration..." -ForegroundColor Cyan
$envFile = ".env.shared"
if (!(Test-Path $envFile)) { 
    Write-Host "ERROR: $envFile not found" -ForegroundColor Red
    exit 1 
}

# Parse .env.shared
Get-Content $envFile | ForEach-Object {
    if ($_ -match '^([^=]+)=(.*)$') { 
        [Environment]::SetEnvironmentVariable($matches[1], $matches[2], 'Process') 
    }
}

$APP_SLUG = [Environment]::GetEnvironmentVariable('APP_SLUG')
$DO_REGISTRY_URL = [Environment]::GetEnvironmentVariable('DO_REGISTRY_URL')

Write-Host "Configuration loaded:" -ForegroundColor Green
Write-Host "  APP_SLUG: $APP_SLUG"
Write-Host "  DO_REGISTRY_URL: $DO_REGISTRY_URL"

# Build Backend
Write-Host "`nBuilding backend image..." -ForegroundColor Cyan
$backendImage = "$DO_REGISTRY_URL/$APP_SLUG-api:latest"
docker build -t $backendImage -f apps/backend/Dockerfile .
if ($LASTEXITCODE -ne 0) { 
    Write-Host "ERROR: Backend build failed" -ForegroundColor Red
    exit 1 
}
Write-Host "✓ Backend image built: $backendImage" -ForegroundColor Green

# Build Frontend
Write-Host "`nBuilding frontend image..." -ForegroundColor Cyan
$frontendImage = "$DO_REGISTRY_URL/$APP_SLUG-web:latest"
docker build -t $frontendImage -f apps/frontend/Dockerfile .
if ($LASTEXITCODE -ne 0) { 
    Write-Host "ERROR: Frontend build failed" -ForegroundColor Red
    exit 1 
}
Write-Host "✓ Frontend image built: $frontendImage" -ForegroundColor Green

# Push Backend
Write-Host "`nPushing backend image..." -ForegroundColor Cyan
docker push $backendImage
if ($LASTEXITCODE -ne 0) { 
    Write-Host "ERROR: Backend push failed" -ForegroundColor Red
    exit 1 
}
Write-Host "✓ Backend image pushed" -ForegroundColor Green

# Push Frontend
Write-Host "`nPushing frontend image..." -ForegroundColor Cyan
docker push $frontendImage
if ($LASTEXITCODE -ne 0) { 
    Write-Host "ERROR: Frontend push failed" -ForegroundColor Red
    exit 1 
}
Write-Host "✓ Frontend image pushed" -ForegroundColor Green

Write-Host "`n✅ All images built and pushed successfully" -ForegroundColor Green
