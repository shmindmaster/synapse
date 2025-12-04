# GitHub Copilot Instructions for Synapse

This configuration applies to **GitHub Copilot** (Chat/Workspace).

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

Synapse implements three state-of-the-art AI features:

**1. Intelligent Document Classification (`/api/classify-document`)**
- Automatic document type detection (14+ categories)
- Entity extraction (people, organizations, dates, amounts)
- Confidence scoring and folder path suggestions
- Integration with DocumentType model for learning

**2. Multi-Document Synthesis (`/api/synthesize-documents`)**
- Cross-document theme and insight extraction
- Timeline analysis across multiple documents
- Entity and relationship mapping
- Knowledge graph generation
- Support for 5 analysis types: synthesis, timeline, entities, comparative, knowledge_graph

**3. Predictive File Management (`/api/smart-recommendations`)**
- AI-powered recommendations based on user behavior
- Pattern detection and workflow optimization
- Priority-based action suggestions (high/medium/low)
- Confidence scoring and impact estimation
- Integration with AuditLog for behavior tracking

**Development Guidelines:**
- All features use Llama 3.1 70B Instruct via DigitalOcean Gradient AI
- Implement 8000-10000 character limits for content processing
- Return structured JSON with confidence scores
- Store learning patterns in PostgreSQL for continuous improvement
- Handle errors gracefully with detailed error messages

---

## 4. Coding Standards

- **Manager:** `pnpm` ONLY.

- **Stack:** TypeScript, React, Next.js, Vite, Tailwind.

- **No-Touch Zones:** `node_modules/`, `.next/`, `dist/`, `src/generated/`.

- **API Design:**
  - RESTful endpoints with POST for mutations, GET for queries
  - Structured JSON responses: `{ success: boolean, error?: string, ...data }`
  - Include confidence scores for AI-generated results
  - Implement proper error handling with try/catch

- **Database Models (Prisma):**
  - `DocumentType` - Classification schemas and rules
  - `AnalysisTemplate` - Reusable analysis prompts
  - `KnowledgeOrganizationPattern` - Synthesis and graph patterns
  - `AuditLog` - Activity tracking for recommendations
  - `User` - Authentication and role-based access

---

## 5. Secrets

- **Source of Truth:** `.env.shared`.

- **Rule:** Never commit secrets.
