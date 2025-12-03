# AI Agent Guidelines - Synapse

> **Scope**: This repository follows SHTrial enterprise standards
> **Infrastructure**: DigitalOcean-only (nyc3 region)
> **Type**: monorepo | **Framework**: express

This repository is AI-agent-friendly with strict rules for **all coding agents** (Copilot, Gemini, Cursor, Windsurf, Devin).

---

## 1. Global Infrastructure Model (DigitalOcean-only)

All code MUST use the canonical shared infrastructure:

- **Region**: `SH_REGION=nyc3` (NO exceptions)
- **Database**: `sh-shared-postgres` via `DATABASE_URL`/`DO_DATABASE_URL_*`
- **Storage**: `voxops` bucket via `DO_SPACES_BUCKET`/`DO_SPACES_ENDPOINT`
- **AI**: DigitalOcean Gradient + Fal AI
  - Inference: `DIGITALOCEAN_INFERENCE_ENDPOINT`
  - Models: `AI_MODEL` (Llama 3.1 70B), `DO_RAG_EMBEDDING_MODEL_*`
  - Multimodal: `FAL_MODEL_FAST_SDXL`, `FAL_MODEL_FLUX_SCHNELL`, `FAL_MODEL_STABLE_AUDIO`, `FAL_MODEL_TTS_V2`

**NEVER** create new databases, buckets, or AI accounts.

---

## 2. Repository Context

**Type**: monorepo
**Framework**: express
**Purpose**: Synapse application

## 4. Express-Specific Rules

### Architecture
- Follow modular architecture patterns
- Use dependency injection properly (NestJS)
- Implement proper DTOs and validation
- Use guards for authentication/authorization

### Best Practices
- Use interceptors for logging/response transformation
- Implement proper error handling
- Use microservices pattern where applicable
- Follow RESTful API design principles

---

## 5. Tooling & Standards

- **Package Manager**: Use `pnpm` exclusively
- **TypeScript**: Strict mode enabled
- **Testing**: Jest/Vitest for unit, Playwright for E2E
- **Linting**: ESLint + Prettier configured

---

## 6. Security & Secrets

- NEVER hardcode credentials
- Use environment variables from `.env.shared`
- Treat all keys as compromised if exposed
- Follow principle of least privilege

---

## 7. Change Discipline

- Prefer focused, minimal changes
- Update tests with new features
- Provide complete file contents in changes
- Follow conventional commit messages

If conflicts arise between repo-specific and global rules, prioritize security and the shared DigitalOcean infrastructure model.
