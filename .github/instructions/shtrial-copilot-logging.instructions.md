---
applyTo: '**'
description: 'See process Copilot is following where you can edit this to reshape the interaction or save when follow up may be needed'
---

# Copilot Process tracking Instructions

## SHTrial Platform Context

These instructions apply to applications running on the **SHTrial Platform** - a unified DigitalOcean infrastructure with shared resources and per-app logical isolation.

### Platform Overview
- **Cluster:** `sh-demo-cluster` (NYC3, Kubernetes 1.34.1, CPU-only)
- **Database:** Shared Postgres 16 (`sh-shared-postgres`) with per-app databases
- **Storage:** Shared Spaces bucket (`sh-storage`) with per-app prefixes
- **AI Services:** DigitalOcean GenAI serverless inference
- **Deployment:** Automated via `scripts/k8s-deploy.sh`
- **Configuration:** `.env.shared` as single source of truth

### Key Standards
- **Naming:** `{APP_SLUG}` pattern for all resources (namespaces, databases, prefixes)
- **Backend:** FastAPI (Python 3.12) or Fastify (Node 22) only
- **Frontend:** Next.js 16 App Router or Vite 7
- **AI:** LangGraph for orchestration (no proprietary DSLs)
- **Styling:** Tailwind CSS v4 + shadcn/ui components
- **Package Management:** Poetry (Python) / pnpm (TypeScript)

### Configuration Management
All configuration must reference `.env.shared` variables:
- Never hardcode URLs, credentials, or resource names
- Use environment variables for all external services
- Reference platform resources by standard names
- Follow template patterns in K8s manifests (`` substitution)

### Platform Reference
- **Standards:** `shtrial-demo-standards.md` - Complete platform documentation
- **Implementation:** `.pendoah/platform/docs/` - Detailed guides
- **Templates:** `.pendoah/platform/templates/` - Code and config templates

---


**ABSOLUTE MANDATORY RULES:**
- You must review these instructions in full before executing any steps to understand the full instructions guidelines.
- You must follow these instructions exactly as specified without deviation.
- Do not keep repeating status updates while processing or explanations unless explicitly required. This is bad and will flood Copilot session context.
- NO phase announcements (no "# Phase X" headers in output)
- Phases must be executed one at a time and in the exact order specified.
- NO combining of phases in one response
- NO skipping of phases
- NO verbose explanations or commentary
- Only output the exact text specified in phase instructions

# Phase 1: Initialization

- Create file `\Copilot-Processing.md` in workspace root
- Populate `\Copilot-Processing.md` with user request details
- Work silently without announcements until complete.
- When this phase is complete keep mental note of this that <Phase 1> is done and does not need to be repeated.

# Phase 2: Planning

- Generate an action plan into the `\Copilot-Processing.md` file.
- Generate detailed and granular task specific action items to be used for tracking each action plan item with todo/complete status in the file `\Copilot-Processing.md`.
- This should include:
  - Specific tasks for each action item in the action plan as a phase.
  - Clear descriptions of what needs to be done
  - Any dependencies or prerequisites for each task
  - Ensure tasks are granular enough to be executed one at a time
- Work silently without announcements until complete.
- When this phase is complete keep mental note of this that <Phase 2> is done and does not need to be repeated.

# Phase 3: Execution

- Execute action items from the action plan in logical groupings/phases
- Work silently without announcements until complete.
- Update file `\Copilot-Processing.md` and mark the action item(s) as complete in the tracking.
- When a phase is complete keep mental note of this that the specific phase from `\Copilot-Processing.md` is done and does not need to be repeated.
- Repeat this pattern until all action items are complete

# Phase 4: Summary

- Add summary to `\Copilot-Processing.md`
- Work silently without announcements until complete.
- Execute only when ALL actions complete
- Inform user: "Added final summary to `\Copilot-Processing.md`."
- Remind user to review the summary and confirm completion of the process then to remove the file when done so it is not added to the repository.

**ENFORCEMENT RULES:**
- NEVER write "# Phase X" headers in responses
- NEVER repeat the word "Phase" in output unless explicitly required
- NEVER provide explanations beyond the exact text specified
- NEVER combine multiple phases in one response
- NEVER continue past current phase without user input
- If you catch yourself being verbose, STOP and provide only required output
- If you catch yourself about to skip a phase, STOP and go back to the correct phase
- If you catch yourself combining phases, STOP and perform only the current phase
