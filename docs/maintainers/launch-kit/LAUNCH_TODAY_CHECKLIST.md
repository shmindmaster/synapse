# TODAY Launch Checklist (Solo Founder)

**Goal:** Go live TODAY with GitHub and social media
**Time:** 2-3 hours
**Start:** Now

---

## ✅ PRE-LAUNCH (Do First - 30 mins)

- [ ] Read `LAUNCH_TODAY.md` once (5 mins)
- [ ] Read `LAUNCH_COMMANDS.md` once (5 mins)
- [ ] Ensure GitHub repo is PUBLIC
- [ ] Open terminal in synapse directory
- [ ] Have Twitter/HN account open in browser tab

---

## 🔧 CODE QUALITY (30 mins)

```bash
# Run these commands exactly:
pnpm lint
pnpm format
pnpm build
```

**If lint fails:** Run `pnpm format` to auto-fix.
**If build fails:** Fix error and try again.
**When all pass:** ✅ Proceed to next step

---

## 📊 GITHUB CHECK (5 mins)

Go to https://github.com/shmindmaster/synapse

**Verify:**

- [ ] Repo is PUBLIC (top of page)
- [ ] Has description: "Enterprise code search at scale..."
- [ ] Has 5+ topics (rag, code-search, semantic-search, ai, privacy-first)
- [ ] All files visible (README.md, LICENSE, etc.)

---

## 🚀 GIT PUSH (5 mins)

```bash
git status
git add -A
git commit -m "launch: production-ready v2.0"
git push origin main
```

**Verify on GitHub:**

- Go to https://github.com/shmindmaster/synapse/actions
- Wait for Tests and Lint workflows to complete (< 3 mins)
- **All should be GREEN ✅**

If red, check error and fix:

```bash
pnpm lint  # Fix locally
git add -A
git commit -m "fix: lint errors"
git push origin main
```

---

## 🌐 DEPLOY LIVE DEMO (Optional but Recommended - 10 mins)

**Get a working demo live at synapse.shtrial.com while code builds**

Quick paths (pick ONE):

**A) Vercel (Easiest - Recommended)**

```bash
# 1. Go to https://vercel.com/dashboard
# 2. Click "Add New" → "Project"
# 3. Import GitHub repo: shmindmaster/synapse
# 4. Root directory: apps/frontend
# 5. Click "Deploy"
# 6. After deploy, go to project settings → Domains → add synapse.shtrial.com
# 7. Update DNS in your registrar (where you own shtrial.com)
# Done! Auto-deploys on every push to main.
```

**B) Railway (If you have database needs)**

```bash
# 1. Go to https://railway.app
# 2. New Project → Import GitHub repo
# 3. Add environment variables (OPENAI_API_KEY, DATABASE_URL)
# 4. Railway assigns a URL immediately
# 5. Custom domain: Railway settings → add synapse.shtrial.com
```

**Don't have domain?**

- Vercel gives free domain: synapse-xxxxx.vercel.app
- Just use that and update README

- [ ] Choose hosting provider (Vercel / Railway / GitHub Pages)
- [ ] Deploy frontend (5 mins)
- [ ] (Optional) Deploy backend API (5 mins)
- [ ] Update README with live demo link

**Later:** Add API docs auto-generated at /api/docs (see DEPLOY_LIVE_DEMO.md)

---

## 📢 TWITTER LAUNCH (10 mins)

**Go to:** twitter.com/compose

**PostTweet #1** (copy from LAUNCH_COMMANDS.md Tweet 1):

```
🧠 Introducing Synapse: Enterprise code search that scales.

404k+ files? Unsearchable. Copilot times out. LangChain bloats.

We built Synapse to fix this. Solo founder, 3 months.

✅ Try the live demo: synapse.shtrial.com
✅ Open source. MIT licensed.

https://github.com/shmindmaster/synapse

#DevTools #AI #OpenSource
```

**After posting:**

- [ ] Retweet/like your own tweet
- [ ] Share in Discord/Slack communities you're in
- [ ] Note the link - you'll reuse it

---

