# Test Troubleshooting Guide

Common issues and solutions when running Synapse E2E tests.

## Prerequisites Not Met

### Azure OpenAI Credentials Missing

**Error:**
```
OpenAIError: Missing credentials. Please pass one of `apiKey` and `azureADTokenProvider`, or set the `AZURE_OPENAI_API_KEY` environment variable.
ERROR: Azure OpenAI credentials not configured
```

**Solution:**
1. Copy the example environment file:
   ```bash
   cp .env.example .env
   ```
2. Edit `.env` and add your Azure OpenAI credentials:
   ```env
   AZURE_OPENAI_ENDPOINT=https://your-resource.openai.azure.com/
   AZURE_OPENAI_KEY=your-api-key
   AZURE_OPENAI_CHAT_DEPLOYMENT=gpt-4o
   AZURE_OPENAI_EMBED_DEPLOYMENT=text-embedding-3-small
   AZURE_OPENAI_CHAT_API_VERSION=2024-02-15-preview
   ```
3. Verify the file is in the project root (same directory as `package.json`)
4. Restart the test run

### Port Already in Use

**Error:**
```
Error: listen EADDRINUSE: address already in use :::3001
```

**Solution:**
1. Stop any running instances of the server:
   ```bash
   # Find and kill process on port 3001
   npx kill-port 3001
   # Or on Windows:
   netstat -ano | findstr :3001
   taskkill /PID <PID> /F
   ```
2. Or change the test port in `playwright.config.ts`

## Test Failures

### Tests Timeout

**Symptom:** Tests fail with timeout errors, especially Suite C and D.

**Causes:**
- Azure OpenAI API is slow or rate-limited
- Network connectivity issues
- AI operations taking longer than expected

**Solutions:**
1. Increase timeout in `playwright.config.ts`:
   ```typescript
   timeout: 120 * 1000, // 120 seconds
   ```
2. Check Azure OpenAI service status
3. Verify API quota/rate limits

### Element Not Found

**Symptom:** Tests fail with "Element not found" errors.

**Causes:**
- UI changed and selectors are outdated
- Component rendered differently
- Timing issues (element not loaded yet)

**Solutions:**
1. Run tests in headed mode to see what's happening:
   ```bash
   npm run test:headed
   ```
2. Use Playwright UI mode for debugging:
   ```bash
   npm run test:ui
   ```
3. Check if selectors need updating in `tests/utils/test-helpers.ts`

### localStorage Not Clearing

**Symptom:** Tests fail because previous test state persists.

**Solution:**
- The `clearLocalStorage` fixture should handle this automatically
- If issues persist, check `tests/fixtures.ts` and ensure `beforeEach` hooks are running

### Mock Files Not Found

**Symptom:** Tests fail with "ENOENT" errors for mock files.

**Causes:**
- Temporary directory cleanup happened too early
- File system permissions issue

**Solutions:**
1. Check `tests/fixtures.ts` - ensure `mockFilesDir` fixture is working
2. Verify file system permissions
3. Check if antivirus is blocking temp directory creation

## AI-Specific Issues

### Index Creation Fails

**Symptom:** Suite C tests fail during indexing.

**Causes:**
- Azure OpenAI embedding API issues
- File text extraction failing (textract)
- Invalid file paths

**Solutions:**
1. Verify Azure OpenAI embedding deployment is correct
2. Check that mock files are valid text files
3. Ensure `textract` package is installed correctly

### Semantic Search Returns No Results

**Symptom:** Search queries return empty results.

**Causes:**
- Index not created properly
- Query doesn't match content
- Embedding similarity threshold too high

**Solutions:**
1. Verify index was created (check SVC-04 test)
2. Try different query terms
3. Check server logs for embedding errors

### AI Analysis Takes Too Long

**Symptom:** Suite D tests timeout during analysis.

**Causes:**
- Azure OpenAI API latency
- Large file content
- Rate limiting

**Solutions:**
1. Increase test timeout
2. Check Azure OpenAI service status
3. Verify API quota isn't exceeded

## Environment Issues

### Windows-Specific Issues

**Path Separators:**
- Tests use forward slashes (`/`) which work on Windows
- If issues occur, check path handling in `tests/fixtures.ts`

**Line Endings:**
- Mock files use UTF-8 encoding
- Ensure Git doesn't change line endings

### CI/CD Failures

**GitHub Actions:**
- Ensure secrets are configured in repository settings
- Check that `AZURE_OPENAI_*` secrets are set
- Verify Node.js version matches (20.x)

**Local vs CI Differences:**
- Tests run in parallel locally but serial in CI
- Timeouts may need adjustment for CI environment
- Check `playwright.config.ts` for CI-specific settings

## Debugging Tips

### Run Single Test

```bash
# Run specific test by name
npx playwright test --grep "A-01"

# Run specific file
npm run test:suite-a
```

### Debug Mode

```bash
# Open Playwright Inspector
npm run test:debug

# Or with UI
npm run test:ui
```

### View Test Reports

```bash
# After test run
npx playwright show-report
```

### Check Server Logs

When tests run, server output is piped. To see it:
1. Run tests in headed mode
2. Check `test-results/` directory for logs
3. Or modify `playwright.config.ts` to not pipe stdout/stderr

## Performance Optimization

### Run Tests in Parallel

Tests run in parallel by default locally. To control:
- Set `workers` in `playwright.config.ts`
- Use `--workers=1` for serial execution

### Skip Slow Tests

```bash
# Skip AI tests (Suite C and D)
npx playwright test --grep-invert "Suite [CD]"

# Run only fast tests
npx playwright test --grep "Suite [ABE]"
```

## Getting Help

If issues persist:
1. Check Playwright documentation: https://playwright.dev
2. Review test logs in `test-results/`
3. Check Azure OpenAI service status
4. Verify all dependencies are installed: `npm install`

