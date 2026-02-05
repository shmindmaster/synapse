#!/bin/bash
# Initialize RAG database for Synapse
set -e

if [ -f .env ]; then
  export $(grep -v '^#' .env | xargs)
fi

DATABASE_URL="${DATABASE_URL:?ERROR: Set DATABASE_URL environment variable}"

echo "Initializing RAG database for Synapse..."

# Create embeddings table with pgvector
psql "${DATABASE_URL}" <<SQL
-- Enable pgvector extension
CREATE EXTENSION IF NOT EXISTS vector;

# Note: Vector dimensions should match your embedding model
# text-embedding-3-small (OpenAI) = 1536 dimensions
# gte-large-en-v1.5 (Alibaba) = 1024 dimensions

-- Create embeddings table (adjust VECTOR dimension below to match your model)
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

SELECT 'Embeddings table created successfully' AS status;
SELECT COUNT(*) AS existing_embeddings FROM embeddings;
SQL

echo "Database initialized successfully"
echo "   Table: embeddings"
echo "   Dimensions: 1536"
echo "   Index: HNSW (L2 distance)"
