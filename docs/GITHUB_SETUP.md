# 🚀 GitHub Project & Labels Setup Guide

This guide outlines how to set up GitHub project boards and labels for managing open-source contributions.

## 📋 Recommended Issue Labels

Use the GitHub CLI or web interface to create these labels:

### By Type
- `type: bug` - Bug reports
- `type: feature` - Feature requests
- `type: enhancement` - Improvements to existing features
- `type: documentation` - Documentation improvements
- `type: refactor` - Code refactoring without functionality changes
- `type: performance` - Performance improvements
- `type: test` - Test additions or improvements

### By Priority
- `priority: critical` - Production-blocking issues
- `priority: high` - Important, should be addressed soon
- `priority: medium` - Standard work
- `priority: low` - Nice to have, can be deferred

### By Status
- `status: needs triage` - Needs initial review
- `status: needs investigation` - Unclear what's needed
- `status: blocked` - Waiting on something (link blockers)
- `status: in progress` - Someone is working on this
- `status: ready for review` - PR ready for code review
- `status: on hold` - Paused/waiting for decision

### By Area
- `area: backend` - Backend API changes
- `area: frontend` - Frontend UI changes
- `area: database` - Database/schema changes
- `area: cli` - CLI tool changes
- `area: vscode-extension` - VS Code extension changes
- `area: mcp-server` - MCP server changes
- `area: docs` - Documentation changes
- `area: ci-cd` - GitHub Actions/build setup

### Community
- `good first issue` - Perfect for new contributors
- `help wanted` - Looking for community help
- `beginner friendly` - Doesn't require deep domain knowledge
- `discussion` - Discussion/decision needed

---

## 🏗️ Creating Labels (Using GitHub CLI)

```bash
# Good first issues
gh label create "good first issue" --color 7057FF --description "Perfect for new contributors"
gh label create "beginner friendly" --color 5DADE2 --description "Doesn't require deep domain knowledge"

# Type labels
gh label create "type: bug" --color EE5A6F --description "Bug reports"
gh label create "type: feature" --color A2EEEF --description "Feature requests"
gh label create "type: enhancement" --color 1D76DB --description "Improvements to existing features"
gh label create "type: documentation" --color 0075CA --description "Documentation improvements"

# Status labels
gh label create "status: needs triage" --color FBCA04 --description "Needs initial review"
gh label create "status: in progress" --color FFFFCC --description "Someone is working on this"
gh label create "status: ready for review" --color C2E0C6 --description "PR ready for code review"

# Priority labels
gh label create "priority: critical" --color B60205 --description "Production-blocking"
gh label create "priority: high" --color D93F0B --description "Important, address soon"
gh label create "priority: low" --color F9D0EB --description "Nice to have, can defer"

# Area labels
gh label create "area: backend" --color 008672 --description "Backend API changes"
gh label create "area: frontend" --color 5969D6 --description "Frontend UI changes"
gh label create "area: docs" --color 0366D6 --description "Documentation changes"

# Help wanted
gh label create "help wanted" --color 33AA3F --description "Looking for community help"
```

---

## 📊 GitHub Project Board Setup

### Option 1: Using GitHub Web UI (Recommended for First Setup)

1. **Go to your repository page**
2. **Click "Projects" tab** (near Pull Requests)
3. **Click "New project"**
4. **Choose template: "Table"**
5. **Name it: "Synapse Development"**

### Option 2: Using GitHub CLI

```bash
# Create a new project (requires project scope in auth)
gh project create --title "Synapse Development" --format table

# List projects
gh project list
```

---

## 📈 Recommended Project Board Structure

### Table Columns:
1. **Status** - Set up as a single-select with:
   - 📋 Backlog
   - 📍 Ready
   - 🚀 In Progress
   - 🔍 In Review
   - ✅ Done

2. **Priority** - Single-select:
   - 🔴 Critical
   - 🟠 High
   - 🟡 Medium
   - 🟢 Low

3. **Labels** - Multiple-select for:
   - Type (bug, feature, etc.)
   - Area (backend, frontend, etc.)

4. **Assignees** - For tracking who's working on it

5. **Milestone** - For releases (v2.1, v3.0, etc.)

---

## 🎯 Project View Configurations

### View 1: "Contributor Board"
- Filter: `label:good first issue` OR `label:help wanted`
- Sort by: Priority, then updated
- **Purpose:** Easy entry point for new contributors

