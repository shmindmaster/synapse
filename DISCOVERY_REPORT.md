# 🕵️ Discovery Report: Synapse

**Repository:** `shmindmaster/Synapse`  
**Date:** 2025-01-27  
**Status:** Phase 1 Complete

---

## 1. Domain Analysis

### Purpose
**Local-First RAG Engine for Codebases** - Open-source, privacy-first RAG (Retrieval Augmented Generation) engine that transforms codebases and technical documentation into an intelligent, queryable knowledge base. Runs entirely on your infrastructure—your code never leaves your machine or servers.

### Core Entities
- **Repositories**: Codebase repositories indexed
- **Documents**: Technical documentation indexed
- **Code Chunks**: Code snippets with embeddings
- **Embeddings**: Vector embeddings for semantic search
- **Indexes**: Codebase indexes with metadata

### AI Agent Role
- **Semantic Codebase Search**: Find code by meaning, not keywords
- **Intelligent Document Classification**: Classify and index documentation
- **Code Understanding**: Understand code context and relationships
- **RAG-Powered Chat**: Chat with codebase using RAG

---

## 2. Technical Stack

### Backend
- **Framework**: Fastify 5.6.2 (TypeScript) - **NOTE**: Placeholder implementation**
- **Database**: PostgreSQL with Prisma ORM
  - **Extensions**: pgvector for embeddings
  - **Database Name**: `synapse` (on shared cluster `sh-shared-postgres`)
- **AI Services**: 
  - DigitalOcean Gradient AI (`https://inference.do-ai.run/v1`)
  - Models: `llama-3.1-70b-instruct` (smart), `llama-3.1-8b-instruct` (fast)
  - Embeddings: `Alibaba-NLP/gte-large-en-v1.5`
- **Storage**: DigitalOcean Spaces (`sh-storage` bucket, prefix: `raw/synapse/`)

### Frontend
- **Framework**: Next.js 15 (App Router), React, TypeScript
- **UI**: Tailwind CSS 4, ShadCN UI
- **State**: React Server Components

### Additional Components
- **MCP Server**: Model Context Protocol server for IDE integration
- **CLI Tool**: Command-line tool for codebase indexing

---

## 3. The "Golden Path" (Critical User Flows)

### Flow A: Index Codebase
1. **User selects repository** → Repository path selected
2. **Codebase indexed** → Files parsed and embedded
3. **Embeddings stored** → Vector embeddings stored in pgvector
4. **Index created** → Index metadata stored

### Flow B: Semantic Search
1. **User queries codebase** → Natural language query
2. **RAG retrieves relevant code** → Similar code chunks retrieved
3. **AI generates answer** → `POST /api/agent/chat` with code context
4. **Answer displayed** → Answer with code references

---

## 4. Test Payloads (For Verification)

### API Smoke Tests

#### 1. Health Check
```bash
curl -X GET https://api-synapse.shtrial.com/health
# Expected: {"status":"ok","stack":"fastify-langgraph-js","model":"..."}
```

#### 2. Agent Chat (Currently Placeholder)
```bash
curl -X POST https://api-synapse.shtrial.com/api/agent/chat \
  -H "Content-Type: application/json" \
  -d '{
    "message": "How does authentication work in this codebase?",
    "threadId": "thread-uuid"
  }'
# Expected: {"response":"Refactor: Connect LangGraph.js here"}
# NOTE: This is a placeholder - needs implementation
```

---

## 5. Deployment Risks

### ⚠️ Critical Issues Found

1. **Backend Implementation Minimal**
   - **Issue**: Fastify backend has only placeholder endpoints
   - **Risk**: No actual RAG functionality implemented yet
   - **Action Required**: Implement codebase indexing, semantic search, and RAG chat

2. **Environment Variables**
   - **All variables present in `.env.shared`** ✅
   - **No ghost variables detected** ✅

---

## 6. API Endpoints Summary

### Current Endpoints (Minimal)

1. **`GET /health`** - Health check ✅
2. **`POST /api/agent/chat`** - Agent chat (placeholder) ⚠️

### Required Endpoints (Not Yet Implemented)

1. **Indexing**
   - `POST /api/index` - Index codebase
   - `GET /api/index/:id` - Get index status
   - `DELETE /api/index/:id` - Delete index

2. **Search**
   - `POST /api/search` - Semantic codebase search
   - `GET /api/search/:query` - Search codebase

3. **Documents**
   - `POST /api/documents` - Index document
   - `GET /api/documents` - List documents

---

## 7. Frontend User Flows

### Main Screens (Next.js App Router)
- `/` - Home/Dashboard
- `/index` - Codebase indexing interface
- `/search` - Semantic search interface
- `/chat` - RAG-powered chat with codebase

---

## 8. Infrastructure Notes

- **Namespace**: `synapse`
- **Cluster**: `sh-demo-cluster` (ID: `fa17ab7c-4a61-4c4d-a80a-1fc8bf26d782`)
- **Domains**: 
  - Frontend: `synapse.shtrial.com`
  - Backend: `api-synapse.shtrial.com`

### Docker
- **Backend**: `apps/backend/Dockerfile` exists
- **Frontend**: `apps/frontend/Dockerfile` exists
- **MCP Server**: `apps/mcp-server/Dockerfile` exists
- **Compose**: Not present (needs creation for Phase 3)

---

## ✅ Ready to Proceed?

**Status**: **⚠️ NO** - Backend implementation incomplete

**Blockers**:
- ❌ Backend has only placeholder endpoints
- ❌ Core RAG functionality not implemented
- ❌ Codebase indexing not implemented

**Next Steps**:
1. **CRITICAL**: Implement codebase indexing API
2. **CRITICAL**: Implement semantic search API
3. **CRITICAL**: Connect LangGraph.js to `/api/agent/chat` endpoint
4. Generate `TEST_PLAN.md` once backend is functional
5. Create `docker-compose.yml` for local simulation

**Recommendation**: This repository appears to be in early development. The README describes a comprehensive RAG engine, but the backend implementation is minimal. Consider prioritizing other repositories that have more complete implementations, or allocate significant development time to complete the backend before proceeding to Phase 2.

---

**Discovery Completed By**: AI DevOps Architect  
**Next Repository**: UmmaConnect (shmindmaster)

