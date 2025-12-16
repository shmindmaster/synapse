# SHTrial Platform Copilot Integration - Testing Checklist

**Date**: December 15, 2025  
**Status**: Ready for Testing  
**Completion**: 100%

---

## ✅ Completion Checklist

### Phase 1: Documentation & Standards ✅
- [x] Established `shtrial-demo-standards.md` as primary source
- [x] Identified supporting documentation in `.pendoah/platform/docs/`
- [x] Verified `.env.shared` configuration template
- [x] Documented shared infrastructure details
- [x] Documented naming conventions

### Phase 2: Core Configuration ✅
- [x] Completely rewrote `.github/copilot-instructions.md`
- [x] Added comprehensive platform architecture
- [x] Included shared infrastructure configuration
- [x] Documented naming conventions
- [x] Added environment variable standards
- [x] Included LangGraph patterns
- [x] Added deployment procedures

### Phase 3: Agent Files ✅
- [x] Enhanced all 22 agent files with platform context
- [x] Added "SHTrial Platform Context" section to each
- [x] Included shared infrastructure details
- [x] Documented naming conventions
- [x] Added configuration management
- [x] Preserved YAML frontmatter
- [x] Renamed all files with `shtrial-*` prefix
- [x] Created `agents/README.md` documentation

### Phase 4: Instruction Files ✅
- [x] Enhanced all 19 instruction files with platform context
- [x] Added "SHTrial Platform Context" section to each
- [x] Included backend standards
- [x] Included frontend standards
- [x] Added platform integration guidelines
- [x] Documented environment variables
- [x] Preserved YAML frontmatter
- [x] Renamed all files with `shtrial-*` prefix
- [x] Created `instructions/README.md` documentation

### Phase 5: Automation & Documentation ✅
- [x] Created `.github/scripts/` directory
- [x] Created `rename-agents.ps1` script
- [x] Created `rename-instructions.ps1` script
- [x] Executed both scripts successfully (100% success rate)
- [x] Created `.github/README.md` overview
- [x] Created `COPILOT-INTEGRATION-COMPLETE.md` summary
- [x] Created this testing checklist

### Phase 6: Verification ✅
- [x] Verified all 22 agent files renamed correctly
- [x] Verified all 19 instruction files renamed correctly
- [x] Spot-checked YAML frontmatter integrity
- [x] Verified platform context sections present
- [x] Counted all files (47 total)
- [x] No errors or warnings

---

## 🧪 Testing Checklist (Next Steps)

### Test 1: Copilot Parser Recognition
**Objective**: Verify GitHub Copilot can parse the renamed files

**Steps**:
1. [ ] Open a TypeScript file in VSCode
2. [ ] Trigger GitHub Copilot suggestion
3. [ ] Verify Copilot uses `shtrial-typescript.instructions.md`
4. [ ] Check that suggestions follow platform standards

**Expected Result**: Copilot applies TypeScript instructions with platform context

---

### Test 2: Agent File Recognition
**Objective**: Verify agent files are recognized and loaded

**Steps**:
1. [ ] Open VSCode with GitHub Copilot Chat
2. [ ] Reference an agent explicitly (e.g., `@shtrial-architecture`)
3. [ ] Ask a platform-specific question
4. [ ] Verify agent uses platform context in response

**Expected Result**: Agent provides answers referencing shared infrastructure

---

### Test 3: New App Creation
**Objective**: Test comprehensive platform standards application

**Prompt**:
```
Create a new SHTrial Platform application called "task-manager" that:
1. Uses FastAPI + LangGraph backend
2. Uses Next.js 16 frontend
3. Follows platform naming conventions
4. Uses shared Supabase database
5. Configures Azure OpenAI integration
6. Sets up Cloudflare R2 storage
```

