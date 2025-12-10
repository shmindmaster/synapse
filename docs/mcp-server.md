# MCP Server Guide

## Overview

The Synapse MCP Server enables AI agents like Devin to interact with your codebase through the Model Context Protocol.

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

## Usage with Devin

Add to your Devin MCP configuration (`~/.devin/mcp.json`):

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

Semantic search across indexed code.

**Parameters:**
- `query` (string): Search query
- `limit` (number, optional): Max results (default: 10)

### index_codebase

Index a directory for search.

**Parameters:**
- `directoryPath` (string): Directory to index
- `enableWatching` (boolean, optional): Enable file watching (default: true)

### get_code_context

Get context about a file or function.

**Parameters:**
- `filePath` (string): File path
- `functionName` (string, optional): Function name

### chat_with_codebase

Chat with codebase using RAG.

**Parameters:**
- `message` (string): Your question
- `context` (object, optional): Additional context

### get_knowledge_graph

Get code relationship graph.

**Parameters:**
- `depth` (number, optional): Relationship depth (default: 2)
- `focus` (string, optional): Focus topic

## Development

```bash
pnpm dev  # Watch mode
pnpm build  # Build
pnpm start  # Run
```

