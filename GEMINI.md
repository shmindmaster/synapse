# Gemini CLI/Code Assist Context - Synapse

> **Repository Type**: monorepo | **Framework**: express

## Core Rules

- Use DigitalOcean shared infrastructure only (nyc3 region)
- Database: `sh-shared-postgres` via environment variables
- Storage: `voxops` bucket via DigitalOcean Spaces
- AI: DigitalOcean Gradient + Fal AI models
- Package manager: `pnpm`
- TypeScript strict mode

## Repository-Specific Context

This is a monorepo repository using express.

Follow RESTful API patterns, use proper DTOs and validation, implement authentication guards.