# 📚 Synapse Documentation

Welcome to the Synapse documentation! This guide will help you deploy, configure, and use Synapse for AI-powered codebase intelligence.

---

## 🚀 Getting Started

### New Users Start Here

1. **[⚡ Quickstart Guide](../README.md#-get-started-in-under-2-minutes)** — Get running in 2 minutes  
   Choose between local/offline (private) or cloud AI (fast).

2. **[❓ FAQ](FAQ.md)** — Common questions and troubleshooting  
   Check here first if you run into issues.

3. **[🎯 Use Cases](../README.md#-what-can-you-do-with-synapse)** — See what you can build  
   Code search, onboarding, documentation, incident response, and more.

---

## 📖 Core Documentation

### Deployment & Configuration

- **[🚀 Cloud Deployment Guide](deployment.md)**  
  Deploy to DigitalOcean, Railway, Azure, Render, or Vercel.  
  Includes database setup, environment variables, and CI/CD.

- **[🔒 Local/Offline Deployment](local-offline-deployment.md)**  
  100% private setup with local LLM models (Ollama, vLLM, llama.cpp).  
  Perfect for HIPAA/GDPR/SOC2 compliance.

### Architecture & Development

- **[🏗️ Architecture Overview](architecture.md)**  
  System design, data flow, tech stack, and extension points.  
  Understand how Synapse works under the hood.

- **[🔧 API Reference](api-reference.md)**  
  REST API endpoints, request/response formats, and authentication.  
  For developers integrating with Synapse.

- **[📁 Project Structure](../STRUCTURE.md)**  
  Folder organization, independence principles, and build system.  
  How the codebase is organized.

- **[👨‍💻 Developer Guide](../DEVELOPERS.md)**  
  Development setup, workflows, testing, and contribution guide.  
  For contributors and maintainers.

---

## 🛠️ Tools & Integrations

### IDE Extensions

- **[VS Code Extension](../src/vscode-ext/README.md)**  
  Search your indexed codebase without leaving VS Code.  
  Install from marketplace or build locally.

### AI Agents

- **[MCP Server](../src/mcp-server/README.md)**  
  Model Context Protocol server for Claude, ChatGPT, and other AI agents.  
  Give agents access to your codebase.

### Command-Line

- **CLI Tool** — Command-line interface for indexing, search, and chat (documentation coming soon)

---

## 📋 Project Information

### For Contributors

- **[🤝 Contributing Guide](../CONTRIBUTING.md)**  
  How to contribute code, documentation, or help others.  
  Includes development setup and PR guidelines.

- **[📜 Code of Conduct](../CODE_OF_CONDUCT.md)**  
  Our commitment to a welcoming, inclusive community.

- **[🔒 Security Policy](../SECURITY.md)**  
  How to report security vulnerabilities responsibly.

### Project Status

- **[📝 Changelog](../CHANGELOG.md)**  
  Version history and release notes.

---

## 💬 Getting Help

### Community Support

- **[💬 GitHub Discussions](https://github.com/shmindmaster/synapse/discussions)**  
  Ask questions, share ideas, and connect with other users.

- **[🐛 Report a Bug](https://github.com/shmindmaster/synapse/issues/new?template=bug_report.md)**  
  Found an issue? Let us know!

- **[✨ Request a Feature](https://github.com/shmindmaster/synapse/issues/new?template=feature_request.md)**  
  Have an idea? We'd love to hear it!

### Enterprise Support

- **[📞 Support Options](../SUPPORT.md)**  
  Community support, SLA-backed enterprise support, and commercial inquiries.

- **[🏢 Enterprise Solutions](../README.md#-enterprise--commercial-support)**  
  Custom deployment, compliance assistance, priority support.

---

## 🔗 Quick Links

| Resource              | Link                                               |
| :-------------------- | :------------------------------------------------- |
| **GitHub Repository** | https://github.com/shmindmaster/synapse            |
| **Live Demo**         | https://synapse.trial.com _(coming soon)_          |
| **Issue Tracker**     | https://github.com/shmindmaster/synapse/issues     |
| **Discussions**       | https://github.com/shmindmaster/synapse/discussions|
| **Changelog**         | [CHANGELOG.md](../CHANGELOG.md)                    |
| **License**           | [MIT License](../LICENSE)                          |

---

## 📚 Documentation Structure

Not sure where to find something? Here's how the docs are organized:

```
docs/
├── README.md                      # ← You are here (documentation index)
├── deployment.md                  # Cloud platform deployment guides
├── local-offline-deployment.md    # Privacy-first local setup
├── architecture.md                # System design and tech stack
├── api-reference.md               # REST API documentation
└── FAQ.md                         # Common questions and troubleshooting

Root Documentation Files:
├── README.md                      # Main project README
├── DEVELOPERS.md                  # Development guide for contributors
├── STRUCTURE.md                   # Project folder structure
├── CONTRIBUTING.md                # Contribution guidelines
├── CHANGELOG.md                   # Version history
├── CODE_OF_CONDUCT.md             # Community guidelines
├── SECURITY.md                    # Security policy
└── SUPPORT.md                     # Support options

Project-Specific READMEs:
├── src/vscode-ext/README.md       # VS Code extension guide
└── src/mcp-server/README.md       # MCP server guide
```

---

## 🎓 Learning Path

**Complete beginners:**

1. Read: [Project README](../README.md)
2. Try: [Quickstart Guide](../README.md#-get-started-in-under-2-minutes) (Docker)
3. Explore: [FAQ](FAQ.md) if you hit issues

**Want to deploy to production:**

1. Read: [Architecture Overview](architecture.md) (understand the system)
2. Choose: [Cloud Deployment](deployment.md) OR [Local/Offline](local-offline-deployment.md)
3. Configure: Follow platform-specific guides in deployment docs
4. Monitor: Set up logging and health checks

**Want to contribute:**

1. Read: [Developer Guide](../DEVELOPERS.md)
2. Review: [Project Structure](../STRUCTURE.md)
3. Check: [Contributing Guidelines](../CONTRIBUTING.md)
4. Start: Look for [`good first issue`](https://github.com/shmindmaster/synapse/issues?q=is%3Aissue+is%3Aopen+label%3A%22good+first+issue%22) labels

**Want to integrate:**

1. Read: [API Reference](api-reference.md)
2. Try: [MCP Server](../src/mcp-server/README.md) for AI agents
3. Extend: [VS Code Extension](../src/vscode-ext/README.md) for IDE integration

---

## 🆘 Still Need Help?

If you can't find what you're looking for:

1. **Search the docs** — Use Ctrl+F or search GitHub
2. **Check [FAQ](FAQ.md)** — Most common issues are covered
3. **Ask the community** — [GitHub Discussions](https://github.com/shmindmaster/synapse/discussions)
4. **Report an issue** — [Documentation Issue](https://github.com/shmindmaster/synapse/issues/new?template=documentation.md)

For enterprise support inquiries: See [SUPPORT.md](../SUPPORT.md)

---

**Last Updated:** February 5, 2026 · **Version:** 0.1.0
