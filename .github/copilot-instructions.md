# GitHub Copilot Instructions for Synapse (v2025.2)

> **Governance**: Enterprise Engineering Standards v2025.2
> **Parent**: `H:\Repos\sh\.github\copilot-instructions.md`

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
- ✅ Upgrade dependencies (Prisma 7, latest packages)
- ✅ Generate database migrations
- ✅ Write comprehensive tests
- ✅ Update documentation
- ✅ Refactor code for better patterns

### No Restrictions
- ❌ No approval required for file edits
- ❌ No approval required for command execution
- ❌ No file blacklist
- ❌ No command blacklist

## 🧠 AI Integration Standards (Enterprise v2025.2)

### 5-Model Fleet Usage

You **MUST** use the correct model for each modality:

| Task Type | Model | Environment Variable | When to Use |
|:---------|:------|:---------------------|:-----------|
| **Chat/Reasoning** | `gpt-5.1-codex-mini` | `AI_MODEL_CORE` | Neural network and ML logic |
| **Live Voice** | `gpt-realtime-mini` | `AI_MODEL_REALTIME` | Real-time speech interactions |
| **Batch Audio** | `gpt-audio-mini` | `AI_MODEL_AUDIO` | Async transcription/TTS |
| **Image Generation** | `gpt-image-1-mini` | `AI_MODEL_IMAGE` | Creating synapse visuals/charts |
| **RAG/Search** | `text-embedding-3-small` | `AI_MODEL_EMBEDDING` | ML research and neural network documentation RAG |

### API Architecture Rules

**MANDATORY**: Use **Responses API v1** (`/openai/v1/responses`) for ALL chat/logic operations.

❌ **NEVER** use legacy Chat Completions API
✅ **ALWAYS** use environment variables for model selection
✅ **ALWAYS** reference `Gemini.md` for governance standards

### Implementation Patterns

```typescript
// ✅ CORRECT: Use environment variables
const model = process.env.AI_MODEL_CORE; // gpt-5.1-codex-mini

// ✅ CORRECT: Use Responses API v1
const response = await fetch(`${process.env.AZURE_OPENAI_RESPONSES_URL}`, {
  method: 'POST',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify({ model, messages })
});

// ❌ WRONG: Hardcoded model names
const response = await openai.chat.completions.create({
  model: 'gpt-4', // WRONG - use env var
  messages
});
```

## 🛠️ MCP Server Usage

### Firecrawl MCP (Data Sourcing)
- **MANDATORY**: Use for real synapse data (no mocking)
- Scrape actual synapse documents, reports, market data
- Never create fake JSON data for UI shells

### Context7 MCP (Documentation)
- Get latest docs for React, TypeScript, Azure OpenAI
- Use for API references and best practices

### Azure MCP (Infrastructure)
- Query existing shared resources only
- **NEVER** create new resource groups
- Use `pg-shared-apps-eastus2`, `stmahumsharedapps`

## 📋 Development Workflow

### Data Layer
- Use Prisma 7+ with `vector` extension enabled
- Implement RAG with `text-embedding-3-small`
- Store embeddings in shared PostgreSQL

### Frontend Development
- React 19 + TypeScript + Vite
- Use Tailwind CSS v3 (not v4)
- Implement real-time ML dashboard

### Backend Development
- Python + FastAPI
- Use Responses API v1 exclusively
- Implement proper error handling for AI calls

## 🚫 Prohibited Patterns

❌ **Never**:
- Use non-Azure AI providers as primary
- Call OpenAI public API directly
- Hardcode API keys or credentials
- Create new Azure resources
- Use legacy Chat Completions API
- Mock synapse data
- Add CI/CD workflows unless requested

## ✅ Required Patterns

✅ **Always**:
- Use correct model per modality
- Source real data via Firecrawl
- Implement Responses API v1
- Follow Enterprise Engineering Standards v2025.2
- Reference `Gemini.md` for governance
- Use shared infrastructure only

## Your Mission

Build the world's most intelligent synapse platform by:
1. Implementing real-time neural network analytics
2. Using AI for ML model optimization
3. Creating predictive neural network models
4. Ensuring enterprise-grade security
5. Following all governance standards

## Deployment Standards (Enterprise v2025.2)

### Required Deployment Pattern
MANDATORY: Deploy to exact shared infrastructure locations:

