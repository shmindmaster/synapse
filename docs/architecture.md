# Synapse Architecture

## Overview

Synapse is a local-first RAG (Retrieval Augmented Generation) engine for codebase indexing and semantic search. It consists of multiple components working together to provide intelligent codebase understanding.

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
│   MCP Server    │──────▶│   Devin AI   │
└────────┬────────┘      └──────────────┘
         │
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
│  │  (Tree-sitter)               │   │
│  └──────────────────────────────┘   │
└────────┬────────────────────────────┘
         │
┌────────▼────────┐
│   PostgreSQL    │
│   + pgvector    │
└─────────────────┘
```

## Components

### Backend API (`apps/backend`)

- **Vector Store Service**: Manages embeddings in PostgreSQL using pgvector
- **File Watcher Service**: Monitors file changes for incremental indexing
- **AST Parser Service**: Extracts code structure using Tree-sitter
- **REST API**: Provides endpoints for search, indexing, and chat

### VS Code Extension (`apps/vscode-extension`)

- **Semantic Search Provider**: Integrates with VS Code's search
- **Workspace Symbol Provider**: Enables Ctrl+T semantic search
- **Chat Panel**: Webview for codebase conversations
- **Indexing Status View**: Shows indexed files and progress

### MCP Server (`apps/mcp-server`)

- **MCP Protocol Handler**: Implements Model Context Protocol
- **Tool Providers**: search_codebase, index_codebase, get_code_context, chat_with_codebase
- **Devin Integration**: Enables AI agents to use Synapse

### CLI Tool (`apps/cli`)

- **Index Command**: Index directories from terminal
- **Search Command**: Search codebase from terminal
- **Chat Command**: Interactive chat with codebase
- **Status Command**: Check indexing status

## Data Flow

1. **Indexing**:
   - Files → Text Extraction → Chunking → Embedding Generation → PostgreSQL (pgvector)

2. **Search**:
   - Query → Embedding → pgvector Similarity Search → Results

3. **Chat**:
   - Message → RAG Context Retrieval → LLM → Response

## Technology Stack

- **Backend**: Node.js, Express, PostgreSQL, pgvector
- **Frontend**: React, Vite, Tailwind CSS
- **VS Code Extension**: TypeScript, VS Code API
- **MCP Server**: TypeScript, MCP SDK
- **CLI**: TypeScript, Commander.js
- **AI**: OpenAI Embeddings, DigitalOcean Gradient AI

## Database Schema

- **vector_embeddings**: Stores file chunks with embeddings
- **users**: User authentication
- **audit_logs**: Activity tracking
- **document_types**: Document classification schemas
- **analysis_templates**: AI analysis templates

## Security

- Local-first: Data stays on your infrastructure
- No cloud dependencies for core functionality
- Optional OpenAI API for embeddings (can be replaced)
- Authentication via JWT tokens

