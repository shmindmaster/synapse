---
description: 'Python coding conventions and guidelines'
applyTo: '**/*.py'
---

# Python Coding Conventions

## SHTrial Platform Context

These instructions apply to applications running on the **SHTrial Platform** - a unified DigitalOcean infrastructure with shared resources and per-app logical isolation.

### Platform Standards Reference
- **Primary:** `./UNIFIED_PLAYBOOK.md` (local file) - Complete platform architecture and standards
- **Configuration:** `./.env.example` - Environment variable template - Master configuration template (single source of truth)

### Key Platform Resources
- **App Platform:** DigitalOcean App Platform (PaaS, automatic builds from GitHub)
- **Database:** `sh-shared-postgres` (Postgres 16 + pgvector, db-per-app isolation)
- **Storage:** `sh-storage` (DigitalOcean Spaces + CDN, prefix-per-app isolation)
- **AI Services:** DigitalOcean GenAI serverless (https://inference.do-ai.run/v1)
- **DNS:** `*.shtrial.com` with automatic SSL certificates
- **Deployment:** Automatic on git push to main branch

### Application Standards
- **Naming Convention:** `{APP_SLUG}` pattern for all resources
- **Component Naming:** `web` (frontend), `backend` (API), `worker` (background tasks)
- **Backend Stack:** FastAPI (Python 3.12) or Fastify (Node 22)
- **Frontend Stack:** Next.js 16 App Router or Vite 7
- **AI Orchestration:** LangGraph (code-first StateGraph, vendor-neutral)
- **Styling:** Tailwind CSS v4 + shadcn/ui
- **Package Management:** Poetry (Python) / pnpm (TypeScript)

### Platform Constraints & Capabilities
- **✅ ENABLED:** Full access to all shared resources, complete credentials provided
- **✅ ENABLED:** Autonomous deployment and configuration management
- **✅ ENABLED:** End-to-end task completion without approval
- **❌ NO GPU:** All AI inference uses serverless endpoints (no local models)
- **❌ NO NEW INFRASTRUCTURE:** Use existing App Platform, database, storage
- **❌ NO KUBERNETES:** All apps deploy via App Platform (PaaS)

### Configuration Management
All applications use local configuration files:
- **Template:** `./.env.example` - Environment variable template (committed to git)
- **Runtime:** `./.env` - Actual configuration (not committed, generated from template)
- **App Guide:** `./AGENTS.MD` - App-specific configuration and standards

### App Platform Configuration
- **Manifest:** `app.yaml` at repo root (single source of truth)
- **Services:** Defined in `app.yaml` (web, backend, worker)
- **Deployment:** Automatic on git push to main branch
- **Build:** App Platform builds Dockerfiles automatically

---


## Python Instructions

- Write clear and concise comments for each function.
- Ensure functions have descriptive names and include type hints.
- Provide docstrings following PEP 257 conventions.
- Use the `typing` module for type annotations (e.g., `List[str]`, `Dict[str, int]`).
- Break down complex functions into smaller, more manageable functions.

## General Instructions

- Always prioritize readability and clarity.
- For algorithm-related code, include explanations of the approach used.
- Write code with good maintainability practices, including comments on why certain design decisions were made.
- Handle edge cases and write clear exception handling.
- For libraries or external dependencies, mention their usage and purpose in comments.
- Use consistent naming conventions and follow language-specific best practices.
- Write concise, efficient, and idiomatic code that is also easily understandable.

## Code Style and Formatting

- Follow the **PEP 8** style guide for Python.
- Maintain proper indentation (use 4 spaces for each level of indentation).
- Ensure lines do not exceed 79 characters.
- Place function and class docstrings immediately after the `def` or `class` keyword.
- Use blank lines to separate functions, classes, and code blocks where appropriate.

## Edge Cases and Testing

- Always include test cases for critical paths of the application.
- Account for common edge cases like empty inputs, invalid data types, and large datasets.
- Include comments for edge cases and the expected behavior in those cases.
- Write unit tests for functions and document them with docstrings explaining the test cases.

## Example of Proper Documentation

```python
def calculate_area(radius: float) -> float:
    """
    Calculate the area of a circle given the radius.
    
    Parameters:
    radius (float): The radius of the circle.
    
    Returns:
    float: The area of the circle.
    
    Raises:
    ValueError: If radius is negative.
    """
    if radius < 0:
        raise ValueError("Radius cannot be negative")
    return 3.14159 * radius ** 2
```

## Async Programming

- Use `async`/`await` for I/O-bound operations.
- Prefer `asyncio` for concurrent execution.
- Use `aiohttp` or `httpx` for async HTTP requests.

## Dependencies and Virtual Environments

- Use `requirements.txt` or `pyproject.toml` for dependency management.
- Always use virtual environments (`venv`, `virtualenv`, or `uv`).
- Pin dependency versions for reproducible builds.

## Error Handling

- Use specific exception types rather than bare `except:`.
- Log errors with appropriate context.
- Use `try`/`except`/`finally` blocks appropriately.
