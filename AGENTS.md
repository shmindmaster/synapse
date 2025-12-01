# AGENTS.md - Synapse

AI coding agent guide for Synapse, an AI-native knowledge OS for your local file system.

## Project Overview

**Application**: Desktop Knowledge OS for local files  
**Role**: Index, analyze, and chat with documents on disk using Azure OpenAI  
**Repo Type**: React/Vite SPA + Node/Express backend in the same repo

## Architecture & Tech Stack

- **Frontend**: React + TypeScript + Vite (`src/main.tsx`, `src/App.tsx`)
  - UI: Tailwind CSS, Lucide icons
  - Async calls via `src/utils/api.ts` → `/api/*` endpoints on the local server
- **Backend**: Node.js + Express (`server.js`)
  - Uses `textract` and `walk` to scan and read local files
  - Maintains a JSON-based vector store on disk (`synapse_memory.json` in `DATA_DIR`)
- **AI**: Azure OpenAI via `AzureOpenAI` (official OpenAI SDK)
  - Chat: `AZURE_OPENAI_CHAT_DEPLOYMENT` (default `gpt-4o`)
  - Embeddings: `AZURE_OPENAI_EMBED_DEPLOYMENT` (default `text-embedding-3-small`)
- **Persistence**: Local filesystem only (no Postgres) – vectors and previews stored in JSON

## Key Backend Endpoints (`server.js`)

- `POST /api/index-files`
  - Scans selected base directories, extracts text from files, chunks content, generates embeddings, and writes to `synapse_memory.json`.
  - Uses Azure OpenAI embeddings for `embedDeployment`.
- `GET /api/index-status`
  - Returns `{ hasIndex, count }` based on the in-memory / JSON vector store.
- `POST /api/semantic-search`
  - Accepts `{ query }`, embeds the query via Azure OpenAI, performs cosine similarity over the vector store, and returns top-matching files with summaries.
- `POST /api/analyze`
  - Accepts `{ filePath }`, extracts file text, truncates to a safe length, and calls Azure OpenAI chat to produce a JSON analysis: `summary`, `tags`, `category`, `sensitivity`.
- `POST /api/chat`
  - Accepts `{ filePath, message, history }`, extracts file text, builds a context prompt, and calls Azure OpenAI chat for RAG-style Q&A over the file.
- `POST /api/search`
  - Legacy keyword-based scan over directories for basic content/keyword matching.
- `POST /api/file-action`
  - `{ file, action, destination }` move/copy operations coordinated from the UI.

## Frontend–Backend Wiring

- `src/utils/api.ts`
  - Uses `API_BASE_URL = ''` in production and `http://localhost:3001` in dev.
  - `apiUrl('/api/...')` is consumed by components and hooks.
- `src/App.tsx`
  - Orchestrates:
    - Indexing via `POST /api/index-files`
    - Semantic search via `POST /api/semantic-search`
    - File actions via `POST /api/file-action`
    - AI analysis/chat via `InsightDrawer` (`/api/analyze`, `/api/chat`)

## Environment & Azure Configuration

See `.env.example` (if present) or `.env` in the repo root. Core variables used in `server.js`:

```env
AZURE_OPENAI_ENDPOINT=https://shared-openai-eastus2.openai.azure.com/
AZURE_OPENAI_KEY=***
AZURE_OPENAI_CHAT_DEPLOYMENT=gpt-4o
AZURE_OPENAI_EMBED_DEPLOYMENT=text-embedding-3-small
AZURE_OPENAI_CHAT_API_VERSION=2024-02-15-preview

# Optional
DATA_DIR=/app/data   # Where synapse_memory.json is stored (defaults to server.js directory)
PORT=3001            # Express server port
```

**Important:**
- Always use the shared `shared-openai-eastus2` resource on the MahumTech platform.
- Never hardcode keys; use `.env` locally and GitHub/Azure secrets in CI/CD.

## Build & Run Commands

```bash
# Install deps
pnpm install

# Dev: run backend and frontend separately
pnpm dev         # Vite dev server (port 5173)
node server.js   # Express + Azure OpenAI server (port 3001)

# Or use the combined start script (per README)
pnpm start       # Launches frontend + analysis server together
```

## Coding Conventions

- TypeScript strict mode in the SPA.
- Keep all Azure OpenAI calls in `server.js`; the SPA should never hold secrets.
- When extending AI behavior:
  - Reuse the existing `AzureOpenAI` client and shared deployments.
  - Log minimal, non-sensitive data; do not log raw file contents.
  - Respect token limits – truncate or chunk content before sending to Azure OpenAI.

## PR Guidelines

- Title: `[Synapse] Brief description`
- Ensure `pnpm build` and tests (Playwright, if modified) pass.
- Do not change the shared Azure resource names; treat them as platform-owned.
