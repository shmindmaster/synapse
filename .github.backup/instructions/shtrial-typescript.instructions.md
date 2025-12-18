---
description: 'Guidelines for TypeScript Development targeting TypeScript 5.x and ES2022 output with SHTrial Platform standards'
applyTo: '**/*.ts'
---

# TypeScript Development (SHTrial Platform)

## SHTrial Platform Context

These instructions apply to applications running on the **SHTrial Platform** - a unified DigitalOcean infrastructure with shared resources and per-app logical isolation.

### Platform Standards Reference
- **Primary:** `./UNIFIED_PLAYBOOK.md` (local file) - Complete platform architecture and standards
- **Configuration:** `./.env.example` - Environment variable template - Master configuration template (single source of truth)

### Key Platform Resources
- **Cluster:** `sh-demo-cluster` (NYC3, Kubernetes 1.34.1-do.1, CPU-only, 4 nodes)
- **Database:** `sh-shared-postgres` (Postgres 16 + pgvector, db-per-app isolation)
- **Storage:** `sh-storage` (DigitalOcean Spaces + CDN, prefix-per-app isolation)
- **Registry:** `registry.digitalocean.com/shtrial-reg`
- **Builder:** `sh-builder-nyc3` (Droplet for builds and deployments)
- **AI Services:** DigitalOcean GenAI serverless (https://inference.do-ai.run/v1)
- **DNS:** `*.shtrial.com` wildcard with Let's Encrypt TLS
- **Load Balancer:** NGINX Ingress Controller (shared)

### Application Standards
- **Naming Convention:** `{APP_SLUG}` pattern for all resources
- **Canonical Naming:** `{APP_SLUG}-backend`, `{APP_SLUG}-frontend` for deployments/services
- **Backend Stack:** FastAPI (Python 3.12) or Fastify (Node 22)
- **Frontend Stack:** Next.js 16 App Router or Vite 7
- **AI Orchestration:** LangGraph (code-first StateGraph, vendor-neutral)
- **Styling:** Tailwind CSS v4 + shadcn/ui
- **Package Management:** Poetry (Python) / pnpm (TypeScript)

### Platform Constraints & Capabilities
- **✅ ENABLED:** Full access to all shared resources, complete credentials provided
- **✅ ENABLED:** Autonomous deployment and configuration management
- **✅ ENABLED:** End-to-end task completion without approval
- **❌ NO GPU:** All AI inference uses serverless endpoints (no local models)
- **❌ NO NEW INFRASTRUCTURE:** Use existing shared cluster, database, storage, registry
- **❌ NO `:latest` TAGS:** Use immutable tags (git-sha + timestamp)

### Configuration Management
All applications use local configuration files:
- **Template:** `./.env.example` - Environment variable template (committed to git)
- **Runtime:** `./.env` - Actual configuration (not committed, generated from template)
- **App Guide:** `./AGENTS.MD` - App-specific configuration and standards

### Canonical Image Naming
- Backend: `registry.digitalocean.com/shtrial-reg/{APP_SLUG}-backend:{TAG}`
- Frontend: `registry.digitalocean.com/shtrial-reg/{APP_SLUG}-frontend:{TAG}`
- Tag format: `{git-sha}-{timestamp}` (immutable, no `:latest`)
- Build script: `scripts/shtrial-build-deploy.sh` with `ROLE=backend` or `ROLE=frontend`

---


> These instructions assume projects are built with TypeScript 5.x (or newer) compiling to an ES2022 JavaScript baseline on the SHTrial Platform (DigitalOcean-based infrastructure).

## Platform Context

This application runs on the **SHTrial Platform** with:
- **Backend Standard:** Fastify (no Express/NestJS)
- **Frontend Standard:** Next.js 16 App Router or Vite 7
- **AI Orchestration:** LangGraph.js (code-first agents)
- **Package Manager:** pnpm only
- **Deployment:** Kubernetes (sh-demo-cluster, NYC3)

## Core Intent

- Respect the existing architecture and SHTrial platform standards
- Prefer readable, explicit solutions over clever shortcuts
- Follow platform naming conventions (`{APP_SLUG}` pattern)
- Extend current abstractions before inventing new ones
- Prioritize maintainability, clarity, and platform consistency

## General Guardrails

- Target TypeScript 5.x / ES2022 and prefer native features over polyfills
- Use pure ES modules; never emit `require`, `module.exports`, or CommonJS helpers
- Rely on the project's build, lint, and test scripts unless asked otherwise
- Note design trade-offs when intent is not obvious
- Follow SHTrial platform standards for configuration and deployment
- Use environment variables from `./.env.example` for all configuration

## Platform Integration

### Backend (Fastify + LangGraph.js)

When building backend services:
- Use **Fastify** as the HTTP framework (not Express or NestJS)
- Implement AI agents using **LangGraph.js** with StateGraph pattern
- Connect to shared Postgres using `DATABASE_URL` from environment
- Use OpenAI-compatible client pointing to `GRADIENT_API_BASE`
- Follow standard patterns from `./UNIFIED_PLAYBOOK.md` and generated templates

### Frontend (Next.js 16 or Vite 7)

When building frontend applications:
- Use **Next.js 16 with App Router** for full-stack apps
- Use **Vite 7** for SPAs
- Call backend via `NEXT_PUBLIC_API_URL` environment variable
- Never hardcode API URLs or service endpoints
- Use shadcn/ui components with Tailwind CSS v4

### Configuration Management

- Read from `./.env.example` for all environment variables
- Never hardcode credentials, URLs, or resource names
- Use template variables in Kubernetes manifests: `${APP_SLUG}`, `${IMAGE_TAG}`
- Reference shared resources by their standard names (see platform docs)

## Project Organization

- Follow the repository's folder and responsibility layout for new code.
- Use kebab-case filenames (e.g., `user-session.ts`, `data-service.ts`) unless told otherwise.
- Keep tests, types, and helpers near their implementation when it aids discovery.
- Reuse or extend shared utilities before adding new ones.

## Naming & Style

- Use PascalCase for classes, interfaces, enums, and type aliases; camelCase for everything else.
- Skip interface prefixes like `I`; rely on descriptive names.
- Name things for their behavior or domain meaning, not implementation.

## Formatting & Style

- Run the repository's lint/format scripts (e.g., `npm run lint`) before submitting.
- Match the project's indentation, quote style, and trailing comma rules.
- Keep functions focused; extract helpers when logic branches grow.
- Favor immutable data and pure functions when practical.

## Type System Expectations

- Avoid `any` (implicit or explicit); prefer `unknown` plus narrowing.
- Use discriminated unions for realtime events and state machines.
- Centralize shared contracts instead of duplicating shapes.
- Express intent with TypeScript utility types (e.g., `Readonly`, `Partial`, `Record`).

## Async, Events & Error Handling

- Use `async/await`; wrap awaits in try/catch with structured errors.
- Guard edge cases early to avoid deep nesting.
- Send errors through the project's logging/telemetry utilities.
- Surface user-facing errors via the repository's notification pattern.
- Debounce configuration-driven updates and dispose resources deterministically.

## Architecture & Patterns

- Follow the repository's dependency injection or composition pattern; keep modules single-purpose.
- Observe existing initialization and disposal sequences when wiring into lifecycles.
- Keep transport, domain, and presentation layers decoupled with clear interfaces.
- Supply lifecycle hooks (e.g., `initialize`, `dispose`) and targeted tests when adding services.

## External Integrations

- Instantiate clients outside hot paths and inject them for testability.
- Apply retries, backoff, and cancellation to network or IO calls.
- Normalize external responses and map errors to domain shapes.

## Security Practices

- Validate and sanitize external input with schema validators or type guards.
- Avoid dynamic code execution and untrusted template rendering.
- Encode untrusted content before rendering HTML; use framework escaping or trusted types.
- Use parameterized queries or prepared statements to block injection.
- Favor immutable flows and defensive copies for sensitive data.
- Use vetted crypto libraries only.
- Patch dependencies promptly and monitor advisories.

## Configuration & Secrets

- Reach configuration through shared helpers and validate with schemas or dedicated validators.
- Document new configuration keys and update related tests.

## UI & UX Components

- Sanitize user or external content before rendering.
- Keep UI layers thin; push heavy logic to services or state managers.
- Use messaging or events to decouple UI from business logic.

## Testing Expectations

- Add or update unit tests with the project's framework and naming style.
- Expand integration or end-to-end suites when behavior crosses modules or platform APIs.
- Run targeted test scripts for quick feedback before submitting.
- Avoid brittle timing assertions; prefer fake timers or injected clocks.

## Performance & Reliability

- Lazy-load heavy dependencies and dispose them when done.
- Defer expensive work until users need it.
- Batch or debounce high-frequency events to reduce thrash.
- Track resource lifetimes to prevent leaks.

## Documentation & Comments

- Add JSDoc to public APIs; include `@remarks` or `@example` when helpful.
- Write comments that capture intent, and remove stale notes during refactors.
- Update architecture or design docs when introducing significant patterns.
