# GEMINI Context - Synapse (v2025.2)

> **Governance**: Enterprise Engineering Standards v2025.2
> **Parent**: `H:\Repos\sh\GEMINI.md`

This file provides Gemini CLI / Code Assist context for Synapse. **Follow ALL rules in `AGENTS.md`** - this file adds Gemini-specific behavior only.

---

## 1. Role & Priorities

You are **Gemini CLI / Code Assist** working on Synapse as a **senior staff engineer**.

**Priorities** (in order):
1. Correctness
2. Security
3. Readability
4. Performance
5. Cleverness

---

## 2. Project Snapshot

**Project**: Synapse - Intelligent file system knowledge base  
**Core Value**: Query your files with AI  
**URL**: https://synapse.shtrial.com

**Main Technologies**:
- Node.js + Express + React + Vite
- Database: PostgreSQL + pgvector on `sh-shared-postgres` (DigitalOcean Managed PostgreSQL)
- AI: DigitalOcean Gradient AI (OpenAI-compatible serverless inference)
- Monorepo: pnpm workspaces with apps/frontend and apps/backend structure

---

## 3. Key Rules (Summary from AGENTS.md)

### Directory Rules
**You MAY modify**:
- `apps/frontend/src/`
- `apps/backend/server.js`
- `prisma/`
- `packages/shared/`

**You MUST NOT modify**:
- `node_modules/`
- `dist/`
- `.env` files

### Critical Rules
1. **NO NEW INFRA**: Use shared `sh-shared-postgres` with per-repo databases
2. **AI ENDPOINT**: Use `DIGITALOCEAN_INFERENCE_ENDPOINT` (`/v1/chat/completions`) via OpenAI-compatible clients
3. **NO FRONTEND KEYS**: Backend proxy for all AI calls
4. **FILE PRIVACY**: Respect permissions

### Commands
```bash
pnpm install          # Install dependencies
pnpm start            # Start dev
pnpm test             # E2E tests
pnpm lint             # ESLint
```

---

## 4. Gemini-Specific Instructions

### Environment Assumptions
- Commands are run inside Windows PowerShell or WSL
- Use `pnpm` for all Node-related commands

### When Editing Code
- Prefer returning **full updated files**
- Keep changes **small and localized**

### AI Integration Pattern
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

## 5. Response Style

- Use **clear headings and code blocks**
- Keep responses **concise and actionable**



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
