# GitHub Repository Metadata Update Script (PowerShell)
# Run this after ensuring you're authenticated as shmindmaster: gh auth switch -u shmindmaster

$REPO = "shmindmaster/synapse"

Write-Host "📝 Updating GitHub repository metadata for $REPO..." -ForegroundColor Cyan
Write-Host ""

# Update repository description and homepage
Write-Host "Updating description and homepage..." -ForegroundColor Yellow
gh repo edit $REPO `
  --description "Privacy-first RAG platform - Transform any document collection into an intelligent, queryable system running entirely on your infrastructure" `
  --homepage "https://github.com/shmindmaster/synapse"

Write-Host "✅ Description and homepage updated" -ForegroundColor Green
Write-Host ""

# Add repository topics/tags
Write-Host "Adding topics..." -ForegroundColor Yellow
$topics = @(
    "rag",
    "retrieval-augmented-generation",
    "vector-database",
    "pgvector",
    "semantic-search",
    "embeddings",
    "privacy-first",
    "local-first",
    "typescript",
    "react",
    "fastify",
    "ai",
    "llm",
    "openai",
    "knowledge-base",
    "document-search"
)

foreach ($topic in $topics) {
    gh repo edit $REPO --add-topic $topic
    Write-Host "  Added: $topic" -ForegroundColor Gray
}

Write-Host "✅ All topics added" -ForegroundColor Green
Write-Host ""

# Enable features
Write-Host "Enabling repository features..." -ForegroundColor Yellow
gh repo edit $REPO `
  --enable-issues `
  --enable-discussions `
  --enable-projects `
  --enable-wiki

Write-Host "✅ Features enabled (Issues, Discussions, Projects, Wiki)" -ForegroundColor Green
Write-Host ""

# Set merge settings
Write-Host "Configuring merge settings..." -ForegroundColor Yellow
gh repo edit $REPO --delete-branch-on-merge

Write-Host "✅ Auto-delete branches on merge enabled" -ForegroundColor Green
Write-Host ""

Write-Host "🎉 Repository metadata update complete!" -ForegroundColor Cyan
Write-Host ""
Write-Host "Next steps:" -ForegroundColor Yellow
Write-Host "1. Verify on GitHub: https://github.com/$REPO"
Write-Host "2. Add a repository social image (Settings > General > Social Preview)"
Write-Host "3. Enable Dependabot alerts (Settings > Security > Code security)"
Write-Host "4. Enable GitHub Advanced Security if available"
Write-Host "5. Set up branch protection rules for main (Settings > Branches)"
Write-Host "6. Consider adding a sponsor button (Settings > General > Sponsorships)"
Write-Host ""
