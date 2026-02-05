# 👨‍💻 Developer Guide

Welcome! This guide will help you set up Synapse for local development and start contributing.

## 🎯 Quick Start (5 minutes)

### Prerequisites

- **Node.js 20+** - [Download](https://nodejs.org/)
- **PostgreSQL 14+** with pgvector extension
- **pnpm 10+** - Package manager (install with `npm install -g pnpm`)
- **Git** - For version control

### 1️⃣ Clone & Install

```bash
# Clone the repository
git clone https://github.com/shmindmaster/synapse.git
cd synapse

# Install dependencies
pnpm install
```

### 2️⃣ Setup Database

#### Option A: Docker (Recommended for Development)

```bash
# Start PostgreSQL with pgvector
docker-compose up -d

# Run migrations
pnpm db:migrate

# Seed demo data
pnpm db:seed
```

#### Option B: Local PostgreSQL

```bash
# Create PostgreSQL database and enable pgvector
psql -U postgres -c "CREATE DATABASE synapse;"
psql -d synapse -c "CREATE EXTENSION IF NOT EXISTS vector;"

# Update .env DATABASE_URL:
# DATABASE_URL="postgresql://user:password@localhost:5432/synapse"

# Run migrations
pnpm db:migrate

# Seed demo data
pnpm db:seed
```

### 3️⃣ Environment Variables

```bash
# Copy example config
cp .env.example .env

# Edit .env with your values (minimum required):
# DATABASE_URL=postgresql://localhost:5432/synapse
# OPENAI_API_KEY=sk-... (get free $5 credits at https://platform.openai.com/signup)
# AUTH_SECRET=your-random-secret-here
```

To generate a secure random secret:

```bash
# macOS/Linux
openssl rand -base64 32

# Windows PowerShell
[Convert]::ToBase64String((1..32 | ForEach-Object { [byte](Get-Random -Maximum 256) }))
```

### 4️⃣ Start Development

```bash
# Start frontend and backend with hot reload
pnpm dev

# Frontend: http://localhost:3000
# Backend: http://localhost:8000
```

**Login with:**

- Email: `demo@synapse.local`
- Password: `DemoPassword123!`

---

## 📁 Project Structure

```
synapse/
├── apps/
│   ├── backend/              # Fastify API server
│   │   ├── src/
│   │   │   ├── server.ts     # Main entry point
│   │   │   ├── config/       # Configuration files
│   │   │   ├── routes/       # API endpoints
│   │   │   ├── middleware/   # Request middleware
│   │   │   └── services/     # Business logic
│   │   └── tests/            # Test files
│   │
│   ├── frontend/             # React web application
│   │   ├── src/
│   │   │   ├── components/   # React components
│   │   │   ├── services/     # API clients
│   │   │   ├── contexts/     # React contexts
│   │   │   └── pages/        # Page components
│   │   └── vite.config.ts    # Vite configuration
│   │
│   ├── cli/                  # Command-line tool
│   │   └── src/
│   │       ├── commands/     # CLI commands
│   │       └── index.ts      # CLI entry point
│   │
│   ├── mcp-server/           # Model Context Protocol server
│   │   └── src/server.ts
│   │
│   └── vscode-extension/     # VS Code extension
│       └── src/
│           ├── extension.ts  # Extension entry
│           ├── panels/       # WebView panels
│           └── providers/    # Command providers
│
├── prisma/
│   ├── schema.prisma         # Database schema
│   ├── seed.ts               # Demo data seeding
│   └── migrations/           # Database migrations
│
├── docs/                     # Documentation
│
├── .github/
│   ├── workflows/            # CI/CD workflows
│   └── ISSUE_TEMPLATE/       # Issue templates
│
└── package.json              # Monorepo configuration
```

---

## 🚀 Common Development Tasks

### Running Code

```bash
# Development mode (hot reload)
pnpm dev

# Build for production
pnpm build

# Start production build
pnpm start

# Run CLI tool
pnpm cli <command>

# Run MCP server
pnpm mcp:dev
```

### Database Operations

```bash
# Run migrations
pnpm db:migrate

# Generate Prisma client
pnpm db:generate

# Open database GUI (Prisma Studio)
pnpm db:studio

# Seed demo data
pnpm db:seed

# Create new migration (interactive)
pnpm db:migrate dev --name your_migration_name
```

### Code Quality

```bash
# Lint all apps
pnpm lint

# Format code with Prettier
pnpm format

# Check formatting without changes
pnpm format:check

# Type-check TypeScript
pnpm build  # (includes type checking)
```

### Testing

```bash
# Run end-to-end tests
pnpm test

# Watch mode for tests
pnpm test:watch

# Run specific test file
pnpm --filter backend test tests/api/search.test.ts
```

---

## 🔧 Development Workflow

### 1. Create a Branch

```bash
# Feature branch
git checkout -b feature/my-new-feature

# Bug fix branch
git checkout -b fix/issue-description

# Always branch from main
git checkout main
git pull origin main
git checkout -b your-branch-name
```

### 2. Make Changes

- Edit files in the appropriate `apps/` folder
- Follow existing code style (ESLint enforced automatically)
- Add tests for new functionality
- Update documentation if behavior changes

### 3. Test Your Changes

```bash
# Before committing:
pnpm lint           # Check code style
pnpm build          # Type-check and build
pnpm test           # Run tests (if applicable)
```

### 4. Commit & Push

```bash
# Stage changes
git add .

# Commit with clear message (use conventional commits)
git commit -m "feat: add semantic search for Python files"
git commit -m "fix: resolve memory leak in indexing service"
git commit -m "docs: update API reference"

# Push to your fork
git push origin your-branch-name
```

### 5. Create Pull Request

- Go to https://github.com/shmindmaster/synapse/pulls
- Click "New Pull Request"
- Select your branch
- Fill in the PR template
- Submit for review

---

## 🧪 Testing

### Unit Tests (Backend)

```bash
# Run all backend tests
pnpm --filter backend test

# Run specific test file
pnpm --filter backend test -- tests/api/search.test.ts

# Watch mode
pnpm --filter backend test:watch
```

### Integration Tests

```bash
# Run end-to-end tests
pnpm test
```

### Adding Tests

```typescript
// tests/api/search.test.ts
import { test, expect } from '@playwright/test';

test('semantic search finds relevant code', async ({ page }) => {
  await page.goto('http://localhost:3000');
  await page.fill('[data-testid="search-input"]', 'error handling');
  await page.click('[data-testid="search-button"]');

  const results = await page.locator('[data-testid="result-item"]');
  expect(await results.count()).toBeGreaterThan(0);
});
```

---

## 🔍 Debugging

### Backend Debugging

```bash
# Enable debug logs
DEBUG=* pnpm dev

# Or set env variable
export DEBUG=synapse:*
pnpm dev
```

### Chrome DevTools (Frontend)

- Open http://localhost:3000
- Press `F12` for DevTools
- Use Console, Network, and Sources tabs

### VS Code Debugging

Add to `.vscode/launch.json`:

```json
{
  "version": "0.2.0",
  "configurations": [
    {
      "name": "Backend API",
      "type": "node",
      "request": "launch",
      "program": "${workspaceFolder}/apps/backend/src/server.ts",
      "preLaunchTask": "build",
      "outFiles": ["${workspaceFolder}/dist/**/*.js"]
    }
  ]
}
```

---

## 📝 Code Style Guide

### TypeScript

- Use strict mode (already enforced)
- Add type annotations for function parameters
- Avoid `any` types—use proper generics
- Use ESLint configured rules

```typescript
// ✅ Good
function searchCodebase(query: string): Promise<SearchResult[]> {
  // ...
}

// ❌ Bad
function searchCodebase(query) {
  // ...
}
```

### React Components

- Use functional components with hooks
- Named exports for easier testing
- Props interfaces clearly defined

```typescript
// ✅ Good
interface SearchProps {
  query: string;
  onSearch: (results: Result[]) => void;
}

export function SearchBox({ query, onSearch }: SearchProps) {
  // ...
}

// ❌ Bad
export default function SearchBox(props) {
  // ...
}
```

### Commit Messages

Follow [Conventional Commits](https://www.conventionalcommits.org/):

```
feat: add semantic search highlighting
fix: resolve database connection pooling issue
docs: update installation instructions
chore: update dependencies
refactor: simplify search algorithm
test: add tests for vector embeddings
perf: optimize indexing performance
```

### File Naming

- Components: `PascalCase.tsx` (e.g., `SearchBox.tsx`)
- Utilities: `camelCase.ts` (e.g., `commonUtils.ts`)
- Types: `camelCase.ts` (e.g., `searchTypes.ts`)
- Tests: `*.test.ts` or `*.spec.ts`

---

## 🤝 Contributing Guidelines

### Before You Start

1. **Check existing issues** - Your feature might already be discussed
2. **Open an issue** - Discuss bigger changes before implementing
3. **Read CONTRIBUTING.md** - Detailed contribution guidelines

### Do's ✅

- Write clear commit messages
- Add tests for new functionality
- Update documentation
- Keep PRs focused (one feature/fix per PR)
- Rebase before submitting (keep history clean)
- Be respectful and constructive

### Don'ts ❌

- Commit API keys or secrets
- Make multiple unrelated changes in one PR
- Skip tests or linting
- Ignore code review feedback
- Force push to main branch

---

## 🚨 Troubleshooting

### Issue: "Cannot find module '@prisma/client'"

**Solution:**

```bash
pnpm db:generate
pnpm install
```

### Issue: "PostgreSQL connection failed"

**Check:**

- PostgreSQL is running: `psql --version`
- DATABASE_URL is correct in `.env`
- Database exists: `psql -l | grep synapse`
- pgvector extension installed: `psql -d synapse -c "SELECT * FROM pg_extension;"`

### Issue: "Port 3000/8000 already in use"

**Solution:**

```bash
# Find process using port
lsof -i :3000  # macOS/Linux
netstat -ano | findstr :3000  # Windows

# Kill process or use different port
```

### Issue: "pnpm: command not found"

**Solution:**

```bash
npm install -g pnpm
pnpm --version
```

### Issue: Build failing with TypeScript errors

**Solution:**

```bash
# Regenerate Prisma client
pnpm db:generate

# Clear build cache
rm -rf dist/
pnpm build
```

---

## 📚 Useful Resources

- **Fastify Docs:** https://www.fastify.io/docs/latest/
- **React Docs:** https://react.dev
- **Prisma Docs:** https://www.prisma.io/docs/
- **PostgreSQL Docs:** https://www.postgresql.org/docs/
- **pgvector Docs:** https://github.com/pgvector/pgvector
- **Tree-sitter Docs:** https://tree-sitter.github.io/tree-sitter/

---

## 💬 Need Help?

- **Questions?** Open a [GitHub Discussion](https://github.com/shmindmaster/synapse/discussions)
- **Bug?** [Report an issue](https://github.com/shmindmaster/synapse/issues)
- **Code review?** Look at open PRs and leave constructive feedback
- **Unclear something?** Ask in a discussion—we're here to help!

---

## 🎉 You're Ready!

1. Set up your environment (5 minutes)
2. Pick an issue or feature to work on
3. Create a branch and make your changes
4. Submit a pull request
5. Wait for review and iterate

**Thank you for contributing to Synapse!** Your help makes this project better. 🚀

---

**Happy coding!**
