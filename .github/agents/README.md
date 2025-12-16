# SHTrial Platform Agents

This directory contains specialized GitHub Copilot agents configured for the SHTrial demo platform. All agents follow the `shtrial-*.agent.md` naming convention and include comprehensive platform context.

## Available Agents

### Architecture & Planning
- **shtrial-architecture.agent.md** - System architecture design and NFR requirements
- **shtrial-strategic-planner.agent.md** - Strategic planning and decision-making
- **shtrial-implementation-planner.agent.md** - Implementation planning and task breakdown

### Development
- **shtrial-software-engineer.agent.md** - General software engineering tasks
- **shtrial-nextjs-expert.agent.md** - Next.js 16 development with App Router
- **shtrial-react-expert.agent.md** - React 19 frontend development
- **shtrial-debugger.agent.md** - Systematic debugging and bug fixes

### Code Quality
- **shtrial-code-janitor.agent.md** - Code cleanup and tech debt remediation
- **shtrial-code-tour.agent.md** - Creating VSCode CodeTour documentation
- **shtrial-context-analyzer.agent.md** - Code context analysis

### Documentation & Specs
- **shtrial-prd-writer.agent.md** - Product requirements documents
- **shtrial-spec-writer.agent.md** - Technical specifications
- **shtrial-blueprint-codex.agent.md** - Blueprint mode documentation

### Task Management
- **shtrial-task-planner.agent.md** - Task planning and organization
- **shtrial-task-researcher.agent.md** - Task research and analysis

### Specialized Agents
- **shtrial-playwright-tester.agent.md** - Browser automation and testing
- **shtrial-seo-expert.agent.md** - Search and AI optimization
- **shtrial-prompt-builder.agent.md** - AI prompt engineering
- **shtrial-pendoah.agent.md** - Platform-specific Pendoah integration
- **shtrial-thinking-beast.agent.md** - Deep reasoning and analysis
- **shtrial-claude-beast.agent.md** - Fast Claude Haiku-based agent
- **shtrial-voidbeast-enhanced.agent.md** - Enhanced GPT-4.1 agent

## Platform Context

All agents include comprehensive SHTrial platform context:

### Shared Infrastructure
- **Coolify Cluster**: `6fgpwc0` at `https://coolify-prod.shtrial.com`
- **Supabase**: Project `egswfhfttyyrrgcjfaee`
- **S3 Storage**: Bucket `shtrial-demo-store` (Cloudflare R2)
- **Azure OpenAI**: `openai-shtrial-demo.openai.azure.com`
- **CDN**: `https://cdn.shtrial.com/{APP_SLUG}/`

### Naming Convention
All apps follow the `{APP_SLUG}` pattern:
- Lowercase, hyphenated for URLs and directories
- UPPER_SNAKE for environment variables
- snake_case for database schemas

### Tech Stack
- **Backend**: Fastify + LangGraph.js (TypeScript) OR FastAPI + LangGraph (Python)
- **Frontend**: Next.js 16 (App Router) OR Vite 7 (React 19)
- **Database**: Supabase PostgreSQL with RLS
- **AI**: Azure OpenAI (GPT-4, GPT-4o-mini, text-embedding-3-large)

### Configuration
- Shared config: `.env.shared` at repo root
- App-specific: `apps/{app-slug}/.env`
- Never hardcode credentials - always use environment variables

## Usage

Agents are automatically loaded by GitHub Copilot. To use a specific agent, reference it in your conversation or let Copilot select the most appropriate agent based on your task.

## Adding New Agents

When adding new agents:
1. Follow the `shtrial-{descriptive-name}.agent.md` naming pattern
2. Include the standard YAML frontmatter
3. Add the "SHTrial Platform Context" section
4. Document shared infrastructure and naming conventions
5. Update this README

## Primary Documentation

All agent configuration derives from:
- **Primary Source**: `H:\Repos\sh\shtrial-demo-standards.md`
- **Supporting Docs**: `H:\Repos\sh\.pendoah\platform\*`

## Scripts

Utility scripts for agent management are located in `.github/scripts/`:
- `rename-agents.ps1` - Bulk rename agents with shtrial prefix
