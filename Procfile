# Heroku Procfile

# Defines process types and commands for Heroku deployment

# Web process - starts the backend server

# Heroku automatically sets PORT environment variable

web: cd apps/backend && npm install -g pnpm@10.23.0 && pnpm install && pnpm exec prisma generate && pnpm run build && node dist/server.js

# Release phase - runs before deployment

# Handles database migrations automatically

release: cd apps/backend && npm install -g pnpm@10.23.0 && pnpm install && npx prisma migrate deploy
