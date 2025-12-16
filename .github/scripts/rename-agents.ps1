# Rename Agent Files with SHTrial Prefix
# This script renames all agent files to follow the shtrial-* naming convention

$agentsDir = "H:\Repos\sh\.github\agents"

# Define the rename mapping
$renameMap = @{
    "arch.agent.md" = "shtrial-architecture.agent.md"
    "blueprint-mode-codex.agent.md" = "shtrial-blueprint-codex.agent.md"
    "claude-haiku-beast-mode.agent.md" = "shtrial-claude-beast.agent.md"
    "code-tour.agent.md" = "shtrial-code-tour.agent.md"
    "context7.agent.md" = "shtrial-context-analyzer.agent.md"
    "debug.agent.md" = "shtrial-debugger.agent.md"
    "expert-nextjs-developer.agent.md" = "shtrial-nextjs-expert.agent.md"
    "expert-react-frontend-engineer.agent.md" = "shtrial-react-expert.agent.md"
    "implementation-plan.agent.md" = "shtrial-implementation-planner.agent.md"
    "janitor.agent.md" = "shtrial-code-janitor.agent.md"
    "pendoah.agent.md" = "shtrial-pendoah.agent.md"
    "plan.agent.md" = "shtrial-strategic-planner.agent.md"
    "playwright-tester.agent.md" = "shtrial-playwright-tester.agent.md"
    "prd.agent.md" = "shtrial-prd-writer.agent.md"
    "prompt-builder.agent.md" = "shtrial-prompt-builder.agent.md"
    "search-ai-optimization-expert.agent.md" = "shtrial-seo-expert.agent.md"
    "software-engineer-agent-v1.agent.md" = "shtrial-software-engineer.agent.md"
    "specification.agent.md" = "shtrial-spec-writer.agent.md"
    "task-planner.agent.md" = "shtrial-task-planner.agent.md"
    "task-researcher.agent.md" = "shtrial-task-researcher.agent.md"
    "Ultimate-Transparent-Thinking-Beast-Mode.agent.md" = "shtrial-thinking-beast.agent.md"
    "voidbeast-gpt41enhanced.agent.md" = "shtrial-voidbeast-enhanced.agent.md"
}

Write-Host "Starting agent file renaming process..." -ForegroundColor Cyan
Write-Host "Directory: $agentsDir" -ForegroundColor Gray
Write-Host ""

$successCount = 0
$errorCount = 0

foreach ($oldName in $renameMap.Keys) {
    $newName = $renameMap[$oldName]
    $oldPath = Join-Path $agentsDir $oldName
    $newPath = Join-Path $agentsDir $newName
    
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
