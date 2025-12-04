# deploy-app.ps1
# Deploy a new full-stack application to DigitalOcean App Platform
# Usage: .\scripts\deploy-app.ps1 -AppSlug myapp -GitRepo owner/repo

param(
  [Parameter(Mandatory = $true)]
  [string]$AppSlug,

  [Parameter(Mandatory = $true)]
  [string]$GitRepo,

  [Parameter(Mandatory = $false)]
  [string]$GitBranch = "main",

  [Parameter(Mandatory = $false)]
  [string]$GitToken = $env:GITHUB_TOKEN,

  [Parameter(Mandatory = $false)]
  [string]$DoRegion = "nyc3",

  [Parameter(Mandatory = $false)]
  [string]$AppDomainBase = "shtrial.com",

  [Parameter(Mandatory = $false)]
  [string]$DoToken = $env:DIGITALOCEAN_TOKEN,

  [Parameter(Mandatory = $false)]
  [string]$TemplateFile = "do-app-spec.template.yaml"
)

# Load environment from .env.shared
function Load-EnvFile {
  param([string]$FilePath)
  if (!(Test-Path $FilePath)) {
    Write-Error "Environment file not found: $FilePath"
    exit 1
  }
  $content = Get-Content $FilePath
  $env_vars = @{}
  foreach ($line in $content) {
    if ($line -match '^\s*#' -or [string]::IsNullOrWhiteSpace($line)) { continue }
    if ($line -match '^\s*export\s+(\w+)=(.*)') {
      $key = $matches[1]
      $value = $matches[2] -replace '^["\'] | ["\']$', ''
            $env_vars[$key] = $value
        }
        elseif ($line -match '^(\w+)=(.*)') {
            $key = $matches[1]
            $value = $matches[2] -replace '^["\']|["\']$', ''
            $env_vars[$key] = $value
        }
    }
    return $env_vars
}

Write-Host "=== DigitalOcean App Platform Deployment ===" -ForegroundColor Cyan
Write-Host ""

# Validate inputs
if (!$GitToken) {
    Write-Error "GitHub token not provided. Set GITHUB_TOKEN env var or pass -GitToken"
    exit 1
}

if (!$DoToken) {
    Write-Error "DigitalOcean token not provided. Set DIGITALOCEAN_TOKEN env var or pass -DoToken"
    exit 1
}

if (!(Test-Path $TemplateFile)) {
    Write-Error "Template file not found: $TemplateFile"
    exit 1
}

Write-Host "Loading configuration..." -ForegroundColor Yellow
$env_vars = Load-EnvFile ".env.shared"

# Get database URL
$db_url = $env_vars['DATABASE_URL'] ?? $env:DATABASE_URL
$db_private_url = $env_vars['DO_DATABASE_URL_PRIVATE'] ?? $env:DO_DATABASE_URL_PRIVATE
$spaces_bucket = $env_vars['DO_SPACES_BUCKET'] ?? "sh-storage"
$spaces_endpoint = $env_vars['DO_SPACES_ENDPOINT'] ?? "https://nyc3.digitaloceanspaces.com"
$spaces_region = $env_vars['DO_SPACES_REGION'] ?? "nyc3"
$spaces_key = $env_vars['DO_SPACES_KEY'] ?? $env:DO_SPACES_KEY
$spaces_secret = $env_vars['DO_SPACES_SECRET'] ?? $env:DO_SPACES_SECRET
$inference_endpoint = $env_vars['DIGITALOCEAN_INFERENCE_ENDPOINT'] ?? "https://inference.do-ai.run/v1"
$inference_key = $env_vars['DIGITALOCEAN_MODEL_KEY'] ?? $env:DIGITALOCEAN_MODEL_KEY
$ai_model = $env_vars['AI_MODEL'] ?? "llama-3.1-70b-instruct"

# Read template
Write-Host "Reading template: $TemplateFile" -ForegroundColor Yellow
$template = Get-Content $TemplateFile -Raw

