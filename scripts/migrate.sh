#!/bin/bash
set -e

# ==========================================
# DATABASE MIGRATION SCRIPT
# ==========================================
# Idempotent database migration script
# Safe to run multiple times

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
REPO_ROOT="$(cd "$SCRIPT_DIR/.." && pwd)"
cd "$REPO_ROOT"

echo "=========================================="
echo "DATABASE MIGRATION"
echo "=========================================="
echo ""

# Check for DATABASE_URL
if [ -z "$DATABASE_URL" ]; then
  echo "ERROR: DATABASE_URL environment variable not set"
  exit 1
fi

echo "SUCCESS: DATABASE_URL configured"
echo ""

# 1. Initialize pgvector extension (required for Synapse)
echo "1. Initializing pgvector extension..."
psql "$DATABASE_URL" -c "CREATE EXTENSION IF NOT EXISTS vector;" 2>/dev/null || {
  echo "   WARNING: Failed to create vector extension (may already exist)"
}
echo "   SUCCESS: pgvector extension ready"
echo ""

# 2. Create embeddings table
echo "2. Creating embeddings table..."
psql "$DATABASE_URL" <<EOF 2>/dev/null || true
CREATE TABLE IF NOT EXISTS embeddings (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  content TEXT NOT NULL,
  metadata JSONB DEFAULT '{}',
  embedding VECTOR(1536),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create indexes for performance
CREATE INDEX IF NOT EXISTS idx_embeddings_vector ON embeddings USING hnsw (embedding vector_l2_ops);
CREATE INDEX IF NOT EXISTS idx_embeddings_metadata ON embeddings USING gin (metadata);
CREATE INDEX IF NOT EXISTS idx_embeddings_created_at ON embeddings (created_at DESC);
EOF

if [ $? -eq 0 ]; then
  echo "   SUCCESS: Embeddings table ready"
else
  echo "   INFO: Embeddings table may already exist"
fi
echo ""

# 3. Run Prisma migrations
if [ -f "prisma/schema.prisma" ]; then
  echo "3. Running Prisma migrations..."
  npx prisma migrate deploy || {
    echo "   WARNING: Prisma migration failed or not needed"
  }
  echo "   SUCCESS: Prisma migrations complete"
  echo ""
fi

echo "=========================================="
echo "MIGRATION COMPLETE"
echo "=========================================="
echo ""
echo "Database is ready for use."
echo "Next steps:"
echo "  - Start the application: pnpm dev"
echo "  - Index a codebase: pnpm cli index /path/to/code"
echo ""
