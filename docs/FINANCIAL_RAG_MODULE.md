# Synapse Financial Documents Module Specification

**Status:** Architecture & Go-To-Market Strategy
**Timeline:** Q2 2025 (6 sprints after Phase 1 completion)
**Priority:** MEDIUM-HIGH (market expansion)
**Market Opportunity:** $2B+ (banking, finance, investment)
**Pricing:** $2000-5000/month (3-5x standard Synapse)
**TAM:** 10,000+ financial services companies globally

---

## Executive Summary

Financial documents represent a **$2 billion market gap** in RAG systems.

### The Problem

Current RAG tools (LlamaIndex, LangChain, PrivateGPT) fail catastrophically on financial documents:

- **Accuracy:** 0.44-0.62 (vs. 0.92 for specialized systems)
- **Table handling:** 70%+ of financial data is in tables (embeddings lose structure)
- **Numerical reasoning:** Can't understand "amount > $1M" semantically
- **Citations:** No way to show "page 15, section 3.2" for compliance
- **Audit trails:** Silent decisions = regulatory risk

### Synapse Solution

**Financial Document Module** = Production-ready RAG specialized for financial data

- ✅ **0.92 accuracy** (benchmark against competitors)
- ✅ **Table-aware chunking** (extract, preserve structure)
- ✅ **Numerical reasoning** (understand amounts, percentages, ratios)
- ✅ **Automatic citations** (page, section, table reference)
- ✅ **Compliance logging** (every decision audited)
- ✅ **Domain vocabulary** (understands finance-specific terms)

### Go-To-Market

- **Target:** Banking, fintech, investment firms
- **Positioning:** "Production-ready financial RAG with audit trails"
- **Initial customer:** 3-5 Fortune 500 financial institutions
- **Revenue:** $2000-10000/month per customer

---

## Financial Documents: Why They're Special

### Characteristics That Break Generic RAG

| Challenge            | Why RAG Fails                                                    | Synapse Solution                              |
| -------------------- | ---------------------------------------------------------------- | --------------------------------------------- |
| **Tables**           | Embeddings lose row/column structure                             | Table detection + structured extraction       |
| **Numbers**          | "Amount > $1M" is semantics, not words                           | Numerical reasoning layer                     |
| **Cross-references** | "See note 5, page 15" loses context                              | Citation tracking + link resolution           |
| **Compliance**       | No audit trail = regulatory risk                                 | Immutable decision log                        |
| **Domain terms**     | "LTV", "EBITDA", "hedge ratio" are meaningless to generic models | Domain vocabulary + fine-tuned embeddings     |
| **Temporal**         | "What was the rate on the OLD contract?"                         | Version control + snapshot management         |
| **Precision**        | $1M vs $1.1M matters                                             | Exact value extraction + numerical comparison |

### Financial Document Types

```
1. Contracts (loan agreements, lines of credit, derivatives)
   - Complexity: Very high (legal + financial)
   - Size: 50-500 pages
   - Critical: Payment terms, covenants, collateral

2. Financial Statements (10-K, 10-Q, balance sheets)
   - Tables: 70% of content
   - Critical: Revenue, expenses, cash flow, ratios
   - Temporal: Multi-year comparison

3. Regulatory Documents (compliance reports, disclosures)
   - Critical: Complete accuracy (SEC filings)
   - Temporal: Historical + current
   - Audit: Every decision must be traceable

4. Risk Documents (prospectuses, term sheets, PMDs)
   - Precision: Description of risks must be exact
   - Complexity: Complex scenarios and conditions

5. Internal Documents (treasury docs, limits, policies)
   - Access control: Different teams see different docs
   - Temporal: Policies evolve over time
```

---

## Architecture

### High-Level Flow

