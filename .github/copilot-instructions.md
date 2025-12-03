# GitHub Copilot Instructions (`github/copilot-instructions.md`)

These rules apply to:
- GitHub Copilot Chat
- GitHub Copilot inline completions
- GitHub Copilot Workspace / Agents

They supplement `agents.md`. If there is a conflict, follow the stricter policy.

---

## 1. DigitalOcean-First Infrastructure

When suggesting code or infra changes, Copilot must:

1. Assume the **canonical shared DigitalOcean resources**:
   - Region: `SH_REGION=nyc3` 
   - Managed Postgres: `SH_DB_CLUSTER_NAME=sh-shared-postgres` and `DATABASE_URL` / `DO_DATABASE_URL_*` 
   - Spaces: `DO_SPACES_BUCKET=voxops`, `DO_SPACES_REGION=nyc3`, `DO_SPACES_CDN_ENDPOINT`, `NEXT_PUBLIC_CDN_BASE_URL` 
   - AI: `DIGITALOCEAN_INFERENCE_ENDPOINT`, `DIGITALOCEAN_MODEL_KEY`, `AI_PROVIDER=digitalocean`, `AI_MODEL`, `DO_RAG_*`, `FAL_MODEL_*` 

2. Target **Droplets, App Platform, and Functions** for hosting:
   - Shared app Droplets (multiple containers) instead of one Droplet per service.
   - App Platform for simple web/static frontends.
   - Functions for low-traffic/background jobs.

3. Avoid proposing:
   - New databases, buckets, or AI accounts per app.
   - Other-cloud solutions (AWS RDS/S3/Lambda, Azure, GCP) as defaults.

---

## 2. Tooling & Language Conventions

1. **Package manager**
   - Use **pnpm** in suggestions:

     ```bash
     pnpm install
     pnpm add <package>
     pnpm add -D <dev-package>
     ```

2. **Language & framework**
   - Prefer TypeScript where present.
   - Match the repo’s actual stack (React, Next.js, etc.).
   - Do not introduce a new framework without an explicit issue or design doc.

3. **Styling**
   - If Tailwind is used, prefer Tailwind utilities.
   - Respect existing design tokens and Tailwind config.

---

## 3. Files and Folders Copilot Must Avoid

Unless explicitly asked by a human:

- Do **not** edit:
  - `node_modules/` 
  - Build output: `.next/`, `dist/`, `out/`, etc.
  - Generated code modules (e.g., `src/generated/`, `src/__generated__/`)
  - Auto-generated UI component directories (e.g., `src/components/ui/`)

If absolutely necessary to touch these, Copilot should:
- Minimize the change.
- Add a comment explaining why.

---

## 4. Secrets & Config Management

Copilot must:

- Never hardcode secret values (DB passwords, API keys for DigitalOcean, Namecheap, GitHub PATs, Firecrawl, Context7, Tavily, Devin, etc.).
- Always read secrets via environment variables using the **existing names**:
  - DB: `DB_HOST`, `DB_PORT`, `DB_USER`, `DB_PASSWORD`, `DATABASE_URL`, etc.
  - Storage: `DO_SPACES_BUCKET`, `DO_SPACES_ENDPOINT`, `DO_SPACES_REGION`, etc.
  - AI: `DIGITALOCEAN_MODEL_KEY`, `AI_MODEL`, `DO_RAG_EMBEDDING_MODEL_*`, `FAL_MODEL_*`, etc.
- Update `.env.example` or config docs with placeholder values when new env vars are needed.
- Avoid printing real env var values in logs or comments.

---

## 5. Code Quality & Testing

When Copilot modifies non-trivial logic (auth, billing, DB querying, AI gateway, file uploads):

1. Keep changes **small and focused**.
2. Update or add tests where a test framework exists.
3. Keep tests:
   - Fast
   - Deterministic
   - Local to the changed behavior

Linting:

- Follow existing ESLint / Prettier config.
- Avoid disabling lint rules globally; if a rule must be disabled for a line, document why.

---

## 6. AI API Usage in This Repo

If Copilot edits AI-related code:

- It must:
  - Use the central AI client modules (e.g., `src/lib/ai/*`) instead of adding new per-feature HTTP clients.
  - Use existing env vars for endpoints and models (`DIGITALOCEAN_INFERENCE_ENDPOINT`, `AI_MODEL`, `DO_RAG_EMBEDDING_MODEL_*`, `FAL_MODEL_*`).
  - Prefer cheaper/smaller models for routine operations, and only use 70B-class or expensive paths when clearly required.

- It must not:
  - Introduce new AI vendors as primary infra.
  - Duplicate AI client logic across the codebase.

---

## 7. PR / Change Explanations

When Copilot drafts PR descriptions or explanations:

- Be concise and technical.
- Include:
  - What changed
  - Why it changed
  - Any env vars / config updates
  - Any manual migration or deployment steps
- Avoid overexplaining basic concepts.

---

## 8. Change Granularity

Copilot should:

- Prefer **localized diffs** over repo-wide refactors.
- Always produce **complete file contents** when rewriting files, so changes are clearly reviewable.
- If uncertain, choose the solution that:
  1. Reuses the shared DigitalOcean resources.
  2. Minimizes new infrastructure.
  3. Matches existing patterns and cost profile.
