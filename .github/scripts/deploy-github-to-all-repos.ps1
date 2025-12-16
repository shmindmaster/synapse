# Deploy .github Configuration to All SHTrial Platform Repos
# This script deletes existing .github folders and replaces them with the updated version

param(
    [switch]$WhatIf = $false
)

$sourceGithubDir = "H:\Repos\sh\.github"

# Define all target repositories
$targetRepos = @(
    # sh-pendoah repos
    "H:\Repos\sh\sh-pendoah\legalbots",
    "H:\Repos\sh\sh-pendoah\magiccommerce",
    "H:\Repos\sh\sh-pendoah\omniforge",
    "H:\Repos\sh\sh-pendoah\petdnaplus",
    "H:\Repos\sh\sh-pendoah\prismiq",
    "H:\Repos\sh\sh-pendoah\quantcoach",
    "H:\Repos\sh\sh-pendoah\serenemind",
    "H:\Repos\sh\sh-pendoah\flashmaster",
    
    # shmindmaster repos
    "H:\Repos\sh\shmindmaster\apexcoachai",
    "H:\Repos\sh\shmindmaster\aura",
    "H:\Repos\sh\shmindmaster\billigent",
    "H:\Repos\sh\shmindmaster\campgen",
    "H:\Repos\sh\shmindmaster\careaxis",
    "H:\Repos\sh\shmindmaster\careiq",
    "H:\Repos\sh\shmindmaster\cfoagent",
    "H:\Repos\sh\shmindmaster\comminsightsai",
    "H:\Repos\sh\shmindmaster\homeiq",
    "H:\Repos\sh\shmindmaster\lawli",
    "H:\Repos\sh\shmindmaster\ledgerlens",
    "H:\Repos\sh\shmindmaster\synapse",
    "H:\Repos\sh\shmindmaster\ummaconnect",
    "H:\Repos\sh\shmindmaster\voxops",
    "H:\Repos\sh\shmindmaster\warrantygains"
)

Write-Host "========================================" -ForegroundColor Cyan
Write-Host "SHTrial Platform .github Deployment" -ForegroundColor Cyan
Write-Host "========================================" -ForegroundColor Cyan
Write-Host ""
Write-Host "Source: $sourceGithubDir" -ForegroundColor Yellow
Write-Host "Target Repos: $($targetRepos.Count)" -ForegroundColor Yellow
if ($WhatIf) {
    Write-Host "MODE: DRY RUN (WhatIf)" -ForegroundColor Magenta
} else {
    Write-Host "MODE: LIVE DEPLOYMENT" -ForegroundColor Red
}
Write-Host ""

# Verify source directory exists
if (-not (Test-Path $sourceGithubDir)) {
    Write-Host "[FATAL] Source .github directory not found: $sourceGithubDir" -ForegroundColor Red
    exit 1
}

# Count files in source
$sourceFiles = Get-ChildItem $sourceGithubDir -Recurse -File
Write-Host "Source contains $($sourceFiles.Count) files" -ForegroundColor Gray
Write-Host ""

$successCount = 0
$errorCount = 0
$skippedCount = 0
$results = @()

foreach ($repoPath in $targetRepos) {
    $repoName = Split-Path $repoPath -Leaf
    $targetGithubDir = Join-Path $repoPath ".github"
    
    Write-Host "[$repoName]" -ForegroundColor Cyan -NoNewline
    
    # Check if repo exists
    if (-not (Test-Path $repoPath)) {
        Write-Host " REPO NOT FOUND - SKIPPED" -ForegroundColor Yellow
        $skippedCount++
        $results += [PSCustomObject]@{
            Repo = $repoName
            Status = "SKIPPED"
            Reason = "Repository directory not found"
        }
        continue
    }
    
    try {
        # Delete existing .github directory if it exists
        if (Test-Path $targetGithubDir) {
            if (-not $WhatIf) {
                Remove-Item -Path $targetGithubDir -Recurse -Force -ErrorAction Stop
            }
            Write-Host " [DELETED OLD]" -ForegroundColor Yellow -NoNewline
        }
        
        # Copy new .github directory
        if (-not $WhatIf) {
            Copy-Item -Path $sourceGithubDir -Destination $targetGithubDir -Recurse -Force -ErrorAction Stop
        }
        
        # Verify deployment
        if ($WhatIf -or (Test-Path $targetGithubDir)) {
            Write-Host " [DEPLOYED]" -ForegroundColor Green -NoNewline
            
            if (-not $WhatIf) {
                $deployedFiles = Get-ChildItem $targetGithubDir -Recurse -File
                Write-Host " ($($deployedFiles.Count) files)" -ForegroundColor Gray
            } else {
                Write-Host " (dry run)" -ForegroundColor Gray
            }
            
            $successCount++
            $results += [PSCustomObject]@{
                Repo = $repoName
                Status = "SUCCESS"
                Reason = "Deployed successfully"
            }
        } else {
            throw "Verification failed - .github directory not found after copy"
        }
    }
    catch {
        Write-Host " [ERROR] $($_.Exception.Message)" -ForegroundColor Red
        $errorCount++
        $results += [PSCustomObject]@{
            Repo = $repoName
            Status = "ERROR"
            Reason = $_.Exception.Message
        }
    }
}

Write-Host ""
Write-Host "========================================" -ForegroundColor Cyan
Write-Host "Deployment Summary" -ForegroundColor Cyan
Write-Host "========================================" -ForegroundColor Cyan
Write-Host ""
Write-Host "Total Repos:    $($targetRepos.Count)" -ForegroundColor White
Write-Host "Success:        $successCount" -ForegroundColor Green
Write-Host "Errors:         $errorCount" -ForegroundColor $(if ($errorCount -eq 0) { "Green" } else { "Red" })
Write-Host "Skipped:        $skippedCount" -ForegroundColor Yellow
Write-Host ""

if ($errorCount -gt 0) {
    Write-Host "Repos with errors:" -ForegroundColor Red
    $results | Where-Object { $_.Status -eq "ERROR" } | ForEach-Object {
        Write-Host "  - $($_.Repo): $($_.Reason)" -ForegroundColor Red
    }
    Write-Host ""
}

if ($skippedCount -gt 0) {
    Write-Host "Skipped repos:" -ForegroundColor Yellow
    $results | Where-Object { $_.Status -eq "SKIPPED" } | ForEach-Object {
        Write-Host "  - $($_.Repo): $($_.Reason)" -ForegroundColor Yellow
    }
    Write-Host ""
}

# Save results to file
if (-not $WhatIf) {
    $timestamp = Get-Date -Format "yyyy-MM-dd_HH-mm-ss"
    $reportPath = "H:\Repos\sh\.github\scripts\deployment-report-$timestamp.json"
    $results | ConvertTo-Json -Depth 10 | Out-File $reportPath
    Write-Host "Deployment report saved: $reportPath" -ForegroundColor Gray
    Write-Host ""
}

if ($errorCount -eq 0 -and $skippedCount -eq 0) {
    Write-Host "✅ Deployment completed successfully!" -ForegroundColor Green
    exit 0
} elseif ($errorCount -eq 0) {
    Write-Host "⚠️  Deployment completed with some repos skipped" -ForegroundColor Yellow
    exit 0
} else {
    Write-Host "❌ Deployment completed with errors" -ForegroundColor Red
    exit 1
}