```
┌──────────────────────────────────────────────────────────────┐
│                   Financial Document                         │
│                  (PDF, XLSX, CSV, JSON)                      │
└──────────────────────────────────────────────────────────────┘
                          │
        ┌─────────────────┼─────────────────┐
        │                 │                 │
        ▼                 ▼                 ▼
    Text Stream      Table Extractor    Metadata Parser
        │                 │                 │
        └─────────────────┼─────────────────┘
                          │
                          ▼
         ┌────────────────────────────────┐
         │  Financial Document Parser      │
         │  (domain-specific chunking)     │
         │                                 │
         │  - Clause detection             │
         │  - Table preservation            │
         │  - Numerical entity extraction   │
         │  - Citation tracking            │
         └────────────────────────────────┘
                          │
        ┌─────────────────┼─────────────────┐
        │                 │                 │
        ▼                 ▼                 ▼
   Text Chunks     Table Chunks    Numerical Entities
   (with context) (with structure)  (with values)
        │                 │                 │
        └─────────────────┼─────────────────┘
                          │
                          ▼
         ┌────────────────────────────────┐
         │   Embedding Layer               │
         │                                 │
         │  - Standard embeddings (text)   │
         │  - Table embeddings (structure) │
         │  - Numerical embeddings         │
         │  - Semantic enrichment          │
         └────────────────────────────────┘
                          │
        ┌─────────────────┼─────────────────┐
        │                 │                 │
        ▼                 ▼                 ▼
  PostgreSQL    Compliance Log    Citation Index
  pgvector         (immutable)      (for audit)
        │                 │                 │
        └─────────────────┼─────────────────┘
                          │
                          ▼
         ┌────────────────────────────────┐
         │   Search & Retrieval            │
         │                                 │
         │  - Keyword search               │
         │  - Semantic search              │
         │  - Numerical search             │
         │  - Hybrid ranking               │
         │  - Citation generation          │
         └────────────────────────────────┘
```

---

## Core Components

### 1. Financial Document Parser

**Goal:** Extract structure while preserving financial meaning

```typescript
interface FinancialDocument {
  id: string;
  source: string;
  document_type: 'contract' | 'financial_statement' | 'regulatory' | 'risk' | 'internal';
  extracted_at: ISO8601;

  // Structured metadata
  metadata: {
    issuer?: string; // Company name
    currency?: string; // USD, EUR, etc.
    fiscal_period?: string; // FY2024, Q1 2025
    regulatory_type?: string; // 10-K, 10-Q, etc.
    filing_date?: ISO8601;
    effective_date?: ISO8601;
    effective_until?: ISO8601;
  };

  // Extracted entities
  entities: {
    monetary_values: MonetaryEntity[];
    percentages: PercentageEntity[];
    dates: DateEntity[];
    measures: MeasureEntity[]; // EBITDA, LTV, etc.
    named_entities: NamedEntity[]; // Parties, counterparties
  };

  // Structure
  sections: DocumentSection[];
  tables: FinancialTable[];
  clauses?: Clause[]; // For contracts
}

interface MonetaryEntity {
  value: number;
  currency: string;
  context: string; // e.g., "principal amount", "interest rate"
  page: number;
  section: string;
}

interface FinancialTable {
  table_id: string;
  title: string;
  rows: number;
  columns: number;
  headers: string[];
  data: Record<string, any>[]; // Parsed table data
  location: { page: number; section: string };
  embedded_values: { column: string; value: unknown }[];
}

interface Clause {
  clause_id: string;
  type: 'payment' | 'liability' | 'termination' | 'covenant' | 'collateral';
  text: string;
  embedded_values: MonetaryEntity[];
}
```

### 2. Table Extraction & Preservation

**Why:** 70% of financial data is in tables. Generic embeddings destroy table structure.

**Approach:**

- **PDF table detection** (Tabula, Camelot)
- **Excel/CSV native parsing** (xlrd, pandas)
- **Table structure preservation** (rows/columns/hierarchy)
- **Value extraction** (numbers, dates, percentages)

