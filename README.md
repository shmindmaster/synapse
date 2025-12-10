# Synapse - Local-First RAG Engine for Codebases

[![License: MIT](https://img.shields.io/badge/License-MIT-yellow.svg)](https://opensource.org/licenses/MIT)
[![Package Manager: pnpm](https://img.shields.io/badge/package%20manager-pnpm-orange)](https://pnpm.io/)
[![Open Source](https://img.shields.io/badge/Open%20Source-Yes-green)](https://github.com/shmindmaster/Synapse)

**Chat with your codebase. Index your documentation. Search semantically. All without sending your code to the cloud.**

Synapse is an open-source, local-first RAG (Retrieval Augmented Generation) engine that transforms your codebase and technical documentation into an intelligent, queryable knowledge base. Built for developers who value privacy, control, and the freedom to understand their codebase without vendor lock-in.

![Synapse Banner](https://images.unsplash.com/photo-1620712943543-bcc4688e7485?q=80&w=1200&auto=format&fit=crop)

## The Problem We're Solving

Most AI coding assistants require you to upload your codebase to the cloud. This creates serious problems:

- **Privacy Risks**: Your proprietary code, internal APIs, and sensitive logic are processed by third-party services
- **Compliance Issues**: Healthcare, finance, and government projects can't use cloud-based tools
- **Vendor Lock-in**: You're tied to a specific service's pricing, features, and availability
- **Limited Control**: You can't customize the indexing, search, or AI models to your needs

**Synapse solves this by running entirely on your infrastructure.** Your code never leaves your machine or your servers.

## Why Developers Choose Synapse

### 🔒 **True Privacy-First Architecture**
Your codebase, documentation, and embeddings stay on your infrastructure. No data sent to OpenAI, Anthropic, or any cloud service. Perfect for:
- Proprietary codebases
- Internal documentation
- Sensitive projects (healthcare, finance, government)
- Companies with strict data governance requirements

### 🚀 **Local-First, Cloud-Optional**
Run everything locally on your laptop, or deploy to your own servers. Use your own AI models (Ollama, local LLMs) or connect to any OpenAI-compatible API. You control:
- Where your data lives
- Which AI models process it
- How indexing and search work
- When and how updates happen

### 🧠 **Semantic Codebase Search**
Find code by **what it does**, not just what it's named. Ask questions like:
- "How does authentication work in this codebase?"
- "Where do we handle payment processing?"
- "Show me all error handling patterns"
- "What files are related to user management?"

Synapse understands context, relationships, and meaning—not just keywords.

### 📚 **Intelligent Documentation Indexing**
Transform your docs into a queryable knowledge graph. Index:
- API documentation
- Architecture diagrams
- README files
- Code comments
- Technical specifications

Ask questions and get answers with exact file paths and line numbers.

### 🔌 **IDE Integration Ready**
Built with VS Code and JetBrains extensions in mind. Future integrations will let you:
- Index your codebase directly from your editor
- Chat with your code without leaving your IDE
- Get context-aware suggestions based on your entire project
- Navigate code semantically, not just by filename

### 🌐 **Open Source, No Vendor Lock-in**
MIT licensed. Self-hosted. Fully customizable. No subscriptions, no usage limits, no proprietary APIs. You own your entire stack.

## Real-World Use Cases

### 1. **Onboarding New Developers**
"Show me how authentication works" → Get a comprehensive explanation with code references, file paths, and related components. New team members understand your codebase faster.

### 2. **Refactoring Large Codebases**
"Find all places where we validate user input" → Discover every validation pattern across your entire codebase, even if they use different function names.

### 3. **Documentation Search**
"How do I implement rate limiting?" → Search your internal docs, API references, and code examples to find the exact implementation pattern your team uses.

### 4. **Code Review Assistance**
"Explain this pull request's impact on the authentication flow" → Understand how changes affect related systems across your codebase.

### 5. **Architecture Understanding**
"Map all dependencies between our microservices" → Visualize how your services connect, what they depend on, and where potential issues might arise.

## Core Features

### Semantic Codebase Search
Search your code by meaning, not keywords. Find functions, classes, and patterns even when you don't know their exact names.

```typescript
// Ask: "Where do we handle database transactions?"
// Synapse finds: transaction.ts, db-utils.ts, connection-pool.ts
// Even if they don't contain the word "transaction" explicitly
```

### Intelligent Document Classification
Automatically classify and tag your code files:
- Component types (React, Vue, Angular)
- Function categories (auth, payment, validation)
- Architecture patterns (MVC, microservices, monolith)
- Technology stack (TypeScript, Python, Go)

### Multi-Document Synthesis
Analyze multiple files simultaneously to understand:
- How components connect across your codebase
- Common patterns and anti-patterns
- Architecture relationships
- Code dependencies and flows

### Knowledge Graph Visualization
See how your codebase is structured:
- Visualize component relationships
- Map dependencies between modules
- Understand data flow
- Identify architectural patterns

### Smart Code Recommendations
Get AI-powered suggestions for:
- Code organization improvements
- Refactoring opportunities
- Duplicate code detection
- Best practice recommendations

## Quick Start

### Prerequisites
- Node.js 20+
- pnpm (package manager)
- PostgreSQL (local or remote)
- (Optional) AI model access (local Ollama, OpenAI, Anthropic, or any OpenAI-compatible API)

### Installation

```bash
# Clone the repository
git clone https://github.com/shmindmaster/Synapse.git
cd Synapse

# Install dependencies
pnpm install

# Set up environment
cp .env.example .env
# Edit .env with your database and AI configuration

# Run database migrations
pnpm db:migrate

# Start development servers
pnpm dev
```

This launches:
- **Frontend**: http://localhost:5173
- **Backend API**: http://localhost:3001
- **API Docs**: http://localhost:3001/docs

### Configuration

Create a `.env` file:

```env
# Database (local PostgreSQL or remote)
DATABASE_URL="postgresql://user:password@localhost:5432/synapse"

# AI Configuration - Choose one:

# Option 1: Local AI (Ollama, LM Studio, etc.)
AI_INFERENCE_ENDPOINT=http://localhost:11434/v1
AI_MODEL=llama3.1:70b
AI_MODEL_EMBEDDING=nomic-embed-text

# Option 2: OpenAI-compatible API (OpenAI, Anthropic, etc.)
AI_INFERENCE_ENDPOINT=https://api.openai.com/v1
AI_API_KEY=your-api-key
AI_MODEL=gpt-4
AI_MODEL_EMBEDDING=text-embedding-3-small

# Option 3: DigitalOcean Gradient AI
DIGITALOCEAN_INFERENCE_ENDPOINT=https://inference.do-ai.run/v1
DIGITALOCEAN_MODEL_KEY=your-key
AI_MODEL=llama-3.1-70b-instruct
AI_MODEL_EMBEDDING=text-embedding-3-small
```

## Development

```bash
# Development mode (frontend + backend)
pnpm dev

# Build for production
pnpm build

# Run production server
pnpm start

# Database operations
pnpm db:generate  # Generate Prisma client
pnpm db:migrate   # Run migrations
pnpm db:studio    # Open Prisma Studio

# Linting
pnpm lint
```

## API Examples

### Index a Codebase

```bash
POST /api/index-codebase
{
  "path": "/path/to/your/codebase",
  "includePatterns": ["**/*.ts", "**/*.tsx", "**/*.js"],
  "excludePatterns": ["node_modules/**", "dist/**"]
}
```

### Semantic Search

```bash
POST /api/search
{
  "query": "How does authentication work?",
  "limit": 10,
  "filters": {
    "fileTypes": ["typescript", "javascript"],
    "paths": ["src/auth/**"]
  }
}
```

### Chat with Your Codebase

```bash
POST /api/chat
{
  "message": "Explain how the payment processing flow works",
  "context": {
    "files": ["src/payment/**"],
    "includeRelated": true
  }
}
```

### Get Knowledge Graph

```bash
GET /api/knowledge-graph?depth=2&focus=authentication
```

## Tech Stack

- **Frontend**: React 19, TypeScript, Tailwind CSS, Vite
- **Backend**: Express, TypeScript, Prisma
- **Database**: PostgreSQL + pgvector (vector similarity search)
- **AI**: OpenAI-compatible API (works with any provider)
- **Architecture**: Monorepo (pnpm workspaces)

## Roadmap

- [ ] VS Code extension for inline codebase chat
- [ ] JetBrains plugin support
- [ ] Incremental indexing (watch mode)
- [ ] Multi-language codebase support
- [ ] Team collaboration features
- [ ] Advanced code analysis (complexity, dependencies)
- [ ] Integration with popular CI/CD tools
- [ ] Webhook support for real-time updates

## Contributing

We welcome contributions! Synapse is built by developers, for developers. See [CONTRIBUTING.md](CONTRIBUTING.md) for guidelines.

**Areas where we'd love help:**
- VS Code extension development
- JetBrains plugin development
- Performance optimizations
- Additional AI model integrations
- Documentation improvements
- Test coverage

## Why Open Source?

We believe developers should have:
- **Control** over their tools and data
- **Freedom** from vendor lock-in
- **Transparency** in how their code is processed
- **Customization** to fit their specific needs

Synapse is MIT licensed because we want every developer to have access to powerful, privacy-first codebase intelligence—regardless of budget or company size.

## License

MIT License - see [LICENSE](LICENSE) for details.

## Support

- **Documentation**: [Coming soon]
- **Issues**: [GitHub Issues](https://github.com/shmindmaster/Synapse/issues)
- **Discussions**: [GitHub Discussions](https://github.com/shmindmaster/Synapse/discussions)

---

**Built with ❤️ for developers who value privacy, control, and open source.**
