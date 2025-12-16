---
description: 'Shell scripting best practices and conventions for bash, sh, zsh, and other shells'
applyTo: '**/*.sh'
---

# Shell Scripting Guidelines

## SHTrial Platform Context

These instructions apply to applications running on the **SHTrial Platform** - a unified DigitalOcean infrastructure with shared resources and per-app logical isolation.

### Platform Overview
- **Cluster:** `sh-demo-cluster` (NYC3, Kubernetes 1.34.1, CPU-only)
- **Database:** Shared Postgres 16 (`sh-shared-postgres`) with per-app databases
- **Storage:** Shared Spaces bucket (`sh-storage`) with per-app prefixes
- **AI Services:** DigitalOcean GenAI serverless inference
- **Deployment:** Automated via `scripts/k8s-deploy.sh`
- **Configuration:** `.env.shared` as single source of truth

### Key Standards
- **Naming:** `{APP_SLUG}` pattern for all resources (namespaces, databases, prefixes)
- **Backend:** FastAPI (Python 3.12) or Fastify (Node 22) only
- **Frontend:** Next.js 16 App Router or Vite 7
- **AI:** LangGraph for orchestration (no proprietary DSLs)
- **Styling:** Tailwind CSS v4 + shadcn/ui components
- **Package Management:** Poetry (Python) / pnpm (TypeScript)

### Configuration Management
All configuration must reference `.env.shared` variables:
- Never hardcode URLs, credentials, or resource names
- Use environment variables for all external services
- Reference platform resources by standard names
- Follow template patterns in K8s manifests (`` substitution)

### Platform Reference
- **Standards:** `shtrial-demo-standards.md` - Complete platform documentation
- **Implementation:** `.pendoah/platform/docs/` - Detailed guides
- **Templates:** `.pendoah/platform/templates/` - Code and config templates

---


Instructions for writing clean, safe, and maintainable shell scripts for bash, sh, zsh, and other shells.

## General Principles

- Generate code that is clean, simple, and concise
- Ensure scripts are easily readable and understandable
- Add comments where helpful for understanding how the script works
- Generate concise and simple echo outputs to provide execution status
- Avoid unnecessary echo output and excessive logging
- Use shellcheck for static analysis when available
- Assume scripts are for automation and testing rather than production systems unless specified otherwise
- Prefer safe expansions: double-quote variable references (`"$var"`), use `${var}` for clarity, and avoid `eval`
- Use modern Bash features (`[[ ]]`, `local`, arrays) when portability requirements allow; fall back to POSIX constructs only when needed
- Choose reliable parsers for structured data instead of ad-hoc text processing

## Error Handling & Safety

- Always enable `set -euo pipefail` to fail fast on errors, catch unset variables, and surface pipeline failures
- Validate all required parameters before execution
- Provide clear error messages with context
- Use `trap` to clean up temporary resources or handle unexpected exits when the script terminates
- Declare immutable values with `readonly` (or `declare -r`) to prevent accidental reassignment
- Use `mktemp` to create temporary files or directories safely and ensure they are removed in your cleanup handler

## Script Structure

- Start with a clear shebang: `#!/bin/bash` unless specified otherwise
- Include a header comment explaining the script's purpose
- Define default values for all variables at the top
- Use functions for reusable code blocks
- Create reusable functions instead of repeating similar blocks of code
- Keep the main execution flow clean and readable

## Working with JSON and YAML

- Prefer dedicated parsers (`jq` for JSON, `yq` for YAML—or `jq` on JSON converted via `yq`) over ad-hoc text processing with `grep`, `awk`, or shell string splitting
- When `jq`/`yq` are unavailable or not appropriate, choose the next most reliable parser available in your environment, and be explicit about how it should be used safely
- Validate that required fields exist and handle missing/invalid data paths explicitly (e.g., by checking `jq` exit status or using `// empty`)
- Quote jq/yq filters to prevent shell expansion and prefer `--raw-output` when you need plain strings
- Treat parser errors as fatal: combine with `set -euo pipefail` or test command success before using results
- Document parser dependencies at the top of the script and fail fast with a helpful message if `jq`/`yq` (or alternative tools) are required but not installed

```bash
#!/bin/bash

# ============================================================================
# Script Description Here
# ============================================================================

set -euo pipefail

cleanup() {
    # Remove temporary resources or perform other teardown steps as needed
    if [[ -n "${TEMP_DIR:-}" && -d "$TEMP_DIR" ]]; then
        rm -rf "$TEMP_DIR"
    fi
}

trap cleanup EXIT

# Default values
RESOURCE_GROUP=""
REQUIRED_PARAM=""
OPTIONAL_PARAM="default-value"
readonly SCRIPT_NAME="$(basename "$0")"

TEMP_DIR=""

# Functions
usage() {
    echo "Usage: $SCRIPT_NAME [OPTIONS]"
    echo "Options:"
    echo "  -g, --resource-group   Resource group (required)"
    echo "  -h, --help            Show this help"
    exit 0
}

validate_requirements() {
    if [[ -z "$RESOURCE_GROUP" ]]; then
        echo "Error: Resource group is required"
        exit 1
    fi
}

main() {
    validate_requirements

    TEMP_DIR="$(mktemp -d)"
    if [[ ! -d "$TEMP_DIR" ]]; then
        echo "Error: failed to create temporary directory" >&2
        exit 1
    fi
    
    echo "============================================================================"
    echo "Script Execution Started"
    echo "============================================================================"
    
    # Main logic here
    
    echo "============================================================================"
    echo "Script Execution Completed"
    echo "============================================================================"
}

# Parse arguments
while [[ $# -gt 0 ]]; do
    case $1 in
        -g|--resource-group)
            RESOURCE_GROUP="$2"
            shift 2
            ;;
        -h|--help)
            usage
            ;;
        *)
            echo "Unknown option: $1"
            exit 1
            ;;
    esac
done

# Execute main function
main "$@"

```
