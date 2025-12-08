# Synapse - AI-Native Knowledge OS

**Synapse** transforms your local file system into a queryable, intelligent knowledge base. Unlike traditional file managers that only move bits, Synapse uses DigitalOcean Gradient AI (Llama 3.1 70B Instruct) to read, understand, categorize, synthesize, and intelligently manage your documents with cutting-edge AI capabilities.

![Synapse Banner](https://images.unsplash.com/photo-1620712943543-bcc4688e7485?q=80&w=1200&auto=format&fit=crop)

## 🧠 Core Capabilities

* **Neural Analysis**: Automatically generates executive summaries, semantic tags, and sensitivity ratings for any text-based file.

* **RAG Chat (Retrieval Augmented Generation)**: Chat directly with your documents. Ask questions like "What are the key deadlines in this contract?" and get instant answers based on the file's content.

* **Smart Sorting**: Move or copy files based on semantic content, not just rigid filename matching.

* **Privacy First**: Your files are processed via your private DigitalOcean Gradient AI model access key and shared database/storage resources.

## 🚀 Advanced AI Features (2025)

### 1. Intelligent Document Classification & Auto-Organization
Leverage state-of-the-art NLP to automatically classify documents by type (contracts, invoices, reports, emails, etc.) with confidence scoring. The system extracts key entities (people, organizations, dates, amounts), suggests optimal folder structures, and can automatically organize your entire file system based on semantic understanding rather than manual rules.

**Key Benefits:**
- Automatic document type detection with 14+ categories
- Entity extraction (people, orgs, dates, financial data)
- Smart folder path suggestions
- Confidence scoring for quality assurance
- Integration with PostgreSQL for persistent classification learning

### 2. Multi-Document Synthesis & Knowledge Graph
Go beyond single-document analysis with our multi-document synthesis engine. Analyze up to 10 documents simultaneously to extract common themes, contradictions, timeline events, and entity relationships. Build a visual knowledge graph showing how concepts and entities connect across your entire document corpus.

**Analysis Types:**
- **Comprehensive Synthesis**: Identify themes, contradictions, and insights
- **Timeline Analysis**: Extract and organize temporal information
- **Entity Mapping**: Map people, organizations, and concepts
- **Comparative Analysis**: Highlight similarities and differences
- **Knowledge Graph**: Visualize concept relationships

**Use Cases:**
- Research paper analysis and literature reviews
- Contract comparison and due diligence
- Meeting notes synthesis and action item extraction
- Financial document trend analysis

### 3. Predictive File Management & Smart Recommendations
Our AI assistant learns from your behavior patterns and proactively suggests actions before you even think of them. Get intelligent recommendations for organizing, archiving, sharing, tagging, and backing up files based on content analysis, user behavior, and workflow patterns.

**Recommendation Types:**
- **Organization**: Suggested file moves and folder structures
- **Duplicate Detection**: Find and manage redundant files
- **Archive Suggestions**: Identify old files for archiving
- **Sharing Recommendations**: Suggest collaboration opportunities
- **Tagging**: Auto-generate relevant tags and metadata
- **Workflow Optimizations**: Identify bottlenecks and inefficiencies

**Features:**
- Real-time pattern detection
- Predictive analytics with confidence scores
- Priority-based action ranking (high/medium/low)
- Impact estimation for each recommendation
- Auto-refresh for continuous insights

## 🚀 Deployment

### Quick Deploy to Kubernetes (DOKS)

Deploy to DigitalOcean Kubernetes (sh-demo-cluster):

```bash
pnpm run k8s:deploy
```

This single command:
1. ✅ Builds and pushes Docker images to DigitalOcean Registry
2. ✅ Generates Kubernetes manifests with environment substitution
3. ✅ Creates/verifies database on shared PostgreSQL cluster
4. ✅ Applies manifests to the `synapse` namespace
5. ✅ Runs Prisma database migrations
6. ✅ Provides verification commands for testing

### Deployment URLs

- **Frontend**: https://synapse.shtrial.com
- **Backend API**: https://api.synapse.shtrial.com

### Infrastructure

- **Platform**: DigitalOcean Kubernetes (DOKS) - `sh-demo-cluster`
- **Database**: Shared PostgreSQL cluster (`sh-shared-postgres`, database: `synapse`)
- **Storage**: DigitalOcean Spaces (`sh-storage`, prefix: `synapse/`)
- **Container Registry**: DigitalOcean Container Registry (`shtrial-reg`)
- **DNS**: Managed via DigitalOcean DNS (zone: `shtrial.com`)
- **SSL**: Automatically provisioned via cert-manager (Let's Encrypt)
- **Ingress**: Static IP `152.42.152.118`

### Post-Deployment Verification

```bash
# Check deployment status
kubectl get all -n synapse

# Test frontend
curl -I https://synapse.shtrial.com

# Test backend health
curl https://api.synapse.shtrial.com/health

# View logs
kubectl logs -n synapse -l app=api --tail=50
kubectl logs -n synapse -l app=web --tail=50
```

## 📖 Usage Examples

### Document Classification

```javascript
// Classify a document automatically
POST /api/classify-document
{
  "filePath": "/path/to/document.pdf",
  "content": "optional_content_string"
}

// Response includes:
{
  "success": true,
  "classification": {
    "documentType": "contract",
    "category": "Employment Contract",
    "confidence": 0.92,
    "suggestedPath": "Legal/Contracts/Employment",
    "extractedEntities": ["ACME Corp", "John Doe", "2024-01-15"],
    "tags": ["employment", "agreement", "compensation"],
    "summary": "Employment agreement for software engineer position"
  }
}
```

### Multi-Document Synthesis

```javascript
// Synthesize insights from multiple documents
POST /api/synthesize-documents
{
  "filePaths": ["/docs/report1.pdf", "/docs/report2.pdf", "/docs/report3.pdf"],
  "analysisType": "synthesis", // or timeline, entities, comparative, knowledge_graph
  "query": "Focus on financial implications" // optional
}

// Response includes themes, entities, relationships, timeline, insights
```

### Smart Recommendations

```javascript
// Get AI-powered file management recommendations
POST /api/smart-recommendations
{
  "currentFile": "/path/to/current/file.pdf",
  "context": "working on Q4 reports",
  "recentActions": [...],
  "userRole": "DEVELOPER"
}

// Response includes:
{
  "recommendations": [
    {
      "type": "organize",
      "action": "Move similar reports to archive",
      "priority": "high",
      "confidence": 0.87,
      "estimatedImpact": "Save 30% storage space"
    }
  ],
  "predictions": [...],
  "insights": [...],
  "patterns": [...]
}
```

### Knowledge Graph

```javascript
// Get knowledge graph visualization data
GET /api/knowledge-graph

// Response includes nodes, edges, and statistics
{
  "success": true,
  "graph": {
    "nodes": [...],
    "edges": [...]
  },
  "stats": {
    "totalNodes": 45,
    "totalEdges": 87,
    "documentTypes": 12,
    "patterns": 8
  }
}
```

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

4.  **Development Commands**

    ```bash
    # Development mode (both frontend and backend)
    pnpm dev
    
    # Build for production
    pnpm build
    
    # Start production server
    pnpm server
    
    # Run linting
    pnpm lint
    
    # Database operations
    pnpm db:generate  # Generate Prisma client
    pnpm db:migrate    # Run database migrations
    pnpm db:studio     # Open Prisma Studio
    ```

## 🛠 Tech Stack

* **Frontend**: React, TypeScript, Tailwind CSS, Lucide Icons
* **Backend**: Express, OpenAI-compatible SDK
* **Database**: PostgreSQL + pgvector on DigitalOcean Managed PostgreSQL (`sh-shared-postgres`)
* **AI**: DigitalOcean Gradient AI - Llama 3.1 70B Instruct (serverless inference at `https://inference.do-ai.run/v1`)
* **Advanced Features**: Document classification, multi-document synthesis, knowledge graphs, predictive analytics
* **Monorepo**: pnpm workspaces with apps/frontend and apps/backend structure

## 📁 Project Structure

```
synapse/
├── apps/
│   ├── frontend/          # React application
│   │   ├── src/
│   │   ├── package.json
│   │   └── vite.config.ts
│   └── backend/           # Express server
│       ├── server.js
│       └── package.json
├── packages/
│   └── shared/            # Shared utilities (future)
├── prisma/                # Database schema and migrations
├── docker-compose.yml     # Local development
├── Dockerfile            # Production build
└── pnpm-workspace.yaml   # Workspace configuration
```

## License

MIT
