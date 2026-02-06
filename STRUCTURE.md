# 📁 Repository Structure Guide

Synapse is organized as a **single repository with independent projects** — not a monorepo. Each project is completely self-contained with its own dependencies, build process, and deployment pipeline.

## 🏗️ Directory Layout

```
synapse/
├── src/                         # All independent applications
│   ├── api/                     # Fastify backend API server
│   │   ├── package.json         # Standalone dependencies
│   │   ├── prisma/              # Database schema (local copy)
│   │   │   ├── schema.prisma
│   │   │   ├── seed.ts
│   │   │   └── migrations/
│   │   ├── src/                 # TypeScript source code
│   │   │   ├── server.ts        # Main entry point
│   │   │   ├── config/          # Configuration (database, auth, etc.)
│   │   │   ├── routes/          # API endpoints
│   │   │   ├── middleware/      # Request middleware
│   │   │   └── services/        # Business logic
│   │   ├── services/            # Legacy service files
│   │   ├── utils/               # Utility functions
│   │   ├── tests/               # API tests
│   │   ├── Dockerfile           # Container definition
│   │   └── README.md            # Project-specific docs
│   │
│   ├── web/                     # React frontend web application
│   │   ├── package.json         # Standalone dependencies
│   │   ├── src/                 # TypeScript/React source
│   │   ├── vite.config.ts       # Vite build configuration
│   │   ├── Dockerfile           # Container definition
│   │   └── index.html           # HTML entry point
│   │
│   ├── cli/                     # Command-line tool
│   │   ├── package.json         # Standalone dependencies
│   │   ├── src/                 # TypeScript source
│   │   │   ├── index.ts         # CLI entry point
│   │   │   └── commands/        # CLI commands
│   │   └── bin/                 # Executable wrappers
│   │
│   ├── mcp-server/              # Model Context Protocol server
│   │   ├── package.json         # Standalone dependencies
│   │   ├── src/server.ts        # Server implementation
│   │   └── README.md            # MCP setup guide
│   │
│   ├── vscode-ext/              # VS Code extension
│   │   ├── package.json         # Standalone dependencies
│   │   ├── src/                 # TypeScript source
│   │   │   ├── extension.ts     # Extension entry point
│   │   │   ├── panels/          # WebView panels
│   │   │   └── providers/       # Command providers
│   │   └── README.md            # Extension guide
│   │
│   └── services/                # Optional companion services
│       └── embeddings/          # Python embedding service (optional)
│           ├── requirements.txt # Python dependencies
│           ├── embedding_server.py
│           └── Dockerfile
│
├── docs/                        # Main documentation
│   ├── README.md                # Documentation index
│   ├── architecture.md          # System architecture details
│   ├── deployment.md            # Deployment guides
│   ├── api-reference.md         # API documentation
│   ├── DEPLOYMENT_ISSUES.md     # Deployment troubleshooting
│   ├── enterprise.md            # Enterprise features
│   ├── FAQ.md                   # Frequently asked questions
│   ├── local-offline-deployment.md  # Privacy-first local AI
│   ├── mcp-server.md            # MCP server integration
│   ├── use-cases.md             # Common use cases
│   └── vscode-extension.md      # VS Code extension
│
├── scripts/                     # Utility scripts
│   ├── init-database.sh         # Database initialization
│   ├── init-db-docker.sh        # Docker DB setup
│   └── migrate.sh               # Migration runner
│
├── .github/                     # GitHub configuration
│   ├── workflows/               # CI/CD workflows
│   │   ├── build.yml            # Build pipeline
│   │   ├── lint.yml             # Code quality
│   │   ├── security.yml         # Security scanning
│   │   └── test.yml             # Testing
│   └── ISSUE_TEMPLATE/          # Issue templates
│       ├── bug_report.md
│       ├── feature_request.md
│       └── documentation.md
│
├── README.md                    # Project overview
├── CONTRIBUTING.md              # Contribution guidelines
├── DEVELOPERS.md                # Developer setup guide
├── CODE_OF_CONDUCT.md           # Community guidelines
├── SECURITY.md                  # Security policy
├── CHANGELOG.md                 # Release notes
├── LICENSE                      # MIT License
├── STRUCTURE.md                 # This file
└── package.json                 # Root package (info only)
```

---

## 🎯 Why This Structure?

### ✅ Independent Projects

Each project in `src/` is **completely independent**:

- **Separate `package.json`** - Own dependencies, no shared packages
- **No cross-project imports** - Each project stands alone
- **Independent deployment** - Update one without affecting others
- **Different tech stacks allowed** - Mix frameworks, languages, patterns

### ✅ Clear Purpose

