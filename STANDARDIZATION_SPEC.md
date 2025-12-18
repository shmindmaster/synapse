# Standardization Specification v9.6

**For:** This Repository
**Platform:** SHTrial Platform

## Overview

This document defines the complete standardization specification that **this repository** must follow. All SHTrial Platform repositories follow the same standards for consistency, but this specification applies to **this repository**.

## Repository Context

This specification applies to **this repository**. Your `APP_SLUG` is defined in `.env` and should match the repository name. All SHTrial Platform repositories follow the same standards for consistency, ensuring a unified development experience across the platform.

## 1. Canonical Naming Specification

### 1.1 Application Identity

**APP_SLUG Rules:**
- Must be DNS-safe: lowercase, numbers, hyphens only
- Must match Kubernetes object naming rules
- Must be consistent across all resources

**Canonical Allowlist (SHTrial Platform apps):**
```
apexcoachai, aura, billigent, campgen, careaxis, careiq,
cfoagent, comminsightsai, flashmaster, homeiq, jurisai,
lawli, ledgerlens, magiccommerce, omniforge, petdnaplus,
prismiq, quantcoach, serenemind, synapse, ummaconnect,
voxops, warrantygains
```

**Static Apps (4 apps - App Platform, no K8s/DB/AI):**
```
mahumtech, saroshhussain, shtrial, tgiagency
```

### 1.2 DNS Naming

- **Frontend:** `{APP_SLUG}.shtrial.com`
- **API:** `api-{APP_SLUG}.shtrial.com` (hyphen, NOT dot)
- **Load Balancer IP:** `209.38.63.90` (documented, consistent)

### 1.3 Kubernetes Naming

- **Namespace:** `{APP_SLUG}` (no prefix)
- **Ingress:** `{APP_SLUG}-ingress`
- **Deployments/Services:**
  - `{APP_SLUG}-backend`
  - `{APP_SLUG}-frontend`
  - Optional: `{APP_SLUG}-worker`, `{APP_SLUG}-cron`, `{APP_SLUG}-migrate`

### 1.4 Container Registry Naming

- **Registry:** `registry.digitalocean.com/shtrial-reg`
- **Repos:**
  - `{APP_SLUG}-backend`
  - `{APP_SLUG}-frontend`
  - Optional: `{APP_SLUG}-worker`, `{APP_SLUG}-jobs`

**Tag Format (Immutable):**
- Production: `prod-YYYYMMDD-HHMM-{gitsha7}`
- Staging: `stg-YYYYMMDD-HHMM-{gitsha7}`
- Development: `dev-{gitsha7}`
- **NO `:latest` TAGS**

### 1.5 Sentry Naming

- **Projects:**
  - `{APP_SLUG}-frontend`
  - `{APP_SLUG}-backend`

- **Releases:**
  - `{APP_SLUG}-frontend@{version}` and `{APP_SLUG}-backend@{version}`
  - OR `{APP_SLUG}@{version}+{gitsha}`

### 1.6 Kubernetes Recommended Labels

All Deployments, Services, and Ingress must include:

```yaml
labels:
  app.kubernetes.io/name: {APP_SLUG}
  app.kubernetes.io/instance: {APP_SLUG}
  app.kubernetes.io/component: frontend|backend|worker
  app.kubernetes.io/part-of: shtrial-platform
  app.kubernetes.io/managed-by: kubectl
```

### 1.7 Ingress Annotations

```yaml
annotations:
  cert-manager.io/cluster-issuer: letsencrypt-prod
  service.beta.kubernetes.io/do-loadbalancer-enable-proxy-protocol: 'true'
  nginx.ingress.kubernetes.io/proxy-body-size: '10m'
```

## 2. Shared Platform Resources

### 2.1 Platform-Owned (Never App-Specific)

- **DOKS Cluster:** `sh-demo-cluster` (NYC3, Kubernetes 1.34.1-do.1)
- **Ingress Controller:** `ingress-nginx` (shared)
- **cert-manager:** ClusterIssuer `letsencrypt-prod`
- **Container Registry:** `registry.digitalocean.com/shtrial-reg`
- **Postgres Cluster:** `sh-shared-postgres` (Postgres 16 + pgvector)
- **Spaces Bucket:** `sh-storage` (shared, prefix-per-app isolation)
- **Load Balancer IP:** `209.38.63.90`

