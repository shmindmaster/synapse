# GitHub Copilot Instructions - Synapse

> **Repository**: monorepo | **Framework**: express

## Global Infrastructure Rules

- Use DigitalOcean shared infrastructure (nyc3 region)
- Database: `sh-shared-postgres` via DATABASE_URL
- Storage: `voxops` bucket via DO_SPACES_* variables
- AI: DigitalOcean Gradient + Fal AI models
- Package manager: `pnpm`

## Repository Context

This is a monorepo repository.

- Follow RESTful API patterns
- Use proper DTOs and validation
- Implement authentication guards