**Verification Points**:
- [ ] App slug is `task-manager` (lowercase, hyphenated)
- [ ] Directory created as `apps/task-manager/`
- [ ] Environment variables use `TASK_MANAGER_*` prefix
- [ ] Database schema named `task_manager_schema`
- [ ] Supabase connection uses `TASK_MANAGER_SUPABASE_URL`
- [ ] Azure OpenAI endpoint references shared configuration
- [ ] S3 bucket uses `shtrial-demo-store` with prefix
- [ ] Deployment URL is `task-manager.shtrial.com`
- [ ] CDN path is `cdn.shtrial.com/task-manager/`
- [ ] `.env` file created with proper variables
- [ ] References `.env.shared` for shared config

**Expected Result**: Copilot creates app following ALL platform standards

---

### Test 4: Backend Code Generation
**Objective**: Verify backend standards are applied

**Prompt**:
```
Create a LangGraph workflow for the task-manager backend that:
1. Accepts task creation requests
2. Stores tasks in Supabase
3. Uses Azure OpenAI to suggest task priorities
4. Returns structured response
```

**Verification Points**:
- [ ] Uses Fastify framework
- [ ] Imports LangGraph StateGraph
- [ ] Configures Azure OpenAI client with environment variables
- [ ] Uses Supabase client with RLS
- [ ] References `task_manager_schema`
- [ ] Follows LangGraph node/edge pattern
- [ ] Uses proper error handling
- [ ] Includes type definitions

**Expected Result**: Generated code follows Fastify + LangGraph patterns

---

### Test 5: Frontend Code Generation
**Objective**: Verify frontend standards are applied

**Prompt**:
```
Create a Next.js 16 page for task-manager that:
1. Uses App Router
2. Displays tasks from Supabase
3. Uses Server Components for data fetching
4. Styles with Tailwind CSS
5. Handles authentication with Supabase Auth
```

**Verification Points**:
- [ ] Creates `app/` directory structure
- [ ] Uses Server Components by default
- [ ] Client Components marked with 'use client'
- [ ] Supabase client initialized with environment variables
- [ ] Tailwind CSS classes used for styling
- [ ] Authentication checks in Server Components
- [ ] Proper TypeScript types
- [ ] Next.js 16 best practices

**Expected Result**: Generated code follows Next.js 16 App Router patterns

---

### Test 6: Environment Variable Configuration
**Objective**: Verify proper environment variable setup

**Prompt**:
```
Create the .env file for task-manager with all required variables
```

**Verification Points**:
- [ ] Uses `TASK_MANAGER_*` prefix for all variables
- [ ] Includes Supabase URL and keys
- [ ] Includes Azure OpenAI configuration
- [ ] Includes S3/R2 storage configuration
- [ ] References CDN endpoint
- [ ] Includes Coolify deployment variables
- [ ] Comments reference `.env.shared`
- [ ] No hardcoded credentials

**Expected Result**: Complete `.env` file with platform standards

---

### Test 7: Database Schema Creation
**Objective**: Verify database standards are applied

**Prompt**:
```
Create Supabase migration for task-manager with:
1. tasks table in task_manager_schema
2. RLS policies
3. User ownership
```

**Verification Points**:
- [ ] Schema named `task_manager_schema`
- [ ] Tables created in correct schema
- [ ] RLS enabled on tables
- [ ] Policies reference auth.users()
- [ ] Proper indexes created
- [ ] Foreign key constraints
- [ ] Created/updated timestamps

**Expected Result**: Migration follows Supabase + RLS patterns

---

### Test 8: Deployment Configuration
**Objective**: Verify deployment standards are applied

**Prompt**:
```
Create deployment configuration for task-manager on Coolify
```

**Verification Points**:
- [ ] References Coolify cluster `6fgpwc0`
- [ ] Deployment URL is `task-manager.shtrial.com`
- [ ] Environment variables loaded from `.env`
- [ ] Build commands correct for Next.js + FastAPI
- [ ] Health check endpoints configured
- [ ] Resource limits defined
- [ ] Logging configured

**Expected Result**: Proper Coolify deployment configuration

---

### Test 9: Agent Specialization
**Objective**: Verify specialized agents provide expert guidance

