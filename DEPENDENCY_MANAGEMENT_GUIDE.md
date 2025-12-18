# Dependency Management Guide

**For:** This Repository
**Platform:** SHTrial Platform
**Last Updated:** 2025-01-17

This guide outlines best practices for managing dependencies in this repository.

## Table of Contents

1. [Quick Reference](#quick-reference)
2. [Adding Dependencies](#adding-dependencies)
3. [Updating Dependencies](#updating-dependencies)
4. [Security Audits](#security-audits)
5. [Removing Dependencies](#removing-dependencies)
6. [Best Practices](#best-practices)
7. [Automated Updates](#automated-updates)
8. [Troubleshooting](#troubleshooting)

## Quick Reference

### Node.js (This Repo)

- **Package Manager:** pnpm (see `package.json` for version)
- **Lock File:** `pnpm-lock.yaml`
- **Add:** `pnpm add <package>`
- **Update:** `pnpm update`
- **Audit:** `pnpm audit`
- **Remove:** `pnpm remove <package>`

### Python (This Repo)

- **Package Manager:** poetry (preferred) or pip
- **Lock File:** `poetry.lock` or `requirements.txt`
- **Add:** `poetry add <package>` or edit `requirements.txt`
- **Update:** `poetry update` or `pip install --upgrade`
- **Audit:** `pip-audit` or `poetry check`
- **Remove:** `poetry remove <package>`

## Adding Dependencies

### Node.js

**Production dependency:**
```bash
pnpm add <package-name>
```

**Dev dependency:**
```bash
pnpm add -D <package-name>
```

**Verify:**
```bash
pnpm install
pnpm build
```

### Python (Poetry)

```bash
# Production dependency
poetry add <package-name>

# Dev dependency
poetry add --group dev <package-name>

# Verify
poetry install
```

### Python (pip)

```bash
# Install package
pip install <package-name>

# Update requirements.txt
pip freeze > requirements.txt

# Verify
pip install -r requirements.txt
```

## Updating Dependencies

### Node.js

**Check for updates:**
```bash
pnpm outdated
```

**Update all:**
```bash
pnpm update
```

**Update specific package:**
```bash
pnpm update <package-name>
```

**Update to latest (may include major versions):**
```bash
pnpm update --latest
```

### Python (Poetry)

**Check for updates:**
```bash
poetry show --outdated
```

**Update all:**
```bash
poetry update
```

**Update specific package:**
```bash
poetry update <package-name>
```

### Python (pip)

**Check for updates:**
```bash
pip list --outdated
```

**Update specific package:**
```bash
pip install --upgrade <package-name>
pip freeze > requirements.txt
```

## Security Audits

### Node.js

**Run audit:**
```bash
pnpm audit
```

**Auto-fix where possible:**
```bash
pnpm audit --fix
```

**Review vulnerabilities:**
```bash
pnpm audit --json > audit-report.json
```

### Python

**Using pip-audit:**
```bash
# Install pip-audit if not available
pip install pip-audit

# Run audit
pip-audit -r requirements.txt

# Auto-fix where possible
pip-audit --fix -r requirements.txt
```

**Using poetry:**
```bash
# Check for known vulnerabilities
poetry check
```

## Removing Dependencies

### Node.js

```bash
pnpm remove <package-name>
```

### Python (Poetry)

```bash
poetry remove <package-name>
```

### Python (pip)

1. Edit `requirements.txt` to remove the package
2. Run: `pip install -r requirements.txt`

## Best Practices

1. **Use exact versions for critical packages** - Pin security-sensitive packages
2. **Keep lock files committed** - `pnpm-lock.yaml`, `poetry.lock`
3. **Run audits regularly** - Weekly security checks
4. **Test after updates** - Always run `pnpm build` or equivalent after updates
5. **Document exceptions** - If you need a different version, document why in comments
6. **Update incrementally** - Update one package at a time for major versions
7. **Review changelogs** - Check package release notes for breaking changes

## Automated Updates

This repository uses **Renovate** for automated dependency updates.

**Configuration:** `renovate.json`

Renovate will:
- Create PRs for dependency updates
- Group minor/patch updates
- Auto-merge security patches (if configured)
- Require review for major updates

See `renovate.json` for configuration details.

## Troubleshooting

### Build Failures After Update

1. **Check error messages** - Look for breaking changes
2. **Review package changelog** - Check release notes
3. **Rollback:** `git revert <commit>`
4. **Update incrementally** - One package at a time
5. **Check compatibility** - Ensure Node.js/Python versions are compatible

### Lock File Conflicts

**Node.js - Regenerate lock file:**
```bash
rm pnpm-lock.yaml
pnpm install
```

**Python (Poetry) - Regenerate lock file:**
```bash
rm poetry.lock
poetry lock
poetry install
```

**Python (pip) - Regenerate requirements:**
```bash
pip freeze > requirements.txt
```

### Version Conflicts

When multiple packages require different versions:

1. **Check if update available** - One package may have newer version supporting both
2. **Use resolutions/overrides (Node.js):**
   ```json
   {
     "pnpm": {
       "overrides": {
         "package-name": "^1.2.0"
       }
     }
   }
   ```
3. **Document conflict** - Add comment explaining why

### Security Vulnerabilities Without Fix

1. **Check if package is actually used** - May be transitive dependency
2. **Consider alternative package** - If no fix available
3. **Temporary workaround** - If critical, document risk
4. **Monitor** - Set up alerts for when fix becomes available

## Platform-Level Tools

**Note for Platform Maintainers:**

Platform-level dependency management scripts are available in the platform root for cross-repo maintenance:

- `scripts/maintenance/audit-dependencies.sh` - Cross-repo inventory
- `scripts/maintenance/analyze-package-usage.sh` - Find unused packages across repos
- `scripts/maintenance/update-node-packages.sh` - Batch updates across repos
- `scripts/maintenance/consolidate-package-versions.sh` - Version standardization across repos

These are for platform-wide maintenance, not individual repo use.

## Resources

- [pnpm Documentation](https://pnpm.io/)
- [Poetry Documentation](https://python-poetry.org/docs/)
- [pip-audit Documentation](https://pypi.org/project/pip-audit/)
- [Renovate Documentation](https://docs.renovatebot.com/)
