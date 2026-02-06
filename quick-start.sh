#!/usr/bin/env bash
# Quick start script for Synapse - One command setup!
# Usage: 
#   ./quick-start.sh              # Interactive mode
#   ./quick-start.sh --local      # Full local (Ollama)
#   ./quick-start.sh --cloud      # Docker + Cloud AI
#   ./quick-start.sh --dev        # Bare-metal dev

set -e

MODE="${1:-interactive}"

echo "🚀 Synapse Quick Start"
echo "======================"
echo ""

# Interactive mode selection
if [ "$MODE" = "interactive" ] || [ "$MODE" = "--interactive" ]; then
    echo "Select deployment mode:"
    echo "  1) Full Local (Ollama) - 100% offline, no API keys"
    echo "  2) Docker + Cloud AI - Database in Docker, OpenAI for AI"
    echo "  3) Bare-metal Dev - Native backend/frontend, Docker DB only"
    echo ""
    read -p "Enter choice [1-3]: " choice
    case $choice in
        1) MODE="--local" ;;
        2) MODE="--cloud" ;;
        3) MODE="--dev" ;;
        *) echo "Invalid choice"; exit 1 ;;
    esac
fi

# Validate Docker for Docker modes
if [ "$MODE" != "--dev" ]; then
    if ! command -v docker &> /dev/null; then
        echo "❌ Docker not found. Install: https://docs.docker.com/get-docker/"
        exit 1
    fi
    echo "✅ Docker found"
    
    if ! docker compose version &> /dev/null && ! command -v docker-compose &> /dev/null; then
        echo "❌ Docker Compose not found"
        exit 1
    fi
    echo "✅ Docker Compose found"
fi
echo ""

# Create/update .env file
if [ ! -f .env ]; then
    echo "📝 Creating .env from .env.example..."
    cp .env.example .env
    echo "✅ Created .env"
else
    echo "✅ .env exists"
fi

# Mode-specific env var checks
if [ "$MODE" = "--cloud" ]; then
    if ! grep -q "OPENAI_API_KEY=." .env 2>/dev/null; then
        echo ""
        echo "⚠️  Cloud mode requires OPENAI_API_KEY in .env"
        read -p "Enter your OpenAI API key (or press Enter to skip): " api_key
        if [ -n "$api_key" ]; then
            echo "OPENAI_API_KEY=$api_key" >> .env
            echo "✅ Added OPENAI_API_KEY to .env"
        fi
    fi
fi
echo ""

<<<<<<< H:/Repos/shmindmaster/synapse/quick-start.sh
# Create .env file if it doesn't exist
if [ ! -f .env ]; then
    echo "📝 Creating .env file from .env.example..."
    if [ -f .env.example ]; then
        cp .env.example .env
        echo "✅ Created .env file"
        echo ""
        echo "⚠️  Note: Default configuration uses local/offline mode."
        echo "   To use OpenAI, edit .env and add your OPENAI_API_KEY"
        echo ""
    else
        echo "❌ .env.example not found. Please create .env manually."
        exit 1
    fi
else
    echo "✅ .env file exists"
fi
echo ""

# Validate required environment variables
echo "🔍 Validating configuration..."
source .env 2>/dev/null || true

if [ -z "$DATABASE_URL" ]; then
    echo "⚠️  DATABASE_URL not set, will use Docker default"
fi

if [ -z "$OPENAI_API_KEY" ] && [ "$USE_LOCAL_MODELS" != "true" ]; then
    echo "⚠️  No AI configured. Chat/search will use text-only mode."
    echo "   Set OPENAI_API_KEY or USE_LOCAL_MODELS=true in .env"
fi
echo ""

