# GitHub Copilot Instructions (github/copilot-instructions.md)

These rules apply to GitHub Copilot Chat, inline completions, and Workspace/Agents.
They supplement agents.md. If there is a conflict, follow the stricter policy.

---

## 1. DigitalOcean & Hatch-First Infrastructure
Copilot must assume:
- Cloud: **DigitalOcean** (SH_REGION=nyc3)
- Billing: Hatch gives **credits/discounts for GPU Droplets and Gradient AI**.

Canonical resources:
- Managed Postgres: DATABASE_URL, DO_DATABASE_URL_*
- Spaces: DO_SPACES_BUCKET=voxops, DO_SPACES_ENDPOINT
- AI: DIGITALOCEAN_INFERENCE_ENDPOINT, AI_MODEL, DO_RAG_EMBEDDING_MODEL_*, FAL_MODEL_*

Copilot must **not** propose migrating to AWS/Azure/GCP or using external SaaS APIs as defaults.

---

## 2. Tooling & Languages
1. **Package manager:** Use **pnpm**.
2. **Language:** Prefer TypeScript. Match existing frameworks (React, Next.js).
3. **Styling:** Prefer Tailwind utilities if present.

---

## 3. Files and Folders Copilot Must Avoid
Unless explicitly told otherwise, Copilot must not edit:
- node_modules/
- Build output (.next/, dist/, etc.)
- Generated code directories (src/generated/, *.gen.ts)
- Auto-generated UI component directories (e.g., src/components/ui/)

---

## 4. Secrets & Configuration
Always use existing env vars.
Secrets must not be printed in logs or comments.

---

## 5. AI API Usage
- Use existing AI client modules.
- Respect the model strategy defined in agents.md.
- Default: cost-effective models from Gradient AI.
