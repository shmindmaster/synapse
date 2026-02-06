#!/usr/bin/env bash
# ============================================
# Synapse Local Model Initialization
# ============================================
# Pulls required Ollama models for local/offline mode.
# Run this AFTER Ollama is running (docker or native).
#
# Usage:
#   ./scripts/init-models.sh                    # Use defaults
#   ./scripts/init-models.sh gemma3:4b          # Override chat model
#   OLLAMA_HOST=http://gpu-server:11434 ./scripts/init-models.sh
#
# ============================================

set -e

OLLAMA_HOST="${OLLAMA_HOST:-http://localhost:11434}"
CHAT_MODEL="${1:-${LOCAL_LLM_MODEL:-qwen2.5-coder:7b}}"
EMBEDDING_MODEL="${LOCAL_EMBEDDING_MODEL:-nomic-embed-text}"

echo "🧠 Synapse Model Initializer"
echo "============================="
echo "Ollama endpoint: $OLLAMA_HOST"
echo "Chat model:      $CHAT_MODEL"
echo "Embedding model: $EMBEDDING_MODEL"
echo ""

# Wait for Ollama to be ready
echo "⏳ Waiting for Ollama to be ready..."
RETRY=0
MAX_RETRY=30
while [ $RETRY -lt $MAX_RETRY ]; do
    if curl -sf "$OLLAMA_HOST/api/tags" > /dev/null 2>&1; then
        echo "✅ Ollama is ready"
        break
    fi
    RETRY=$((RETRY + 1))
    echo "   Attempt $RETRY/$MAX_RETRY..."
    sleep 2
done

if [ $RETRY -eq $MAX_RETRY ]; then
    echo "❌ Ollama did not become ready. Check that it's running."
    echo "   Try: docker compose -f docker-compose.local.yml logs ollama"
    exit 1
fi

echo ""

# Pull embedding model (small, fast download)
echo "📥 Pulling embedding model: $EMBEDDING_MODEL (~275MB)..."
curl -s "$OLLAMA_HOST/api/pull" -d "{\"name\": \"$EMBEDDING_MODEL\"}" | while IFS= read -r line; do
    status=$(echo "$line" | grep -o '"status":"[^"]*"' | head -1 | cut -d'"' -f4)
    if [ -n "$status" ]; then
        printf "\r   %s" "$status"
    fi
done
echo ""
echo "✅ Embedding model ready: $EMBEDDING_MODEL"
echo ""

# Pull chat model (larger download)
echo "📥 Pulling chat model: $CHAT_MODEL (~4.5GB, this may take a few minutes)..."
curl -s "$OLLAMA_HOST/api/pull" -d "{\"name\": \"$CHAT_MODEL\"}" | while IFS= read -r line; do
    status=$(echo "$line" | grep -o '"status":"[^"]*"' | head -1 | cut -d'"' -f4)
    if [ -n "$status" ]; then
        printf "\r   %s" "$status"
    fi
done
echo ""
echo "✅ Chat model ready: $CHAT_MODEL"
echo ""

# Verify models are loaded
echo "📋 Installed models:"
curl -s "$OLLAMA_HOST/api/tags" | grep -o '"name":"[^"]*"' | cut -d'"' -f4 | while read -r model; do
    echo "   ✅ $model"
done

echo ""
echo "🎉 All models ready! Synapse is good to go."
echo ""
echo "Available model options:"
echo "  Chat:       qwen2.5-coder:7b | gemma3:4b | phi3.5 | llama3.1:8b"
echo "  Embeddings: nomic-embed-text | all-minilm"
echo ""
echo "To switch models, set LOCAL_LLM_MODEL in .env and restart."
