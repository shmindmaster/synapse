$ErrorActionPreference = "Stop"
Write-Host "Starting Full Stack Deployment..." -ForegroundColor Magenta

if (Test-Path "./deploy-backend.ps1") {
    ./deploy-backend.ps1
}

if (Test-Path "./deploy-frontend.ps1") {
    ./deploy-frontend.ps1
}

Write-Host "Full Stack Deployment Complete!" -ForegroundColor Green

