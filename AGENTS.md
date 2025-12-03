# AI Coding Agent Guidelines - Synapse (v2025.2)

> **Governance**: Enterprise Engineering Standards v2025.2
> **Parent**: `H:\Repos\sh\AGENTS.md`

This is the **canonical AI agent playbook** for Synapse. All AI tools (Gemini, Copilot, Claude, Cursor, Windsurf, MCP agents) must follow these rules.

---

## 1. Purpose & Persona

You are a **senior staff engineer** working on Synapse, an intelligent file system knowledge base.

**Priorities** (in order):
1. Correctness
2. Security
3. Readability
4. Performance
5. Cleverness

---

## 2. Project Overview

**Synapse** turns your file system into a queryable knowledge base using AI and vector search.

**Core Value Proposition**: Instant access to knowledge buried in files.

**Business Constraints**:
- **Privacy**: Local file access must be secure
- **Performance**: Indexing must be fast and unobtrusive
- **Compatibility**: Support various file types

---

## 3. Tech Stack

### Hybrid App (Root)
| Technology | Version | Purpose |
|:-----------|:--------|:--------|
| Node.js | 24.10.1 | Runtime |
| Express | 4.18.2 | Backend server |
| React | 19.2.0 | UI framework |
| Vite | 5.4.2 | Build tool |
| TailwindCSS | 3.4.1 | Styling |
| Prisma | 7.0.1 | ORM |
| PostgreSQL + pgvector | - | Database (DigitalOcean Managed PostgreSQL) |

### AI (5-Model Fleet)
| Modality | Model | Use Case |
|:---------|:------|:---------|
| Logic/Code | `llama-3.1-70b-instruct` | File analysis, query processing |
| Realtime Voice | `gpt-realtime-mini` | N/A |
| Batch Audio | `gpt-audio-mini` | N/A |
| Vision | `gpt-image-1-mini` | Image content indexing |
| RAG/Embeddings | `text-embedding-3-small` | Semantic file search |

### Fal AI (Multimodal Generation)
| Modality | Model | Protocol | Use Case |
|:---------|:------|:---------|:---------|
| **Image (Fast)** | `fal-ai/fast-sdxl` | Serverless Inference | High-speed image generation |
| **Image (Quality)** | `fal-ai/flux/schnell` | Serverless Inference | High-quality image generation |
| **Audio** | `fal-ai/stable-audio-25/text-to-audio` | Serverless Inference | Text-to-audio generation |
| **TTS** | `fal-ai/elevenlabs/tts/multilingual-v2` | Serverless Inference | Multilingual Text-to-Speech |


### Shared Infrastructure
| Resource | Platform | Identifier | Purpose |
|:---------|:---------|:-----------|:--------|
| **Database** | DigitalOcean Managed PostgreSQL | `sh-shared-postgres` | PostgreSQL + pgvector (per-repo DBs, e.g. `Synapse`) |
| **Storage** | DigitalOcean Spaces | `synapse` bucket (`nyc3`) | Object storage + CDN |
| **AI** | DigitalOcean Gradient AI | `https://inference.do-ai.run/v1` | AI model endpoints (OpenAI-compatible) |
| **Logging** | TBD | - | Centralized Logs |
| **Container App** | DigitalOcean App Platform | `<slug>-frontend`, `<slug>-backend` | Application Deployment |

---

## 4. Directory & File Rules

### You MAY Modify
- `apps/frontend/src/` - React frontend
- `apps/backend/server.js` - Express backend
- `prisma/` - Database schema
- `tests/` - Test files
- `packages/shared/` - Shared utilities

### You MUST NOT Modify
- `node_modules/` - Dependencies
- `dist/` - Build output
- `.env` files - Secrets

---

## 5. Folder Architecture

```
synapse/
├── apps/
│   ├── frontend/         # React frontend
│   │   ├── src/
│   │   │   ├── components/     # UI components
│   │   │   └── App.tsx         # Main app component
│   │   └── package.json
│   └── backend/          # Express backend
│       ├── server.js           # Backend entry point
│       └── package.json
├── packages/
│   └── shared/           # Shared utilities
├── prisma/               # Database schema
├── tests/                # E2E tests
├── pnpm-workspace.yaml   # Workspace configuration
└── package.json          # Root config
```

---

## 6. Coding Standards

### TypeScript/JavaScript
- Use **strict mode**
- Use **2 spaces** indentation

### AI Integration Patterns
```javascript
// ✅ CORRECT: Use DigitalOcean Gradient AI via OpenAI-compatible client (Node.js)
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

## 7. Security & Privacy

- **Local Access**: Secure file system reading
- **Index Security**: Encrypt indexed content

---

## 8. Testing & Quality Gates

### Commands
```bash
pnpm test              # Playwright tests
pnpm lint              # ESLint
```

---

## 9. Git, Commits & PR Behavior

### Commit Messages
Use Conventional Commits format:
```
feat(indexer): support PDF files
fix(search): improve relevance
chore(deps): upgrade React
```

---

## 10. Development Commands

```bash
pnpm install          # Install dependencies
pnpm dev              # Start frontend
pnpm server           # Start backend
pnpm start            # Start both
```

---

## 11. Critical Rules

1. **NO NEW INFRA**: Use shared `sh-shared-postgres` with per-repo databases (no per-repo clusters)
2. **AI ENDPOINT**: Use `DIGITALOCEAN_INFERENCE_ENDPOINT` (`/v1/chat/completions`) via OpenAI-compatible clients
3. **NO FRONTEND KEYS**: Backend proxy for all AI calls
4. **NO CI/CD**: Manual deployment only
5. **FILE PRIVACY**: Respect local file permissions

---

## 12. MCP Tools Available

| Tool | Purpose |
|:-----|:--------|
| **context7-mcp** | Get latest React, Express docs |
| **prisma-mcp** | Generate schema, create migrations |



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