### 2.2 Per-App Resources

- **Database:** Logical database `{APP_SLUG}` in shared Postgres
- **K8s Namespace:** `{APP_SLUG}`
- **Storage Prefix:** `{APP_SLUG}/` in shared bucket
- **Vector Tables:** `{APP_SLUG}_embeddings` (if using app-prefixed tables)

## 3. Environment Variable Contract

### 3.1 Required for Canonical Apps

```bash
# Identity & Routing
APP_SLUG={APP_SLUG}
BASE_URL=https://{APP_SLUG}.shtrial.com
API_BASE_URL=https://api-{APP_SLUG}.shtrial.com

# Database
DATABASE_URL=postgresql://.../{APP_SLUG}?sslmode=require
DATABASE_URL_INTERNAL=postgresql://.../{APP_SLUG}?sslmode=require
VECTOR_STORE_CONNECTION_STRING=${DATABASE_URL}
LANGGRAPH_CHECKPOINT_DB=${DATABASE_URL}

# Object Storage
OBJECT_STORAGE_BUCKET=sh-storage
OBJECT_STORAGE_PREFIX={APP_SLUG}/
AWS_ENDPOINT_URL=https://nyc3.digitaloceanspaces.com

# Default GenAI (DigitalOcean)
LLM_PROVIDER=do
OPENAI_BASE_URL=https://inference.do-ai.run/v1
OPENAI_API_KEY=...
MODEL_CHAT=openai-gpt-oss-120b
MODEL_FAST=openai-gpt-oss-20b
MODEL_EMBEDDING=Alibaba-NLP/gte-large-en-v1.5

# Speech / Voice (NEW)
SPEECH_STT_PROVIDER=elevenlabs
SPEECH_TTS_PROVIDER=elevenlabs
VOICE_AGENT_PROVIDER=off
ELEVENLABS_API_KEY=...
ELEVENLABS_STT_MODEL=scribe_v1
ELEVENLABS_TTS_VOICE_ID=...
ELEVENLABS_AUDIO_FORMAT=mp3

# Observability
SENTRY_DSN_FRONTEND=...
SENTRY_DSN_BACKEND=...
```

### 3.2 Required for Static Apps

```bash
APP_SLUG={APP_SLUG}
BASE_URL=https://{APP_SLUG}.shtrial.com
```

## 4. Code Pattern Standards

### 4.1 Speech Provider Abstraction

**REQUIRED:** Remove all Whisper references
- ❌ `WHISPER_API_URL`
- ❌ `whisper-service`
- ❌ Port `:9000` references

**REQUIRED:** Use speech provider abstraction
- ✅ `SPEECH_STT_PROVIDER` (default: `elevenlabs`)
- ✅ `SPEECH_TTS_PROVIDER` (default: `elevenlabs`)
- ✅ Provider modules: `src/server/speech/stt.ts`, `src/server/speech/tts.ts`

### 4.2 API Host Pattern

**REQUIRED:** Use hyphen, not dot
- ✅ `api-{APP_SLUG}.shtrial.com`
- ❌ `api.{APP_SLUG}.shtrial.com`

### 4.3 Storage Prefix Pattern

**REQUIRED:** Use `{APP_SLUG}/` prefix
- ✅ `OBJECT_STORAGE_PREFIX={APP_SLUG}/`
- ❌ `raw/{APP_SLUG}/` or other patterns

### 4.4 Frontend Stack

**REQUIRED:**
- Tailwind CSS 4.1.x+
- Token-based theming (CSS variables)
- No hardcoded colors (hex/rgb)
- shadcn/ui components
- Responsive design (mobile-first)

### 4.5 Design System

**REQUIRED:** `DESIGN_SYSTEM.md` per repo
- Brand adjectives
- Typography rules
- Layout model
- Motion rules
- Component rules
- Shared token names, unique token values

## 5. Frontend Requirements

### 5.1 Framework Standards