# Build replacement map
$replacements = @{
    '${APP_SLUG}'                           = $AppSlug
    '${DO_REGION}'                          = $DoRegion
    '${APP_DOMAIN_BASE}'                    = $AppDomainBase
    '${DATABASE_URL}'                       = $db_url
    '${DO_DATABASE_URL_PRIVATE}'            = $db_private_url
    '${DO_SPACES_BUCKET}'                   = $spaces_bucket
    '${DO_SPACES_ENDPOINT}'                 = $spaces_endpoint
    '${DO_SPACES_REGION}'                   = $spaces_region
    '${DO_SPACES_KEY}'                      = $spaces_key
    '${DO_SPACES_SECRET}'                   = $spaces_secret
    '${NEXT_PUBLIC_CDN_BASE_URL}'           = "https://$spaces_bucket.$spaces_region.cdn.digitaloceanspaces.com/$AppSlug"
    '${APP_STORAGE_PREFIX}'                 = $AppSlug
    '${DIGITALOCEAN_INFERENCE_ENDPOINT}'    = $inference_endpoint
    '${DIGITALOCEAN_MODEL_KEY}'             = $inference_key
    '${AI_MODEL}'                           = $ai_model
    '${GITHUB_TOKEN}'                       = $GitToken
    '${GITHUB_ACCOUNT}'                     = $GitRepo.Split('/')[0]
    '${GITHUB_REPO}'                        = $GitRepo.Split('/')[1]
}

# Apply replacements
$spec = $template
foreach ($key in $replacements.Keys) {
    $spec = $spec -replace [regex]::Escape($key), $replacements[$key]
}

# Output generated spec
$output_file = "do-app-spec.$AppSlug.yaml"
Write-Host "Generating spec: $output_file" -ForegroundColor Yellow
$spec | Out-File $output_file -Encoding UTF8

Write-Host ""
Write-Host "Generated App Spec:" -ForegroundColor Green
Write-Host "===================" -ForegroundColor Green
$spec | Select-Object -First 50
Write-Host "... (spec saved to $output_file)" -ForegroundColor Green
Write-Host ""

# Deploy using doctl
Write-Host "Deploying to DigitalOcean App Platform..." -ForegroundColor Yellow
Write-Host "Command: doctl apps create --spec $output_file --format ID,DefaultIngress,Created" -ForegroundColor Cyan

try {
    $result = & doctl apps create --spec $output_file --format ID,DefaultIngress,Created 2>&1
    if ($LASTEXITCODE -ne 0) {
        Write-Error "Deployment failed: $result"
        exit 1
    }
    Write-Host $result -ForegroundColor Green
}
catch {
    Write-Error "Failed to run doctl command: $_"
    Write-Host "Make sure doctl is installed and authenticated" -ForegroundColor Yellow
    Write-Host "See: https://docs.digitalocean.com/reference/doctl/how-to/install/" -ForegroundColor Yellow
    exit 1
}

Write-Host ""
Write-Host "=== DEPLOYMENT COMPLETE ===" -ForegroundColor Green
Write-Host ""
Write-Host "Next steps:" -ForegroundColor Yellow
Write-Host "  1. DNS is managed by DigitalOcean (automatic via app spec zone setting)" -ForegroundColor Cyan
Write-Host "     - Records for $AppSlug.$AppDomainBase and api.$AppSlug.$AppDomainBase are auto-configured"
Write-Host ""
Write-Host "  2. Verify DNS (wait 2-5 minutes):" -ForegroundColor Cyan
Write-Host "     - nslookup $AppSlug.$AppDomainBase"
Write-Host "     - nslookup api.$AppSlug.$AppDomainBase"
Write-Host ""
Write-Host "  3. Access your app:" -ForegroundColor Cyan
Write-Host "     - Frontend: https://$AppSlug.$AppDomainBase"
Write-Host "     - Backend:  https://api.$AppSlug.$AppDomainBase"
Write-Host "     - Docs:     https://api.$AppSlug.$AppDomainBase/docs"
Write-Host "     - OpenAPI:  https://api.$AppSlug.$AppDomainBase/openapi.json"
Write-Host ""
