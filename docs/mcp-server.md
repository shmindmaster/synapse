# MCP Server Guide

## Overview

The Synapse MCP Server enables AI agents like Claude, Devin, and other MCP-compatible tools to interact with your indexed documents, knowledge bases, and code through the Model Context Protocol.

## Installation

```bash
cd apps/mcp-server
pnpm install
pnpm build
```

## Configuration

Set environment variable:

```bash
export SYNAPSE_API_URL=http://localhost:3001
```

## Usage with Claude Desktop

Add to your Claude Desktop MCP configuration (`~/Library/Application Support/Claude/claude_desktop_config.json` on macOS or `%APPDATA%\Claude\claude_desktop_config.json` on Windows):

```json
{
  "mcpServers": {
    "synapse": {
      "command": "node",
      "args": ["/path/to/synapse/apps/mcp-server/dist/server.js"],
      "env": {
        "SYNAPSE_API_URL": "http://localhost:3001"
      }
    }
  }
}
```

## Usage with Cursor

Add to your Cursor MCP configuration (`~/.cursor/mcp.json`):

```json
{
  "mcpServers": {
    "synapse": {
      "command": "node",
      "args": ["/path/to/synapse/apps/mcp-server/dist/server.js"],
      "env": {
        "SYNAPSE_API_URL": "http://localhost:3001"
      }
    }
  }
}
```

## Available Tools

### search_codebase

Semantic search across indexed documents and code.

**Parameters:**

- `query` (string): Search query (e.g., "authentication logic" or "contract terms")
- `limit` (number, optional): Max results (default: 10)

### index_codebase

Index a directory containing documents, code, or any text-based files.

**Parameters:**

- `directoryPath` (string): Directory to index
- `enableWatching` (boolean, optional): Enable file watching for real-time updates (default: true)

### get_code_context

Get context about a specific file or section.

**Parameters:**

- `filePath` (string): File path
- `functionName` (string, optional): Function name

### chat_with_codebase

Chat with your indexed knowledge base using RAG (Retrieval Augmented Generation).

**Parameters:**

- `message` (string): Your question or query
- `context` (object, optional): Additional context to guide the response

### get_knowledge_graph

Get relationship graph for indexed content (documents, code, etc.).

**Parameters:**

- `depth` (number, optional): Relationship depth (default: 2)
- `focus` (string, optional): Focus topic

## Development

```bash
pnpm dev  # Watch mode
pnpm build  # Build
pnpm start  # Run
```