- **Next.js:** 16+ with App Router
- **Vite:** 7+ (if using SPA)
- **React:** 19
- **Tailwind CSS:** 4.1.x
- **shadcn/ui:** Token-first CSS-variable theming

### 5.2 Required Pages

- **Landing Page:** Public, value prop, features, CTAs to /login
- **Login Page:** Branded, accessible, validation/loading/errors

### 5.3 Auth (if missing)

- Users table + sessions
- Password hashing
- login/logout endpoints
- `/me` session endpoint
- **Node/Next:** Auth.js + Prisma
- **Python:** SQLAlchemy + Alembic

### 5.4 UX Requirements

- Token-driven Light/Dark/System theming
- WCAG AA contrast
- Tap targets ≥ 44px
- No horizontal scroll on mobile
- Accessible modals/drawers
- Full keyboard navigation
- Subtle motion + respects reduced-motion

## 6. Kubernetes Manifest Standards

### 6.1 Required Manifests (Canonical Only)

- `k8s/namespace.yaml`
- `k8s/backend.yaml` (if has backend)
- `k8s/frontend.yaml` (if has frontend)
- `k8s/ingress.yaml`

### 6.2 Required Labels

All resources must include Kubernetes recommended labels (see section 1.6).

### 6.3 Ingress Configuration

- **Class:** `nginx`
- **TLS Issuer:** `letsencrypt-prod` (annotation)
- **Hosts:** `{APP_SLUG}.shtrial.com`, `api-{APP_SLUG}.shtrial.com`

## 7. Validation Rules

### 7.1 Canonical Naming Validation

- All DNS uses `{APP_SLUG}` and `api-{APP_SLUG}` (hyphen)
- All K8s resources use `{APP_SLUG}-{component}` naming
- All registry repos use `{APP_SLUG}-{component}` naming
- All Sentry projects use `{APP_SLUG}-{component}` naming

### 7.2 Code Pattern Validation

- No Whisper references
- No `api.{APP_SLUG}` patterns (must be `api-{APP_SLUG}`)
- No hardcoded colors (warns, doesn't auto-fix)
- Storage prefixes use `{APP_SLUG}/`

### 7.3 Environment Contract Validation

- Canonical apps have all required variables
- Static apps have minimal required variables
- Variable patterns match specification (BASE_URL, API_BASE_URL, etc.)

### 7.4 Frontend Stack Validation

- Tailwind 4.1.x+
- Token-based theming present
- shadcn/ui components present
- Responsive patterns

## 8. Enforcement

### 8.1 Hard Gates

- Canonical apps MUST be in allowlist
- Non-allowlisted repos are treated as non-canonical
- Static apps skip K8s/DB/AI config

### 8.2 Soft Warnings

- Hardcoded colors (warns, doesn't block)
- Missing design system docs (warns)
- Legacy model branding (warns)

## 9. Examples

### 9.1 Canonical App Example

**APP_SLUG:** `lawli`

- DNS: `lawli.shtrial.com`, `api-lawli.shtrial.com`
- K8s: namespace `lawli`, deployments `lawli-backend`, `lawli-frontend`
- Registry: `lawli-backend`, `lawli-frontend`
- Sentry: `lawli-frontend`, `lawli-backend`
- Database: `lawli`
- Storage: prefix `lawli/`

### 9.2 Static App Example

**APP_SLUG:** `mahumtech`

- DNS: `mahumtech.shtrial.com` (App Platform)
- No K8s namespace
- No database
- No AI config
- Frontend standards only

## 10. Migration Checklist

When standardizing this repository:

- [ ] Verify APP_SLUG is in canonical allowlist (or static apps list)
- [ ] Update all DNS references to use hyphen (api-{APP_SLUG})
- [ ] Update K8s manifests with canonical naming and labels
- [ ] Update .env with complete environment contract
- [ ] Remove Whisper references, add speech provider
- [ ] Update storage prefixes to `{APP_SLUG}/`
- [ ] Verify Tailwind 4.1.x, upgrade if needed
- [ ] Ensure token-based theming (no hardcoded colors)
- [ ] Create/update DESIGN_SYSTEM.md
- [ ] Verify landing + login pages exist
- [ ] Add auth if missing
- [ ] Run all validation scripts
