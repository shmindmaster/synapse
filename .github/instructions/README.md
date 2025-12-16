# SHTrial Platform Instructions

This directory contains GitHub Copilot instruction files for the SHTrial demo platform. All instructions follow the `shtrial-*.instructions.md` naming convention and include platform-specific context.

## Available Instructions

### Languages & Frameworks

#### Frontend
- **shtrial-nextjs.instructions.md** - Next.js 16 with App Router, Server Components, Turbopack
- **shtrial-nextjs-tailwind.instructions.md** - Next.js with Tailwind CSS styling
- **shtrial-reactjs.instructions.md** - React 19 best practices and patterns
- **shtrial-typescript.instructions.md** - TypeScript 5 with ES2022+ features

#### Backend
- **shtrial-python-fastapi.instructions.md** - FastAPI + LangGraph backend development
- **shtrial-nestjs.instructions.md** - NestJS framework patterns
- **shtrial-nodejs-vitest.instructions.md** - Node.js with Vitest testing

#### AI/ML
- **shtrial-langchain-python.instructions.md** - LangChain/LangGraph Python patterns

### Development Practices

#### Code Quality
- **shtrial-object-calisthenics.instructions.md** - Object-oriented design principles
- **shtrial-performance.instructions.md** - Performance optimization techniques
- **shtrial-codexer.instructions.md** - Code documentation standards

#### DevOps & Infrastructure
- **shtrial-docker-containerization.instructions.md** - Docker and Coolify deployment
- **shtrial-shell.instructions.md** - Shell scripting best practices
- **shtrial-powershell.instructions.md** - PowerShell scripting
- **shtrial-powershell-pester.instructions.md** - PowerShell testing with Pester

#### Workflows
- **shtrial-task-implementation.instructions.md** - Task implementation patterns
- **shtrial-memory-bank.instructions.md** - Context and memory management
- **shtrial-copilot-logging.instructions.md** - Copilot thought logging
- **shtrial-taming-copilot.instructions.md** - Copilot optimization strategies

## Platform Standards

All instruction files include SHTrial platform standards:

### Backend Standards
- **Framework**: Fastify (Node.js) or FastAPI (Python)
- **AI Framework**: LangGraph.js or LangGraph (Python)
- **Pattern**: Agent-based workflows with state management
- **Authentication**: Supabase Auth with JWT
- **Database**: Supabase PostgreSQL with RLS policies

### Frontend Standards
- **Framework**: Next.js 16 (App Router) or Vite 7 (React 19)
- **Styling**: Tailwind CSS v4 or Radix UI primitives
- **State**: React 19 Context or Zustand
- **Data Fetching**: Server Components (Next.js) or TanStack Query (Vite)

### Shared Infrastructure
- **Coolify Cluster**: `6fgpwc0` at `https://coolify-prod.shtrial.com`
- **Supabase**: Database `postgres.egswfhfttyyrrgcjfaee.supabase.co:6543`
- **S3 Storage**: Cloudflare R2 bucket `shtrial-demo-store`
- **Azure OpenAI**: Endpoint `openai-shtrial-demo.openai.azure.com`
- **CDN**: `https://cdn.shtrial.com/{APP_SLUG}/`

### Configuration Management
```bash
# Shared configuration (repo root)
.env.shared

# App-specific configuration
apps/{app-slug}/.env
```

### Environment Variables Pattern
```bash
# Use {APP_SLUG_UPPER} prefix
{APP_SLUG_UPPER}_DATABASE_URL=...
{APP_SLUG_UPPER}_API_KEY=...
{APP_SLUG_UPPER}_AZURE_OPENAI_ENDPOINT=...
```

### Naming Convention
- **URLs**: `https://{app-slug}.shtrial.com`
- **Directories**: `apps/{app-slug}/`
- **Environment Variables**: `{APP_SLUG_UPPER}_*`
- **Database Schemas**: `{app_slug_snake}_schema`
- **CDN Paths**: `https://cdn.shtrial.com/{APP_SLUG}/`

## Usage

Instructions are automatically applied by GitHub Copilot based on:
1. File types being edited
2. Context of the current task
3. Explicit references in conversations

## Adding New Instructions

When creating new instruction files:
1. Follow the `shtrial-{descriptive-name}.instructions.md` naming pattern
2. Include standard YAML frontmatter with appropriate `languageId` values
3. Add "SHTrial Platform Context" section
4. Document platform integration requirements
5. Reference shared infrastructure and environment variables
6. Update this README

## Primary Documentation

All instruction configuration derives from:
- **Primary Source**: `H:\Repos\sh\shtrial-demo-standards.md`
- **Supporting Docs**: `H:\Repos\sh\.pendoah\platform\*`
  - `architecture-standards.md` - System design patterns
  - `deployment-standards.md` - Coolify deployment workflows
  - `testing-standards.md` - Testing strategies
  - `workflow-standards.md` - Development workflows

## Scripts

Utility scripts for instruction management are located in `.github/scripts/`:
- `rename-instructions.ps1` - Bulk rename instructions with shtrial prefix

## Key References

### Azure OpenAI Models
- `gpt-4` - Complex reasoning and planning
- `gpt-4o-mini` - Fast responses and embeddings
- `text-embedding-3-large` - Vector embeddings

### Supabase Connection
```typescript
// Always use environment variables
const supabaseUrl = process.env.{APP_SLUG_UPPER}_SUPABASE_URL
const supabaseKey = process.env.{APP_SLUG_UPPER}_SUPABASE_ANON_KEY
```

### LangGraph Pattern
```typescript
// Backend: Fastify + LangGraph.js
import { StateGraph } from "@langchain/langgraph"
// OR Python: FastAPI + LangGraph
from langgraph.graph import StateGraph
```

## Notes

- All instruction files have been enhanced with platform context (Dec 15, 2025)
- Files renamed with `shtrial-` prefix for consistency
- Original functionality and YAML schemas preserved
- No security restrictions - includes actual credentials and connection strings
