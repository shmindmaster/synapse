# Quick Fix Guide: Implement Missing Backend API

**Priority**: 🔴 CRITICAL
**Time to Implement**: 3-4 hours
**Complexity**: Medium

---

## What Tests Expect vs What's Implemented

### TEST EXPECTATIONS:

```
✅ GET /api/health
   - Returns: { status: 'healthy', service: 'Synapse API' }

❌ POST /api/auth/login
   - Input: { email, password }
   - Returns: { success: true, user: { email }, token }
   - Error (401): { success: false }

❌ GET /api/index-status (PROTECTED)
   - Requires: Authorization: Bearer {token}
   - Returns: { hasIndex: boolean }
   - Error (401): { error: 'Authentication required' }

❌ Protected routes need auth middleware
```

---

## Implementation Strategy

### Step 1: Create Backend Routes Structure

```
apps/backend/src/
├── routes/
│   ├── index.ts          (register all routes)
│   ├── auth.ts           (login, logout)
│   ├── search.ts         (semantic-search)
│   ├── index.ts          (indexing)
│   ├── chat.ts           (chat)
│   └── analyze.ts        (analysis endpoints)
├── middleware/
│   ├── auth.ts           (verify JWT token)
│   └── error.ts          (error handling)
├── services/
│   ├── authService.ts    (login logic)
│   ├── searchService.ts  (search logic)
│   └── chatService.ts    (chat logic)
└── server.ts             (update with routes)
```

### Step 2: Authentication Handler (MINIMAL)

**File**: `apps/backend/src/middleware/auth.ts`

```typescript
import { FastifyRequest, FastifyReply } from 'fastify';
import jwt from '@fastify/jwt';

export async function verifyAuth(request: FastifyRequest, reply: FastifyReply) {
  try {
    await request.jwtVerify();
  } catch (err) {
    reply.status(401).send({ error: 'Authentication required' });
  }
}

export function generateToken(userId: string): string {
  // Use Fastify's JWT plugin to generate token
  return signing({ userId });
}
```

### Step 3: Auth Route (CRITICAL)

**File**: `apps/backend/src/routes/auth.ts`

```typescript
import { FastifyInstance } from 'fastify';
import { PrismaClient } from '@prisma/client';
import bcrypt from 'bcrypt';

const prisma = new PrismaClient();

export async function authRoutes(app: FastifyInstance) {
  // POST /api/auth/login
  app.post<{ Body: { email: string; password: string } }>('/auth/login', async (request, reply) => {
    const { email, password } = request.body;

    // Find user in database
    const user = await prisma.users.findUnique({ where: { email } });

    if (!user) {
      return reply.status(401).send({
        success: false,
        error: 'Invalid credentials',
      });
    }

    // Verify password
    const passwordValid = await bcrypt.compare(password, user.password_hash);

    if (!passwordValid) {
      return reply.status(401).send({
        success: false,
        error: 'Invalid credentials',
      });
    }

    // Generate JWT token
    const token = app.jwt.sign({ userId: user.id });

    return reply.send({
      success: true,
      user: {
        id: user.id,
        email: user.email,
      },
      token,
    });
  });

  // POST /api/auth/logout
  app.post('/auth/logout', async (request, reply) => {
    return reply.send({ success: true });
  });
}
```

### Step 4: Search Route (CORE FEATURE)

**File**: `apps/backend/src/routes/search.ts`

```typescript
import { FastifyInstance } from 'fastify';
import { vectorStore } from '../services/vectorStore';
import { verifyAuth } from '../middleware/auth';

export async function searchRoutes(app: FastifyInstance) {
  // POST /api/semantic-search
  app.post<{ Body: { query: string } }>(
    '/semantic-search',
    { onRequest: [verifyAuth] },
    async (request, reply) => {
      const { query } = request.body;

      if (!query) {
        return reply.status(400).send({ error: 'Query is required' });
      }

      try {
        // Use existing vectorStore service
        const results = await vectorStore.semanticSearch(query, 10);

        return reply.send({
          success: true,
          results: results.map(r => ({
            id: r.id,
            content: r.content,
            path: r.path,
            similarity: r.similarity,
            preview: r.preview,
          })),
        });
      } catch (error) {
        console.error('Search error:', error);
        return reply.status(500).send({ error: 'Search failed' });
      }
    }
  );

  // GET /api/index-status
  app.get('/index-status', { onRequest: [verifyAuth] }, async (request, reply) => {
    try {
      // Check if any embeddings exist
      const count = await prisma.vector_embeddings.count();

      return reply.send({
        success: true,
        hasIndex: count > 0,
        documentCount: count,
      });
    } catch (error) {
      return reply.status(500).send({ error: 'Failed to get index status' });
    }
  });
}
```