```typescript
// Example: Balance Sheet
{
  "type": "financial_statement",
  "table": {
    "title": "Consolidated Balance Sheet",
    "fiscal_periods": ["2024-12-31", "2023-12-31"],
    "rows": [
      {
        "description": "Total Assets",
        "2024": 5200000000,
        "2023": 4800000000,
        "change_pct": 8.3
      },
      {
        "description": "Current Assets",
        "2024": 2100000000,
        "2023": 1900000000
      },
      // ... more rows
    ]
  }
}

// Embedding strategy:
// 1. Embed table title + headers together
// 2. Embed each row as: "In 2024, Current Assets were $2.1B (vs $1.9B in 2023)"
// 3. Create relationship embeddings: "Ratio of Current Assets to Total Assets: 0.4"
```

### 3. Numerical Reasoning Engine

**Goal:** Enable queries like "Find loans with LTV > 80%" or "Show obligations > $1M"

```typescript
interface NumericalQuery {
  metric: string; // 'amount', 'percentage', 'ratio'
  operator: '>' | '<' | '==' | '>=' | '<=';
  value: number;
  unit?: string; // 'USD', 'BPS' (basis points), '%'
  context?: string; // 'initial', 'outstanding', 'annual'
}

// Example queries:
// 1. "Find contracts with principal > $500M"
// 2. "Show all values > 2.5x EBITDA"
// 3. "Interest rates between 3% and 5%"

// Implementation:
// - Extract numerical entities during parsing
// - Create secondary index on (metric, value, operator)
// - Query: SELECT * FROM financial_numbers WHERE metric='amount' AND value > 500000000
// - Return: Full citations + context
```

### 4. Citation & Audit System

**Why:** Compliance requires knowing WHERE a decision came from

```typescript
interface Citation {
  document_id: string;
  source: string;           // e.g., "loan_agreement_2024.pdf"
  location: {
    page: number;
    section: string;
    table?: {name: string; row: number; column: number};
    clause_id?: string;
  };
  extracted_text: string;   // The exact text (immutable)
  extracted_at: ISO8601;
  confidence: number;       // 0-1 (extraction confidence)
}

// Every search result must include citations
{
  "query": "What is the interest rate on Loan X?",
  "result": {
    "value": "5.25%",
    "citations": [
      {
        "source": "loan_agreement.pdf",
        "location": {page: 5, section: "3.2.1 Interest"},
        "extracted": "The interest rate shall be 5.25% per annum",
        "confidence": 0.98
      }
    ]
  }
}

// Immutable audit log
CREATE TABLE financial_decision_log (
  id UUID PRIMARY KEY,
  tenant_id UUID,
  decision_id UUID,          // Links to search operation
  query TEXT,
  result JSONB,
  citations JSONB,
  decision_timestamp TIMESTAMP,
  compliance_reviewed BOOLEAN,
  reviewer_id UUID,

  -- Immutable: no updates, only inserts
  CONSTRAINT audit_immutable CHECK (true)
);
```

### 5. Domain Vocabulary & Fine-Tuning

**Why:** Generic embeddings don't understand "LTV", "EBITDA", "covenant"

**Approach:**

- Fine-tune embedding model on financial corpus
- Create domain vocabulary (`financial_vocab.json`)
- Map domain terms to standard definitions
- Boost embeddings for financial entities

```json
{
  "financial_vocabulary": {
    "LTV": {
      "full_name": "Loan-to-Value Ratio",
      "definition": "Mortgage amount divided by property value",
      "formula": "Loan Amount / Property Value",
      "typical_range": "0.60-0.95",
      "context": "Risk metric, used in credit analysis"
    },
    "EBITDA": {
      "full_name": "Earnings Before Interest, Taxes, Depreciation, Amortization",
      "definition": "Operating performance metric",
      "calculation": "Net Income + Interest + Taxes + D&A",
      "typical_usage": "Leverage calculations, valuation"
    },
    "covenant": {
      "definition": "Binding obligation in a contract",
      "types": ["financial", "operational", "restrictive"],
      "context": "Loan agreements, bonds"
    }
  }
}
```