- **`src/`** - All independent applications (API, web UI, CLI, extensions)
- **`src/services/`** - Optional companion services (embeddings server)
- **`src/api/prisma/`** - Database schema (owned by API project)
- **`docs/`** - User-facing documentation
- **Root configs** - Docker Compose, deployment templates, scripts

### ✅ Scalability

Each project can:

- Be deployed separately to different infrastructure
- Have its own CI/CD pipeline
- Scale independently based on demand
- Be maintained by different teams
- Use different databases if needed

---

## 📦 Project Independence

### How Projects Communicate

1. **API-based** (Recommended)
   - Web calls API via REST (`http://api:8000`)
   - VS Code extension calls API via REST
   - MCP server calls API via REST
   - Embeddings service called via HTTP

2. **Process-based** (CLI, migrations)
   - CLI tool runs locally, calls API
   - Migrations in `prisma/` run during deployment

3. **Database-based** (Shared schema)
   - All projects that need data use `prisma/` schema
   - But libraries are installed per-project

---

## 🚀 Building & Deploying Projects

### Build Single Project

```bash
# Build just the API
cd src/api
npm install
npm run build

# Build just the web frontend
cd src/web
npm install
npm run build
```

### Deploy Independent Project

Each project has its own `Dockerfile`:

```bash
# Deploy API to container registry
docker build src/api -t synapse-api:latest
docker push registry/synapse-api:latest

# Deploy Web to container registry
docker build src/web -t synapse-web:latest
docker push registry/synapse-web:latest
```

### Local Development

Each project can be developed independently:

```bash
# Terminal 1: API server
cd src/api && npm run dev

# Terminal 2: Web application
cd src/web && npm run dev

# Terminal 3: CLI tool
cd src/cli && npm run dev

# Web UI calls API at http://localhost:8000
```

---

## 📊 Project Responsibilities

| Project                      | Purpose              | Type             | Dependencies             | Port |
| ---------------------------- | -------------------- | ---------------- | ------------------------ | ---- |
| **src/api/**                 | REST API server      | Node.js          | Fastify, Prisma, OpenAI  | 8000 |
| **src/web/**                 | Web UI               | React+TypeScript | React, Vite, Tailwind    | 3000 |
| **src/cli/**                 | Command-line tool    | Node.js          | Commander, Axios         | —    |
| **src/mcp-server/**          | AI agent integration | Node.js          | MCP SDK, Axios           | —    |
| **src/vscode-ext/**          | IDE integration      | TypeScript       | VS Code API              | —    |
| **src/services/embeddings/** | Vector generation    | Python           | FastAPI, sentence-trans. | 8001 |

---

## 🔄 Shared Resources

### Database Schema (`src/api/prisma/`)

Used by:

- `src/api/` - Main application (owns the schema)
- `src/services/embeddings/` - Optional vector storage
- CLI tools and migrations

The API project has its own Prisma schema:

```bash
cd src/api
npm install  # Prisma already included
```

### Documentation (`docs/`)

- User-facing guides and API reference
- Deployment instructions
- Architecture diagrams
- Read-only reference for all projects

---

## ✨ Benefits of This Structure

✅ **Easy Onboarding** - New developers only need to understand one project
✅ **Parallel Development** - Teams can work independently
✅ **Flexible Scaling** - Scale one project without others
✅ **Independent Updates** - Update one without affecting others
✅ **Clear Ownership** - Each project has clear purpose
✅ **Technology Freedom** - Each project can use different tech stack
✅ **Simple CI/CD** - One workflow per project
✅ **Easier Debugging** - Isolated issues, easier to find problems

---

## 🔧 Adding a New Project

1. **Create folder** under `src/`

   ```bash
   mkdir src/myservice
   cd src/myservice
   ```

2. **Initialize with template**

   ```bash
   npm init -y
   npm install --save-dev typescript @types/node tsx
   mkdir src
   touch src/index.ts
   ```

3. **Add to documentation**
   - Update this STRUCTURE.md
   - Create `src/myservice/README.md`
   - Update main README.md

4. **Setup CI/CD**
   - Add workflow in `.github/workflows/`
   - Configure container registry
   - Test independently

---

## 📚 Next Steps

- **Contributing** - See [CONTRIBUTING.md](./CONTRIBUTING.md)
- **Development** - See [DEVELOPERS.md](./DEVELOPERS.md)
- **Architecture** - See [docs/architecture.md](./docs/architecture.md)
- **Deployment** - See [docs/deployment.md](./docs/deployment.md)

---

**Questions?** Open a [GitHub Discussion](https://github.com/shmindmaster/synapse/discussions) or check [docs/FAQ.md](./docs/FAQ.md)
