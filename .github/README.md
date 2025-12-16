# SHTrial Platform GitHub Copilot Integration

This directory contains GitHub Copilot configuration for the SHTrial demo platform, providing comprehensive context and standards for AI-assisted development.

## 📁 Directory Structure

```
.github/
├── copilot-instructions.md          # Core Copilot configuration (REWRITTEN)
├── COPILOT-INTEGRATION-COMPLETE.md  # Project completion summary
├── agents/                           # Specialized agent configurations (22 files)
│   ├── README.md                     # Agent documentation
│   └── shtrial-*.agent.md           # Agent files with platform context
├── instructions/                     # Language/framework instructions (19 files)
│   ├── README.md                     # Instruction documentation
│   └── shtrial-*.instructions.md    # Instruction files with platform context
└── scripts/                          # Automation utilities (2 files)
    ├── rename-agents.ps1            # Agent file renaming script
    └── rename-instructions.ps1       # Instruction file renaming script
```

## 🎯 Quick Start

### For Developers
When working on SHTrial Platform applications, GitHub Copilot will automatically:
1. Apply platform standards from `copilot-instructions.md`
2. Select appropriate agents from `agents/` based on your task
3. Use language-specific instructions from `instructions/` based on file types

### For AI Agents
All agents and instructions include comprehensive platform context:
- Shared infrastructure configuration (Coolify, Supabase, S3, Azure OpenAI)
- Naming conventions (`{APP_SLUG}` pattern)
- Environment variable standards
- Deployment procedures
- Tech stack standards (Fastify/FastAPI + LangGraph, Next.js/Vite)

## 📚 Key Files

### Core Configuration
- **[copilot-instructions.md](copilot-instructions.md)** - Primary Copilot configuration with platform architecture, shared infrastructure, naming conventions, and deployment standards

### Documentation
- **[agents/README.md](agents/README.md)** - Complete agent directory documentation
- **[instructions/README.md](instructions/README.md)** - Complete instruction directory documentation
- **[COPILOT-INTEGRATION-COMPLETE.md](COPILOT-INTEGRATION-COMPLETE.md)** - Project completion summary and technical details

### Automation
- **[scripts/rename-agents.ps1](scripts/rename-agents.ps1)** - Bulk rename agent files
- **[scripts/rename-instructions.ps1](scripts/rename-instructions.ps1)** - Bulk rename instruction files

## 🏗️ Platform Architecture

### Shared Infrastructure
```yaml
Coolify Cluster:  6fgpwc0 (https://coolify-prod.shtrial.com)
Supabase:         egswfhfttyyrrgcjfaee (Postgres 15)
S3 Storage:       shtrial-demo-store (Cloudflare R2)
Azure OpenAI:     openai-shtrial-demo.openai.azure.com
CDN:              cdn.shtrial.com/{APP_SLUG}/
```

### Naming Convention
All applications follow the `{APP_SLUG}` pattern:
- **URLs**: `https://{app-slug}.shtrial.com`
- **Directories**: `apps/{app-slug}/`
- **Environment Variables**: `{APP_SLUG_UPPER}_*`
- **Database Schemas**: `{app_slug_snake}_schema`

### Configuration Management
```bash
# Shared configuration (repo root)
.env.shared

# App-specific configuration
apps/{app-slug}/.env
```

### Tech Stack
- **Backend**: Fastify + LangGraph.js (TypeScript) OR FastAPI + LangGraph (Python)
- **Frontend**: Next.js 16 (App Router) OR Vite 7 (React 19)
- **Database**: Supabase PostgreSQL with RLS
- **AI**: Azure OpenAI (GPT-4, GPT-4o-mini, text-embedding-3-large)
- **Storage**: Cloudflare R2 (S3-compatible)

## 🤖 Available Agents (22)

### Architecture & Planning
- `shtrial-architecture` - System architecture and NFRs
- `shtrial-strategic-planner` - Strategic planning
- `shtrial-implementation-planner` - Implementation planning

### Development
- `shtrial-software-engineer` - General software engineering
- `shtrial-nextjs-expert` - Next.js 16 development
- `shtrial-react-expert` - React 19 development
- `shtrial-debugger` - Debugging and fixes

### Code Quality
- `shtrial-code-janitor` - Code cleanup and tech debt
- `shtrial-code-tour` - VSCode CodeTour creation
- `shtrial-context-analyzer` - Code context analysis

