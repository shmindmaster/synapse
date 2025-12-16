# Rename Instruction Files with SHTrial Prefix
# This script renames all instruction files to follow the shtrial-* naming convention

$instructionsDir = "H:\Repos\sh\.github\instructions"

# Define the rename mapping
$renameMap = @{
    "codexer.instructions.md" = "shtrial-codexer.instructions.md"
    "containerization-docker-best-practices.instructions.md" = "shtrial-docker-containerization.instructions.md"
    "copilot-thought-logging.instructions.md" = "shtrial-copilot-logging.instructions.md"
    "langchain-python.instructions.md" = "shtrial-langchain-python.instructions.md"
    "memory-bank.instructions.md" = "shtrial-memory-bank.instructions.md"
    "nestjs.instructions.md" = "shtrial-nestjs.instructions.md"
    "nextjs-tailwind.instructions.md" = "shtrial-nextjs-tailwind.instructions.md"
    "nextjs.instructions.md" = "shtrial-nextjs.instructions.md"
    "nodejs-javascript-vitest.instructions.md" = "shtrial-nodejs-vitest.instructions.md"
    "object-calisthenics.instructions.md" = "shtrial-object-calisthenics.instructions.md"
    "performance-optimization.instructions.md" = "shtrial-performance.instructions.md"
    "powershell-pester-5.instructions.md" = "shtrial-powershell-pester.instructions.md"
    "powershell.instructions.md" = "shtrial-powershell.instructions.md"
    "python.instructions.md" = "shtrial-python-fastapi.instructions.md"
    "reactjs.instructions.md" = "shtrial-reactjs.instructions.md"
    "shell.instructions.md" = "shtrial-shell.instructions.md"
    "taming-copilot.instructions.md" = "shtrial-taming-copilot.instructions.md"
    "task-implementation.instructions.md" = "shtrial-task-implementation.instructions.md"
    "typescript-5-es2022.instructions.md" = "shtrial-typescript.instructions.md"
}

Write-Host "Starting instruction file renaming process..." -ForegroundColor Cyan
Write-Host "Directory: $instructionsDir" -ForegroundColor Gray
Write-Host ""

$successCount = 0
$errorCount = 0

foreach ($oldName in $renameMap.Keys) {
    $newName = $renameMap[$oldName]
    $oldPath = Join-Path $instructionsDir $oldName
    $newPath = Join-Path $instructionsDir $newName
    
    if (Test-Path $oldPath) {
        try {
            Rename-Item -Path $oldPath -NewName $newName -ErrorAction Stop
            Write-Host "[SUCCESS] $oldName -> $newName" -ForegroundColor Green
            $successCount++
        }
        catch {
            Write-Host "[ERROR] Failed to rename $oldName : $_" -ForegroundColor Red
            $errorCount++
        }
    }
    else {
        Write-Host "[SKIP] File not found: $oldName" -ForegroundColor Yellow
    }
}

Write-Host ""
Write-Host "Renaming complete!" -ForegroundColor Cyan
Write-Host "Success: $successCount | Errors: $errorCount" -ForegroundColor $(if ($errorCount -eq 0) { "Green" } else { "Yellow" })
