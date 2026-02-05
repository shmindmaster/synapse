#!/bin/bash
# GitHub Repository Metadata Update Script
# Run this after ensuring you're authenticated as shmindmaster: gh auth switch -u shmindmaster

REPO="shmindmaster/synapse"

echo "📝 Updating GitHub repository metadata for ${REPO}..."

# Update repository description
gh repo edit $REPO \
  --description "Privacy-first RAG platform - Transform any document collection into an intelligent, queryable system running entirely on your infrastructure" \
  --homepage "https://github.com/shmindmaster/synapse"

echo "✅ Description and homepage updated"

# Add repository topics/tags
gh repo edit $REPO \
  --add-topic "rag" \
  --add-topic "retrieval-augmented-generation" \
  --add-topic "vector-database" \
  --add-topic "pgvector" \
  --add-topic "semantic-search" \
  --add-topic "embeddings" \
  --add-topic "privacy-first" \
  --add-topic "local-first" \
  --add-topic "typescript" \
  --add-topic "react" \
  --add-topic "fastify" \
  --add-topic "ai" \
  --add-topic "llm" \
  --add-topic "openai" \
  --add-topic "knowledge-base" \
  --add-topic "document-search"

echo "✅ Topics added"

# Enable features
gh repo edit $REPO \
  --enable-issues \
  --enable-discussions \
  --enable-projects \
  --enable-wiki

echo "✅ Features enabled (Issues, Discussions, Projects, Wiki)"

# Set security and merge settings
gh repo edit $REPO \
  --delete-branch-on-merge

echo "✅ Auto-delete branches on merge enabled"

echo ""
echo "🎉 Repository metadata update complete!"
echo ""
echo "Next steps:"
echo "1. Verify on GitHub: https://github.com/${REPO}"
echo "2. Add a repository social image (Settings > General > Social Preview)"
echo "3. Enable Dependabot (Settings > Security)"
echo "4. Add repository to your profile README if desired"
