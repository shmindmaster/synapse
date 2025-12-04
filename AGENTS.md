# AI Agent Guidelines (AGENTS.MD) for Synapse

This configuration applies to **ALL** AI agents working in this repository.

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

Synapse implements three advanced AI-powered features:

1. **Document Classification**: `/api/classify-document` - Automatic document type detection, entity extraction, and folder path suggestions
2. **Multi-Document Synthesis**: `/api/synthesize-documents` - Cross-document analysis, knowledge graph generation, timeline extraction
3. **Smart Recommendations**: `/api/smart-recommendations` - Predictive file management suggestions based on user behavior and content analysis

**AI Agent Guidelines:**
- All features use Llama 3.1 70B Instruct via DigitalOcean Gradient AI
- Implement proper token limits (8000-10000 chars) to avoid timeout
- Store learning data in PostgreSQL (DocumentType, AnalysisTemplate, KnowledgeOrganizationPattern models)
- Return structured JSON responses with confidence scores
- Handle errors gracefully with fallback options

---

## 4. Coding Standards

- **Manager:** `pnpm` ONLY.

- **Stack:** TypeScript, React, Next.js, Vite, Tailwind.

- **No-Touch Zones:** `node_modules/`, `.next/`, `dist/`, `src/generated/`.

- **Database Models:** Use Prisma for all database operations. Key models:
  - `DocumentType` - Document classification and schema definitions
  - `AnalysisTemplate` - Analysis prompts and templates
  - `KnowledgeOrganizationPattern` - Knowledge graph and synthesis patterns
  - `AuditLog` - User activity tracking for recommendations

- **API Patterns:** 
  - Use async/await for all AI calls
  - Implement proper error handling with try/catch
  - Return structured JSON with `success`, `error`, and data fields
  - Include confidence scores where applicable

---

## 5. Secrets

- **Source of Truth:** `.env.shared`.

- **Rule:** Never commit secrets.

