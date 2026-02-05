# 🧠 Synapse

**Privacy-First RAG Platform** - Transform any document, codebase, or knowledge base into an intelligent, queryable system. Run entirely on your infrastructure—your data never leaves your control.

[![License: MIT](https://img.shields.io/badge/License-MIT-blue.svg)](LICENSE)
[![TypeScript](https://img.shields.io/badge/TypeScript-5.9-blue)](https://www.typescriptlang.org/)
[![Node.js](https://img.shields.io/badge/Node.js-20-green)](https://nodejs.org/)
[![PRs Welcome](https://img.shields.io/badge/PRs-welcome-brightgreen.svg)](CONTRIBUTING.md)
[![Monorepo](https://img.shields.io/badge/Monorepo-pnpm-4B8BBE.svg)](pnpm-workspace.yaml)

<div align="center">
  <img src="https://img.shields.io/github/stars/shmindmaster/synapse?style=social" alt="GitHub stars">
  <img src="https://img.shields.io/github/forks/shmindmaster/synapse?style=social" alt="GitHub forks">
  <img src="https://img.shields.io/github/contributors/shmindmaster/synapse" alt="Contributors">
</div>

---

## 🚀 Quick Deploy to Cloud (1-Click)

**Production-ready in 5 minutes** - One-click deployment to major cloud platforms with everything pre-configured!

<div align="center">

[![Deploy to Azure](https://aka.ms/deploytoazurebutton)](https://portal.azure.com/#create/Microsoft.Template/uri/https%3A%2F%2Fraw.githubusercontent.com%2Fshmindmaster%2Fsynapse%2Fmain%2Fazuredeploy.json)
[![Deploy to DigitalOcean](https://www.deploytodo.com/do-btn-blue.svg)](https://cloud.digitalocean.com/apps/new?repo=https://github.com/shmindmaster/synapse/tree/main)
[![Deploy on Railway](https://railway.app/button.svg)](https://railway.app/template/synapse)

[![Deploy to Render](https://render.com/images/deploy-to-render-button.svg)](https://render.com/deploy?repo=https://github.com/shmindmaster/synapse)
[![Deploy to Heroku](https://www.herokucdn.com/deploy/button.svg)](https://heroku.com/deploy?template=https://github.com/shmindmaster/synapse)

**All deployments include:** PostgreSQL with pgvector • Automatic SSL • Migrations • Demo user

⚠️ **Required:** OpenAI API key ([get free credits](https://platform.openai.com/signup)) for chat, search & embeddings

📖 **[Complete Deployment Guide →](docs/deployment.md)**

</div>

---

## 🐳 Deploy with Docker Locally (3 Minutes)

**Fastest local setup** - One command to get everything running!

```bash
# Clone and navigate
git clone https://github.com/shmindmaster/synapse.git
cd synapse

# Add your OpenAI API key (REQUIRED for AI features)
echo "OPENAI_API_KEY=sk-your-openai-key-here" > .env

# Start everything with Docker Compose
./quick-start.sh  # Linux/Mac
# OR
quick-start.bat   # Windows

# That's it! 🎉
```

✅ Open http://localhost:3000 and login with:

- **Email:** demomaster@pendoah.ai
- **Password:** Pendoah1225

**What gets deployed:**

- PostgreSQL 16 with pgvector extension
- Backend API server (port 8000)
- Frontend React app (port 3000)
- Auto-migrations & demo user seeding

**Get OpenAI API Key:** [platform.openai.com/api-keys](https://platform.openai.com/api-keys)

- New accounts get $5 free credits
- Sufficient for testing/development

**Stop Docker:**

```bash
docker compose down
```

**View Logs:**

```bash
docker compose logs -f
```

---

## 🤖 AI Provider Options

**Choose how you want to power Synapse's AI features:**

### Option 1: Standard OpenAI (Default)

Perfect for getting started quickly:

- ✅ Easiest setup - just add API key
- ✅ High quality (GPT-4, GPT-3.5)
- ✅ $5 free credits for new accounts
- 📖 [Already documented above](#deploy-with-docker-locally-3-minutes)

### Option 2: Azure OpenAI (Enterprise)

For organizations using Microsoft Azure:

- ✅ Enterprise SLA & compliance
- ✅ Private networking (VNET)
- ✅ Regional data residency
- ✅ Microsoft Entra ID auth
- 📖 **[Azure OpenAI Integration Guide →](docs/azure-openai-integration.md)**

### Option 3: Local/Offline Models (Privacy-First)

Run completely disconnected without cloud AI services:

- ✅ **100% offline** - no internet needed
- ✅ **Zero AI costs** - run on your hardware
- ✅ **Complete privacy** - data never leaves your machine
- ✅ Uses llama.cpp, vLLM, sentence-transformers
- 📖 **[Local/Offline Deployment Guide →](docs/local-offline-deployment.md)**

---

📚 [Full Documentation](SETUP.md) | [Architecture](docs/architecture.md) | [Troubleshooting](docs/FAQ.md)

---

## ✨ What is Synapse?

Synapse is an **open-source, privacy-first RAG (Retrieval Augmented Generation) platform** that transforms any document collection—codebases, technical documentation, contracts, knowledge bases, research papers—into an intelligent, queryable system.

Unlike cloud-based alternatives, Synapse runs **entirely on your infrastructure** with zero data leaving your control. Perfect for enterprises, researchers, and developers who need intelligent knowledge retrieval without sacrificing privacy or compliance.

### 🎯 Key Features

- **🔍 Semantic Search** - Find relevant information by meaning, not just keywords
- **💬 RAG-Powered Chat** - Ask questions about your documents in natural language
- **📚 Intelligent Classification** - Automatically classify and index any document type
- **🔄 Real-Time Indexing** - Watch mode for incremental file tracking and updates
- **🧩 Multi-Source Synthesis** - Synthesize information across multiple documents
- **📊 Knowledge Graph Visualization** - Visualize relationships and connections
- **🔐 100% Local-First** - Your data stays on your infrastructure
- **🎨 Beautiful UI** - Modern, intuitive interface built with React and Tailwind CSS
- **🔌 IDE Integration** - VS Code extension and MCP server for AI agents

---

## 💼 Use Cases

**Engineering:** Codebase search, documentation synthesis, onboarding, API reference
**Enterprise:** Contract analysis, compliance, knowledge management, employee onboarding
**Healthcare:** Medical records synthesis, scientific literature analysis, clinical docs
**Operations:** Customer support, incident response, process documentation

---

## 🛠️ Manual Setup

For advanced users who want to run without Docker:

**Prerequisites:** Node.js 20+, PostgreSQL 14+ with pgvector, pnpm

```bash
git clone https://github.com/shmindmaster/synapse.git
cd synapse
pnpm install
cp .env.example .env  # Edit with your configuration
pnpm db:generate && pnpm db:migrate
pnpm dev  # Frontend: localhost:3000, Backend: localhost:8000
```

---

## 📦 What's Inside?

This monorepo contains multiple independent services:

### Apps

- **`apps/frontend`** - React web application with modern UI
- **`apps/backend`** - Fastify API server with RAG capabilities
- **`apps/cli`** - Command-line tool for indexing and search
- **`apps/mcp-server`** - Model Context Protocol server for AI agents
- **`apps/vscode-extension`** - VS Code extension for inline search

### Architecture

```
┌─────────────────┐
│   VS Code       │
│   Extension     │
└────────┬────────┘
         │
┌────────▼────────┐
│   CLI Tool      │
└────────┬────────┘
         │
┌────────▼────────┐      ┌──────────────┐
│   MCP Server    │──────▶│   AI Agents  │
└────────┬────────┘      └──────────────┘
         │
         │ HTTP/REST
         │
┌────────▼────────────────────────────┐
│         Backend API                 │
│  ┌──────────────────────────────┐   │
│  │  Vector Store Service        │   │
│  │  (PostgreSQL + pgvector)     │   │
│  └──────────────────────────────┘   │
│  ┌──────────────────────────────┐   │
│  │  File Watcher Service        │   │
│  │  (Incremental Indexing)      │   │
│  └──────────────────────────────┘   │
│  ┌──────────────────────────────┐   │
│  │  AST Parser Service          │   │
│  │  (Tree-sitter)               │   │
│  └──────────────────────────────┘   │
└────────┬────────────────────────────┘
         │
┌────────▼────────┐
│   PostgreSQL    │
│   + pgvector    │
└─────────────────┘
```

---

## 💡 Usage Examples

### Index Any Documents

Using the CLI:

```bash
# Index a codebase
pnpm cli index /path/to/codebase

# Index contracts, PDFs, or documentation
pnpm cli index /path/to/documents
```

Using the web interface:

1. Navigate to `http://localhost:3000`
2. Click "Index Documents"
3. Select the directory or files to index
4. Wait for the indexing process to complete

### Semantic Search Across Documents

Using the CLI:

```bash
pnpm cli search "payment processing flow"
pnpm cli search "GDPR compliance requirements"
pnpm cli search "error handling patterns"
```

Using the web interface:

1. Navigate to the search page
2. Type your query in natural language
3. Get relevant results with context

### Chat with Your Knowledge Base

Using the CLI:

```bash
pnpm cli chat
> How does authentication work?
> What are the compliance requirements?
> Summarize the contract terms
```

Using the web interface and RAG:

1. Navigate to the chat page
2. Ask questions in natural language
3. Get intelligent responses with source references

### VS Code Integration

Use the VS Code extension to search your indexed knowledge without leaving your editor:

```
Ctrl+Shift+P: Synapse: Search Knowledge Base
```

---

## 🔧 Configuration

Configure via `.env` file. See `.env.example` for all options.

**AI Providers Supported:** OpenAI, Azure OpenAI, Local models (llama.cpp/vLLM), Groq, Gemini, Anthropic (coming soon)

---

## 🛠️ Development

### Project Structure

```
synapse/
├── apps/
│   ├── backend/          # Fastify API server
│   ├── frontend/         # React web app
│   ├── cli/              # Command-line tool
│   ├── mcp-server/       # MCP protocol server
│   └── vscode-extension/ # VS Code extension
├── packages/
│   └── shared/           # Shared utilities
├── prisma/               # Database schema and migrations
├── docs/                 # Documentation
└── scripts/              # Development scripts
```

### Available Scripts

```bash
pnpm dev          # Start dev mode
pnpm build        # Build for production
pnpm db:migrate   # Run migrations
pnpm db:studio    # Open database GUI
pnpm cli          # Run CLI tool
pnpm lint         # Lint all apps
```

### Tech Stack

**Frontend:**

- React 19
- TypeScript 5.9
- Vite 7
- Tailwind CSS 4
- ShadCN UI Components

**Backend:**

- Fastify 5
- TypeScript 5.9
- Prisma ORM
- PostgreSQL + pgvector
- Tree-sitter (AST parsing)

**Tools:**

- pnpm (package manager)
- ESLint (linting)
- Prettier (formatting)

---

## 📚 Documentation

- [Architecture](./docs/architecture.md) | [API Reference](./docs/api-reference.md) | [Deployment Guide](./docs/deployment.md)
- [Azure OpenAI](./docs/azure-openai-integration.md) | [Local Models](./docs/local-offline-deployment.md)
- [Enterprise Guide](./docs/enterprise.md) | [VS Code Extension](./docs/vscode-extension.md) | [MCP Server](./docs/mcp-server.md)

---

## 🤝 Contributing

Contributions welcome! [Contributing Guide](CONTRIBUTING.md) | [Report Bugs](https://github.com/shmindmaster/synapse/issues) | [Discussions](https://github.com/shmindmaster/synapse/discussions)

---

## 🗺️ Roadmap

### Current Status (v2.0)

- ✅ Semantic code search
- ✅ RAG-powered chat
- ✅ Document classification
- ✅ Web interface
- ✅ CLI tool
- ✅ MCP server
- ✅ VS Code extension (alpha)

### Coming Soon

- 🔄 Incremental indexing with file watching
- 🧠 Better local AI model support (Ollama, LM Studio)
- 🔌 JetBrains plugin (IntelliJ, PyCharm, etc.)
- 📊 Advanced code analytics and metrics
- 🌐 Multi-language support improvements
- 👥 Team collaboration features
- 🔐 Enhanced security and permissions

---

## 📄 License

Synapse is [MIT licensed](LICENSE).

---

---

## 🙏 Acknowledgments

Synapse is built on top of amazing open-source projects:

- [PostgreSQL](https://www.postgresql.org/) & [pgvector](https://github.com/pgvector/pgvector)
- [Tree-sitter](https://tree-sitter.github.io/)
- [Fastify](https://www.fastify.io/)
- [React](https://react.dev/)
- [Prisma](https://www.prisma.io/)
- [Tailwind CSS](https://tailwindcss.com/)
- [ShadCN UI](https://ui.shadcn.com/)

---

<div align="center">
  <p><strong>Built with ❤️ by the open-source community</strong></p>
  <p>
    <a href="https://github.com/shmindmaster/synapse">⭐ Star us on GitHub</a> •
    <a href="https://github.com/shmindmaster/synapse/issues">🐛 Report a Bug</a> •
    <a href="https://github.com/shmindmaster/synapse/discussions">💡 Request a Feature</a>
  </p>
</div>
