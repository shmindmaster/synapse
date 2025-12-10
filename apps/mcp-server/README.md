# Synapse MCP Server

Model Context Protocol (MCP) server for Synapse codebase indexing and search. Enables AI agents like Devin to interact with your codebase.

## Features

- **search_codebase**: Semantic search across indexed code
- **index_codebase**: Index directories for search
- **get_code_context**: Get context about specific files/functions
- **chat_with_codebase**: RAG-based chat with codebase
- **get_knowledge_graph**: Get code relationship graph

## Installation

```bash
cd apps/mcp-server
pnpm install
pnpm build
```

## Configuration

Set environment variable:
- `SYNAPSE_API_URL`: Backend API URL (default: http://localhost:3001)

## Usage with Devin

Add to your Devin MCP configuration:

```json
{
  "mcpServers": {
    "synapse": {
      "command": "node",
      "args": ["path/to/synapse/apps/mcp-server/dist/server.js"],
      "env": {
        "SYNAPSE_API_URL": "http://localhost:3001"
      }
    }
  }
}
```

## Development

```bash
pnpm dev  # Watch mode
pnpm build  # Build
pnpm start  # Run built server
```

## License

MIT

