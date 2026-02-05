# Synapse Architecture

## Overview

Synapse is a **privacy-first RAG (Retrieval Augmented Generation) platform** that transforms any document collection—codebases, technical documentation, contracts, knowledge bases—into an intelligent, queryable system.

The system is designed with a **local-first architecture**: all processing happens on your infrastructure with zero data leakage to external services (unless you explicitly configure AI providers).

## System Architecture

```
┌─────────────────┐
│   VS Code       │
│   Extension     │
└────────┬────────┘
         │
┌────────▼────────┐
│   CLI Tool      │
└────────┬────────┘
         │
┌────────▼────────┐      ┌──────────────┐
│   MCP Server    │──────▶│   AI Agents  │
└────────┬────────┘      │ (Claude, etc)│
         │               └──────────────┘
         │ HTTP/REST
         │
┌────────▼────────────────────────────┐
│         Backend API                 │
│  ┌──────────────────────────────┐   │
│  │  Vector Store Service        │   │
│  │  (PostgreSQL + pgvector)     │   │
│  └──────────────────────────────┘   │
│  ┌──────────────────────────────┐   │
│  │  File Watcher Service        │   │
│  │  (Incremental Indexing)      │   │
│  └──────────────────────────────┘   │
│  ┌──────────────────────────────┐   │
│  │  AST Parser Service          │   │
│  │  (Tree-sitter - Optional)    │   │
│  └──────────────────────────────┘   │
│  ┌──────────────────────────────┐   │
│  │  Document Processor          │   │
│  │  (Multi-format ingestion)    │   │
│  └──────────────────────────────┘   │
└────────┬────────────────────────────┘
         │
┌────────▼────────┐
│   PostgreSQL    │
│   + pgvector    │
└─────────────────┘
```

## Components

### Backend API (`src/api`)

The backend is a **Fastify-based REST API** that handles all core RAG functionality:

- **Vector Store Service**: Manages embeddings in PostgreSQL using pgvector extension for semantic similarity search
- **File Watcher Service**: Monitors directories for file changes, enabling real-time incremental updates
- **AST Parser Service** (Optional): Extracts code structure using Tree-sitter for intelligent code understanding
- **Document Processor**: Handles multi-format document ingestion (text, markdown, code, etc.)
- **REST API**: Provides endpoints for:
  - Document indexing
  - Semantic search
  - RAG-powered chat
  - Status and health checks

**Key Features**:

- Graceful degradation (AST parsing optional)
- Chunking strategies for different document types
- Metadata extraction and filtering
- Real-time incremental indexing

### Frontend (`src/web`)

Modern **React + TypeScript** web application:

- **Search Interface**: Semantic search with result previews
- **Chat Interface**: RAG-powered conversational interface
- **Index Management**: Upload, organize, and manage indexed documents
- **Analytics Dashboard**: View indexing stats and usage
- **Configuration Panel**: Manage AI providers and settings

**Tech Stack**:

- React 19
- Vite 7
- Tailwind CSS 4
- ShadCN UI components

### VS Code Extension (`src/vscode-ext`)

Bring semantic search directly into your IDE:

- **Semantic Search Provider**: Integrates with VS Code's search UI
- **Workspace Symbol Provider**: Enables semantic Ctrl+T navigation
- **Chat Panel**: Webview for document conversations
- **Indexing Status**: Shows indexed files and progress
- **Command Palette Integration**: Quick access to all features

### MCP Server (`src/mcp-server`)

**Model Context Protocol server** for AI agent integration:

- **MCP Protocol Handler**: Implements Model Context Protocol spec
- **Tool Providers**:
  - `search_knowledge_base`: Semantic search tool
  - `index_documents`: Indexing tool
  - `get_context`: Context retrieval tool
  - `chat_with_knowledge`: Chat tool
- **AI Agent Integration**: Works with Claude, Devin, and other MCP-compatible agents

### CLI Tool (`src/cli`)

Command-line interface for automation and scripting:

```bash
# Index documents
synapse index /path/to/documents

# Search
synapse search "query text"

# Interactive chat
synapse chat

# Check status
synapse status
```

**Use Cases**:

- CI/CD pipeline integration
- Batch processing
- Scripting and automation
- Headless deployment

## Data Flow

### 1. Document Indexing Flow

```
Documents → Text Extraction → Chunking → Embedding Generation → PostgreSQL (pgvector)
                   ↓              ↓              ↓
              Metadata      Smart Chunks   Vector Embeddings
              Extraction    (Semantic)     (1536 dimensions)
```

**Steps**:

1. **File Discovery**: Scan directories for indexable documents
2. **Content Extraction**: Extract text content (with format-specific parsers)
3. **Metadata Extraction**: Extract document type, author, date, etc.
4. **Chunking**: Split into semantic chunks (respecting document structure)
5. **Embedding Generation**: Generate vector embeddings using configured AI provider
6. **Storage**: Store in PostgreSQL with pgvector for similarity search

**Optimization**:

- Incremental updates (only changed files)
- Batch processing for efficiency
- Parallel embedding generation
- Deduplication

### 2. Semantic Search Flow

