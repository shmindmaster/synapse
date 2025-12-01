# GitHub Copilot Instructions for Synapse

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
- ❌ No tool restrictions

## Tech Stack (Reference)
- **Database**: PostgreSQL via Prisma 7.x (rust-free client)
- **AI**: Azure OpenAI Responses API (gpt-5.1-codex-mini)
- **Testing**: Playwright + Jest/Vitest
- **Deployment**: Azure Container Apps

## Development Standards

### Prisma Schema Pattern
\\\prisma
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
\\\

### AI Integration Pattern
\\\	ypescript
import { ResponsesAPI } from '@/lib/azure-openai';

const response = await ResponsesAPI.create({
  model: 'gpt-5.1-codex-mini',
  input: userQuery,
  tools: [...], // Tool definitions
  previous_response_id: lastResponseId // For continuity
});
\\\

### RAG with pgvector
\\\	ypescript
// Embedding generation
const embedding = await generateEmbedding(text);

// Vector search
const results = await prisma.\
  SELECT * FROM documents
  ORDER BY embedding <=> \::vector
  LIMIT 5
\;
\\\

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
\\\ash
pnpm install
pnpm dev
pnpm build
pnpm test
pnpm test:e2e
\\\

### Database
\\\ash
pnpm prisma generate
pnpm prisma migrate dev --name <description>
pnpm prisma studio
pnpm prisma db seed
\\\

### Git
\\\ash
git add .
git commit -m "feat: <description>"
git push
git checkout -b feature/<name>
\\\

### Azure (Deployment)
\\\ash
az containerapp up
az containerapp logs tail
\\\

## Project-Specific Context

### SHTrial Product Roadmap
- Read \SHTRIAL_PRODUCT_ROADMAP.md\ in workspace root
- Understand this product's feature priorities
- Implement epics in order (E1 → E2 → E3 → E4)
- Align with shared platform mandates

### Demo Accounts
- Refer to \DEMO_LOGINS.md\ in workspace root
- Ensure demo accounts exist for this app
- Use standard password: \Pendoah1225\
- Never commit demo credentials to repo

### Azure Resources
- **Database**: pg-shared-apps-eastus2 (shared server)
- **Storage**: stmahumsharedapps (shared account)
- **OpenAI**: shared-openai-eastus2 (shared endpoint)
- **Container App**: Unique per repo

## Security Protocol
- Never commit secrets to git
- Use \copilot.env\ in root for shared secrets
- Use \.env.local\ in each repo for local overrides
- Ensure repo visibility is PRIVATE (check with \gh repo view\)

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