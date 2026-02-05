# GitHub Repository Metadata Reference

## Quick Reference: What You Should Update

### 1. Repository Description
**Current (likely)**: Generic or empty
**Should be**: 
```
Privacy-first RAG platform - Transform any document collection into an intelligent, queryable system running entirely on your infrastructure
```

### 2. Homepage URL
**Should be**: `https://github.com/shmindmaster/synapse` or your documentation site

### 3. Topics/Tags (for discoverability)
Add these topics to improve GitHub search ranking:

**Core Technology:**
- `rag`
- `retrieval-augmented-generation`
- `vector-database`
- `pgvector`
- `semantic-search`
- `embeddings`

**Value Propositions:**
- `privacy-first`
- `local-first`
- `knowledge-base`
- `document-search`

**Tech Stack:**
- `typescript`
- `react`
- `fastify`
- `postgresql`
- `prisma`

**AI/ML:**
- `ai`
- `llm`
- `openai`
- `anthropic`
- `machine-learning`

**Use Cases:**
- `developer-tools`
- `code-search`
- `documentation`

### 4. Repository Settings to Enable

**Features:**
- ✅ Issues
- ✅ Discussions (for community)
- ✅ Projects (for roadmap)
- ✅ Wiki (optional)
- ❌ Sponsorships (add later if desired)

**Merge Settings:**
- ✅ Auto-delete head branches

**Security:**
- ✅ Dependabot alerts
- ✅ Dependabot security updates
- ✅ Secret scanning (if available)
- ✅ Code scanning (GitHub Advanced Security)

**Branch Protection (for `main`):**
- Require pull request reviews before merging
- Require status checks to pass (after CI/CD is set up)
- Require conversation resolution before merging

### 5. Social Preview Image
Create a 1280x640px image with:
- Synapse logo/name
- Tagline: "Privacy-First RAG Platform"
- Key tech: PostgreSQL, TypeScript, React
- Upload in Settings > General > Social Preview

### 6. About Section (appears on right sidebar)
Should show:
- ⭐ Topics (from list above)
- 🌐 Website/Homepage link
- 📖 README badge showing license (MIT)
- 📊 Languages (TypeScript should be primary)

## Manual Update Steps (if script doesn't work)

### Via GitHub Web Interface:

1. **Go to repository Settings**
   - https://github.com/shmindmaster/synapse/settings

2. **Update Description & Homepage**
   - Under "General" section
   - Paste description from above
   - Add homepage URL

3. **Add Topics**
   - Click gear icon next to "About"
   - Add topics from list above (max 20)

4. **Enable Features**
   - Scroll to "Features" section
   - Check: Issues, Discussions, Projects, Wiki

5. **Security**
   - Go to Settings > Security > Code security and analysis
   - Enable all Dependabot features

6. **Branches**
   - Go to Settings > Branches
   - Add branch protection rule for `main`

### Via GitHub CLI (if authenticated correctly):

```powershell
# Switch to correct account
gh auth switch -u shmindmaster

# Run the update script
.\update-repo-metadata.ps1
```

### Via Manual gh commands:

```powershell
# Update description
gh repo edit shmindmaster/synapse --description "Privacy-first RAG platform - Transform any document collection into an intelligent, queryable system running entirely on your infrastructure"

# Add topics (run each separately)
gh repo edit shmindmaster/synapse --add-topic rag
gh repo edit shmindmaster/synapse --add-topic retrieval-augmented-generation
gh repo edit shmindmaster/synapse --add-topic vector-database
# ... etc for each topic

# Enable features
gh repo edit shmindmaster/synapse --enable-issues --enable-discussions --enable-projects
```

## Verification Checklist

After updating, verify at https://github.com/shmindmaster/synapse:

- [ ] Description appears below repository name
- [ ] Topics/tags appear in About section
- [ ] Homepage link appears in About section
- [ ] Issues tab is accessible
- [ ] Discussions tab is accessible
- [ ] Social preview image shows correctly (when sharing link)
- [ ] Repository appears in search for relevant topics
- [ ] Security tab shows enabled features

## Impact on Discoverability

With proper metadata, your repository will:
- ✅ Rank in GitHub search for "RAG", "vector database", "semantic search", etc.
- ✅ Appear in topic pages (e.g., https://github.com/topics/rag)
- ✅ Show up in GitHub Explore for relevant categories
- ✅ Get indexed properly by external search engines
- ✅ Display nicely when shared on social media
- ✅ Be found by developers searching for solutions

## Additional Recommendations

1. **Create a Release**
   - Tag v2.0.0 from your latest commit
   - Include CHANGELOG.md content
   - Attach any build artifacts

2. **Add GitHub Topics Badge to README**
   ```markdown
   ![Topics](https://img.shields.io/github/topics/shmindmaster/synapse)
   ```

3. **Enable GitHub Discussions Categories**
   - Announcements
   - General
   - Ideas
   - Q&A
   - Show and tell

4. **Pin Important Issues**
   - Roadmap issue
   - Contributing guide
   - First-timer friendly issues
