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

## 🚀 Get Started in 3 Minutes

**No configuration required** - Everything runs in Docker with pre-seeded demo data!

```bash
git clone https://github.com/shmindmaster/synapse.git
cd synapse
./quick-start.sh
```

✅ Open http://localhost:3000 and login with:
- **Email:** demomaster@pendoah.ai
- **Password:** Pendoah1225

**Windows users:** Use `quick-start.bat` instead

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

Synapse works beyond just code. Deploy it for:

### Engineering Teams

- **Codebase Search** - Semantic search across codebases
- **Documentation Synthesis** - Unify and query scattered technical docs
- **Architecture Understanding** - Quick onboarding for new team members
- **API Reference** - Instant answers about your internal APIs

### Enterprise & Legal

- **Contract Analysis** - Clause extraction and risk identification
- **Regulatory Compliance** - Policy synthesis and audit trails
- **Knowledge Management** - Internal wiki unification
- **Employee Onboarding** - Procedure discovery and learning

### Healthcare & Research

- **Medical Records** - Patient history synthesis (with privacy controls)
- **Scientific Literature** - Research paper analysis and gap identification
- **Clinical Documentation** - Synthesis of complex medical information

### Operations

- **Customer Support** - Ticket synthesis and response recommendations
- **Incident Response** - Knowledge base query for troubleshooting
- **Process Documentation** - Searchable procedure knowledge base

---

## 🛠️ Manual Setup

For advanced users who want to run Synapse without Docker:

### Prerequisites

- Node.js 20 or higher
- PostgreSQL 14+ with pgvector extension
- pnpm (recommended package manager)

### Installation

```bash
# Clone the repository
git clone https://github.com/shmindmaster/synapse.git
cd synapse

# Install dependencies
pnpm install

# Set up environment variables
cp .env.example .env
# Edit .env with your configuration

# Set up database
pnpm db:generate
pnpm db:migrate

# Start development servers
pnpm dev
```

The frontend will be available at `http://localhost:3000` and the backend at `http://localhost:8000`.

### Docker Deployment

Alternatively, use Docker Compose to run everything with one command:

```bash
# Clone the repository
git clone https://github.com/shmindmaster/synapse.git
cd synapse

# Configure environment
cp .env.example .env
# Edit .env with your configuration

# Start all services (PostgreSQL, backend, frontend)
docker-compose up -d

# View logs
docker-compose logs -f

# Stop services
docker-compose down
```

See the [Deployment Guide](./docs/deployment.md) for more deployment options.

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

Synapse is highly configurable through environment variables. Copy `.env.example` to `.env` and customize:

```bash
# Database
DATABASE_URL="postgresql://user:pass@localhost:5432/synapse"

# AI Models (supports multiple providers)
MODEL_CHAT="gpt-4o"              # Primary chat model
MODEL_FAST="gpt-3.5-turbo"       # Fast operations
MODEL_EMBEDDING="text-embedding-3-small"  # Embeddings

# API Keys (optional, for AI providers)
OPENAI_API_KEY="your-key-here"
GROQ_API_KEY="your-key-here"
GEMINI_API_KEY="your-key-here"

# Storage (optional, for file uploads)
OBJECT_STORAGE_ENDPOINT="https://your-s3-endpoint.com"
OBJECT_STORAGE_KEY="your-key"
OBJECT_STORAGE_SECRET="your-secret"
OBJECT_STORAGE_BUCKET="your-bucket"
```

### Supported AI Providers

- **OpenAI** - GPT-4, GPT-3.5, text-embedding-3
- **Anthropic** - Claude models (coming soon)
- **Groq** - Fast LLaMA inference
- **Google** - Gemini models
- **Ollama** - Local models (coming soon)
- **LM Studio** - Local models (coming soon)

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
# Development
pnpm dev          # Start frontend + backend in dev mode
pnpm build        # Build all apps for production
pnpm start        # Start production server

# Database
pnpm db:generate  # Generate Prisma client
pnpm db:migrate   # Run database migrations
pnpm db:studio    # Open Prisma Studio (GUI)
pnpm db:seed      # Seed database with demo data

# CLI
pnpm cli          # Run CLI tool

# MCP Server
pnpm mcp:dev      # Start MCP server in dev mode

# Linting
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

## 🎓 Documentation

Comprehensive documentation is available in the [`docs/`](./docs) directory:

- [Architecture](./docs/architecture.md) - System design and components
- [API Reference](./docs/api-reference.md) - Complete API documentation
- [Deployment Guide](./docs/deployment.md) - Deploy on various platforms (Docker, Vercel, Railway, AWS, etc.)
- [VS Code Extension](./docs/vscode-extension.md) - Using the VS Code extension
- [MCP Server](./docs/mcp-server.md) - MCP server integration guide

---

## 🤝 Contributing

We love contributions! Please read our [Contributing Guide](CONTRIBUTING.md) to learn how you can help.

### Ways to Contribute

- 🐛 **Report bugs** - Found a bug? [Open an issue](https://github.com/shmindmaster/synapse/issues)
- 💡 **Request features** - Have an idea? [Start a discussion](https://github.com/shmindmaster/synapse/discussions)
- 📝 **Improve docs** - Documentation can always be better
- 🔧 **Submit PRs** - Fix bugs or add features
- ⭐ **Star the repo** - Show your support!

### Development Setup

```bash
# Fork the repository
git clone https://github.com/YOUR_USERNAME/synapse.git
cd synapse

# Install dependencies
pnpm install

# Create a branch
git checkout -b feature/your-feature-name

# Make your changes and commit
git commit -m "feat: add amazing feature"

# Push and create a PR
git push origin feature/your-feature-name
```

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

## 🌟 Why Synapse?

### Privacy First

Your code is your intellectual property. Synapse runs entirely on your infrastructure, ensuring your code never leaves your control.

### Open Source

Synapse is MIT licensed and fully open source. No vendor lock-in, no hidden costs, no data collection.

### Extensible

Built with a modular architecture, Synapse can be extended to support new AI providers, IDE integrations, and use cases.

### Developer Experience

Beautiful UI, powerful CLI, IDE integrations—Synapse fits seamlessly into your workflow.

---

## 📊 Use Cases

- **Onboarding** - Help new team members understand large codebases quickly
- **Code Review** - Find similar patterns and potential issues
- **Documentation** - Generate documentation from code
- **Refactoring** - Understand code dependencies before making changes
- **Research** - Explore open-source projects and learn from them
- **Compliance** - Ensure your code stays within your infrastructure

---

## 📄 License

Synapse is [MIT licensed](LICENSE).

---

## 💬 Community & Support

- **GitHub Issues** - [Report bugs or request features](https://github.com/shmindmaster/synapse/issues)
- **GitHub Discussions** - [Ask questions and share ideas](https://github.com/shmindmaster/synapse/discussions)
- **Contributing** - [See our contributing guide](CONTRIBUTING.md)

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