| Component | Target Location | Resource Name | Custom Domain |
|:---------|:----------------|:--------------|:-------------|
| **Backend API** | `rg-shared-container-apps` | `ca-synapse-api` | `api.synapse.shtrial.com` |
| **Frontend** | `rg-shared-web` | `synapse` | `synapse.shtrial.com` |
| **Database** | `pg-shared-apps-eastus2` | `synapse` | - |
| **Storage** | `stmahumsharedapps` | `synapse` | - |

### DNS & Custom Domains
- **Frontend URL**: `https://synapse.shtrial.com`
- **Backend API URL**: `https://api.synapse.shtrial.com`
- **DNS Zone**: Shared `shtrial.com` in `rg-shared-dns`
- **Managed Certificates**: Auto-created for custom domains

## Tech Stack (v2025.2 5-Model Fleet)
- **Database**: PostgreSQL via Prisma 7.x (rust-free client)
- **AI**: Azure OpenAI Responses API (`/openai/v1/responses`)
- **Testing**: Playwright + Jest/Vitest
- **Deployment**: Azure Container Apps

### 5-Model Fleet

| Modality | Deployment Name | Use Case |
|:---------|:----------------|:---------|
| **Logic / Code** | `gpt-5.1-codex-mini` | Neural network and ML logic |
| **Realtime Voice** | `gpt-realtime-mini` | Live Speech-to-Speech |
| **Batch Audio** | `gpt-audio-mini` | Async Transcription (STT/TTS) |
| **Vision** | `gpt-image-1-mini` | Image Generation |
| **Memory** | `text-embedding-3-small` | ML research and neural network documentation RAG |

## Development Standards

### Prisma Schema Pattern
```prisma
generator client {
  provider = "prisma-client" // Prisma 7, ESM, rust-free
}

model Example {
  id        String   @id @default(uuid())
  createdAt DateTime @default(now())
  updatedAt DateTime @updatedAt
  deletedAt DateTime? // Soft delete
  // ... domain fields
}
```

### AI Integration Pattern
```typescript
import { ResponsesAPI } from '@/lib/azure-openai';

const response = await ResponsesAPI.create({
  model: 'gpt-5.1-codex-mini',
  input: userQuery,
  tools: [...], // Tool definitions
  previous_response_id: lastResponseId // For continuity
});
```

### RAG with pgvector
```typescript
// Embedding generation
const embedding = await generateEmbedding(text);

// Vector search
const results = await prisma.$queryRaw`
  SELECT * FROM documents
  ORDER BY embedding <=> ${embedding}::vector
  LIMIT 5
`;
```

## MCP Server Usage

You have access to these MCP servers (use freely):

### azure-mcp
- List Azure resources
- Manage Container Apps
- Query PostgreSQL databases
- Storage operations

### context7-mcp
- Search latest library documentation
- Get up-to-date API references
- Find code examples

### prisma-mcp
- Generate Prisma schema
- Create migrations
- Manage database models

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
- Gather competitive intelligence

## Commands You Can Execute

### Development
```bash
pnpm install
pnpm dev
pnpm build
pnpm test
pnpm test:e2e
```

### Database
```bash
pnpm prisma generate
pnpm prisma migrate dev --name <description>
pnpm prisma studio
pnpm prisma db seed
```

### Git
```bash
git add .
git commit -m "feat: <description>"
git push
git checkout -b feature/<name>
```

### Azure (Deployment)
```bash
az containerapp up
az containerapp logs tail
```

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
- **Database**: pg-shared-apps-eastus2 (shared server)
- **Storage**: stmahumsharedapps (shared account)
- **OpenAI**: shared-openai-eastus2 (shared endpoint)
- **Container App**: Unique per repo

## Security Protocol
- Never commit secrets to git
- Use `copilot.env` in root for shared secrets
- Use `.env.local` in each repo for local overrides
- Ensure repo visibility is PRIVATE (check with `gh repo view`)

## Autonomous Decision Making

You are empowered to:
1. **Choose implementation patterns** based on best practices
2. **Refactor existing code** to improve quality
3. **Add missing tests** proactively
4. **Update documentation** as code changes
5. **Resolve dependency conflicts** automatically
6. **Create new files** as architecture requires
7. **Delete obsolete code** when safe
8. **Execute migrations** after schema changes

## Quality Standards
- Write tests for all new features
- Maintain >80% code coverage
- Use TypeScript strict mode
- Follow existing code style
- Document complex logic with comments
- Update README.md with new features

**MODE**: ✅ FULLY AUTONOMOUS
**APPROVAL**: ❌ NOT REQUIRED
**RISK**: ⚠️ MAXIMUM (Development only)

---
*Last Updated: December 2025 | Version: 2025.2*