**Test Cases**:
1. [ ] `@shtrial-architecture` - Ask about system design
2. [ ] `@shtrial-debugger` - Ask to debug a code issue
3. [ ] `@shtrial-nextjs-expert` - Ask about Next.js patterns
4. [ ] `@shtrial-playwright-tester` - Ask about E2E testing
5. [ ] `@shtrial-seo-expert` - Ask about optimization

**Verification Points**:
- [ ] Each agent responds with specialized knowledge
- [ ] Agents reference platform infrastructure
- [ ] Agents follow naming conventions
- [ ] Agents suggest platform-appropriate solutions

**Expected Result**: Agents provide specialized, platform-aware guidance

---

### Test 10: Cross-File Consistency
**Objective**: Verify consistency across multiple generated files

**Prompt**:
```
Create complete task-manager app with:
- Backend API
- Frontend UI
- Database schema
- Deployment config
- Tests
```

**Verification Points**:
- [ ] All files use consistent `task-manager` slug
- [ ] All env vars use `TASK_MANAGER_*` prefix
- [ ] All database refs use `task_manager_schema`
- [ ] All URLs use `task-manager.shtrial.com`
- [ ] All CDN paths use `cdn.shtrial.com/task-manager/`
- [ ] Shared infrastructure referenced consistently
- [ ] No conflicting patterns or conventions

**Expected Result**: Perfect consistency across all generated files

---

## 📊 Test Results Template

### Test Summary
| Test # | Test Name | Status | Issues | Notes |
|--------|-----------|--------|--------|-------|
| 1 | Copilot Parser Recognition | ⏳ | - | - |
| 2 | Agent File Recognition | ⏳ | - | - |
| 3 | New App Creation | ⏳ | - | - |
| 4 | Backend Code Generation | ⏳ | - | - |
| 5 | Frontend Code Generation | ⏳ | - | - |
| 6 | Environment Variables | ⏳ | - | - |
| 7 | Database Schema | ⏳ | - | - |
| 8 | Deployment Config | ⏳ | - | - |
| 9 | Agent Specialization | ⏳ | - | - |
| 10 | Cross-File Consistency | ⏳ | - | - |

Legend: ⏳ Not Started | 🟡 In Progress | ✅ Passed | ❌ Failed

---

## 🐛 Issue Tracking Template

### Issue Format
```markdown
**Test #**: [Number]
**Test Name**: [Name]
**Issue**: [Brief description]
**Expected**: [What should happen]
**Actual**: [What actually happened]
**Files Affected**: [List of files]
**Severity**: [Critical/High/Medium/Low]
**Fix Required**: [Description of fix]
```

---

## 📝 Post-Testing Actions

After testing is complete:

### If All Tests Pass ✅
1. [ ] Document test results in this file
2. [ ] Create changelog entry
3. [ ] Update version in README files
4. [ ] Notify team of completion
5. [ ] Archive this checklist

### If Issues Found ❌
1. [ ] Document all issues using template above
2. [ ] Prioritize issues by severity
3. [ ] Create fix plan
4. [ ] Execute fixes
5. [ ] Re-test affected areas
6. [ ] Update documentation if needed

---

## 🎯 Success Criteria

The integration is considered fully successful when:
- [ ] All 10 tests pass without issues
- [ ] Generated code follows ALL platform standards
- [ ] Naming conventions applied consistently
- [ ] Shared infrastructure referenced correctly
- [ ] Environment variables configured properly
- [ ] Agents provide specialized, accurate guidance
- [ ] No hardcoded credentials or URLs
- [ ] Cross-file consistency maintained

---

## 📞 Support

If you encounter issues during testing:
1. Review `COPILOT-INTEGRATION-COMPLETE.md` for technical details
2. Check `shtrial-demo-standards.md` for platform standards
3. Review agent/instruction README files for context
4. Document issues using the template above

---

**Status**: Ready for Testing  
**Next Step**: Execute Test 1 (Copilot Parser Recognition)  
**Estimated Testing Time**: 2-3 hours for complete suite
