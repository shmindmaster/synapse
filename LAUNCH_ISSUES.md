# 🚀 Synapse Launch Backlog (Dogfood Week)

Copy/paste these titles and descriptions into GitHub Issues to create your "contribution engine" for the dev team.

## 🐛 Bugs & Glitches

1. **Title**: Local Quickstart fails if Docker daemon is not running
   - **Body**: The `docker compose up` command assumes Docker is running. Add a pre-check or clearer error message in the `quick-start.sh` script.
2. **Title**: Search results formatting breaks on narrow viewports
   - **Body**: Code snippets in search results overflow on mobile/narrow screens. Need horizontal scroll or wrap.
3. **Title**: File indexer hangs on empty directories
   - **Body**: Indexer seems to stall if a selected subdirectory is empty. Should skip and warn.
4. **Title**: "Back to Top" button missing on long documentation pages
   - **Body**: Long documents need a sticky "Back to Top" button for better navigation.
5. **Title**: API returns 500 when `OPENAI_API_KEY` is invalid format
   - **Body**: Should return 401/400 with a helpful message instead of crashing with 500.

## 📚 Documentation

6. **Title**: Add "Troubleshooting" section to README
   - **Body**: Document common errors (e.g. port 5432 in use, memory limits).
7. **Title**: Create "How to Contribute" detailed guide
   - **Body**: Expand `CONTRIBUTING.md` with a step-by-step "First PR" walkthrough.
8. **Title**: Document VS Code Extension configuration
   - **Body**: Add screenshots of the VS Code extension settings panel to the docs.
9. **Title**: Add "Ollama Setup" specific guide
   - **Body**: Write a dedicated doc for connecting Synapse to Ollama (ports, models).
10. **Title**: Create video/GIF for "Indexing Process"
    - **Body**: Record a 10s clip showing the indexing CLI in action for the docs.

## ⚡ Enhancements

11. **Title**: Feature: Add `--verbose` flag to CLI
    - **Body**: CLI is too quiet. Add verbose logging for debugging.
12. **Title**: UI: Add "Copy Code" button to chat code blocks
    - **Body**: Chat responses often have code. Need a 1-click copy button.
13. **Title**: Perf: Cache recent search queries
    - **Body**: Implement simple in-memory cache for identical queries within 1 minute.
14. **Title**: Docker: Add healthcheck to Backend container
    - **Body**: Ensure container restarts if API becomes unresponsive.
15. **Title**: CLI: Add ASCII art banner on startup
    - **Body**: Make the CLI startup look cooler with a Synapse ASCII logo.

## 🧪 Testing

16. **Title**: Add E2E test for "Zero Results" state
    - **Body**: Ensure UI handles empty search results gracefully (no "undefined" errors).
17. **Title**: Unit tests for `aiService` error handling
    - **Body**: logical test cases for 429 (rate limit) and 503 (service down).
18. **Title**: Verify Docker build on Windows (Home/Pro)
    - **Body**: Validate `docker-compose.yml` compatibility with Windows filesystem mounting.
19. **Title**: Test "Offline Mode" with disconnected internet
    - **Body**: rigorous manual test: unplug ethernet, run local stack, verify functionality.
20. **Title**: Add GitHub Action for Link Checking
    - **Body**: Automate checking for broken links in `docs/`.

## 🎨 UX / Polish

21. **Title**: Update Favicon to match logo
    - **Body**: Validated favicon is default Vite logo. Switch to Synapse logo.
22. **Title**: Dark Mode contrast adjustment
    - **Body**: The sidebar gray is too close to the background color. increase contrast.
23. **Title**: Add loading skeleton for Search Results
    - **Body**: Show a shimmer effect while waiting for vector search results.
24. **Title**: "Clear Chat" confirmation modal
    - **Body**: Prevent accidental deletion of chat history.
25. **Title**: Add tooltip to "Similarity Score"
    - **Body**: Explain what the percentage match means in the search UI.
