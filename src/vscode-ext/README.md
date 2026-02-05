# Synapse VS Code Extension

Privacy-first semantic search and chat for your workspace documents and code.

## Features

- **Semantic Search**: Find relevant information by meaning, not just keywords
- **Intelligent Chat**: Ask questions about your documents, code, or knowledge base
- **Real-Time Indexing**: Automatically index your workspace with file watching
- **Privacy-First**: All processing happens locally or on your own infrastructure
- **Multi-Format Support**: Works with code, markdown, text files, and more

## Requirements

- Synapse backend server running (default: http://localhost:3001)
- VS Code 1.80.0 or higher

## Usage

1. **Index Your Workspace**:
   - Press `Ctrl+Shift+P` (or `Cmd+Shift+P` on Mac)
   - Type "Synapse: Index Codebase"
   - Select your workspace folder to index code, docs, and other files

2. **Search Your Content**:
   - Press `Ctrl+Shift+P`
   - Type "Synapse: Search Codebase"
   - Enter your query (e.g., "How does authentication work?" or "deployment process")

3. **Chat with Your Knowledge Base**:
   - Press `Ctrl+Shift+P`
   - Type "Synapse: Chat with Codebase"
   - Ask questions about your code, documentation, or any indexed content

4. **Use Symbol Search**:
   - Press `Ctrl+T` (or `Cmd+T` on Mac)
   - Type your query - Synapse will provide semantic results

## Configuration

- `synapse.apiUrl`: Backend API URL (default: http://localhost:3001)
- `synapse.autoIndex`: Automatically index workspace on startup (default: false)
- `synapse.watchFiles`: Watch files for changes (default: true)

## Development

```bash
cd apps/vscode-extension
pnpm install
pnpm compile
pnpm watch  # For development
```

## License

MIT
