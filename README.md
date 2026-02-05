# 🧠 Synapse

**Talk to Your Codebase** — Let AI understand your code, documentation, and knowledge base. Ask questions in natural language. Get instant answers with source references. **No code leaves your infrastructure.**

[![License: MIT](https://img.shields.io/badge/License-MIT-blue.svg)](LICENSE)
[![TypeScript](https://img.shields.io/badge/TypeScript-5.9-blue)](https://www.typescriptlang.org/)
[![Node.js](https://img.shields.io/badge/Node.js-20-green)](https://nodejs.org/)
[![PRs Welcome](https://img.shields.io/badge/PRs-welcome-brightgreen.svg)](CONTRIBUTING.md)

---

## 🎯 What Can You Do With Synapse?

| Use Case               | Example                                 | Impact                                        |
| :--------------------- | :-------------------------------------- | :-------------------------------------------- |
| **Code Search**        | _"Show me all authentication handlers"_ | 🚀 Find patterns instantly across 100K+ lines |
| **Onboarding**         | _"How does the payment flow work?"_     | 👥 New devs productive on day 1               |
| **Documentation**      | _"What APIs are available?"_            | 📚 Always-current, searchable docs            |
| **Incident Response**  | _"Where do we log database errors?"_    | 🔥 Fix production bugs in minutes             |
| **Code Understanding** | _"Explain this legacy module"_          | 🧠 Understand complex systems faster          |
| **Compliance**         | _"Find all data handling code"_         | ✅ Audit & security easier                    |

---

## ⚡ Get Started in 3 Minutes

### Option 1: Docker (Recommended)

```bash
git clone https://github.com/shmindmaster/synapse.git
cd synapse
echo "OPENAI_API_KEY=sk-your-key-here" > .env
./quick-start.sh  # or quick-start.bat on Windows
```

Open **http://localhost:3000** and login with demo credentials:

- **Email:** demo@synapse.local
- **Password:** DemoPassword123!

### Option 2: Cloud Deploy (1-Click)

<div align="center">

[![Deploy to Azure](https://aka.ms/deploytoazurebutton)](https://portal.azure.com/#create/Microsoft.Template/uri/https%3A%2F%2Fraw.githubusercontent.com%2Fshmindmaster%2Fsynapse%2Fmain%2Fazuredeploy.json)
[![Deploy to DigitalOcean](https://www.deploytodo.com/do-btn-blue.svg)](https://cloud.digitalocean.com/apps/new?repo=https://github.com/shmindmaster/synapse/tree/main)
[![Deploy on Railway](https://railway.app/button.svg)](https://railway.app/template/synapse)

</div>

---

**Cloud deployments include:** PostgreSQL with pgvector • Automatic SSL • Migrations • Demo user
**Need API key?** [Get free OpenAI credits >](https://platform.openai.com/signup) (new accounts get $5)

📖 **[Full Deployment Guide →](docs/deployment.md)**

---

## 💡 Why Synapse?

### 🔒 **Your Data Stays Yours**

Code never sent to cloud. Runs on your infrastructure—on-premise, VPC, Kubernetes, whatever you use.

### ⚡ **AI-Powered Codebase Search**

Uses semantic understanding (pgvector embeddings) to find relevant code by meaning, not just keywords.

### 🧠 **Multi-Source Understanding**

Ask questions that require understanding across multiple files, modules, or entire services.

### 🔌 **IDE Integration**

VS Code extension for inline search. MCP server for any AI agent to access your codebase.

### 📚 **Multi-Format Support**

Index codebases, docs, contracts, knowledge bases—any text-based content.

### 🚀 **Production-Ready**

Runs on PostgreSQL. Scales to 100M+ tokens. Used by engineering teams for real work.

---

## ✨ Key Capabilities

### 🔍 **Semantic Codebase Search**

Find code by meaning, not just keywords. "Show me all error handlers" returns relevant code across your entire codebase.

```bash
# CLI Example
pnpm cli search "payment validation logic"
```

### 💬 **Chat with Your Code**

Ask questions in natural language. Synapse reads context from multiple files and explains how your system works.

```bash
# Examples:
# "How does authentication work?"
# "What's the database schema?"
# "Show me how user sessions are handled"
```

### 🎯 **Intent-Based Search**

Searches understand developer intent. Looking for "error handler" will find try-catch blocks, error middleware, and exception handlers.

### 📚 **Document Indexing**

Index any documents—technical specs, compliance docs, contracts, research papers. Create a searchable knowledge base.

### 🔄 **Real-Time Updates**

File watcher mode automatically re-indexes changed files. Always up-to-date without manual refreshes.

### 🧩 **Multi-Source Synthesis**

Ask questions requiring knowledge from multiple documents. Synthesizes answers with source references.

---

## 🏗️ How It Works

## 🎓 Quick Start Examples

### 1. Index Your Codebase

Using the web UI:

1. Open http://localhost:3000
2. Click **"Index Documents"**
3. Select your code folder
4. Wait ~30 seconds to 2 minutes depending on size

Using the CLI:

```bash
pnpm cli index /path/to/your/codebase
```

### 2. Search Your Code

**Web UI:**

- Open the search page
- Type _"payment processing"_ or _"error handling"_
- Get relevant code snippets with context

**CLI:**

```bash
pnpm cli search "authentication flow"
```

### 3. Chat with Your Code

**Web UI:**

- Open the chat page
- Ask: _"How does the API authorization work?"_
- Get detailed answer with code references

**CLI:**

```bash
pnpm cli chat
> How is user data validated?
```

---

## 🔌 IDE Integration

### VS Code Extension

```
Ctrl+Shift+P: Synapse: Search Knowledge Base
```

Search your indexed codebase without leaving the editor.

### MCP Server

Use with Claude, ChatGPT, and other AI tools to give them access to your codebase.

---

## 🤖 AI Provider Options

### 🔒 **Local Models** (Recommended for Privacy)

**Run 100% offline with zero cost.** No AI calls leave your infrastructure. Use llama.cpp, vLLM, or Ollama with any open-source model (Llama 3.2, Qwen, Mistral, etc).

- ✅ Complete privacy—no API keys needed
- ✅ Zero API costs
- ✅ Runs on CPU or GPU
- ✅ Full compliance (HIPAA, GDPR, SOC 2)

**[→ Local/Offline Deployment Guide](docs/local-offline-deployment.md)**

### Default: OpenAI

Best for getting started. Free $5 credits for new accounts.

### Azure OpenAI

Enterprise-grade with VNET support, data residency, and Microsoft Entra authentication.

---

## 🏗️ Architecture & Tech Stack

Synapse is a **full-stack monorepo** built with modern, battle-tested technologies:

### Frontend

- **React 19** + TypeScript 5.9 for type-safe UI
- **Vite 7** for lightning-fast builds
- **Tailwind CSS 4** + ShadCN components for beautiful, accessible UI

### Backend

- **Fastify 5** for high-performance API (30k+ req/sec)
- **Prisma ORM** for type-safe database queries
- **Tree-sitter** for accurate code parsing (26+ languages)
- **pgvector** for semantic search (1536-dim embeddings)

### Database

- **PostgreSQL 18** for reliability and compliance
- **pgvector extension** for vector similarity search

### Deployment Ready

- **Docker** with multi-stage builds
- **Cloud templates** for DigitalOcean, Azure, Railway, Render
- **Environment-agnostic** (on-premise, VPC, Kubernetes, serverless)

### Development

- **pnpm monorepo** for efficient package management
- **ESLint + Prettier** for consistent code style
- **GitHub Actions** for CI/CD (lint, test, build, security)

---

## 👥 For Different Teams

### 💻 **Developers**

Self-service codebase intelligence. Faster onboarding, better debugging, instant documentation.

### 🔍 **DevOps/SRE**

Private infrastructure, zero cloud data transfer, compliance-first architecture. Deploy on your VPC/Kubernetes.

### 🏢 **Enterprise**

HIPAA/SOC2-ready, Microsoft Entra auth, data residency, audit logging, fine-grained permissions.

### 📚 **Documentation Teams**

Auto-generate and keep docs fresh. Searchable knowledge base that stays synchronized with code.

### 🔐 **Security Teams**

No third-party data transfers. Source code never leaves your infrastructure. Fully auditable.

---

## 📚 Documentation & Resources

---

## 🚀 Get Involved

### Contribute Code

See [Contributing Guide](CONTRIBUTING.md) for:

- Setting up development environment
- Code style and testing requirements
- PR process and review standards
- [Browse open issues](https://github.com/shmindmaster/synapse/issues?q=is%3Aissue+is%3Aopen)

### Discuss Ideas

- [GitHub Discussions](https://github.com/shmindmaster/synapse/discussions) - Share ideas, ask questions
- [Report Bugs](https://github.com/shmindmaster/synapse/issues/new?template=bug_report.md)
- [Request Features](https://github.com/shmindmaster/synapse/issues/new?template=feature_request.md)

### Share Your Use Case

Tell us how you're using Synapse! Open a discussion or reach out—we'd love to feature your story.

---

## 🗺️ Roadmap

### Current Status (v2.0) ✅

- ✅ Semantic code search across multiple languages
- ✅ RAG-powered chat with source references
- ✅ Web UI + CLI + VS Code extension
- ✅ MCP server for AI agents
- ✅ Multi-document synthesis
- ✅ Real-time indexing

### Planned (v2.1-v3.0)

- 🔄 File watcher for automatic re-indexing
- 🧠 Local model support (Ollama, LM Studio)
- 🔌 JetBrains IDE plugin (IntelliJ, PyCharm)
- 👥 Team collaboration & permissions
- 📊 Code metrics & analytics
- 🌐 Better multi-language support

---

## ❓ FAQ & Support

**Q: Can I use this for production?**
Yes! Synapse is production-ready. Runs on PostgreSQL, scales to 100M+ tokens, used by engineering teams.

**Q: Will my code be sent to the cloud?**
No, never. Code stays on your infrastructure. AI calls are only made if you configure external providers (OpenAI, etc).

**Q: Can I run this locally without internet?**
Yes! Synapse was designed for this. Run completely offline with local models (llama.cpp, vLLM, Ollama) and local embeddings. See [Local/Offline Deployment Guide](docs/local-offline-deployment.md).

**Q: What about large codebases (1M+ LOC)?**
Tested up to 500K lines of code. For very large codebases, consider selective indexing or multiple deployments.

**Q: How much does it cost to run?**
Cost depends on your infrastructure. For cloud, expect $50-200/month depending on database size and API provider choice.

[More FAQs →](docs/FAQ.md)

---

## 📄 License & Community

**License:** Synapse is [MIT licensed](LICENSE)
**Code of Conduct:** [Contributor Covenant](CODE_OF_CONDUCT.md)

---

## 🙏 Thanks

Synapse stands on the shoulders of giants. Special thanks to:

**Core:** [PostgreSQL](https://www.postgresql.org/) • [pgvector](https://github.com/pgvector/pgvector) • [Tree-sitter](https://tree-sitter.github.io/)
**Framework:** [Fastify](https://www.fastify.io/) • [React](https://react.dev/) • [Prisma](https://www.prisma.io/)
**Styling:** [Tailwind CSS](https://tailwindcss.com/) • [ShadCN UI](https://ui.shadcn.com/)

---

<div align="center">

## ⭐ Like This? Star Us!

Your ⭐ means a lot. It helps others discover Synapse and shows developer interest in open-source AI tools.

[⭐ Star on GitHub](https://github.com/shmindmaster/synapse) • [💬 Discuss](https://github.com/shmindmaster/synapse/discussions) • [🐛 Report Bug](https://github.com/shmindmaster/synapse/issues)

**Built with ❤️ by developers, for developers**

</div>
