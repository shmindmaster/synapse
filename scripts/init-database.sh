#!/bin/bash
# Initialize RAG database for this app
set -e

if [ -f .env ]; then
  export $(grep -v '^#' .env | xargs)
fi

APP_SLUG="${APP_SLUG:?Set APP_SLUG}"
DATABASE_URL="${DATABASE_URL:?Set DATABASE_URL}"

echo "🗄️  Initializing RAG database for ${APP_SLUG}..."

# Create embeddings table with pgvector
psql "${DATABASE_URL}" <<SQL
-- Enable pgvector extension
CREATE EXTENSION IF NOT EXISTS vector;

-- Create embeddings table (1024 dimensions)
CREATE TABLE IF NOT EXISTS embeddings (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  content TEXT NOT NULL,
  metadata JSONB DEFAULT '{}',
  embedding VECTOR(1024),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create indexes for performance
CREATE INDEX IF NOT EXISTS idx_embeddings_vector ON embeddings USING hnsw (embedding vector_l2_ops);
CREATE INDEX IF NOT EXISTS idx_embeddings_metadata ON embeddings USING gin (metadata);
CREATE INDEX IF NOT EXISTS idx_embeddings_created_at ON embeddings (created_at DESC);

-- Grant permissions
GRANT ALL ON embeddings TO ${PGUSER};

SELECT 'Embeddings table created successfully' AS status;
SELECT COUNT(*) AS existing_embeddings FROM embeddings;
SQL

echo "✅ Database initialized for ${APP_SLUG}"
echo "   • Table: embeddings"
echo "   • Dimensions: 1024"
echo "   • Index: HNSW (L2 distance)"
