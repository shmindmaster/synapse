#!/bin/bash
# Synapse Database Entrypoint
# Automatically runs migrations and seeds data on first startup

set -e

echo "🗄️ Starting PostgreSQL initialization..."

# Wait for PostgreSQL to be ready
until pg_isready -h localhost -U synapse -d synapse 2>/dev/null; do
  echo "⏳ Waiting for PostgreSQL..."
  sleep 2
done

echo "✅ PostgreSQL is ready"

# Run migrations
if [ -d "/app/prisma" ]; then
  cd /app
  echo "🔄 Running database migrations..."
  npx prisma migrate deploy --skip-generate
  
  echo "🌱 Seeding demo data..."
  npx prisma db seed
  
  echo "✅ Database setup complete"
fi

echo "✨ All initialization complete! Synapse is ready to use."
