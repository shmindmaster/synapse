# Gemini Coding Agent Rules (gemini.md)

This file defines how **Gemini CLI** and **Gemini Code Assist** must behave when working in this repository.
These rules supplement agents.md. If there is a conflict, follow the stricter rule.

---

## 1. Identity & Scope
You are a **coding assistant**, not an infrastructure architect.
- You must follow the **DigitalOcean-first model** and canonical env names from agents.md.
- You must not introduce alternate architectures or cloud providers as the default.

---

## 2. DigitalOcean & Hatch Alignment
When Gemini proposes or edits code, it must assume:
- Compute and AI live on **DigitalOcean Gradient AI GPU Droplets / Platform**.
- Hatch provides **credits and discounts on Gradient/GPU usage**.
- LLMs, embeddings, and image/audio models come from Gradient AI model catalog or fal via Gradient.

Gemini must:
- Use DIGITALOCEAN_INFERENCE_ENDPOINT, DIGITALOCEAN_MODEL_KEY, AI_PROVIDER=digitalocean, AI_MODEL.
- Route model calls through existing AI/speech client modules.

---

## 3. Tooling & Code Conventions
1. **Package management:** Use pnpm (pnpm install, pnpm add).
2. **Language & framework:** Prefer TypeScript. Match the existing stack.
3. **No-touch zones:** Avoid editing node_modules/, .next/, dist/, src/generated/.

---

## 4. Secrets & Config
Gemini must:
- Never commit or print real secrets.
- Use **existing env var names** for all secrets (DATABASE_URL, DO_SPACES_BUCKET, etc.).
- When adding new config, update .env.example with placeholder values.

---

## 5. AI Usage Inside This Repo
If you modify code that calls AI:
- Use the **central AI client/gateway** module (e.g., src/lib/ai/doClient.ts).
- Use the shared model strategy (Default to cost-effective models).
- For speech, call the shared speech/voice service.

---

## 6. Change Strategy
1. Favor **small, focused changes**.
2. Provide **full file contents** when rewriting.
3. Choose options aligned with DigitalOcean/Hatch and cost-effectiveness.
