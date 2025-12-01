# Project: Synapse

## General Instructions

Synapse is an **AI-native knowledge OS** for your local file system. It indexes local files, generates semantic summaries and tags, and lets you perform RAG-style search and chat over your documents using Azure OpenAI.

The repo contains both:
- A React + Vite SPA (`src/`) for the UI.
- A Node.js + Express backend (`server.js`) that does file scanning, embedding, semantic search, and analysis.

When generating new code:
- Treat this as a desktop-style app that talks to a local Express server.
- Keep all Azure OpenAI calls on the backend; the SPA must never hold secrets.
- Ground changes in `server.js`, `src/utils/api.ts`, and `src/App.tsx`.

## Coding Style

### Frontend (React + TypeScript)
- Use TypeScript strict mode.
- 2-space indentation; always use semicolons.
- Use functional components with hooks.
- Use Tailwind CSS and Lucide icons as in existing components.
- Use `src/utils/api.ts` as the single API client for backend calls.

### Backend (Node + Express)
- Keep all routes defined in `server.js`.
- Use the official `AzureOpenAI` client (from the OpenAI SDK) configured via env vars.
- For heavy operations (indexing, analysis), chunk/truncate content to respect token limits.
- Keep vector store logic and file scanning behavior centralized; avoid scattering it across new files without reason.

## Tech Stack

- **Frontend**: React, TypeScript, Vite, Tailwind CSS, Lucide Icons.
- **Backend**: Node.js, Express (`server.js`).
- **AI**: Azure OpenAI (GPT-4o for chat, `text-embedding-3-small` for embeddings).
- **Persistence**: Local filesystem JSON vector store (`synapse_memory.json`), located in `DATA_DIR` or server directory.

## Key Backend Endpoints (`server.js`)

- `POST /api/index-files`
  - Scans selected base directories, extracts text from files, chunks content.
  - Generates embeddings via Azure OpenAI and writes them to `synapse_memory.json`.

- `GET /api/index-status`
  - Returns index status (`{ hasIndex, count }`).

- `POST /api/semantic-search`
  - Accepts `{ query }`.
  - Embeds query text and performs vector similarity search over stored embeddings.

- `POST /api/analyze`
  - Accepts `{ filePath }`.
  - Extracts text and calls Azure OpenAI chat to produce JSON analysis (summary, tags, category, sensitivity).

- `POST /api/chat`
  - Accepts `{ filePath, message, history }`.
  - Builds a context prompt from the file and performs chat-based Q&A.

- `POST /api/search`
  - Legacy keyword-based search over directories.

- `POST /api/file-action`
  - `{ file, action, destination }` move/copy operations triggered from the UI.

## Frontend–Backend Wiring

- `src/utils/api.ts`
  - Defines `apiUrl('/api/...')` using `API_BASE_URL` (empty in prod, `http://localhost:3001` in dev).
- `src/App.tsx`
  - Orchestrates indexing, semantic search, file actions, and AI analysis/chat using the above endpoints.

## Environment & Azure Configuration

See `.env` and `.env.example` in the repo root. Key variables:

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

Rules:
- Always use the shared `shared-openai-eastus2` resource.
- Do not hardcode API keys; use env vars.

## Build & Run Commands

From the repo root (`Synapse/`):

```bash
pnpm install

# Dev: run backend and frontend separately
pnpm dev         # Vite dev server (port 5173)
node server.js   # Express + Azure OpenAI server (port 3001)

# Combined (per README)
pnpm start       # Launches frontend + analysis server together
```

## Testing

- Use Playwright-based E2E suite as documented:
  - `npm test` or `pnpm test` to run all tests.
  - Suite-specific commands (`test:suite-a` .. `test:suite-e`) for focused runs.
- Keep test expectations aligned with existing suites (Service Health, Core UX, Neural Core, AI Features, UI/UX).

## Critical Rules

- All Azure OpenAI calls must go through `server.js`; the SPA must never call Azure OpenAI directly.
- Do not introduce additional backends or databases; Synapse is local-filesystem + JSON store only.
- Minimize logging of file contents; avoid storing raw sensitive user data.
- Respect token limits by chunking/truncating large documents.

## When in Doubt

- Treat `server.js`, `src/App.tsx`, and `src/utils/api.ts` as the source of truth.
- Use `README.md` and `AGENTS.md` to understand high-level behavior and constraints.
- Prefer incremental changes that preserve the desktop/local-first experience and privacy posture.
