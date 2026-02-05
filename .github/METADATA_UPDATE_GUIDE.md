# GitHub Repository Metadata Update Guide

Since the GitHub CLI requires authentication, here's how to update the repository metadata manually via the GitHub web interface.

## 📋 Recommended Metadata Updates

### 1. Repository Description

**Navigate to:** https://github.com/shmindmaster/synapse/settings

**Update "Description":**

```
AI-powered semantic search for code & docs. Chat with your codebase. 100% local/offline or cloud AI. No data leaves your infrastructure. Privacy-first RAG.
```

**Update "Website":**

```
https://github.com/shmindmaster/synapse#readme
```

(Or use: https://synapse.shtrial.com when deployment is stable)

---

### 2. Repository Topics (Tags)

**Navigate to:** https://github.com/shmindmaster/synapse

**Click "Add topics" and add these tags:**

```
ai
artificial-intelligence
code-search
semantic-search
rag
retrieval-augmented-generation
llm
local-llm
privacy-first
self-hosted
codebase-intelligence
developer-tools
fastify
react
postgresql
pgvector
typescript
docker
offline-first
knowledge-base
```

**Why these topics?**

- Increases GitHub discoverability
- Appears in related projects
- Helps users find via GitHub search
- Shows up in topic pages (e.g., github.com/topics/code-search)

---

### 3. Social Preview Image

**Navigate to:** https://github.com/shmindmaster/synapse/settings

**Scroll to "Social preview"**

**Recommended:** Create a simple social card (1280x640px) with:

- Synapse logo or icon
- "Talk to Your Codebase"
- "AI-Powered Semantic Search"
- Tech stack badges (React, Fastify, PostgreSQL, etc.)

**Tools to create social preview:**

- Canva (free): https://www.canva.com/
- Figma (free): https://www.figma.com/
- Or use a GitHub social card generator

---

### 4. About Section Enhancements

**Navigate to:** https://github.com/shmindmaster/synapse

**In the sidebar, click the gear icon (⚙️) next to "About"**

**Enable these checkboxes:**

- ☑️ Releases (shows latest release)
- ☑️ Packages (if publishing to npm/Docker Hub)
- ☑️ Deployments (if using GitHub Environments)

**Add Homepage URL:**

```
https://github.com/shmindmaster/synapse#readme
```

(Or your deployed demo URL once stable)

---

### 5. GitHub Features to Enable

**Navigate to:** https://github.com/shmindmaster/synapse/settings

**Features tab:**

- ☑️ **Issues** → Enabled (already enabled)
- ☑️ **Discussions** → Enable (for community Q&A)
- ☐ **Wiki** → Leave disabled (use docs/ instead)
- ☑️ **Projects** → Enable if tracking roadmap publicly
- ☑️ **Sponsorships** → Enable if accepting donations/sponsorships

**Recommended:** Enable Discussions for community engagement!

---

### 6. Release Configuration

**Navigate to:** https://github.com/shmindmaster/synapse/releases

**Published release:** v0.1.0 ✅

**For future releases:**

- Use semantic versioning (v0.2.0, v1.0.0, etc.)
- Always include changelog
- Add upgrade instructions
- Tag Docker images to match release

---

## 🤖 Alternative: Update via GitHub CLI (Once Authenticated)

If you complete the GitHub CLI authentication (https://github.com/login/device with code **E153-B99A**), you can run:

```powershell
# Update description and homepage
gh repo edit shmindmaster/synapse \
  --description "AI-powered semantic search for code & docs. Chat with your codebase. 100% local/offline or cloud AI. No data leaves your infrastructure. Privacy-first RAG." \
  --homepage "https://github.com/shmindmaster/synapse#readme"

# Add topics
gh repo edit shmindmaster/synapse \
  --add-topic ai \
  --add-topic artificial-intelligence \
  --add-topic code-search \
  --add-topic semantic-search \
  --add-topic rag \
  --add-topic retrieval-augmented-generation \
  --add-topic llm \
  --add-topic local-llm \
  --add-topic privacy-first \
  --add-topic self-hosted \
  --add-topic codebase-intelligence \
  --add-topic developer-tools \
  --add-topic fastify \
  --add-topic react \
  --add-topic postgresql \
  --add-topic pgvector \
  --add-topic typescript \
  --add-topic docker \
  --add-topic offline-first \
  --add-topic knowledge-base

# Enable Discussions
gh repo edit shmindmaster/synapse --enable-discussions

# Verify changes
gh repo view shmindmaster/synapse
```

---

## ✅ Verification Checklist

After making changes, verify:

- [ ] Description appears on main repo page
- [ ] Website link is clickable in About section
- [ ] Topics appear as blue tags below description
- [ ] Social preview shows when sharing on Twitter/LinkedIn
- [ ] Discussions tab is visible (if enabled)
- [ ] Latest release (v0.1.0) is pinned

---

## 📊 Impact of Good Metadata

**Improved Discoverability:**

- 🔍 **Search**: Appears in GitHub search for relevant keywords
- 🏷️ **Topics**: Shows up on topic pages (10K+ users browse daily)
- 🔗 **Related**: Appears in "Repositories also use these topics"
- 📱 **Social**: Better previews when shared on social media

**Increased Trust:**

- ✅ Professional description
- ✅ Clear homepage
- ✅ Proper categorization
- ✅ Active community (Discussions)
- ✅ Published releases

**Better Conversion:**

- Users understand what Synapse does **instantly**
- Clear call-to-action (homepage link)
- Professional appearance = higher trust
- Topics attract right audience

---

## 🎯 Priority Order

If short on time, do these in order:

1. **Description** (30 seconds) → Most impact
2. **Topics** (2 minutes) → Big discoverability boost
3. **Enable Discussions** (10 seconds) → Community engagement
4. **Social Preview** (30 minutes) → Professional appearance
5. **About section** (1 minute) → Polish

---

**Created:** February 5, 2026
**Status:** Manual update required (CLI auth pending)
**Location:** `.github/METADATA_UPDATE_GUIDE.md`
