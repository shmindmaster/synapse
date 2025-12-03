# Synapse - AI-Native Knowledge OS

**Synapse** transforms your local file system into a queryable, intelligent knowledge base. Unlike traditional file managers that only move bits, Synapse uses DigitalOcean Gradient AI (via an OpenAI-compatible API) to read, understand, categorize, and chat with your documents.

![Synapse Banner](https://images.unsplash.com/photo-1620712943543-bcc4688e7485?q=80&w=1200&auto=format&fit=crop)

## 🧠 Core Capabilities

* **Neural Analysis**: Automatically generates executive summaries, semantic tags, and sensitivity ratings for any text-based file.

* **RAG Chat (Retrieval Augmented Generation)**: Chat directly with your documents. Ask questions like "What are the key deadlines in this contract?" and get instant answers based on the file's content.

* **Smart Sorting**: Move or copy files based on semantic content, not just rigid filename matching.

* **Privacy First**: Your files are processed via your private DigitalOcean Gradient AI model access key and shared database/storage resources.

## 🚀 Getting Started

### Prerequisites
1.  Node.js 20+
2.  Access to the shared DigitalOcean Managed PostgreSQL cluster (`sh-shared-postgres`) with a `Synapse` database
3.  DigitalOcean Gradient AI model access key (serverless inference) and inference endpoint

### Installation

1.  **Clone & Install**

    ```bash
    git clone <repo>
    cd synapse
    pnpm install
    ```

2.  **Configure Environment**

    Create a `.env` file in the root directory based on `.env.example` and your organization-level `.env.shared`:

    ```env
    # Database (DigitalOcean Managed PostgreSQL shared cluster)
    DATABASE_URL="postgresql://doadmin:<DB_PASSWORD>@sh-shared-postgres-do-user-XXXX.f.db.ondigitalocean.com:25060/Synapse?sslmode=require"

    # DigitalOcean Gradient AI (OpenAI-compatible)
    DIGITALOCEAN_INFERENCE_ENDPOINT=https://inference.do-ai.run/v1
    DIGITALOCEAN_MODEL_KEY=<YOUR_GRADIENT_MODEL_KEY>
    AI_MODEL=llama-3.1-70b-instruct
    AI_MODEL_EMBEDDING=text-embedding-3-small
    ```

3.  **Launch Synapse**

    ```bash
    pnpm start
    ```

    This will launch both the frontend (port 5173) and the analysis server (port 3001).

## 🧪 Testing

Synapse includes a comprehensive E2E test suite using Playwright.

### Quick Start

1. **Install Playwright browsers:**
   ```bash
   npx playwright install chromium
   ```

2. **Run all tests:**
   ```bash
   npm test
   ```

3. **Run specific test suite:**
   ```bash
   npm run test:suite-a  # Core UX tests
   npm run test:suite-b  # Workflow tests
   npm run test:suite-c  # Neural Core tests
   npm run test:suite-d  # AI Features tests
   npm run test:suite-e  # UI/UX tests
   ```

4. **Run with UI (recommended for debugging):**
   ```bash
   npm run test:ui
   ```

### Test Structure

- **Service Health** (4 tests): Backend prerequisite validation
- **Suite A** (7 tests): Core UX & Configuration
- **Suite B** (6 tests): Workflow & Functional operations
- **Suite C** (5 tests): Neural Core - Indexing & Search
- **Suite D** (6 tests): High-Value AI Features
- **Suite E** (5 tests): Responsiveness & Accessibility

**Total: 33 test cases** covering all major functionality.

See [tests/README.md](./tests/README.md) for detailed documentation and [tests/TROUBLESHOOTING.md](./tests/TROUBLESHOOTING.md) for common issues.

## 🛠 Tech Stack

* **Frontend**: React, TypeScript, Tailwind CSS, Lucide Icons
* **Backend**: Express, OpenAI-compatible SDK
* **Database**: PostgreSQL + pgvector on DigitalOcean Managed PostgreSQL (`sh-shared-postgres`)
* **AI**: DigitalOcean Gradient AI (serverless inference at `https://inference.do-ai.run/v1`)

## License

MIT
