# Agent Files Update Summary

## Mission

Update ALL agent files in `.github/agents/` to include **SHTrial Platform context** and standards from:
- `shtrial-demo-standards.md` (Primary source)
- `.pendoah/platform/docs/` (Supporting documentation)

## Platform Context Template

The following section should be added after frontmatter but before main content in each agent:

```markdown
## SHTrial Platform Context

This agent operates within the **SHTrial Platform** - a unified DigitalOcean infrastructure supporting 20+ applications with shared resources.

### Platform Standards Reference
- **Primary:** `shtrial-demo-standards.md` - Complete platform architecture
- **Supporting:** `.pendoah/platform/docs/` - Detailed implementation guides
- **Configuration:** `.env.shared` - Environment template (source of truth)

### Key Platform Resources
- **Cluster:** `sh-demo-cluster` (NYC3, Kubernetes 1.34.1, CPU-only)
- **Database:** `sh-shared-postgres` (Postgres 16 + pgvector, per-app DBs)
- **Storage:** `sh-storage` (Spaces + CDN, per-app prefixes)
- **Registry:** `registry.digitalocean.com/shtrial-reg`
- **AI:** DigitalOcean GenAI serverless (https://inference.do-ai.run/v1)

### Application Standards
- **Naming:** `{APP_SLUG}` pattern for all resources
- **Backend:** FastAPI (Python) or Fastify (TypeScript)
- **Frontend:** Next.js 16 App Router or Vite 7
- **AI Orchestration:** LangGraph (code-first, StateGraph pattern)
- **Package Management:** Poetry (Python) / pnpm (TypeScript)
```

## Agent-Specific Enhancements

### Architecture/Planning Agents
**Agents:** arch, plan, implementation-plan, blueprint

**Add:**
- Platform architecture patterns reference
- Deployment automation requirements
- Infrastructure constraints (no GPU, shared resources)
- LangGraph/LangChain integration patterns

### Development Agents
**Agents:** software-engineer, expert-nextjs, expert-react, debug

**Add:**
- Technology stack requirements (Next.js 16, React 19.2)
- Configuration management patterns (`.env.shared`)
- Database/storage access patterns
- AI integration standards (DigitalOcean GenAI)

### Testing Agents
**Agents:** playwright-tester

**Add:**
- Platform deployment URLs pattern (`{APP_SLUG}.shtrial.com`)
- Smoke test requirements
- Sentry integration for error tracking

### Documentation Agents
**Agents:** prd, specification, code-tour

**Add:**
- Platform standards in documentation
- Architecture documentation requirements
- Deployment documentation standards

### Specialized Agents
**Agents:** janitor, context7, prompt-builder

**Add:**
- Platform-specific cleanup patterns
- Library documentation access
- Prompt engineering for platform context

## Security & Empowerment Updates

### Remove
- Permission requests
- Confirmation seeking
- Security blocks for standard operations
- Manual approval processes

### Add
- Full authority to act
- Complete credentials and access
- Autonomous decision-making
- End-to-end task completion

## Files to Update

- [ ] Ultimate-Transparent-Thinking-Beast-Mode.agent.md
- [ ] arch.agent.md
- [ ] blueprint-mode-codex.agent.md
- [ ] claude-haiku-beast-mode.agent.md
- [ ] code-tour.agent.md
- [ ] context7.agent.md
- [ ] debug.agent.md
- [ ] expert-nextjs-developer.agent.md
- [ ] expert-react-frontend-engineer.agent.md
- [ ] implementation-plan.agent.md
- [ ] janitor.agent.md
- [x] pendoah.agent.md (ALREADY COMPREHENSIVE - verify only)
- [ ] plan.agent.md
- [ ] playwright-tester.agent.md
- [ ] prd.agent.md
- [ ] prompt-builder.agent.md
- [ ] search-ai-optimization-expert.agent.md
- [ ] software-engineer-agent-v1.agent.md
- [ ] specification.agent.md
- [ ] task-planner.agent.md
- [ ] task-researcher.agent.md
- [ ] voidbeast-gpt41enhanced.agent.md

## Status

**Date Started:** 2025-12-15
**Completed:** 0/22
**In Progress:** Starting systematic updates

## Notes

- `pendoah.agent.md` already has comprehensive platform context - needs verification only
- Focus on critical agents first: arch, software-engineer, expert-nextjs, implementation-plan
- Ensure all platform standards are consistently referenced
- Remove all security restrictions and permission-seeking language