## 📰 HACKER NEWS LAUNCH (5 mins)

**Go to:** https://news.ycombinator.com/submit

**Fill in:**

- Title: `Synapse – Enterprise Code Search at Scale`
- URL: `https://github.com/shmindmaster/synapse`
- Text: (copy from LAUNCH_COMMANDS.md)

**After posting:**

- [ ] Copy the link they give you
- [ ] Post it in your Twitter mentions (@dang is the mod)
- [ ] Come back in 1 hour to respond to comments

---

## 📱 REDDIT LAUNCH (10 mins)

**Post in r/coding first:**

Go to https://www.reddit.com/r/coding/submit

- Title: `I spent 3 months building Synapse – Enterprise Code Search at Scale`
- Content type: Post
- Text: (copy from LAUNCH_COMMANDS.md)
- Post

**Repeat in:**

- r/MachineLearning
- r/devtools
- r/OpenSource

(Wait 15 mins between each to avoid spam detection)

---

## 👀 MONITOR (Next 2 hours)

**Open these tabs and check every 15 mins:**

1. GitHub repo: https://github.com/shmindmaster/synapse
   - Watch stars counter
   - Check new issues/discussions

2. HN: https://news.ycombinator.com/newest
   - Search for your post
   - Note upvotes and comments

3. Twitter: https://twitter.com/search?q=synapse
   - See if people are tweeting about it
   - Respond to anyone mentioning it

4. GitHub Notifications: https://github.com/notifications
   - Someone will probably open an issue
   - **Respond within 30 mins** (shows you're responsive)

---

## 💬 RESPOND (Hours 2-8)

**When people comment/issue:**

- ✅ Respond within 30 mins
- ✅ Be friendly and helpful
- ✅ Answer technical questions
- ✅ If someone says "How do I deploy to X?" → Link to docs
- ✅ If someone finds a bug → Thank them, add to issue

**Example response:**

```
Thanks for trying Synapse! That's a great question.

For deploying to Railway, check out the guide here: [link]

Let me know if you hit any issues. Happy to help!
```

---

## 🎯 WIN CONDITION (First 24 hours)

**You WIN if you hit:**

- [ ] GitHub Actions all green ✅
- [ ] 50+ GitHub stars
- [ ] 3+ quality comments/issues
- [ ] 1+ HN upvote
- [ ] Responded to all comments within 30 mins

---

## 🎉 IF YOU HIT THESE TODAY

Tomorrow:

1. Write 1 blog post: "Why code search fails at scale"
2. Talk to 3 people interested (DMs/comments who asked questions)
3. Plan next week: Phase 1 work (observability, hybrid search)

You've launched. You've got momentum. Capitalize on it.

---

## ⏰ TIME ESTIMATE

| Task                         | Time                                      |
| ---------------------------- | ----------------------------------------- |
| Code quality check           | 15 mins                                   |
| Git push + verify            | 5 mins                                    |
| Twitter post                 | 5 mins                                    |
| HN submission                | 5 mins                                    |
| Reddit posts (3x)            | 15 mins                                   |
| Initial monitoring           | 30 mins                                   |
| Q&A responses (next 6 hours) | 30 mins                                   |
| **TOTAL**                    | **~2 hours active, + 6 hours monitoring** |

---

## Emergency Fixes

**GitHub Actions failing?**

```
Go to Actions tab → Click "Re-run jobs" → Should pass
```

**Forgot to make repo PUBLIC?**

```
Settings → Change visibility → PUBLIC → Save
```

**Typo in README?**

```
Fix it locally → git add . → git commit -m "typo" → git push
```

**Big bug found after launch?**
Choose:
A) Fix and push immediately (if small)
B) Create issue "Known issue: X" (if big, needs refactor)

---

## When You're Live

You'll see:

- Stars rolling in (1-2 per minute initially)
- Issues asking how to use it
- Some "looks cool" comments
- Maybe 1-2 technical questions

**Keep this perspective:** You shipped day 1. That's a win. Everything else is bonus.

---

**Start NOW. 30 mins to launch. You've got this.** 🚀
