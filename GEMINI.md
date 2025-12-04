# Gemini Rules (GEMINI.md) for Synapse

This configuration applies to **Gemini CLI** and **Gemini Code Assist**.

## 1. Global Infrastructure Model (DigitalOcean + Hatch)

### 1.1 Organization & Region

- **Repo:** `Synapse`

- **Slug:** `synapse`

- **Region:** `nyc3`

### 1.2 Managed PostgreSQL

- **Cluster:** `sh-shared-postgres`

- **DB Name:** `synapse` (Exact match to slug, no prefix)

- **Rules:**

  1. Use the shared cluster defined in `.env.shared`.

  2. Do NOT create new clusters.

### 1.3 Storage (Spaces)

- **Bucket:** `sh-storage`

- **Folder:** `/synapse/` (Root level folder for this app)

- **Base URL:** `https://sh-storage.nyc3.digitaloceanspaces.com`

- **CDN URL:** `https://sh-storage.nyc3.cdn.digitaloceanspaces.com`

### 1.4 Container Registry

- **Registry:** `registry.digitalocean.com/shtrial-reg`

- **Login:** `doctl registry login` OR use `DO_REGISTRY_USER` / `DO_REGISTRY_PASS` from env.

---

## 2. DNS & Domain Configuration (Namecheap)

You must use the **Namecheap API credentials** in `.env.shared` to configure:

1.  **Frontend:** `synapse.shtrial.com`

2.  **Backend:** `api.synapse.shtrial.com`

3.  **Docs:** `api.synapse.shtrial.com/docs`

**Agent Action:** When initializing the repo, ensure a script or step exists to register these subdomains via the Namecheap API if they do not exist.

---

## 3. AI Stack & Hatch Billing

### 3.1 The Hatch Reality

- **Billing:** Hatch credits cover **Gradient AI** & **GPU Droplets**.

- **Restriction:** NO free OpenAI/Anthropic APIs.

- **Requirement:** Prefer Gradient AI / Open Models.

### 3.2 Inference (Gradient AI)

- **Endpoint:** `DIGITALOCEAN_INFERENCE_ENDPOINT`

- **Model:** `AI_MODEL` (e.g. Llama 3.1 70B Instruct).

- **Strategy:** Use `src/lib/ai/doClient.ts`.

### 3.3 Generative Media (Fal)

- Use `FAL_MODEL_*` env vars.

### 3.4 Advanced AI Features (2025)

Synapse provides three cutting-edge AI features powered by Llama 3.1 70B Instruct:

1. **Intelligent Document Classification** - Automatic categorization with entity extraction
2. **Multi-Document Synthesis** - Cross-document analysis and knowledge graph generation  
3. **Predictive File Management** - AI-powered recommendations based on user patterns

When working with these features, ensure proper token management and structured JSON responses.

---

## 4. Coding Standards

- **Manager:** `pnpm` ONLY.

- **Stack:** TypeScript, React, Next.js, Vite, Tailwind.

- **No-Touch Zones:** `node_modules/`, `.next/`, `dist/`, `src/generated/`.

- **AI Integration:** All AI features use DigitalOcean Gradient AI with structured prompts and JSON responses.

- **Database:** PostgreSQL with pgvector for semantic search and Prisma for ORM.

---

## 5. Secrets

- **Source of Truth:** `.env.shared`.

- **Rule:** Never commit secrets.

