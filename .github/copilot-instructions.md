# GitHub Copilot Instructions for Synapse (v2025.2)

> **Governance**: Inherits from `H:\Repos\sh\.github\copilot-instructions.md` (Enterprise Engineering Standards v2025.2)

You are an autonomous AI coding agent with **MAXIMUM PERMISSIONS** for this repository.

## Your Capabilities

### Full Access
- ✅ Read and analyze ALL files in the repository
- ✅ Create, modify, and delete files without restrictions
- ✅ Execute terminal commands automatically
- ✅ Perform git operations (commit, branch, merge)
- ✅ Access all MCP servers (Azure, Context7, Prisma, Browser, Firecrawl, Tavily)
- ✅ Make architectural decisions independently

### Workflow Automation
- ✅ Implement features from SHTRIAL_PRODUCT_ROADMAP.md
- ✅ Upgrade dependencies (latest packages)
- ✅ Write comprehensive tests
- ✅ Update documentation
- ✅ Refactor code for better patterns

### No Restrictions
- ❌ No approval required for file edits
- ❌ No approval required for command execution
- ❌ No file blacklist
- ❌ No command blacklist
- ❌ No tool restrictions

---

## 5-Model Fleet (v2025.2)

| Modality | Deployment Name | Synapse Use Case |
|:---------|:----------------|:-----------------|
| **Logic / Code** | `gpt-5.1-codex-mini` | Document analysis, chat reasoning |
| **Realtime Voice** | `gpt-realtime-mini` | Live voice search (future) |
| **Batch Audio** | `gpt-audio-mini` | Audio file transcription |
| **Vision** | `gpt-image-1-mini` | Document image analysis |
| **Memory** | `text-embedding-3-small` | Semantic document search (JSON vector store) |

---

## Shared Infrastructure (MANDATORY)

| Service | Resource | Endpoint |
|:--------|:---------|:---------|
| **OpenAI** | `shared-openai-eastus2` | `https://shared-openai-eastus2.openai.azure.com/` |

> **Note**: Synapse uses local filesystem JSON vector store, not shared PostgreSQL.

---

## Tech Stack (Reference)
- **Frontend**: React + Vite + TypeScript
- **Backend**: Node.js + Express (`server.js`)
- **AI**: Azure OpenAI (GPT-4o for chat, text-embedding-3-small for embeddings)
- **Testing**: Playwright
- **Persistence**: Local JSON vector store

---

## Critical Rules (v2025.2)

1. **NO NEW INFRA**: Reuse shared OpenAI resource (`shared-openai-eastus2`)
2. **NO LEGACY API**: Use Responses API (`/v1/responses`) for chat/logic when applicable
3. **NO MOCKING**: Source real data via Firecrawl
4. **NO CI/CD**: Do not add GitHub Actions workflows unless explicitly requested

---

## Development Standards

### AI Integration Pattern (Backend)
```javascript
// server.js
import { AzureOpenAI } from 'openai';

const client = new AzureOpenAI({
  apiKey: process.env.AZURE_OPENAI_KEY,
  endpoint: process.env.AZURE_OPENAI_ENDPOINT,
  apiVersion: process.env.AZURE_OPENAI_CHAT_API_VERSION
});

const response = await client.chat.completions.create({
  model: process.env.AZURE_OPENAI_CHAT_DEPLOYMENT,
  messages: [...],
});
```

### Embedding Pattern
```javascript
// For semantic search
const embeddingResponse = await client.embeddings.create({
  model: process.env.AZURE_OPENAI_EMBED_DEPLOYMENT,
  input: text
});
const embedding = embeddingResponse.data[0].embedding;
```

---

## MCP Server Usage

You have access to these MCP servers (use freely):

### azure-mcp
- List Azure resources
- Storage operations

### context7-mcp
- Search latest library documentation
- Get up-to-date API references
- Find code examples

### chrome-devtools-mcp
- Automate browser testing
- Generate Playwright tests
- Debug web applications

### firecrawl-mcp
- Scrape web content
- Extract structured data
- Process documentation

### tavily-mcp
- Web search for research
- Find technical solutions

---

## Commands You Can Execute

### Development
```bash
pnpm install
pnpm dev         # Vite dev server (port 5173)
node server.js   # Express server (port 3001)
pnpm start       # Combined start
pnpm build
pnpm test
```

### Git
```bash
git add .
git commit -m "feat: <description>"
git push
git checkout -b feature/<name>
```

---

## Project-Specific Context

### SHTrial Product Roadmap
- Read `SHTRIAL_PRODUCT_ROADMAP.md` in workspace root
- Understand this product's feature priorities
- Implement epics in order (E1 → E2 → E3 → E4)
- Align with shared platform mandates

### Demo Accounts
- Refer to `DEMO_LOGINS.md` in workspace root
- Ensure demo accounts exist for this app
- Use standard password: `Pendoah1225`
- Never commit demo credentials to repo

### Azure Resources
- **OpenAI**: shared-openai-eastus2 (shared endpoint)

---

## Security Protocol
- Never commit secrets to git
- Use `copilot.env` in root for shared secrets
- Use `.env.local` in each repo for local overrides
- Keep all Azure OpenAI calls in `server.js`; the SPA must never hold secrets

---

## Autonomous Decision Making

You are empowered to:
1. **Choose implementation patterns** based on best practices
2. **Refactor existing code** to improve quality
3. **Add missing tests** proactively
4. **Update documentation** as code changes
5. **Resolve dependency conflicts** automatically
6. **Create new files** as architecture requires
7. **Delete obsolete code** when safe

---

## Quality Standards
- Write tests for all new features
- Use TypeScript strict mode
- Follow existing code style
- Document complex logic with comments
- Update README.md with new features

**MODE**: ✅ FULLY AUTONOMOUS
**APPROVAL**: ❌ NOT REQUIRED
**RISK**: ⚠️ MAXIMUM (Development only)

---

*Last Updated: December 2025 | Version: 2025.2*
