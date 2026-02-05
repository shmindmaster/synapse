# Changelog

All notable changes to this project will be documented in this file.

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.0.0/),
and this project adheres to [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

## [0.1.0] - 2026-02-05

### 🎉 First Public Release

This is the first stable public release of Synapse — AI-powered semantic search for codebases, documentation, and knowledge bases.

### ✨ Added

#### Core Features
- **Semantic Code Search** — Find code by meaning using pgvector embeddings (1536-dim)
- **AI-Powered Chat** — Natural language Q&A with multi-document context synthesis
- **Real-Time Indexing** — File watching with automatic re-indexing
- **Multi-Format Support** — Index code, docs, contracts, and any text content
- **Source Citations** — Every answer includes file paths and line numbers

#### Deployment & Infrastructure
- **🔒 Local/Offline Mode** — 100% offline with local LLM models (Ollama, vLLM, llama.cpp)
- **☁️ Cloud AI Support** — OpenAI, Azure OpenAI, Anthropic, Groq, Gemini
- **🐳 Docker Deployment** — One-command Docker Compose setup
- **🚀 Cloud Platforms** — One-click deploy to DigitalOcean, Railway, Azure, Render
- **Privacy-First Architecture** — Code never leaves your infrastructure (offline mode)

#### Developer Tools
- **VS Code Extension** — Search indexed codebase from editor
- **MCP Server** — Model Context Protocol for AI agents (Claude, ChatGPT)
- **CLI Interface** — Command-line tools for index/search/chat
- **Web UI** — React 19 frontend with Tailwind CSS and ShadCN

#### Technical Stack
- **Frontend:** React 19, TypeScript 5.9, Vite 7, Tailwind CSS 4
- **Backend:** Fastify 5 (30K+ req/sec), Prisma ORM, Tree-sitter (26+ languages)
- **Database:** PostgreSQL 18 with pgvector extension
- **Architecture:** Independent services (not monorepo) for true scalability

### 📚 Documentation

- Comprehensive README with offline-first quickstart
- Deployment guides for all major platforms
- Local/offline deployment guide (privacy-focused)
- Architecture documentation
- API reference
- FAQ and troubleshooting
- Community profile (issue templates, PR template, Code of Conduct)
- Enterprise support information

### 🤝 Community & Support

- GitHub Discussions for Q&A and ideas
- Issue templates for bugs, features, and documentation
- Contributing guidelines with development setup
- Code of Conduct (Contributor Covenant)
- MIT License
- SUPPORT.md with response time expectations

### 🔒 Security & Compliance

- Privacy-first design (no external data transfer in offline mode)
- HIPAA/GDPR/SOC2 ready (deploy on your infrastructure)
- Security policy with responsible disclosure process
- Audit logging for compliance

### ⚠️ Known Limitations

- Large codebases (1M+ LOC) may need selective indexing
- Initial indexing takes several minutes for large repos
- Cloud AI providers have rate limits and variable costs

### 🚧 Coming Soon (v0.2.0)

- Automatic file watcher improvements
- JetBrains IDE plugins (IntelliJ, PyCharm)
- Team collaboration and permissions
- Code metrics and analytics
- Multi-language support improvements

---

## Unreleased

### Planned Features

- Ollama integration for offline LLMs
- LM Studio integration
- Advanced privacy controls (PII masking)
- Multi-format document ingestion (PDF, Word, Email)
- Database record integration
- API connector for real-time data sources
- Advanced analytics and usage insights
- Webhook integrations
- Custom analysis templates
- Enterprise authentication options
