---
description: "Guidelines for writing Node.js and JavaScript code with Vitest testing"
applyTo: '**/*.js, **/*.mjs, **/*.cjs'
---

# Code Generation Guidelines

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


## Coding standards
- Use JavaScript with ES2022 features and Node.js (20+) ESM modules
- Use Node.js built-in modules and avoid external dependencies where possible
- Ask the user if you require any additional dependencies before adding them
- Always use async/await for asynchronous code, and use 'node:util' promisify function to avoid callbacks
- Keep the code simple and maintainable
- Use descriptive variable and function names
- Do not add comments unless absolutely necessary, the code should be self-explanatory
- Never use `null`, always use `undefined` for optional values
- Prefer functions over classes

## Testing
- Use Vitest for testing
- Write tests for all new features and bug fixes
- Ensure tests cover edge cases and error handling
- NEVER change the original code to make it easier to test, instead, write tests that cover the original code as it is

## Documentation
- When adding new features or making significant changes, update the README.md file where necessary

## User interactions
- Ask questions if you are unsure about the implementation details, design choices, or need clarification on the requirements
- Always answer in the same language as the question, but use english for the generated content like code, comments or docs