# Start the application
echo "🐳 Starting Synapse with Docker Compose..."
=======
# Determine compose file
case "$MODE" in
    --local)
        COMPOSE_FILE="docker-compose.local.yml"
        echo "📦 Mode: Full Local (Ollama)"
        echo "   - Database: Docker PostgreSQL"
        echo "   - AI: Ollama (models download automatically)"
        echo "   - Frontend: Docker"
        ;;
    --cloud)
        COMPOSE_FILE="docker-compose.yml"
        echo "📦 Mode: Docker + Cloud AI"
        echo "   - Database: Docker PostgreSQL"
        echo "   - AI: OpenAI/Azure (requires API key)"
        echo "   - Frontend: Docker"
        ;;
    --dev)
        echo "📦 Mode: Bare-metal Dev"
        echo "   - Database: Docker PostgreSQL only"
        echo "   - Backend: Run with 'pnpm dev' after DB starts"
        echo "   - Frontend: Run with 'pnpm dev' after DB starts"
        COMPOSE_FILE="docker-compose.yml"
        ;;
    *)
        echo "❌ Invalid mode: $MODE"
        echo "Usage: ./quick-start.sh [--local|--cloud|--dev]"
        exit 1
        ;;
esac
>>>>>>> C:/Users/SaroshHussain/.windsurf/worktrees/synapse/synapse-0ad03b3e/quick-start.sh
echo ""

# Start services
if [ "$MODE" = "--dev" ]; then
    echo "🐳 Starting PostgreSQL only..."
    docker compose up postgres -d
    
    echo ""
    echo "⏳ Waiting for PostgreSQL..."
    sleep 5
    
    echo ""
    echo "✅ PostgreSQL ready!"
    echo ""
    echo "Next steps:"
    echo "  1. cd src/api && pnpm install && pnpm dev"
    echo "  2. cd src/web && pnpm install && pnpm dev"
    echo "  3. Open http://localhost:5173"
    exit 0
fi

echo "🐳 Starting Synapse with Docker Compose..."
echo "   File: $COMPOSE_FILE"
echo ""

docker compose -f "$COMPOSE_FILE" up --build -d

echo ""
if [ "$MODE" = "--local" ]; then
    echo "⏳ Waiting for services (first run: ~5-10 min for model downloads)..."
else
    echo "⏳ Waiting for services (30-60 seconds)..."
fi
echo ""

# Wait for backend
RETRY_COUNT=0
MAX_RETRIES=60
while [ $RETRY_COUNT -lt $MAX_RETRIES ]; do
    if curl -f http://localhost:8000/api/health 2>/dev/null; then
        echo "✅ Backend ready"
        break
    fi
    RETRY_COUNT=$((RETRY_COUNT + 1))
    if [ $((RETRY_COUNT % 5)) -eq 0 ]; then
        echo "⏳ Waiting for backend... ($RETRY_COUNT/$MAX_RETRIES)"
    fi
    sleep 2
done

if [ $RETRY_COUNT -eq $MAX_RETRIES ]; then
    echo "❌ Backend timeout. Check logs:"
    echo "   docker compose -f $COMPOSE_FILE logs backend"
    exit 1
fi

# Wait for frontend
RETRY_COUNT=0
while [ $RETRY_COUNT -lt 30 ]; do
    if curl -f http://localhost:3000 2>/dev/null | grep -q "<!doctype html>"; then
        echo "✅ Frontend ready"
        break
    fi
    RETRY_COUNT=$((RETRY_COUNT + 1))
    sleep 2
done

echo ""
echo "🎉 Synapse is running!"
echo ""
echo "📱 Open: http://localhost:3000"
echo ""
echo "🔑 Login:"
echo "   Email: demo@synapse.local"
echo "   Password: DemoPassword123!"
echo ""
if [ "$MODE" = "--local" ]; then
    echo "� Local mode tips:"
    echo "   - First query may be slow (model loading)"
    echo "   - Models stored in Docker volume (persist across restarts)"
    echo "   - Change models: Edit .env and restart"
    echo ""
fi
echo "🛑 Stop: docker compose -f $COMPOSE_FILE down"
echo "📊 Logs: docker compose -f $COMPOSE_FILE logs -f"
echo ""
