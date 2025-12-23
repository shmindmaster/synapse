---
applyTo: '**'
description: 'Next.js 16 Best Practices for SHTrial Platform applications'
---

# Next.js Best Practices for SHTrial Platform (2025)

## SHTrial Platform Context

These instructions apply to applications running on the **SHTrial Platform** - a unified DigitalOcean infrastructure with shared resources and per-app logical isolation.

### Platform Standards Reference
- **Primary:** `./UNIFIED_PLAYBOOK.md` (local file) - Complete platform architecture and standards
- **Configuration:** `./.env.example` - Environment variable template - Master configuration template (single source of truth)

### Key Platform Resources
- **App Platform:** DigitalOcean App Platform (PaaS, automatic builds from GitHub)
- **Database:** `sh-shared-postgres` (Postgres 16 + pgvector, db-per-app isolation)
- **Storage:** `sh-storage` (DigitalOcean Spaces + CDN, prefix-per-app isolation)
- **AI Services:** DigitalOcean GenAI serverless (https://inference.do-ai.run/v1)
- **DNS:** `*.shtrial.com` with automatic SSL certificates
- **Deployment:** Automatic on git push to main branch

### Application Standards
- **Naming Convention:** `{APP_SLUG}` pattern for all resources
- **Component Naming:** `web` (frontend), `backend` (API), `worker` (background tasks)
- **Backend Stack:** FastAPI (Python 3.12) or Fastify (Node 22)
- **Frontend Stack:** Next.js 16 App Router or Vite 7
- **AI Orchestration:** LangGraph (code-first StateGraph, vendor-neutral)
- **Styling:** Tailwind CSS v4 + shadcn/ui
- **Package Management:** Poetry (Python) / pnpm (TypeScript)

### Platform Constraints & Capabilities
- **✅ ENABLED:** Full access to all shared resources, complete credentials provided
- **✅ ENABLED:** Autonomous deployment and configuration management
- **✅ ENABLED:** End-to-end task completion without approval
- **❌ NO GPU:** All AI inference uses serverless endpoints (no local models)
- **❌ NO NEW INFRASTRUCTURE:** Use existing App Platform, database, storage

### Configuration Management
All applications use local configuration files:
- **Template:** `./.env.example` - Environment variable template (committed to git)
- **Runtime:** `./.env` - Actual configuration (not committed, generated from template)
- **App Guide:** `./AGENTS.MD` - App-specific configuration and standards

**Next.js Environment Loading:**
```json
// apps/web/package.json
{
  "scripts": {
    "dev": "env-cmd -f ../../.env next dev",
    "build": "env-cmd -f ../../.env next build",
    "start": "env-cmd -f ../../.env next start"
  }
}
```

### App Platform Configuration
- **Manifest:** `app.yaml` at repo root (single source of truth)
- **Services:** Defined in `app.yaml` (web, backend, worker)
- **Deployment:** Automatic on git push to main branch
- **Build:** App Platform builds Dockerfiles automatically

---


_Last updated: December 2025_

This document summarizes the latest, authoritative best practices for building, structuring, and maintaining Next.js 16 applications on the **SHTrial Platform** (DigitalOcean-based infrastructure). These standards ensure consistency, maintainability, and seamless deployment across all platform applications.

## Platform Context

All Next.js applications on SHTrial Platform must:
- Use **Next.js 16 with App Router** (no Pages Router)
- Deploy to DigitalOcean App Platform (automatic from GitHub)
- Connect to backend via `NEXT_PUBLIC_API_URL` environment variable
- Use shared CDN for assets: `https://sh-storage.nyc3.cdn.digitaloceanspaces.com/{APP_SLUG}/`
- Follow platform naming conventions: `{APP_SLUG}.shtrial.com`

---

## 1. Project Structure & Organization

- **Use the `app/` directory** (App Router) for all new projects. Prefer it over the legacy `pages/` directory.
- **Top-level folders:**
  - `app/` — Routing, layouts, pages, and route handlers
  - `public/` — Static assets (images, fonts, etc.)
  - `lib/` — Shared utilities, API clients, and logic
  - `components/` — Reusable UI components
  - `contexts/` — React context providers
  - `styles/` — Global and modular stylesheets
  - `hooks/` — Custom React hooks
  - `types/` — TypeScript type definitions
- **Colocation:** Place files (components, styles, tests) near where they are used, but avoid deeply nested structures.
- **Route Groups:** Use parentheses (e.g., `(admin)`) to group routes without affecting the URL path.
- **Private Folders:** Prefix with `_` (e.g., `_internal`) to opt out of routing and signal implementation details.

- **Feature Folders:** For large apps, group by feature (e.g., `app/dashboard/`, `app/auth/`).
- **Use `src/`** (optional): Place all source code in `src/` to separate from config files.

## 2.1. Server and Client Component Integration (App Router)

**Never use `next/dynamic` with `{ ssr: false }` inside a Server Component.** This is not supported and will cause a build/runtime error.

**Correct Approach:**
- If you need to use a Client Component (e.g., a component that uses hooks, browser APIs, or client-only libraries) inside a Server Component, you must:
  1. Move all client-only logic/UI into a dedicated Client Component (with `'use client'` at the top).
  2. Import and use that Client Component directly in the Server Component (no need for `next/dynamic`).
  3. If you need to compose multiple client-only elements (e.g., a navbar with a profile dropdown), create a single Client Component that contains all of them.

**Example:**

```tsx
// Server Component
import DashboardNavbar from '@/components/DashboardNavbar';

export default async function DashboardPage() {
  // ...server logic...
  return (
    <>
      <DashboardNavbar /> {/* This is a Client Component */}
      {/* ...rest of server-rendered page... */}
    </>
  );
}
```

**Why:**
- Server Components cannot use client-only features or dynamic imports with SSR disabled.
- Client Components can be rendered inside Server Components, but not the other way around.

**Summary:**
Always move client-only UI into a Client Component and import it directly in your Server Component. Never use `next/dynamic` with `{ ssr: false }` in a Server Component.

---

## 2. Component Best Practices

- **Component Types:**
  - **Server Components** (default): For data fetching, heavy logic, and non-interactive UI.
  - **Client Components:** Add `'use client'` at the top. Use for interactivity, state, or browser APIs.
- **When to Create a Component:**
  - If a UI pattern is reused more than once.
  - If a section of a page is complex or self-contained.
  - If it improves readability or testability.
- **Naming Conventions:**
  - Use `PascalCase` for component files and exports (e.g., `UserCard.tsx`).
  - Use `camelCase` for hooks (e.g., `useUser.ts`).
  - Use `snake_case` or `kebab-case` for static assets (e.g., `logo_dark.svg`).
  - Name context providers as `XyzProvider` (e.g., `ThemeProvider`).
- **File Naming:**
  - Match the component name to the file name.
  - For single-export files, default export the component.
  - For multiple related components, use an `index.ts` barrel file.
- **Component Location:**
  - Place shared components in `components/`.
  - Place route-specific components inside the relevant route folder.
- **Props:**
  - Use TypeScript interfaces for props.
  - Prefer explicit prop types and default values.
- **Testing:**
  - Co-locate tests with components (e.g., `UserCard.test.tsx`).

## 3. Naming Conventions (General)

- **Folders:** `kebab-case` (e.g., `user-profile/`)
- **Files:** `PascalCase` for components, `camelCase` for utilities/hooks, `kebab-case` for static assets
- **Variables/Functions:** `camelCase`
- **Types/Interfaces:** `PascalCase`
- **Constants:** `UPPER_SNAKE_CASE`

## 4. API Routes (Route Handlers)

- **Prefer API Routes over Edge Functions** unless you need ultra-low latency or geographic distribution.
- **Location:** Place API routes in `app/api/` (e.g., `app/api/users/route.ts`).
- **HTTP Methods:** Export async functions named after HTTP verbs (`GET`, `POST`, etc.).
- **Request/Response:** Use the Web `Request` and `Response` APIs. Use `NextRequest`/`NextResponse` for advanced features.
- **Dynamic Segments:** Use `[param]` for dynamic API routes (e.g., `app/api/users/[id]/route.ts`).
- **Validation:** Always validate and sanitize input. Use libraries like `zod` or `yup`.
- **Error Handling:** Return appropriate HTTP status codes and error messages.

## 5. General Best Practices

- **TypeScript:** Use TypeScript for all code. Enable `strict` mode in `tsconfig.json`.
- **ESLint & Prettier:** Enforce code style and linting. Use the official Next.js ESLint config.
- **Environment Variables:** Store configuration in `.env.local`.
- **Testing:** Use Jest, React Testing Library, or Playwright. Write tests for all critical logic and components.
- **Accessibility:** Use semantic HTML and ARIA attributes. Test with screen readers.
- **Performance:**
  - Use built-in Image and Font optimization.
  - Use Suspense and loading states for async data.
  - Avoid large client bundles; keep most logic in Server Components.
- **Documentation:**
  - Write clear README and code comments.
  - Document public APIs and components.

# Avoid Unnecessary Example Files

Do not create example/demo files (like ModalExample.tsx) in the main codebase unless the user specifically requests a live example, Storybook story, or explicit documentation component. Keep the repository clean and production-focused by default.

# Platform Integration

## Backend Communication

**CRITICAL:** Never hardcode API URLs. Always use environment variables:

```typescript
// ✅ CORRECT
const API_URL = process.env.NEXT_PUBLIC_API_URL;
if (!API_URL) throw new Error("NEXT_PUBLIC_API_URL not configured");

export async function fetchData() {
  const response = await fetch(`${API_URL}/api/data`);
  return response.json();
}

// ❌ INCORRECT
const API_URL = "http://localhost:8000"; // Never hardcode!
const API_URL = "https://api-myapp.shtrial.com"; // Use env var instead!
```

## Asset Management

Use platform CDN for all public assets:

```typescript
// Environment variable
NEXT_PUBLIC_CDN_BASE_URL=https://sh-storage.nyc3.cdn.digitaloceanspaces.com/{APP_SLUG}/

// Usage
<Image 
  src={`${process.env.NEXT_PUBLIC_CDN_BASE_URL}/images/logo.png`}
  alt="Logo"
  width={200}
  height={50}
/>
```

## Environment Configuration

Required environment variables (from `./.env.example`):
- `NEXT_PUBLIC_API_URL` - Backend API endpoint
- `NEXT_PUBLIC_URL` - Frontend URL
- `NEXT_PUBLIC_CDN_BASE_URL` - CDN base for assets
- App-specific variables as needed

## Deployment

Applications deploy to:
- **Production URL:** `https://{APP_SLUG}.shtrial.com`
- **API Backend:** `https://api-{APP_SLUG}.shtrial.com`
- **App Platform:** App named `{APP_SLUG}`, Service `web` (frontend), Service `backend` (API)
- **Deployment:** Automatic on git push to main branch

# Always use the latest documentation and guides

- For every Next.js related request, begin by searching for the most current Next.js 16 documentation, guides, and examples
- Use the following tools to fetch and search documentation:
  - `context7-mcp/*` tools (`resolve-library-id`, `get-library-docs`) for up-to-date library documentation
  - `tavily-mcp/*` tools for comprehensive web research and real-time information
- Reference platform standards in `./UNIFIED_PLAYBOOK.md` for infrastructure integration