```
Query → Embedding → pgvector Similarity Search → Re-ranking → Results
          ↓              ↓                          ↓
    Vector (1536d)   Cosine Distance        Metadata Filtering
```

**Steps**:

1. **Query Embedding**: Convert natural language query to vector
2. **Similarity Search**: Use pgvector's `<=>` operator for fast nearest neighbor search
3. **Filtering**: Apply metadata filters (path, type, date, etc.)
4. **Re-ranking**: Optional re-ranking based on additional signals
5. **Result Assembly**: Fetch full content and metadata for top matches

**Fallback**:

- Text-based search when embeddings unavailable
- PostgreSQL full-text search as backup

### 3. RAG Chat Flow

```
User Message → Context Retrieval → Prompt Assembly → LLM → Response
                      ↓                  ↓
              Relevant Chunks    System Prompt + Context + Message
```

**Steps**:

1. **Message Reception**: Receive user question
2. **Context Retrieval**: Semantic search for relevant document chunks (top 5-10)
3. **Prompt Assembly**: Build prompt with:
   - System instructions
   - Retrieved context (with source citations)
   - Conversation history
   - User question
4. **LLM Invocation**: Send to configured AI provider
5. **Response Streaming**: Stream response back to user (with source references)

**Features**:

- Multi-turn conversation support
- Source citation (with links to original documents)
- Conversation history management
- Context window optimization

## Technology Stack

### Backend

- **Runtime**: Node.js 20+
- **Framework**: Fastify 5 (ultra-fast web framework)
- **Database**: PostgreSQL 14+ with pgvector extension
- **ORM**: Prisma (type-safe database access)
- **Language**: TypeScript 5.9

### Frontend

- **Framework**: React 19
- **Build Tool**: Vite 7 (instant HMR)
- **Styling**: Tailwind CSS 4
- **UI Components**: ShadCN UI (accessible, customizable)
- **Language**: TypeScript 5.9

### AI/ML

- **Embeddings**: OpenAI text-embedding-3-small (1536 dimensions)
- **Vector Search**: pgvector (PostgreSQL extension)
- **LLM Providers**: OpenAI, Anthropic, Groq, Gemini (configurable)
- **Code Intelligence**: Tree-sitter (optional)

### Deployment

- **Container**: Docker + Docker Compose
- **Reverse Proxy**: nginx (production)
- **Monitoring**: Sentry (error tracking)
- **CI/CD**: GitHub Actions

## Database Schema

### Core Tables

**vector_embeddings**

- Primary storage for document chunks and embeddings
- Columns:
  - `id` (UUID): Primary key
  - `path` (TEXT): Document path or identifier
  - `content` (TEXT): Chunk content
  - `embedding` (VECTOR(1536)): pgvector embedding
  - `metadata` (JSONB): Flexible metadata (type, author, etc.)
  - `preview` (TEXT): Short preview for search results
  - `indexed_at` (TIMESTAMP): When indexed
  - `updated_at` (TIMESTAMP): When updated

**users**

- User authentication and access control
- Columns: id, email, password_hash, created_at

**document_types**

- Configurable document classification schemas
- Columns: id, name, schema (JSONB), created_at

**analysis_templates**

- Custom analysis patterns (summarization, extraction, etc.)
- Columns: id, name, template (JSONB), created_at

**knowledge_organization_patterns**

- Knowledge structuring patterns (hierarchical, tag-based, etc.)
- Columns: id, name, pattern (JSONB), created_at

**audit_logs**

- Activity tracking and compliance
- Columns: id, user_id, action, details (JSONB), timestamp

### Indexes

- **pgvector index**: IVFFlat index on `embedding` column for fast similarity search
- **GIN index**: On `metadata` JSONB for efficient filtering
- **B-tree indexes**: On `path`, `indexed_at` for common queries

## Privacy & Security Architecture

### Data Isolation

- All processing happens on your infrastructure
- No telemetry or analytics sent externally
- AI provider calls optional and explicit

### Access Control

- User authentication with bcrypt
- Role-based access control (future)
- Audit logging for compliance

### Encryption

- TLS/SSL for all network communication
- Database connection encryption
- API key encryption at rest

### Compliance

- GDPR-ready (data portability, right to deletion)
- HIPAA-compatible deployment options
- SOC 2 audit trail capabilities

## Scalability Considerations

### Horizontal Scaling

- Stateless backend (scales horizontally)
- PostgreSQL read replicas for search
- Load balancing across multiple backends

### Performance

- Connection pooling (PostgreSQL)
- Caching layer for frequent queries
- Batch embedding generation
- Lazy loading in UI

### Storage

- Chunking strategy minimizes storage
- Metadata filtering reduces search scope
- Optional cleanup of old embeddings

## Extension Points

### Custom Document Processors

Add processors for new file types in `src/api/services/processors/`

### Analysis Templates

Define custom analysis patterns in database

### AI Provider Integration

Add new providers in `src/api/services/ai/`

### UI Themes

Customize Tailwind config for branding

- **analysis_templates**: AI analysis templates

## Security

- Local-first: Data stays on your infrastructure
- No cloud dependencies for core functionality
- Optional OpenAI API for embeddings (can be replaced)
- Authentication via JWT tokens