### Step 5: Update Server to Register Routes

**File**: `apps/backend/src/server.ts` (UPDATE)

```typescript
import Fastify from 'fastify';
import fastifyJwt from '@fastify/jwt';
import fastifyCors from '@fastify/cors';
import { authRoutes } from './routes/auth';
import { searchRoutes } from './routes/search';
import { indexRoutes } from './routes/index';
import { chatRoutes } from './routes/chat';

const app = Fastify({
  logger: true,
});

// Register plugins
await app.register(fastifyJwt, {
  secret: process.env.JWT_SECRET || 'your-secret-key-change-in-prod',
});

await app.register(fastifyCors);

// Health check (no auth)
app.get('/api/health', async (request, reply) => {
  return {
    status: 'healthy',
    service: 'Synapse API',
    timestamp: new Date().toISOString(),
  };
});

// Register all routes
await app.register(authRoutes, { prefix: '/api' });
await app.register(searchRoutes, { prefix: '/api' });
await app.register(indexRoutes, { prefix: '/api' });
await app.register(chatRoutes, { prefix: '/api' });

// Start server
const start = async () => {
  try {
    await app.listen({ port: 3001, host: '0.0.0.0' });
    console.log('Server running at http://localhost:3001');
  } catch (err) {
    app.log.error(err);
    process.exit(1);
  }
};

start();
```

---

## Step-by-Step Implementation Order

### Phase 1: Authentication (1 hour)

1. [ ] Install `@fastify/jwt` and `bcrypt`
2. [ ] Create `middleware/auth.ts`
3. [ ] Create `routes/auth.ts` with login endpoint
4. [ ] Update `server.ts` to register auth routes
5. [ ] Test: `curl -X POST http://localhost:3001/api/auth/login -d '{"email":"test@example.com","password":"test"}'`

### Phase 2: Core Search (1 hour)

1. [ ] Create `routes/search.ts`
2. [ ] Wire up vectorStore service
3. [ ] Implement semantic-search endpoint
4. [ ] Implementation index-status endpoint
5. [ ] Create tests for search endpoints

### Phase 3: Indexing (1 hour)

1. [ ] Create `routes/index.ts`
2. [ ] Wire up fileWatcher service
3. [ ] Implement file upload/indexing endpoints
4. [ ] Add progress tracking

### Phase 4: Chat (1 hour)

1. [ ] Create `routes/chat.ts`
2. [ ] Implement RAG chat endpoint
3. [ ] Wire up AI provider (OpenAI, Groq, etc.)
4. [ ] Add context retrieval

---

## Testing Commands

```bash
# Test health
curl http://localhost:3001/api/health

# Test login (after implementation)
curl -X POST http://localhost:3001/api/login \
  -H "Content-Type: application/json" \
  -d '{"email":"demo@example.com","password":"password"}'

# Test semantic search (with token)
curl http://localhost:3001/api/semantic-search \
  -H "Authorization: Bearer {token}" \
  -H "Content-Type: application/json" \
  -d '{"query":"How does authentication work?"}'
```

---

## Quick Wins (Do These First)

1. **Get Login Working** (Critical for E2E tests)
   - Time: 30 minutes
   - Impact: Unblocks all protected routes

2. **Get Search Working** (Demo feature)
   - Time: 30 minutes
   - Impact: Shows core functionality

3. **Get Index Status Working** (Basic feature)
   - Time: 15 minutes
   - Impact: Simple but needed

4. **Docker Compose with PostgreSQL**
   - Time: 1 hour
   - Impact: Enables local dev setup

---

## Minimal Viable Backend

The absolute minimum to launch:

```typescript
// Just these endpoints:
✅ GET /api/health
✅ POST /api/auth/login
✅ GET /api/index-status (protected)
✅ POST /api/semantic-search (protected)
✅ POST /api/chat (protected)
```

This covers:

- Authentication flow
- Search functionality
- Chat functionality

Everything else can be added post-launch.

---

## Environment Variables Needed

```bash
# .env
DATABASE_URL=postgresql://user:password@localhost:5432/synapse
JWT_SECRET=your-secret-key
OPENAI_API_KEY=sk-...
LLM_MODEL=gpt-4-turbo

# Optional
LOG_LEVEL=info
PORT=3001
NODE_ENV=development
```

---

## Installation Commands

```bash
# Add required dependencies
pnpm add @fastify/jwt @fastify/cors bcrypt jsonwebtoken

# Verify compilation
pnpm build

# Run tests after implementation
pnpm test:e2e
```
