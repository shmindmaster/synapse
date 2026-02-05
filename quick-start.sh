#!/usr/bin/env bash
# Quick start script for Synapse - One command setup!
# Usage: ./quick-start.sh

set -e

echo "🚀 Synapse Quick Start"
echo "======================"
echo ""

# Check for Docker
if ! command -v docker &> /dev/null; then
    echo "❌ Docker not found. Please install Docker: https://docs.docker.com/get-docker/"
    exit 1
fi

echo "✅ Docker found"
echo ""

# Check for docker-compose
if ! command -v docker-compose &> /dev/null && ! docker compose version &> /dev/null; then
    echo "❌ Docker Compose not found. Please update Docker Desktop or install Compose separately"
    exit 1
fi

echo "✅ Docker Compose found"
echo ""

# Start the application
echo "🐳 Starting Synapse with Docker Compose..."
echo ""
echo "This will:"
echo "  • Download PostgreSQL with pgvector"
echo "  • Build backend API server"
echo "  • Build frontend React app"
echo "  • Create and seed database with demo user"
echo "  • Start everything on http://localhost"
echo ""

docker compose up --build -d

echo ""
echo "⏳ Waiting for services to start (30-60 seconds)..."
echo ""

# Wait for backend health check
RETRY_COUNT=0
MAX_RETRIES=30
while [ $RETRY_COUNT -lt $MAX_RETRIES ]; do
    if curl -f http://localhost:8000/api/health 2>/dev/null; then
        echo "✅ Backend API is ready"
        break
    fi
    RETRY_COUNT=$((RETRY_COUNT + 1))
    echo "⏳ Checking backend... (attempt $RETRY_COUNT/$MAX_RETRIES)"
    sleep 2
done

if [ $RETRY_COUNT -eq $MAX_RETRIES ]; then
    echo "❌ Backend did not start. Check logs with: docker compose logs backend"
    exit 1
fi

# Wait for frontend
RETRY_COUNT=0
while [ $RETRY_COUNT -lt $MAX_RETRIES ]; do
    if curl -f http://localhost:80 2>/dev/null | grep -q "react"; then
        echo "✅ Frontend is ready"
        break
    fi
    RETRY_COUNT=$((RETRY_COUNT + 1))
    echo "⏳ Checking frontend... (attempt $RETRY_COUNT/$MAX_RETRIES)"
    sleep 2
done

echo ""
echo "🎉 Synapse is running!"
echo ""
echo "📱 Open your browser: http://localhost"
echo ""
echo "🔑 Login credentials:"
echo "   Email: demomaster@pendoah.ai"
echo "   Password: Pendoah1225"
echo ""
echo "📚 Documentation: https://github.com/shmindmaster/synapse"
echo ""
echo "🛑 To stop: docker compose down"
echo "📊 View logs: docker compose logs -f"
echo ""
