# Gemini Coding Agent Rules (gemini.md)

This file defines how **Gemini CLI** and **Gemini Code Assist** must behave when working in this repository.

These rules supplement agents.md. If there is a conflict, follow the stricter rule.

---

## 1. Identity & Scope

You are a **coding assistant**, not an infrastructure architect.

- You must follow the **DigitalOcean-first model** and canonical env names from agents.md.
- You must not introduce alternate architectures or cloud providers as the default without an explicit design request.

---

## 2. DigitalOcean & Hatch Alignment

When Gemini proposes or edits code, it must assume:

- Compute and AI live on **DigitalOcean Gradient AI GPU Droplets / Platform**.
- Hatch provides **credits and discounts on Gradient/GPU usage**, not free third-party APIs.
- LLMs, embeddings, and image/audio models come from:
  - Gradient AI model catalog (Llama 3.x, Mistral, Qwen, Gemma, etc.).
  - fal image/audio models via Gradient Serverless Inference.
  - Open-source speech models (Sesame CSM, Kokoro, etc.) on GPU Droplets.

Gemini must:

- Use DIGITALOCEAN_INFERENCE_ENDPOINT, DIGITALOCEAN_MODEL_KEY, AI_PROVIDER=digitalocean, AI_MODEL and the DO_RAG_* / FAL_MODEL_* envs.
- Route model calls through existing AI/speech client modules, not new ad-hoc HTTP clients.

---

## 3. Tooling & Code Conventions

1. **Package management**
   - Use pnpm in all suggestions:

     ```bash
     pnpm install
     pnpm add <package>
     pnpm add -D <dev-package>
     ```

2. **Language & framework**
   - Prefer TypeScript where present.
   - Match the existing stack (React, Next.js, Vite, etc.).
   - Do not introduce new frameworks without an explicit issue.

3. **No-touch zones**
   - Avoid editing:
     - node_modules/
     - .next/, dist/, build output
     - Generated code folders (e.g. src/generated/, src/__generated__/)
     - Auto-generated UI directories (e.g. src/components/ui/)
   - Only touch these if a human explicitly asks and you add comments explaining why.

---

## 4. Secrets & Config

Gemini must:

- Never commit or print real secrets (DB passwords, API keys, PATs, etc.).
- Use **existing env var names** for all secrets:
  - DB: DATABASE_URL, DO_DATABASE_URL_PUBLIC, etc.
  - Storage: DO_SPACES_BUCKET, DO_SPACES_ENDPOINT, DO_SPACES_REGION, etc.
  - AI: DIGITALOCEAN_MODEL_KEY, AI_MODEL, DO_RAG_EMBEDDING_MODEL_*, FAL_MODEL_*, etc.
- When adding new config:
  - Add new env vars to .env.example with placeholder values.
  - Document them in README or architecture docs.

---

## 5. AI Usage Inside This Repo

If you modify code that calls AI:

- Use the **central AI client/gateway** module (e.g., src/lib/ai/doClient.ts) instead of direct HTTP.
- Use the shared model strategy:
  - Default to **cost-effective models** for routine operations.
  - Use heavier models only when the feature clearly justifies it.
- Implement:
  - Timeouts
  - Error handling
  - Basic cost guardrails (no unbounded loops or retries)

For speech:

- Call the shared speech/voice service (ASR/TTS) rather than embedding TTS/ASR models in this repo.

---

## 6. Change Strategy

When Gemini edits code:

1. Favor **small, focused changes** over large rewrites.
2. Provide **full file contents** when rewriting, not truncated snippets.
3. If multiple options exist, choose the one that is:
   - Most aligned with the DigitalOcean/Hatch model
   - Cheapest to run
   - Most consistent with existing patterns in this codebase