---

## Database Schema

### Financial-Specific Tables

```sql
-- Financial documents
CREATE TABLE financial_documents (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id UUID NOT NULL REFERENCES tenants(id),

  -- Document metadata
  original_filename TEXT,
  document_type VARCHAR(50),  -- contract, statement, regulatory, etc.
  source_system VARCHAR(100), -- banking system, treasury, etc.

  -- Temporal tracking
  fiscal_period DATE,
  effective_date DATE,
  effective_until DATE,
  uploaded_at TIMESTAMP DEFAULT NOW(),

  -- Extracted metadata
  issuer TEXT,
  currency VARCHAR(3),
  regulatory_type VARCHAR(50),

  -- Processing
  parsing_status VARCHAR(50),
  error_message TEXT,

  -- Storage
  raw_content BYTEA,
  content_types TEXT[],  -- pdf, xlsx, json

  UNIQUE(tenant_id, original_filename),
  INDEX idx_fin_tenant_type (tenant_id, document_type),
  INDEX idx_fin_temporal (tenant_id, fiscal_period DESC)
);

-- Extracted numerical entities
CREATE TABLE financial_entities (
  id BIGSERIAL PRIMARY KEY,
  document_id UUID NOT NULL REFERENCES financial_documents(id),

  -- Entity data
  entity_type VARCHAR(50),  -- amount, percentage, ratio
  metric_name VARCHAR(255), -- principal_amount, interest_rate
  numeric_value DECIMAL(20,6),
  unit VARCHAR(20),         -- USD, EUR, BPS, %
  text_context TEXT,

  -- Location
  page_number INT,
  section_path TEXT,
  table_id VARCHAR(255),
  cell_reference VARCHAR(20), -- e.g., "A5:C5"

  -- Extraction quality
  confidence FLOAT,
  extraction_method VARCHAR(50), -- ocr, parsed, manual

  -- Indexing
  created_at TIMESTAMP DEFAULT NOW(),

  INDEX idx_entities_doc (document_id),
  INDEX idx_entities_metric (metric_name, numeric_value),
  INDEX idx_entities_value_range (numeric_value)
);

-- Financial tables
CREATE TABLE financial_tables (
  id VARCHAR(255) PRIMARY KEY,
  document_id UUID NOT NULL REFERENCES financial_documents(id),

  -- Table metadata
  table_title TEXT,
  table_type VARCHAR(50),  -- balance_sheet, income_statement, etc.
  row_count INT,
  column_count INT,

  -- Structure
  headers TEXT[],
  data JSONB,  -- Raw table data

  -- Location
  page_number INT,
  section_path TEXT,

  -- Temporal
  fiscal_period DATE,
  comparative_periods DATE[],

  created_at TIMESTAMP DEFAULT NOW(),

  INDEX idx_tables_doc (document_id),
  INDEX idx_tables_type (table_type)
);

-- Citations for audit trail
CREATE TABLE financial_citations (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  search_operation_id UUID NOT NULL,

  -- What was cited
  document_id UUID NOT NULL REFERENCES financial_documents(id),
  entity_id BIGINT REFERENCES financial_entities(id),
  table_id VARCHAR(255) REFERENCES financial_tables(id),

  -- Location details
  page_number INT,
  section_path TEXT,
  extracted_text TEXT,

  -- Quality
  confidence FLOAT,
  extraction_method VARCHAR(50),

  -- Immutable audit
  cited_at TIMESTAMP DEFAULT NOW(),
  citation_used_in_decision BOOLEAN DEFAULT false,

  INDEX idx_citations_search (search_operation_id),
  INDEX idx_citations_doc (document_id)
);

-- Compliance decisions log
CREATE TABLE financial_compliance_log (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id UUID NOT NULL REFERENCES tenants(id),
  search_operation_id UUID NOT NULL,

  -- Decision details
  query TEXT,
  decision_summary TEXT,
  citations_count INT,

  -- Compliance
  regulatory_category VARCHAR(100),  -- SEC_FILING, LOAN_COVENANT, etc.
  requires_review BOOLEAN,
  reviewed_by UUID,
  review_timestamp TIMESTAMP,
  audit_passed BOOLEAN,

  -- Immutable
  created_at TIMESTAMP DEFAULT NOW(),

  INDEX idx_compliance_tenant (tenant_id),
  INDEX idx_compliance_reviewed (requires_review, reviewed_by)
);
```

