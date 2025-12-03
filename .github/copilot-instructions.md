# GitHub Copilot Instructions (github/copilot-instructions.md)

These rules apply to:

- GitHub Copilot Chat
- GitHub Copilot inline completions
- GitHub Copilot Workspace / Agents

They supplement agents.md. If there is a conflict, follow the stricter policy.

---

## 1. DigitalOcean & Hatch-First Infrastructure

Copilot must assume:

- Cloud: **DigitalOcean**
- Region: SH_REGION=nyc3 
- Billing: Hatch gives **credits/discounts for GPU Droplets and Gradient AI**, not free third-party APIs.

Canonical resources:

- Managed Postgres:
  - SH_DB_CLUSTER_NAME=sh-shared-postgres + DATABASE_URL / DO_DATABASE_URL_* - Spaces:
  - DO_SPACES_BUCKET=voxops, DO_SPACES_REGION=nyc3, DO_SPACES_CDN_ENDPOINT, NEXT_PUBLIC_CDN_BASE_URL 
- AI:
  - DIGITALOCEAN_INFERENCE_ENDPOINT 
  - DIGITALOCEAN_MODEL_KEY 
  - AI_PROVIDER=digitalocean 
  - AI_MODEL 
  - DO_RAG_REGION, DO_RAG_EMBEDDING_MODEL_* - FAL_MODEL_FAST_SDXL, FAL_MODEL_FLUX_SCHNELL, FAL_MODEL_STABLE_AUDIO, FAL_MODEL_TTS_V2 

Copilot must **not** propose migrating to AWS/Azure/GCP or using external SaaS APIs as defaults. Any such change requires explicit human direction.

---

## 2. Tooling & Languages

1. **Package manager**

   Use **pnpm**:

   ```bash
   pnpm install
   pnpm add <package>
   pnpm add -D <dev-package>
   ```

2.  **Language & framework**

      - Prefer TypeScript where present.
      - Match existing frameworks (React, Next.js, etc.).
      - Do not introduce new frameworks without an explicit issue or design doc.

3.  **Styling**

      - If Tailwind is used, prefer Tailwind utilities.
      - Respect existing Tailwind config and design tokens.

-----

## 3. Files and Folders Copilot Must Avoid

Unless explicitly told otherwise, Copilot must not edit:

  - node_modules/
  - Build output: .next/, dist/, out/, etc.
  - Generated code directories: src/generated/, src/__generated__/, *.gen.ts, etc.
  - Auto-generated UI component directories (e.g., src/components/ui/)

If touching any of these is absolutely necessary:

  - Minimize the change.
  - Add a comment / PR note explaining why.

-----

## 4. Secrets & Configuration

Always use existing env vars:

  - DB: DB_HOST, DB_PORT, DB_USER, DB_PASSWORD, DATABASE_URL, DO_DATABASE_URL_PUBLIC, etc.
  - Storage: DO_SPACES_BUCKET, DO_SPACES_ENDPOINT, DO_SPACES_REGION, DO_SPACES_CDN_ENDPOINT, NEXT_PUBLIC_CDN_BASE_URL.
  - AI: DIGITALOCEAN_MODEL_KEY, AI_MODEL, DO_RAG_EMBEDDING_MODEL_*, FAL_MODEL_*, etc.

Update .env.example and docs with placeholder values when introducing new env vars.
Secrets must not be printed in logs or comments.

-----

## 5. AI API Usage

When editing code that calls AI:

  - Use the existing AI client modules (e.g. src/lib/ai/*) rather than creating new, ad-hoc HTTP clients.
  - Respect the model strategy defined in agents.md:
      - Default: cost-effective models from Gradient AI (Llama 3.x, Mistral, etc.).
      - Heavy models only for explicitly high-value tasks.
  - For RAG, use the central RAG/embedding client and shared DO_RAG_* env vars.
  - For image/audio generation, use FAL_MODEL_* env vars and the shared fal/Gradient client.
  - For speech/voice, call the shared ASR/TTS service rather than embedding models inside this repo.

