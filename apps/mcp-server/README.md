# Synapse MCP Server

Model Context Protocol (MCP) server for Synapse. Enables AI agents like Claude, Devin, and other MCP-compatible tools to interact with your indexed documents and knowledge bases.

## Features

- **search_codebase**: Semantic search across indexed documents and code
- **index_codebase**: Index directories and document collections
- **get_code_context**: Get context about specific files/sections
- **chat_with_codebase**: RAG-based chat with your knowledge base
- **get_knowledge_graph**: Get relationship graph for indexed content

## Installation

```bash
cd apps/mcp-server
pnpm install
pnpm build
```

## Configuration

Set environment variable:

- `SYNAPSE_API_URL`: Backend API URL (default: http://localhost:3001)

## Usage with AI Agents

### Claude Desktop / Other MCP Clients

Add to your MCP configuration:

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
