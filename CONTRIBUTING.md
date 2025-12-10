# Contributing to Synapse

Thank you for your interest in contributing to Synapse! We're building a privacy-first, open-source RAG engine for codebases, and we'd love your help.

## Why Contribute?

Synapse is solving a real problem: **developers need AI-powered codebase intelligence without sending their code to the cloud**. By contributing, you're helping build tools that:

- Protect developer privacy
- Enable compliance with strict data governance
- Give developers full control over their tools
- Support open-source alternatives to proprietary solutions

## Getting Started

### 1. Fork and Clone

```bash
# Fork the repository on GitHub, then:
git clone https://github.com/YOUR_USERNAME/Synapse.git
cd Synapse
```

### 2. Set Up Development Environment

```bash
# Install dependencies
pnpm install

# Set up environment variables
cp .env.example .env
# Edit .env with your local configuration

# Set up database
pnpm db:migrate

# Start development servers
pnpm dev
```

### 3. Create a Branch

```bash
git checkout -b feature/your-feature-name
# or
git checkout -b fix/your-bug-fix
```

## Development Workflow

### Running the Project

```bash
# Development mode (frontend + backend with hot reload)
pnpm dev

# Build for production
pnpm build

# Run production server
pnpm start

# Database operations
pnpm db:generate  # Generate Prisma client
pnpm db:migrate   # Run migrations
pnpm db:studio    # Open Prisma Studio (database GUI)
```

### Code Style

- **TypeScript**: Strict mode enabled. Follow existing patterns.
- **Linting**: Run `pnpm lint` before committing. We use ESLint.
- **Formatting**: Code is auto-formatted. Ensure your editor is configured.
- **Naming**: Use descriptive names. Follow existing conventions.
- **Comments**: Add comments for complex logic, not obvious code.

### Testing

```bash
# Run tests (when available)
pnpm test

# Run linting
pnpm lint
```

## How to Contribute

### Reporting Bugs

Before creating an issue:

1. **Search existing issues** - Your bug might already be reported
2. **Check recent commits** - It might already be fixed
3. **Reproduce the issue** - Make sure you can consistently reproduce it

When creating an issue, include:

- **Clear title** - Describe the problem concisely
- **Steps to reproduce** - Detailed steps to trigger the bug
- **Expected behavior** - What should happen
- **Actual behavior** - What actually happens
- **Environment** - OS, Node version, pnpm version, etc.
- **Error messages** - Full error logs if applicable
- **Screenshots** - If relevant to UI issues

### Suggesting Features

We love feature ideas! When suggesting:

1. **Check existing issues** - Your idea might already be discussed
2. **Explain the problem** - What problem does this solve?
3. **Describe the solution** - How should it work?
4. **Consider alternatives** - Are there other ways to solve this?
5. **Show use cases** - Who would benefit and how?

### Pull Requests

1. **Keep changes focused** - One feature or bug fix per PR
2. **Write clear commit messages** - Use conventional commits when possible:
   - `feat: add VS Code extension support`
   - `fix: resolve memory leak in indexing`
   - `docs: update README with new examples`
3. **Test your changes** - Ensure everything works
4. **Update documentation** - Update README, API docs, or comments as needed
5. **Follow code style** - Run `pnpm lint` and fix any issues
6. **Write a good PR description** - Explain what, why, and how

### Code Review Process

1. **Automated checks** - CI will run linting and tests
2. **Maintainer review** - A maintainer will review your PR
3. **Feedback** - Address any requested changes
4. **Merge** - Once approved, your PR will be merged!

## Areas for Contribution

We're particularly interested in contributions for:

### High Priority

- **VS Code Extension** - Inline codebase chat and semantic search
- **JetBrains Plugin** - IDE integration for IntelliJ, PyCharm, etc.
- **Performance Optimizations** - Faster indexing, better search
- **Local AI Integration** - Better Ollama, LM Studio support
- **Incremental Indexing** - Watch mode for file changes

### Medium Priority

- **Additional AI Providers** - Anthropic, Cohere, local models
- **Multi-language Support** - Better handling of Python, Go, Rust, etc.
- **Code Analysis** - Complexity metrics, dependency graphs
- **Team Features** - Collaboration, sharing, permissions
- **Documentation** - More examples, tutorials, guides

### Always Welcome

- **Bug Fixes** - Any issues you encounter
- **Documentation** - Typos, clarifications, examples
- **Tests** - Test coverage improvements
- **Code Quality** - Refactoring, cleanup, optimization
- **Examples** - Use case demonstrations

## Development Guidelines

### Architecture

- **Monorepo Structure**: `apps/frontend` and `apps/backend`
- **Shared Code**: `packages/shared` for common utilities
- **Database**: Prisma ORM with PostgreSQL + pgvector
- **API**: RESTful API with Express
- **Frontend**: React with TypeScript

### Adding New Features

1. **Discuss first** - Open an issue to discuss the feature
2. **Design** - Consider architecture and impact
3. **Implement** - Write clean, tested code
4. **Document** - Update docs and add examples
5. **Test** - Ensure it works in different scenarios

### Database Changes

When modifying the database schema:

1. **Create a migration**: `pnpm db:migrate dev --name your-migration-name`
2. **Update Prisma schema**: `prisma/schema.prisma`
3. **Generate client**: `pnpm db:generate`
4. **Test thoroughly**: Ensure migrations work both ways

### API Changes

- **Version breaking changes** - Consider API versioning
- **Document endpoints** - Update API documentation
- **Add examples** - Show how to use new endpoints
- **Backward compatibility** - When possible, maintain compatibility

## Community

### Getting Help

- **GitHub Discussions** - Ask questions, share ideas
- **GitHub Issues** - Report bugs, request features
- **Code of Conduct** - Be respectful and inclusive

### Recognition

Contributors will be:
- Listed in CONTRIBUTORS.md (coming soon)
- Mentioned in release notes
- Credited in relevant documentation

## Questions?

Not sure where to start? Here are some ideas:

1. **Pick a "good first issue"** - Look for issues labeled `good first issue`
2. **Fix a bug** - Check the issues list for bugs
3. **Improve docs** - Documentation always needs improvement
4. **Add tests** - Help improve test coverage
5. **Share feedback** - Tell us what you think!

Feel free to:
- Open an issue with the `question` label
- Start a discussion in GitHub Discussions
- Reach out to maintainers

## Code of Conduct

We're committed to providing a welcoming and inclusive environment. Please:

- Be respectful and considerate
- Welcome newcomers and help them learn
- Focus on constructive feedback
- Respect different viewpoints and experiences

## Thank You!

Every contribution, no matter how small, makes a difference. Thank you for helping make Synapse better! 🚀

---

**Ready to contribute?** Pick an issue, fork the repo, and submit a PR. We can't wait to see what you build!
