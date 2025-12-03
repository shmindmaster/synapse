# Gemini Coding Agent Rules (`gemini.md`)

This file defines how **Gemini CLI** and **Gemini Code Assist** must behave when working in this repository.

These rules supplement `agents.md`. If there is a conflict, follow the stricter rule.

---

## 1. Identity & Scope

You are a **coding assistant**, not an infrastructure owner.

- You must follow the **shared DigitalOcean model** and env names in `agents.md`.
- You must not introduce alternate architectures or cloud providers unless explicitly requested.

---

## 2. DigitalOcean-Aligned Behavior

When Gemini proposes or edits code, it must:

1. Use the canonical shared resources:
   - Managed Postgres via `SH_DB_CLUSTER_NAME=sh-shared-postgres` and `DATABASE_URL`/`DO_DATABASE_URL_*`.
   - Spaces via `DO_SPACES_BUCKET=voxops`, `DO_SPACES_REGION=nyc3`, and CDN endpoints.
   - DO AI stack via `DIGITALOCEAN_INFERENCE_ENDPOINT`, `DIGITALOCEAN_MODEL_KEY`, `AI_PROVIDER=digitalocean`, `AI_MODEL`, and `DO_RAG_*`, `FAL_MODEL_*`.
2. Assume all compute runs in `SH_REGION=nyc3` on:
   - Shared app Droplets (multiple containers), and/or
   - DigitalOcean App Platform & Functions.

Gemini must **not** suggest or implement migrations to AWS, Azure, or GCP as a “better default.”

---

## 3. Tooling & Code Conventions

1. **Package management**
   - Default to **pnpm** commands:
     ```bash
     pnpm install
     pnpm add <package>
     pnpm add -D <dev-package>
     ```
2. **Language/framework**
   - Prefer TypeScript where used.
   - Match existing stack (React, Next.js, etc.), no surprise framework swaps.

3. **Do-not-touch zones**
   - `node_modules/`, `.next/`, `dist/`, and any generated code directories.
   - `src/components/ui/` (or equivalent auto-generated UI folders).
   - Any directory explicitly marked as generated or vendor code.

Only edit these when a human explicitly asks and explain in comments why.

---

## 4. Secrets & Config

Gemini must:

- Never insert real key values (DB, DO, Namecheap, GitHub, Firecrawl, Context7, Tavily, Devin, etc.) into code or docs.
- Use environment variables exactly as named in the shared `.env` (e.g., `DB_HOST`, `DO_SPACES_BUCKET`, `DIGITALOCEAN_MODEL_KEY`).
- Update `.env.example` and README with **placeholder** values when new config is introduced, not with real secrets.

---

## 5. AI Usage Inside the Codebase

If you modify code that **calls AI services** (DigitalOcean AI, RAG, FAL, etc.):

- Route all model calls through a central client module (e.g., `src/lib/ai/doClient.ts`).
- Use the canonical env vars for:
  - Endpoint and key: `DIGITALOCEAN_INFERENCE_ENDPOINT`, `DIGITALOCEAN_MODEL_KEY`, `AI_PROVIDER`.
  - Model choices: `AI_MODEL`, `DO_RAG_EMBEDDING_MODEL_*`, `FAL_MODEL_*`.
- Prefer cost-efficient models and embeddings by default, reserving heavy models for explicit “deep reasoning” paths.
- Implement timeouts and error handling; no infinite retries.

---

## 6. Change Strategy

When Gemini proposes changes:

1. Prefer **incremental improvements** over sweeping rewrites.
2. Keep refactors localized unless an issue or design doc explicitly calls for a big change.
3. Provide **full updated files**, not partial patches with implied context.

If unsure between multiple options, choose the solution that is:

1. Most aligned with the **shared DigitalOcean stack**.
2. Cheapest to run (fewer resources, reuse existing infra).
3. Closest to existing patterns in the repo.
