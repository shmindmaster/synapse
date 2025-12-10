# Synapse VS Code Extension

Local-first semantic codebase search and chat for VS Code.

## Features

- **Semantic Codebase Search**: Find code by meaning, not just keywords
- **Codebase Chat**: Ask questions about your codebase and get AI-powered answers
- **Incremental Indexing**: Automatically index your workspace with file watching
- **Privacy-First**: All processing happens locally or on your own infrastructure

## Requirements

- Synapse backend server running (default: http://localhost:3001)
- VS Code 1.80.0 or higher

## Usage

1. **Index Your Codebase**: 
   - Press `Ctrl+Shift+P` (or `Cmd+Shift+P` on Mac)
   - Type "Synapse: Index Codebase"
   - Select your workspace folder

2. **Search Your Codebase**:
   - Press `Ctrl+Shift+P`
   - Type "Synapse: Search Codebase"
   - Enter your query (e.g., "How does authentication work?")

3. **Chat with Your Codebase**:
   - Press `Ctrl+Shift+P`
   - Type "Synapse: Chat with Codebase"
   - Ask questions about your code

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

