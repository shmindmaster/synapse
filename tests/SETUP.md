# Test Setup Guide

Quick guide to get the E2E test suite running.

## Prerequisites

1. **Node.js 20+** installed
2. **Azure OpenAI credentials** configured
3. **Playwright browsers** installed

## Step 1: Install Dependencies

```bash
npm install
```

## Step 2: Install Playwright Browsers

```bash
npx playwright install chromium
```

This installs the Chromium browser needed for tests. You can also install all browsers:

```bash
npx playwright install
```

## Step 3: Configure Azure OpenAI

Create a `.env` file in the project root (copy from `.env.example`):

```bash
cp .env.example .env
```

Edit `.env` and add your Azure OpenAI credentials:

```env
AZURE_OPENAI_ENDPOINT=https://your-resource.openai.azure.com/
AZURE_OPENAI_KEY=your-api-key-here
AZURE_OPENAI_CHAT_DEPLOYMENT=gpt-4o
AZURE_OPENAI_EMBED_DEPLOYMENT=text-embedding-3-small
AZURE_OPENAI_CHAT_API_VERSION=2024-02-15-preview
```

**Note:** Tests require valid Azure OpenAI credentials. Without them, tests will fail at startup.

## Step 4: Verify Setup

Run a quick smoke test:

```bash
npm run test:service-health -- --grep "SVC-01"
```

This should:
- Start the server automatically
- Start the frontend automatically
- Run the base server health check
- Complete in ~10-15 seconds

If this passes, you're ready to run the full test suite!

## Step 5: Run Tests

### Run All Tests

```bash
npm test
```

**Expected Duration:** 15-30 minutes (depends on AI API response times)

### Run Individual Suites

Start with the fastest, non-AI tests:

```bash
# Suite A: Core UX (fastest, ~2 minutes)
npm run test:suite-a

# Suite B: Workflow (~5 minutes)
npm run test:suite-b

# Suite C: Neural Core (~10 minutes, requires AI)
npm run test:suite-c

# Suite D: AI Features (~15 minutes, requires AI)
npm run test:suite-d

# Suite E: UI/UX (~3 minutes)
npm run test:suite-e
```

### Run with UI (Recommended for First Run)

```bash
npm run test:ui
```

This opens Playwright's UI mode where you can:
- See tests running in real-time
- Watch the browser interactions
- Debug failures easily
- Re-run individual tests

### Run in Headed Mode

```bash
npm run test:headed
```

Runs tests with visible browser windows (useful for debugging).

## Test Execution Order

For best results, run tests in this order:

1. **Service Health** - Validates backend is working
2. **Suite A** - Fast, no AI required
3. **Suite B** - Workflow tests
4. **Suite E** - UI/UX tests (can run in parallel)
5. **Suite C** - Requires AI indexing
6. **Suite D** - Requires AI analysis/chat

## What Gets Tested

### Service Health
- Server starts correctly
- AI endpoints are accessible
- Index persistence works

### Suite A: Core UX
- Welcome wizard flow
- Dark mode toggle
- Directory management
- Configuration persistence

### Suite B: Workflow
- Keyword rule creation
- File move/copy operations
- Error handling
- Toast notifications

### Suite C: Neural Core
- Index creation with progress tracking
- Semantic search (high relevance)
- Semantic search (conceptual match)
- Error handling

### Suite D: AI Features
- AI analysis (summarization, tags, sensitivity)
- RAG chat with context recall
- Out-of-context handling
- Conversation history

### Suite E: UI/UX
- Mobile responsiveness
- Grid breakpoints
- Dark mode consistency
- Visual polish

## Troubleshooting

If tests fail, see [TROUBLESHOOTING.md](./TROUBLESHOOTING.md) for common issues and solutions.

Common first-time issues:
- **Missing Azure credentials** → Check `.env` file
- **Port already in use** → Stop other server instances
- **Tests timeout** → Check Azure OpenAI service status
- **Element not found** → Run in UI mode to see what's happening

## Next Steps

Once tests are passing:
- Set up CI/CD (see `.github/workflows/test.yml`)
- Review test reports: `npx playwright show-report`
- Add more test cases as features are added