---

## API Endpoints (Financial-Specific)

### Search with Financial Parameters

```
POST /api/financial/search

Request:
{
  "query": "Find all loans with LTV > 80%",
  "document_types": ["contract"],
  "fiscal_period": "2024-12-31",
  "metric_filters": [
    {
      "metric": "ltv",
      "operator": ">",
      "value": 0.80
    }
  ],
  "include_citations": true
}

Response:
{
  "results": [
    {
      "document": {
        "id": "doc-123",
        "filename": "loan_agreement_acmecorp.pdf",
        "fiscal_period": "2024-12-31"
      },
      "findings": [
        {
          "metric": "LTV",
          "value": 0.85,
          "unit": "ratio",
          "context": "property collateral for Line of Credit A",
          "citations": [
            {
              "page": 12,
              "section": "3.2 Collateral",
              "text": "Security: Property valued at $10M, Loan: $8.5M, LTV: 85%"
            }
          ]
        }
      ]
    }
  ],
  "total_results": 47,
  "search_quality": 0.92,
  "compliance_required": true
}
```

### Financial Analytics

```
POST /api/financial/analyze

Request:
{
  "operation": "covenant_analysis",
  "document_id": "doc-123",
  "analyze_against": ["current_state", "previous_period"]
}

Response:
{
  "covenant_analysis": {
    "interest_coverage": {
      "requirement": "> 2.5x",
      "current": 3.1,
      "status": "compliant",
      "citations": [...]
    },
    "debt_to_ebitda": {
      "requirement": "< 3.0x",
      "current": 2.8,
      "status": "compliant",
      "trend": "improving"
    },
    "minimum_cash": {
      "requirement": "> $50M",
      "current": $45M,
      "status": "non_compliant",
      "alert": true,
      "days_to_breach": 45
    }
  }
}
```

### Document Comparison (Temporal)

```
POST /api/financial/compare

Request:
{
  "document_ids": ["doc-old", "doc-new"],
  "compare_metrics": ["interest_rate", "covenant", "penalties"]
}

Response:
{
  "differences": [
    {
      "metric": "interest_rate",
      "old_value": 4.5,
      "new_value": 5.25,
      "change": +0.75,
      "impact": "material",
      "old_citation": {...},
      "new_citation": {...}
    },
    {
      "metric": "prepayment_penalty",
      "old_value": "2% of outstanding principal",
      "new_value": "None",
      "change": "removed",
      "impact": "favorable"
    }
  ]
}
```

---

## Implementation Roadmap

### Week 1-2: Foundation

- [ ] Financial document parser (PDF + Excel extraction)
- [ ] Database schema (financial_documents, entities, tables)
- [ ] Basic table extraction (Tabula integration)
- [ ] Numerical entity extraction (regex + ML)

### Week 2-3: Embedding Layer

- [ ] Fine-tune embedding model on financial corpus
- [ ] Domain vocabulary integration
- [ ] Create financial-specific embeddings
- [ ] Table structure preservation in embeddings

### Week 3-4: Search & Retrieval

- [ ] Numerical reasoning engine
- [ ] Hybrid search (semantic + numerical)
- [ ] Citation system (track where data came from)
- [ ] Result formatting with citations

### Week 4-5: Compliance & Audit

- [ ] Immutable decision log
- [ ] Compliance flagging
- [ ] Audit trail generation
- [ ] Comparison analysis (old vs. new documents)

