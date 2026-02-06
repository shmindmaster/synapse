Team,

**Quick Intro:** Synapse is an AI-powered knowledge base for your codebase, docs, and systems. Ask natural language questions—"Show me authentication handlers," "How does the payment flow work?," "Find all data handling code"—and get instant answers with source references. Runs completely offline on your infrastructure (no cloud APIs required).

I've just published our first public-grade open source project: 
🔗 **[Synapse on GitHub](https://github.com/shmindmaster/synapse)**

This is launching publicly next week, so **your feedback this week is critical**—we want to catch friction, bugs, and doc gaps *before* external users hit them.

---

## ✅ What I Need From You

**Run the Quickstart early next week** (Option A: Local recommended) and give me real-world feedback as a user would experience it.

**🎯 Your Job:** Send me (not GitHub) any issues you find + general impressions. I'll fix them internally before launch.

### What to Test
- **Setup friction**: Did quick-start work? Did any step confuse you?
- **Core workflow**: Index a repo → Ask a question → See results w/ citations
- **Edge cases**: Try searching for ambiguous terms, cross-file patterns, documentation queries
- **Performance**: How long does indexing take? Search latency acceptable?

### What to Report (Send Directly to Me)
1. **Bugs** (anything broken/erroring)
2. **Documentation gaps** (where you got stuck)
3. **UX friction** (confusing flow, unclear buttons, weird behavior)
4. **Missing features** (nice-to-haves you noticed)

**Include:**
- Your OS + environment (Windows/Mac, Node version, Docker yes/no)
- Exact steps you took before hitting the issue
- Expected vs. actual behavior
- Screenshots or logs if applicable

### What I'm Measuring
- ⏱️ Time from clone → first successful search (target: <5 min for Option A)
- 🎯 **Top 2–3 friction points** — what slowed you down?
- ✨ **Top 2–3 wins** — what worked really well?
- 🐛 Any bugs that block the happy path

### Timeline
**Target feedback window:** By *end of next week* (Feb 12)  
**Why:** Public launch is Feb 14. We need 3–4 days to fix issues you find.

---

## Known Limitations (Set Expectations)

So you're not surprised:
- **Bare minimum UI** — functional but basic (intentional, we're refining based on feedback)
- **Search quality depends on codebase size** — larger/diverse codebases = better results
- **No real-time indexing** — requires manual re-index after big code changes (auto-watch coming in v0.2)
- **Works best with English code/docs** — non-English patterns less tested
- **Embedding model is local** — slower than cloud but 100% private

---

## How This Helps Me

1. **Catch showstoppers before launch** — real user friction, not my blind spots
2. **Fix docs where they fail** — you'll show me where setup instructions unclear
3. **Validate the core value prop** — does "talk to your codebase" actually *work* for real devs?
4. **Build proof of quality** — confident OSS launch = good brand signal

---

## Quick Start Commands

`bash
# Option A: Local/Offline (Recommended)
git clone https://github.com/shmindmaster/synapse.git
cd synapse
cp .env.example .env          # Already set to run offline
./quick-start.sh              # Windows: .\quick-start.bat

# Opens http://localhost:3000
# Login: demo@synapse.local / DemoPassword123!

# Then index a small repo to test
# Try asking: "Show me all error handlers"
`

---

**Questions? Direct Slack/email—don't open issues yet.**

Thanks for being our first real users. 🙏
