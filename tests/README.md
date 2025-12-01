# Synapse E2E Test Suite

Comprehensive end-to-end test suite for Synapse AI-Native Knowledge OS using Playwright.

## Test Structure

### Test Suites

- **Service Health** (`service-health.spec.ts`): Backend prerequisite validation
- **Suite A** (`suite-a-core-ux.spec.ts`): Core UX & Configuration (7 tests)
- **Suite B** (`suite-b-workflow.spec.ts`): Workflow & Functional operations (6 tests)
- **Suite C** (`suite-c-neural-core.spec.ts`): Neural Core - Indexing & Search (5 tests)
- **Suite D** (`suite-d-ai-features.spec.ts`): High-Value AI Features (6 tests)
- **Suite E** (`suite-e-ui-ux.spec.ts`): Responsiveness & Accessibility (5 tests)

## Running Tests

### Prerequisites

1. Ensure Azure OpenAI credentials are configured in `.env`
2. Install dependencies: `npm install`
3. Install Playwright browsers: `npx playwright install chromium`

### Run All Tests

```bash
npm test
```

### Run Specific Suite

```bash
npm run test:service-health  # Service health checks
npm run test:suite-a        # Core UX tests
npm run test:suite-b        # Workflow tests
npm run test:suite-c        # Neural Core tests
npm run test:suite-d        # AI Features tests
npm run test:suite-e        # UI/UX tests
```

### Run with UI

```bash
npm run test:ui
```

### Run in Headed Mode

```bash
npm run test:headed
```

### Debug Tests

```bash
npm run test:debug
```

## Test Environment

Tests use real server instances and file system operations:

- **Server**: Automatically started on port 3001
- **Frontend**: Automatically started on port 5173
- **Test Data**: Temporary directories created per test run
- **Mock Files**: Created with known content for deterministic AI testing

## Test Fixtures

- `testDataDir`: Temporary directory for test data
- `mockFilesDir`: Directory containing mock test files (MF-1, MF-2, MF-3)
- `apiContext`: API request context for direct backend calls

## Mock Data

Test files created automatically:

- `Q3_Budget_Contract.txt`: Financial/contract content
- `Vacation_Policy.txt`: HR policy content
- `Legacy_Code_Snippet.txt`: Code with PII (triggers High sensitivity)

## Notes

- Tests require Azure OpenAI API access
- AI operations may take 5-10 seconds per request
- Test timeouts are set to 90 seconds to accommodate AI operations
- localStorage is cleared between tests for isolation

