# GitHub Copilot Instructions - Synapse (v2025.2)

> **Governance**: Enterprise Engineering Standards v2025.2
> **Parent**: `H:\Repos\sh\.github\copilot-instructions.md`

**Project**: Synapse - Intelligent file system knowledge base  
**Last Updated**: December 2025

---

## 1. Core Rule

**Follow the guidelines in `AGENTS.md`.** That document defines:
- Directory rules (what NOT to touch)
- Coding standards
- Security and testing expectations
- Tech stack and infrastructure

If instructions here conflict with `AGENTS.md`, prefer `AGENTS.md` for general rules and this file for Copilot-specific behavior.

---

## 2. Project Snapshot

**Synapse** turns your file system into a queryable knowledge base.

**Core Value**: Instant access to file knowledge.

**Main Technologies**:
- Node.js + Express + React + Vite
- Database: PostgreSQL + pgvector on `sh-shared-postgres` (DigitalOcean Managed PostgreSQL)
- AI: DigitalOcean Gradient AI (OpenAI-compatible serverless inference)
- Monorepo: pnpm workspaces with apps/frontend and apps/backend structure

---

## 3. Directory Rules

**You MAY modify**:
- `apps/frontend/src/`
- `apps/backend/server.js`
- `prisma/`
- `tests/`
- `packages/shared/`

**NEVER edit**:
- `node_modules/`
- `dist/`
- `.env` files

---

## 4. Coding & Editing Rules

### Package Manager
- Use `pnpm` for all scripts
- Never use `npm` or `yarn`

### TypeScript/JavaScript Standards
- Use **strict mode**
- Use **2 spaces** for indentation

### AI Integration
```javascript
// ✅ CORRECT: Use DigitalOcean Gradient AI via OpenAI-compatible client
import OpenAI from 'openai';

const client = new OpenAI({
  baseURL: process.env.DIGITALOCEAN_INFERENCE_ENDPOINT,
  apiKey: process.env.DIGITALOCEAN_MODEL_KEY,
});

const response = await client.chat.completions.create({
  model: process.env.AI_MODEL,
  messages: [
    { role: 'system', content: instructions },
    { role: 'user', content: userQuery },
  ],
});
```

---

## 5. Testing & Quality

### Commands
```bash
pnpm test              # E2E tests
pnpm lint              # ESLint
```

### Requirements
- For any non-trivial change, update or add tests
- Do not suggest merging code that introduces failing tests

---

## 6. Code Review & PR Guidance

When helping with PRs or reviews:

### Focus Areas
- Correctness, security, and maintainability
- File system safety
- Missing tests for new behavior
- Large diffs that should be split into smaller PRs

### PR Standards
- Title format: `feat(synapse): description`
- Use Conventional Commits (`feat`, `fix`, `chore`, `docs`)

### Verification Before Merge
```bash
pnpm test
```

---

## 7. Critical Rules

1. **NO NEW INFRA**: Use shared `sh-shared-postgres` with per-repo databases
2. **AI ENDPOINT**: Use `DIGITALOCEAN_INFERENCE_ENDPOINT` (`/v1/chat/completions`) via OpenAI-compatible clients
3. **NO FRONTEND KEYS**: Backend proxy for all AI calls
4. **NO CI/CD**: Manual deployment only
5. **FILE PRIVACY**: Respect permissions



## Golden Environment Standard (v2025.2)

Every repo's `.env` must follow this structure (derived from `.env.shared`):

```dotenv
# APP IDENTITY
APP_SLUG={{APP_SLUG}}
APP_ENV=prod

# DIGITALOCEAN INFRASTRUCTURE (SHARED)
DIGITALOCEAN_API_TOKEN=dop_v1_...
SH_ORG_PREFIX=sh
SH_REGION=nyc3

# DATABASE (Managed PostgreSQL)
# Use repo-specific database name
DO_DATABASE_URL_PUBLIC=postgresql://doadmin:PASSWORD@host:port/{{RepoName}}?sslmode=require
DO_DATABASE_URL_PRIVATE=postgresql://doadmin:PASSWORD@private-host:port/{{RepoName}}?sslmode=require

# OBJECT STORAGE (Spaces)
# Use repo-specific bucket name
DO_SPACES_ENDPOINT=https://nyc3.digitaloceanspaces.com
DO_SPACES_BUCKET={{bucketname}}
DO_SPACES_CDN_ENDPOINT=https://{{bucketname}}.nyc3.cdn.digitaloceanspaces.com

# AI ENGINE (Gradient AI + Fal AI)
DIGITALOCEAN_INFERENCE_ENDPOINT=https://inference.do-ai.run/v1
AI_PROVIDER=digitalocean
AI_MODEL=llama-3.1-70b-instruct

# Fal AI Models
FAL_MODEL_FAST_SDXL=fal-ai/fast-sdxl
FAL_MODEL_FLUX_SCHNELL=fal-ai/flux/schnell
FAL_MODEL_STABLE_AUDIO=fal-ai/stable-audio-25/text-to-audio
FAL_MODEL_TTS_V2=fal-ai/elevenlabs/tts/multilingual-v2

# DEV SERVICES
NAMECHEAP_API_USER=sh12may80
GITHUB_PAT_SHMINDMASTER=...
FIRECRAWL_API_KEY=...
CONTEXT7_API_KEY=...
```

---


*Last Updated: December 2025 | Version: 2025.2*
