#!/bin/bash
# Minimal setup guide for Synapse RAG Platform

echo "🚀 Starting Synapse setup..."

# Step 1: Install dependencies
echo "📦 Installing dependencies..."
pnpm install

# Step 2: Generate Prisma client (CRITICAL - fixes PrismaClient import error)
echo "🔧 Generating Prisma client..."
pnpm exec prisma generate

# Step 3: Build all packages
echo "🏗️  Building packages..."
pnpm build

# Step 4: Check .env file
if [ ! -f .env ]; then
    echo "📝 Creating .env file from .env.example..."
    cp .env.example .env
    echo "⚠️  Update .env with your database URL and API keys"
    echo "   Required:"
    echo "   - DATABASE_URL=postgresql://..."
    echo "   - OPENAI_API_KEY=sk-... (optional)"
fi

# Step 5: Database setup
echo "🗄️  Setting up database..."
read -p "Run database migrations? (y/n) " -n 1 -r
echo
if [[ $REPLY =~ ^[Yy]$ ]]; then
    pnpm exec prisma migrate deploy
    pnpm exec prisma db seed
    echo "✅ Database ready"
fi

# Step 6: Start development environment
echo "🎯 Setup complete!"
echo ""
echo "To start development:"
echo "  1. Start backend: cd apps/backend && npm run dev"
echo "  2. Start frontend: cd apps/frontend && npm run dev"
echo ""
echo "Or use docker-compose: docker-compose up"

