# API Reference

## Base URL

Default: `http://localhost:3001`

## Endpoints

### Health Check

```
GET /api/health
```

Returns server health status.

### Index Files

```
POST /api/index-files
```

Index a directory for semantic search.

**Request Body:**

```json
{
  "baseDirectories": [{ "path": "/path/to/directory" }],
  "enableWatching": true
}
```

**Response:** Streaming JSON with progress updates.

### Index Status

```
GET /api/index-status
```

Get current indexing status.

**Response:**

```json
{
  "hasIndex": true,
  "count": 1234
}
```

### Semantic Search

```
POST /api/semantic-search
```

Search indexed documents, code, or knowledge base content using semantic similarity.

**Request Body:**

```json
{
  "query": "How does authentication work?"
}
```

**Response:**

```json
{
  "results": [
    {
      "name": "auth.ts",
      "path": "/path/to/auth.ts",
      "keywords": ["85% Match"],
      "analysis": {
        "summary": "...",
        "category": "Search Result",
        "tags": ["Vector Match"]
      }
    }
  ]
}
```

### Chat

```
POST /api/chat
```

Chat with your indexed knowledge base using RAG (Retrieval Augmented Generation).

**Request Body:**

```json
{
  "message": "How do I implement authentication?",
  "context": {
    "files": ["/path/to/file.ts"]
  }
}
```

**Response:**

```json
{
  "success": true,
  "reply": "To implement authentication..."
}
```

### Watch Directory

```
POST /api/watch-directory
```

Start watching a directory for changes.

**Request Body:**

```json
{
  "directoryPath": "/path/to/directory"
}
```

### Watcher Status

```
GET /api/watcher-status
```

Get file watcher status.

**Response:**

```json
{
  "watching": ["/path/to/dir1", "/path/to/dir2"],
  "queueSize": 5,
  "isProcessing": false
}
```