### Documentation
- `shtrial-prd-writer` - Product requirements
- `shtrial-spec-writer` - Technical specifications
- `shtrial-blueprint-codex` - Blueprint documentation

### Specialized
- `shtrial-playwright-tester` - Browser automation
- `shtrial-seo-expert` - Search optimization
- `shtrial-pendoah` - Platform-specific integration
- And more... (see [agents/README.md](agents/README.md))

## 📝 Available Instructions (19)

### Frontend
- `shtrial-nextjs` - Next.js 16 with App Router
- `shtrial-reactjs` - React 19 patterns
- `shtrial-typescript` - TypeScript 5 standards
- `shtrial-nextjs-tailwind` - Tailwind CSS styling

### Backend
- `shtrial-python-fastapi` - FastAPI + LangGraph
- `shtrial-nestjs` - NestJS patterns
- `shtrial-nodejs-vitest` - Node.js testing

### AI/ML
- `shtrial-langchain-python` - LangChain/LangGraph

### DevOps
- `shtrial-docker-containerization` - Docker and Coolify
- `shtrial-shell` - Shell scripting
- `shtrial-powershell` - PowerShell scripting

### Best Practices
- `shtrial-object-calisthenics` - OOP principles
- `shtrial-performance` - Performance optimization
- And more... (see [instructions/README.md](instructions/README.md))

## 🔧 Maintenance

### Adding New Agents
1. Create file: `.github/agents/shtrial-{name}.agent.md`
2. Include YAML frontmatter with `name`, `description`, `tools`
3. Add "SHTrial Platform Context" section
4. Document in `agents/README.md`

### Adding New Instructions
1. Create file: `.github/instructions/shtrial-{name}.instructions.md`
2. Include YAML frontmatter with `applyTo`, `description`
3. Add "SHTrial Platform Context" section
4. Document in `instructions/README.md`

### Bulk Operations
Use PowerShell scripts in `scripts/` directory for bulk operations:
```powershell
# Rename all agent files
.\scripts\rename-agents.ps1

# Rename all instruction files
.\scripts\rename-instructions.ps1
```

## 📖 Primary Documentation

All configuration derives from:
- **Primary Source**: `H:\Repos\sh\shtrial-demo-standards.md`
- **Supporting Docs**: `H:\Repos\sh\.pendoah\platform\*`
  - `architecture-standards.md`
  - `deployment-standards.md`
  - `testing-standards.md`
  - `workflow-standards.md`

## 🎯 Design Principles

### 1. Platform Awareness
Every agent and instruction includes comprehensive platform context, enabling seamless integration with shared infrastructure.

### 2. No Security Restrictions
Agents have full operational capability with actual credentials and connection strings. No need to request configuration.

### 3. Consistent Naming
All files follow `shtrial-*` prefix for easy identification and alphabetical sorting.

### 4. Schema Compatibility
YAML frontmatter preserved for GitHub Copilot parser compatibility.

### 5. Empowered Autonomy
Agents can operate autonomously without requesting details from users.

## 📊 Statistics

| Category | Count | Status |
|----------|-------|--------|
| Agent Files | 22 | ✅ Active |
| Instruction Files | 19 | ✅ Active |
| Automation Scripts | 2 | ✅ Ready |
| Documentation Files | 4 | ✅ Complete |
| **TOTAL** | **47** | **✅ OPERATIONAL** |

## 🚀 Recent Updates

**December 15, 2025** - Major overhaul completed:
- ✅ Rewrote `copilot-instructions.md` with comprehensive platform standards
- ✅ Enhanced all 22 agent files with platform context
- ✅ Enhanced all 19 instruction files with platform context
- ✅ Renamed all files with `shtrial-*` prefix
- ✅ Created comprehensive documentation
- ✅ Created automation scripts

See [COPILOT-INTEGRATION-COMPLETE.md](COPILOT-INTEGRATION-COMPLETE.md) for full details.

## 🔗 Related Resources

### Platform Documentation
- `shtrial-demo-standards.md` - Complete platform architecture
- `.pendoah/platform/docs/` - Implementation guides
- `.env.shared` - Environment configuration template

### External Links
- [Coolify Dashboard](https://coolify-prod.shtrial.com)
- [Supabase Dashboard](https://supabase.com/dashboard/project/egswfhfttyyrrgcjfaee)
- [Azure OpenAI](https://portal.azure.com)

---

**Maintained by**: SHTrial Platform Team  
**Last Updated**: December 15, 2025  
**Version**: 2.0 (Major Overhaul)  
**Status**: ✅ Production Ready