### View 2: "This Sprint"  
- Filter: `status:in progress` OR `status:ready for review`
- **Purpose:** Current work items

### View 3: "Bug Triage"
- Filter: `type:bug` AND `status:needs triage`
- Sort by: Created (oldest first)
- **Purpose:** Managing incoming bug reports

### View 4: "Feature Pipeline"
- Filter: `type:feature` AND `priority:high`
- **Purpose:** Planning upcoming features

---

## 📝 GitHub Discussions Setup

To enable discussions for your community:

1. **Repository Settings** → **Enable Discussions**
2. **Create categories:**
   - **Announcements** (locked) - New releases, major updates
   - **General** - General discussion and questions
   - **Ideas** - Feature ideas and design discussions  
   - **Show & Tell** - Share your use cases and extensions
   - **Integrations** - Questions about integrations

---

## 🔄 Workflow Integration

### Automatically Add to Project

Create `.github/workflows/add-to-project.yml`:

```yaml
name: Add issues to project

on:
  issues:
    types: [opened]
  pull_request:
    types: [opened]

jobs:
  add-to-project:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/add-to-project@main
        with:
          project-url: https://github.com/shmindmaster/synapse/projects/1
          github-token: ${{ secrets.GITHUB_TOKEN }}
```

### Auto-label PRs

Create `.github/workflows/auto-label.yml`:

```yaml
name: Auto-label PRs

on:
  pull_request:
    types: [opened]

jobs:
  label:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/labeler@v4
        with:
          configuration-path: .github/labeler.yml
```

Create `.github/labeler.yml`:

```yaml
area: backend:
  - apps/backend/**

area: frontend:
  - apps/frontend/**

area: cli:
  - apps/cli/**

type: documentation:
  - docs/**
  - "*.md"

type: test:
  - "**/*.test.ts"
  - "**/*.spec.ts"
```

---

## 🏅 Contribution Recognition

### Release Notes

When merging PRs, tag contributors:
```markdown
- Fixed X bug (@username)
- Added Y feature thanks to @username
```

### Contributors Page

Add to repo description or docs:
```markdown
Made with ❤️ by [contributors](https://github.com/shmindmaster/synapse/graphs/contributors)
```

### CONTRIBUTORS.md File

Manually maintain or auto-generate:

```bash
# Generate contributors list
gh api repos/shmindmaster/synapse/contributors --paginate | \
  jq -r '.[] | "- [@\(.login)](\(.html_url))"' > CONTRIBUTORS.md
```

---

## 📊 Metrics to Track

Use GitHub Insights to monitor:

- **Open issues trend** - Growing/shrinking?
- **PR merge time** - How long for review?
- **Contributor growth** - New contributors?
- **Issue resolution time** - How quickly are issues fixed?
- **Most active areas** - Where is development focused?

---

## ✅ Checklist for Repository Setup

- [ ] Create recommended labels (see script above)
- [ ] Setup GitHub Discussions
- [ ] Create GitHub Project board
- [ ] Configure project views (Contributor Board, Sprint, etc.)
- [ ] Add workflow to auto-add items to project
- [ ] Add workflow for PR auto-labeling
- [ ] Create DEVELOPERS.md (✅ Already done)
- [ ] Verify CONTRIBUTING.md is up-to-date
- [ ] Verify CODE_OF_CONDUCT.md is accessible
- [ ] Verify SECURITY.md has security contact
- [ ] Check README highlights contribution path
- [ ] Add "good first issue" label to some issues
- [ ] Pin 3-5 discussion topics for common questions

---

## 🚀 First Release Strategy

When preparing v2.1 release:

1. **Create milestone** - `gh api repos/shmindmaster/synapse/milestones --input -` 
2. **Tag issues with milestone** - Link all relevant PRs/issues
3. **Test release notes** - Generate from changelog
4. **Tag release** - `git tag v2.1.0`
5. **Create GitHub release** - With markdown changelog
6. **Mark as latest** - If appropriate
7. **Announce** - In discussions and README

---

## 📚 Resources

- [GitHub Labels Best Practices](https://github.com/github/gitignore)
- [GitHub Projects Documentation](https://docs.github.com/en/issues/planning-and-tracking-with-projects)
- [GitHub Discussions Guide](https://docs.github.com/en/discussions)
- [Conventional Commits](https://www.conventionalcommits.org/)

---

**Setup complete!** Your repository is now optimized for open-source contributions. 🎉
