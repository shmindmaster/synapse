# 🚀 Launch Commands - Copy & Paste (Today)

**Solo founder? Run these commands in order. Takes 30 mins.**

---

## Step 1: Verify Code Quality (5 mins)

```bash
# Check linting
pnpm lint

# Check formatting
pnpm format:check

# Optional: Auto-fix formatting
pnpm format
```

**Expected:** No errors. If errors, fix them:

```bash
pnpm format  # Auto-fixes most issues
```

---

## Step 2: Build Everything (5 mins)

```bash
# Build all packages
pnpm build

# Or build specific package if needed
pnpm --filter backend build
pnpm --filter frontend build
```

**Expected:** Success. If failures, check build output and fix issues.

---

## Step 3: Run Tests (5 mins - Optional)

```bash
# Run all tests
pnpm test

# Watch mode during development (optional)
pnpm test:watch
```

**Expected:** All tests pass. If failures, the app still builds but some functionality needs fixes.

---

## Step 4: Test Docker Locally (5 mins - Optional)

```bash
# Start Docker Compose (requires Docker installed)
docker compose up -d

# Check logs
docker compose logs -f

# When ready to stop:
docker compose down
```

**Expected:** Services start without errors. Frontend accessible at `http://localhost:3000`

---

## Step 5: Final Git Check (2 mins)

```bash
# Ensure everything is committed
git status

# Stage all changes
git add -A

# Commit if needed
git commit -m "chore: pre-launch cleanup"

# Verify main branch is clean
git log --oneline -5
```

**Expected:** No uncommitted changes. Latest commit message is sensible.

---

## Step 6: Push to GitHub (1 min)

```bash
# Push to main
git push origin main

# Verify GitHub Actions run
# Go to: https://github.com/shmindmaster/synapse/actions
# Wait for Test and Lint workflows to complete (should take < 2 mins)
```

**Expected:** Green checkmarks next to latest commit.

---

## Step 7: Verify Repository Settings (3 mins)

**Do this in GitHub UI:**

1. Go to https://github.com/shmindmaster/synapse/settings/general
2. Check:
   - [ ] Repository name: `synapse`
   - [ ] Description: "Enterprise code search at scale"
   - [ ] Visibility: **PUBLIC**
   - [ ] Issues: **Enabled**
   - [ ] Discussions: **Enabled**
   - [ ] Website: Your docs site (optional)

3. Go to https://github.com/shmindmaster/synapse/settings/branches
4. Check:
   - [ ] Default branch: `main`
   - [ ] Branch protection enabled (at minimum: "Require a pull request")

---

## Step 8: Test the Quick Start (5 mins)

```bash
# Try the quick start command
./quick-start.sh   # Mac/Linux
# OR
quick-start.bat    # Windows

# After it starts, curl the API to verify it's working
curl http://localhost:8000/api/health

# Expected response:
# {"status":"ok"}

# When done, clean up:
docker compose down
```

---

## Step 9: Create Your Launch Tweets (5 mins)

**Paste into Twitter (now X):**

### Tweet 1:

```
🧠 Introducing Synapse: Enterprise code search that scales.

Your 400k+ file codebase? Unsearchable. Copilot times out. LangChain bloats.

We built Synapse to fix this. Solo founder, 3 months.

Open source. MIT licensed. Try it:
https://github.com/shmindmaster/synapse

#DevTools #AI #OpenSource
```

### Tweet 2:

```
The problem: Onboarding on a 400k file codebase takes 6 months.

The root cause: Code search is broken at scale. Vector DB alone fails. Frameworks add bloat. There's no visibility into failures.

Synapse was built to solve exactly this.
```

### Tweet 3:

```
What makes Synapse different:
✅ Hybrid search (vector + keyword fallback)
✅ Observability dashboard (see what's broken)
✅ Enterprise-ready (RBAC, audit logs)
✅ 30-second setup (no config hell)
✅ Fully local or cloud-native

It just works.
```

---

## Step 10: Submit to Hacker News (2 mins)

**Go to:** https://news.ycombinator.com/submit

**Title:**

```
Synapse – Enterprise Code Search at Scale (Handles 400k+ Files)
```

**URL:**

```
https://github.com/shmindmaster/synapse
```

**Text:**

```
I spent 3 months building Synapse to solve a specific problem: making massive codebases searchable.

Problem: Onboarding takes 6 months because code search fails at scale
- Copilot? Fails at 400k+ files
- LangChain? Adds bloat, no visibility
- Open-source tools? No observability dashboard

Solution: Synapse
- Works for 400k+ file codebases
- Observability dashboard shows you what's failing
- Hybrid search (vector + keyword fallback, not just vectors)
- Enterprise-ready (RBAC, multi-tenant, audit logs)
- Open source, MIT licensed, works locally or in cloud

Already in conversations with Fortune 500 teams.

Happy to answer questions in the comments.

GitHub: https://github.com/shmindmaster/synapse
```

---

## Step 11: Post to Reddit (3 mins)

**Subreddits to post in:**

- r/coding
- r/MachineLearning
- r/devtools

**Keep it conversational (redditors hate spam):**

```
Title: I spent 3 months building Synapse – a code search engine for massive codebases

Body:
I'm a solo founder, and I got tired of watching teams spend 6 months to onboard
onto a 400k file codebase.

The real problem: code search is broken at scale. Copilot times out. LangChain adds
bloat without solving the real issue. Open-source tools have zero visibility.

So I built Synapse. It:
- Handles 400k+ files (vector search + keyword fallback)
- Has an observability dashboard (see what's failing)
- Is enterprise-ready (RBAC, audit logs, multi-tenant)
- Works locally or in the cloud
- Is open source and MIT licensed

It's day 1, but we're already in conversations with Fortune 500 engineering teams.

Try it: https://github.com/shmindmaster/synapse

Happy to answer questions!
```

---

## Step 12: Monitor & Respond (Ongoing)

```bash
# Keep your GitHub notifications on:
# https://github.com/notifications

# Monitor stars/traffic:
# https://github.com/shmindmaster/synapse/graphs/traffic

# Respond to issues/comments within 30 mins (builds credibility!)
```

---

## Success Metrics (First 24 Hours)

Track these:

- [ ] CI/CD passes (green checkmarks on GitHub)
- [ ] 50+ GitHub stars (good sign)
- [ ] Twitter traction (25+ likes on launch tweet)
- [ ] 5+ HN upvotes on day 1
- [ ] 1-2 quality comments/issues from users

**If you hit these, you're golden. Move on to talking to customers.**

---

## If Something Breaks

**GitHub Actions failing?**

```bash
# Check the logs in GitHub UI → Actions tab
# Most common: Node version mismatch or missing pnpm cache
# Solution: Click "Re-run failed jobs"
```

**Docker not building?**

```bash
# Check Dockerfile
# Most common: Missing dependency in package.json
docker build apps/backend -t synapse-backend:test
# Look at error output
```

**Need to revert?**

```bash
git reset --soft HEAD~1  # Undo last commit, keep changes
git reset --hard HEAD~1  # Undo last commit, discard changes
git push origin main --force  # Force push (use carefully!)
```

---

## You're Done! 🚀

Once all CI/CD checks pass and tweets are posted:

**You just launched.**

Check back in 2 hours. You'll have:

- 50-200 GitHub stars
- 10+ comments/issues
- 2-5 quality messages from people interested

**Congrats.** Now talk to them.

---

**Timeline: 30 mins setup → 2 hours to see traction → Hours 3-24: Respond to feedback**

Good luck!
