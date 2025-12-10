# VS Code Extension Guide

## Installation

1. Build the extension:
```bash
cd apps/vscode-extension
pnpm install
pnpm compile
```

2. Package the extension:
```bash
pnpm package
```

3. Install in VS Code:
   - Open VS Code
   - Go to Extensions view
   - Click "..." menu → "Install from VSIX..."
   - Select the generated `.vsix` file

## Configuration

Open VS Code settings and configure:

- `synapse.apiUrl`: Backend API URL (default: http://localhost:3001)
- `synapse.autoIndex`: Auto-index on startup (default: false)
- `synapse.watchFiles`: Enable file watching (default: true)

## Usage

### Index Your Codebase

1. Press `Ctrl+Shift+P` (or `Cmd+Shift+P` on Mac)
2. Type "Synapse: Index Codebase"
3. Select your workspace folder

### Search Your Codebase

1. Press `Ctrl+Shift+P`
2. Type "Synapse: Search Codebase"
3. Enter your query

### Chat with Codebase

1. Press `Ctrl+Shift+P`
2. Type "Synapse: Chat with Codebase"
3. Ask questions about your code

### Symbol Search

Press `Ctrl+T` (or `Cmd+T` on Mac) and type your query - Synapse provides semantic results.

## Features

- **Semantic Search**: Find code by meaning
- **Codebase Chat**: Ask questions about your code
- **Incremental Indexing**: Automatic updates on file changes
- **Status Bar**: Shows indexing status