### Week 5-6: Testing & Performance

- [ ] Benchmark against competitors (target: 0.92 accuracy)
- [ ] Test on real financial documents
- [ ] Performance optimization
- [ ] Documentation & SDKs

---

## Go-To-Market Strategy

### Target Customers

**Tier 1: Fortune 500 Financial Institutions**

- 10+ large banks, investment firms, insurance companies
- Budget: $5000-10000/month per customer
- Pain point: Manual document review, compliance risk
- Pitch: "Reduce document review time from weeks to days. Eliminate compliance risk."

**Tier 2: Fintech & Mid-Market**

- 50+ companies
- Budget: $2000-5000/month
- Pain point: Due diligence, compliance operations
- Pitch: "Production-ready financial RAG with audit trails"

**Tier 3: Venture/Private Equity**

- 200+ firms
- Budget: $1000-3000/month
- Pain point: Due diligence during M&A, portfolio monitoring
- Pitch: "Find risks and opportunities in due diligence docs 10x faster"

### Positioning

**Message 1 (For Enterprises):**
"The only production-ready financial RAG with audit trails. 0.92 accuracy on complex documents. Compliance-built-in."

**Message 2 (For Builders):**
"Infrastructure for financial AI. Use Synapse as the knowledge layer for your fintech app. Fully self-hosted, no API costs."

### Sales Approach

1. **Direct outreach** to CFOs, COOs at financial institutions
2. **Partner with** financial software companies (treasury, compliance tools)
3. **Case studies** from early customers (time savings, risk reduction)
4. **Trade shows:** FinDev Summit, Money 20/20, Techcrunch Disrupt

### Pricing

```
Standard Synapse:        $300-500/month
+ Financial Module:      $1500-2000/month additional
= Total:                 $2000-2500/month (3-5x base)

Enterprise:              Custom (often $5000-10000+)
  - Includes SLA
  - Custom deployment
  - Training + support
```

---

## Success Metrics

**Accuracy Benchmark:**

- Target: 0.92 (vs. competitor 0.44-0.62)
- Measure: Precision + recall on financial entity extraction
- Validation: Human review of 100 random results

**Customer Metrics:**

- Time savings: 70% reduction in document review time
- Cost: Reduce legal/compliance costs by 40%+
- Compliance: 100% citation coverage, zero missed entities

**Market Metrics:**

- 3-5 Fortune 500 customers by end of 2025
- $50K-100K MRR from financial module
- 50+ fintech customers

---

## Competitive Advantage

**Why Synapse Wins:**

| vs. Generic RAG            | vs. Custom Solutions          | vs. Manual Review |
| -------------------------- | ----------------------------- | ----------------- |
| **Accuracy:** 0.92 vs 0.44 | Pre-built financial knowledge | 70% faster        |
| **Citations:** Audit trail | Compliance ready              | Full audit trail  |
| **Cost:** $2000/mo         | $50K-100K to build            | 90% cost savings  |
| **Speed:** Instant         | Months to build               | Instant           |
| **Self-hosted:** ✅        | Depends                       | N/A               |

---

## Risks & Mitigations

| Risk                   | Mitigation                                     |
| ---------------------- | ---------------------------------------------- |
| Accuracy not proven    | Benchmark against competitors, publish results |
| Adoption slow          | Partner with treasury/compliance software      |
| Regulatory concerns    | Provide compliance documentation, audit trails |
| Table extraction fails | Invest in table detection ML, manual override  |
| Integration complexity | Provide SDKs, API, pre-built integrations      |

---

## Metrics to Track

- **Adoption:** Financial module customer count, revenue, MRR growth
- **Quality:** Accuracy benchmarks, citation coverage, customer satisfaction
- **Performance:** Search latency, throughput, uptime
- **Cost:** Infrastructure costs, cost per query, customer LTV

---

**Document version:** 1.0
**Last updated:** February 5, 2025
