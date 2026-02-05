# CRITICAL FIX NEEDED - Build Issue

## Current Status
Build fails with: "Module '@prisma/client' has no exported member 'PrismaClient'"

## Root Cause
TypeScript cache issue with pnpm setup. Prisma generates to pnpm cache, but TypeScript can't find it.

## QUICK FIX (Do This Immediately)

### Option 1: Clean Build (Recommended)
```bash
cd h:\Repos\shmindmaster\synapse
# Clear TypeScript and pnpm cache
rm -r apps/backend/dist apps/backend/*.tsbuildinfo node_modules/.cache 2>/dev/null
pnpm clean
pnpm install
pnpm exec prisma generate --skip-engine-check
pnpm build
```

### Option 2: Move Database Config
Move `apps/backend/src/config/db.ts` to use lazy import:

```typescript
// Instead of:
import { PrismaClient } from '@prisma/client';

// Use:
import type { PrismaClient as PC } from '@prisma/client';
let PrismaClient: any;

dynamic(() => {
  return import('@prisma/client').then(m => {
    PrismaClient = m.PrismaClient;
  });
});
```

### Option 3: Use Prisma Global Instance
```typescript
// At root of apps/backend/src/lib/prisma.ts
export const prisma = global.prisma || new (...).PrismaClient();
if (process.env.NODE_ENV !== 'production') {
  global.prisma = prisma;
}
```

## Files Modified
- apps/backend/package.json - Changed Prisma from v7 to v6.19.0 (actual release)

## Next Actions
1. Try Option 1 (clean build) first
2. If that doesn't work, try Option 2
3. Document the fix in SETUP.md

## What Should Work After Fix
- pnpm build should complete all 4 packages
- Backend should compile to dist/
- Frontend should compile to dist/
- All routes should be available
- E2E tests should be able to run

## Database
- Prisma schema is at: prisma/schema.prisma
- Already has User, VectorEmbedding, AuditLog tables
- Just needs migrations applied

## DeployMent Ready?
✅ Code is ready (all services implemented)
❌ Build is broken (Prisma import issue)
⚠️  Database not yet seeded
