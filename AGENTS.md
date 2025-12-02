# AI Coding Agent Guidelines - Synapse (v2025.2)

> **Governance**: Enterprise Engineering Standards v2025.2
> **Parent**: `H:\Repos\sh\AGENTS.md`

This is the **canonical AI agent playbook** for Synapse. All AI tools (Gemini, Copilot, Claude, Cursor, Windsurf, MCP agents) must follow these rules.

---

## 1. Purpose & Persona

You are a **senior staff engineer** working on Synapse, an intelligent file system knowledge base.

**Priorities** (in order):
1. Correctness
2. Security
3. Readability
4. Performance
5. Cleverness

---

## 2. Project Overview

**Synapse** turns your file system into a queryable knowledge base using AI and vector search.

**Core Value Proposition**: Instant access to knowledge buried in files.

**Business Constraints**:
- **Privacy**: Local file access must be secure
- **Performance**: Indexing must be fast and unobtrusive
- **Compatibility**: Support various file types

---

## 3. Tech Stack

### Hybrid App (Root)
| Technology | Version | Purpose |
|:-----------|:--------|:--------|
| Node.js | 24.10.1 | Runtime |
| Express | 4.18.2 | Backend server |
| React | 19.2.0 | UI framework |
| Vite | 5.4.2 | Build tool |
| TailwindCSS | 3.4.1 | Styling |
| Prisma | 7.0.1 | ORM |
| PostgreSQL + pgvector | - | Database |

### AI (5-Model Fleet)
| Modality | Model | Use Case |
|:---------|:------|:---------|
| Logic/Code | `gpt-5.1-codex-mini` | File analysis, query processing |
| Realtime Voice | `gpt-realtime-mini` | N/A |
| Batch Audio | `gpt-audio-mini` | N/A |
| Vision | `gpt-image-1-mini` | Image content indexing |
| RAG/Embeddings | `text-embedding-3-small` | Semantic file search |

### Shared Infrastructure
| Resource | Location | Purpose |
|:---------|:---------|:--------|
| Database | `pg-shared-apps-eastus2` | PostgreSQL + pgvector |
| OpenAI | `shared-openai-eastus2` | AI model endpoints |
| Container App | `ca-synapse-app` | Backend deployment |

---

## 4. Directory & File Rules

### You MAY Modify
- `src/` - React frontend
- `server.js` - Express backend
- `prisma/` - Database schema
- `tests/` - Test files

### You MUST NOT Modify
- `node_modules/` - Dependencies
- `dist/` - Build output
- `.env` files - Secrets

---

## 5. Folder Architecture

```
synapse/
├── src/                     # React frontend
│   ├── components/         # UI components
│   └── App.tsx             # Main app component
├── server.js               # Express backend entry
├── prisma/                 # Database schema
├── tests/                  # E2E tests
└── package.json            # Config
```

---

## 6. Coding Standards

### TypeScript/JavaScript
- Use **strict mode**
- Use **2 spaces** indentation

### AI Integration Patterns
```javascript
// ✅ CORRECT: Use Responses API v1 (Node.js)
const response = await fetch(`${process.env.AZURE_OPENAI_RESPONSES_URL}`, {
  method: 'POST',
  headers: { 
    'Content-Type': 'application/json',
    'api-key': process.env.AZURE_OPENAI_API_KEY
  },
  body: JSON.stringify({
    model: process.env.AI_MODEL_CORE,
    input: userQuery,
    previous_response_id: lastResponseId
  })
});
```

---

## 7. Security & Privacy

- **Local Access**: Secure file system reading
- **Index Security**: Encrypt indexed content

---

## 8. Testing & Quality Gates

### Commands
```bash
pnpm test              # Playwright tests
pnpm lint              # ESLint
```

---

## 9. Git, Commits & PR Behavior

### Commit Messages
Use Conventional Commits format:
```
feat(indexer): support PDF files
fix(search): improve relevance
chore(deps): upgrade React
```

---

## 10. Development Commands

```bash
pnpm install          # Install dependencies
pnpm dev              # Start frontend
pnpm server           # Start backend
pnpm start            # Start both
```

---

## 11. Critical Rules

1. **NO NEW INFRA**: Use shared `pg-shared-apps-eastus2`
2. **RESPONSES API**: Use `/v1/responses` with `input` + `previous_response_id`
3. **NO FRONTEND KEYS**: Backend proxy for all AI calls
4. **NO CI/CD**: Manual deployment only
5. **FILE PRIVACY**: Respect local file permissions

---

## 12. MCP Tools Available

| Tool | Purpose |
|:-----|:--------|
| **context7-mcp** | Get latest React, Express docs |
| **prisma-mcp** | Generate schema, create migrations |

---

*Last Updated: December 2025 | Version: 2025.2*
