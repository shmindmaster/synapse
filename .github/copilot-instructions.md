# GitHub Copilot Instructions - Synapse (v2025.2)

> **Governance**: Enterprise Engineering Standards v2025.2
> **Parent**: `H:\Repos\sh\.github\copilot-instructions.md`

**Project**: Synapse - Intelligent file system knowledge base  
**Last Updated**: December 2025

---

## 1. Core Rule

**Follow the guidelines in `AGENTS.md`.** That document defines:
- Directory rules (what NOT to touch)
- Coding standards
- Security and testing expectations
- Tech stack and infrastructure

If instructions here conflict with `AGENTS.md`, prefer `AGENTS.md` for general rules and this file for Copilot-specific behavior.

---

## 2. Project Snapshot

**Synapse** turns your file system into a queryable knowledge base.

**Core Value**: Instant access to file knowledge.

**Main Technologies**:
- Node.js + Express + React + Vite
- Database: PostgreSQL + pgvector on `sh-shared-postgres` (DigitalOcean Managed PostgreSQL)
- AI: DigitalOcean Gradient AI (OpenAI-compatible serverless inference)

---

## 3. Directory Rules

**You MAY modify**:
- `src/`
- `server.js`
- `prisma/`
- `tests/`

**NEVER edit**:
- `node_modules/`
- `dist/`
- `.env` files

---

## 4. Coding & Editing Rules

### Package Manager
- Use `pnpm` for all scripts
- Never use `npm` or `yarn`

### TypeScript/JavaScript Standards
- Use **strict mode**
- Use **2 spaces** for indentation

### AI Integration
```javascript
// ✅ CORRECT: Use DigitalOcean Gradient AI via OpenAI-compatible client
import OpenAI from 'openai';

const client = new OpenAI({
  baseURL: process.env.DIGITALOCEAN_INFERENCE_ENDPOINT,
  apiKey: process.env.DIGITALOCEAN_MODEL_KEY,
});

const response = await client.chat.completions.create({
  model: process.env.AI_MODEL,
  messages: [
    { role: 'system', content: instructions },
    { role: 'user', content: userQuery },
  ],
});
```

---

## 5. Testing & Quality

### Commands
```bash
pnpm test              # E2E tests
pnpm lint              # ESLint
```

### Requirements
- For any non-trivial change, update or add tests
- Do not suggest merging code that introduces failing tests

---

## 6. Code Review & PR Guidance

When helping with PRs or reviews:

### Focus Areas
- Correctness, security, and maintainability
- File system safety
- Missing tests for new behavior
- Large diffs that should be split into smaller PRs

### PR Standards
- Title format: `feat(synapse): description`
- Use Conventional Commits (`feat`, `fix`, `chore`, `docs`)

### Verification Before Merge
```bash
pnpm test
```

---

## 7. Critical Rules

1. **NO NEW INFRA**: Use shared `sh-shared-postgres` with per-repo databases
2. **AI ENDPOINT**: Use `DIGITALOCEAN_INFERENCE_ENDPOINT` (`/v1/chat/completions`) via OpenAI-compatible clients
3. **NO FRONTEND KEYS**: Backend proxy for all AI calls
4. **NO CI/CD**: Manual deployment only
5. **FILE PRIVACY**: Respect permissions

---

*Last Updated: December 2025 | Version: 2025.2*
