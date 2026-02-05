# Synapse Observability Dashboard Specification

**Status:** Architecture & Implementation Guide
**Priority:** Phase 1 (Q1 2025) - Critical Differentiator
**Effort:** 1.5 sprints (80 story points)
**Impact:** Market differentiation (0 competitors have this)

---

## Executive Summary

The Observability Dashboard is Synapse's primary differentiator. It solves the #1 reason RAG systems fail in production: **invisible degradation**.

Current state: Teams deploy RAG, search quality drops silently, no one notices for weeks.

Synapse solution: Real-time dashboard showing exactly what's working, what's failing, why, and at what cost.

**Key insight:** Observability alone closes enterprise deals. "Silent failures dashboard" = table-stakes for production RAG.

---

## Problem Statement

### Why Observability Matters for RAG

73% of production RAG deployments fail silently:

- Embeddings get stale (not updated for 30+ days)
- Retrieval quality degrades (confidence drops below 0.65)
- Vector similarity scores become meaningless
- Keyword search fallback rate spikes (80%+ keyword searches = vector is failing)
- Teams don't notice for weeks, then blame the tool

### Competitors Don't Have This

- ❌ LangChain: No built-in monitoring
- ❌ LlamaIndex: Basic tracing, not structured metrics
- ❌ Chroma: Vector DB, no observability layer
- ❌ PrivateGPT: Focused on deployment, not operations
- ✅ **Synapse:** First open-source RAG tool with production observability

This is our **single biggest differentiator**.

---

## Observability Dashboard Architecture

### High-Level Flow

```
┌─────────────────────────────────────────────────┐
│         Synapse Search/Index Operations         │
│                                                 │
│  POST /api/search                               │
│  POST /api/index                                │
│  POST /api/chat                                 │
└────────────────────┬────────────────────────────┘
                     │
                     ▼ (emit metrics)
┌─────────────────────────────────────────────────┐
│      Observability Middleware                    │
│                                                 │
│  - Latency tracking (start → end)               │
│  - Quality scoring (relevance, confidence)      │
│  - Token/cost tracking                          │
│  - Staleness detection                          │
│  - Error categorization                         │
└────────────────────┬────────────────────────────┘
                     │
        ┌────────────┴────────────┬─────────────┐
        ▼                         ▼             ▼
   PostgreSQL          Prometheus Metrics  Alerting
   (for history)       (for real-time)     (for ops)
        │                         │             │
        └────────────┬────────────┴─────────────┘
                     │
                     ▼
        ┌──────────────────────────────┐
        │   React Dashboard             │
        │   (real-time + historical)    │
        └──────────────────────────────┘
```

---

## Core Metrics to Track

### 1. **Search Quality Metrics**

#### Relevance Score (0-1)

- Definition: How relevant are returned results to the query?
- Measurement: Cosine similarity between query embedding and returned documents
- Target: > 0.75 (good), > 0.85 (excellent)
- Alert: < 0.65 (degraded quality)
- Actions: "Low relevance detected. Consider re-indexing or adjusting chunking strategy"

```
POST /api/search
{
  "query": "authentication",
  "search_method": "vector",
  "relevance_scores": [0.92, 0.88, 0.81, 0.76, 0.72],
  "mean_relevance": 0.818,
  "min_relevance": 0.72
}
```

#### Confidence Score (0-1)

- Definition: How confident is the system in its answer?
- Measurement: Vector similarity - difference between top result and second result
  - High confidence: top result score 0.95, second 0.65 (gap = 0.30)
  - Low confidence: top result score 0.72, second 0.68 (gap = 0.04)
- Target: > 0.15 gap (good), > 0.20 gap (excellent)
- Alert: < 0.10 gap (ambiguous results, might be hallucinating)

```
{
  "confidence_gap": 0.25,
  "method": "vector_only",
  "top_score": 0.92,
  "second_score": 0.67,
  "status": "high_confidence"
}
```

#### Retrieval Method Distribution

- Tracks: What % vector vs. keyword vs. hybrid searches
- Target: 70-80% vector, 10-20% keyword, 10-20% hybrid
- Alert: Keyword > 50% (vector failing, investigate)
- Alert: Hybrid > 40% (vector confidence too low)

```
{
  "today_vector": 78,      // percentage
  "today_keyword": 12,
  "today_hybrid": 10,
  "week_avg_vector": 72,   // vector quality degrading
  "status": "warning"
}
```

### 2. **Performance Metrics**

#### Latency (p50, p95, p99)

- Definition: Time from request → response
- Measurement: End-to-end in milliseconds
- Target: < 20ms (p95), < 50ms (p99)
- Tracked by: Query complexity (short vs. long), result count, index size

```
{
  "operation": "search",
  "p50_ms": 8,
  "p95_ms": 18,
  "p99_ms": 45,
  "mean_ms": 12,
  "outliers": 3  // requests > 100ms
}
```

#### Throughput

- Definition: Queries processed per minute
- Target: Scale from 10 QPS → 1000 QPS
- Alert: Queuing detected (requests > 5s wait time)

#### Index Size & Growth

- Vectors: Size in memory/disk
- Documents: Count of indexed files
- Growth rate: Vectors added per day
- Alert: > 50% growth in 24h (unusual, investigate)

### 3. **Staleness Metrics**

#### Embedding Age Distribution

```
{
  "embeddings_by_age": {
    "0_7_days": {count: 98500, percent: 98.5},
    "7_30_days": {count: 1000, percent: 1.0},
    "30_90_days": {count: 400, percent: 0.4},
    "90_plus_days": {count: 100, percent: 0.1}
  },
  "avg_age_days": 2.3,
  "oldest_embedding_days": 287,  // Alert!
  "last_full_index": "2024-12-01"
}
```

- Alert: > 5% embeddings older than 30 days
- Alert: Any embedding older than 90 days
- Recommendation: "Run incremental index to refresh stale embeddings"

#### Freshness Score

- Definition: How up-to-date is the index relative to actual codebase?
- Measurement: Days since last sync of each file
- Target: < 7 days average
- Alert: > 30 days

### 4. **Cost Metrics**

#### Token Usage (if using external LLM)

```
{
  "today": {
    "tokens_input": 45000,
    "tokens_output": 12000,
    "total_cost_usd": 0.82,
    "avg_cost_per_search": 0.0041
  },
  "month": {
    "total_cost_usd": 245.00,
    "trend": "increasing",
    "forecast_eom": 310.00
  }
}
```

#### Infrastructure Costs

- PostgreSQL disk usage
- Memory usage
- CPU usage during peaks
- Estimated monthly cost (self-hosted)

#### Cost Optimization Insights

- "Your queries average 2000 tokens. Consider shorter context windows"
- "Keyword fallback rate is 40%. Consider reindexing with different chunk size"

### 5. **Error & Failure Metrics**

#### Error Rate by Type

```
{
  "total_errors_24h": 12,
  "error_rate_pct": 0.024,
  "by_type": {
    "indexing_failure": 5,
    "embedding_timeout": 3,
    "database_error": 2,
    "llm_rate_limit": 2
  },
  "alerts": [
    {type: "indexing_failure", count: 5, trend: "increasing"},
    {type: "database_error", count: 2, trend: "new"}
  ]
}
```

#### Silent Failure Detection

- Zero results returned (but quality threshold passed)
- Confidence < 0.10 but results returned
- Keyword fallback required (vector failed)
- Embeddings not updated for file despite change

#### Recovery Insights

- "Rerun index on path/\*.ts to refresh embeddings"
- "Database query slow. Consider adding index on vector_embeddings.path"

---

## Dashboard UI Layout

### 1. **Overview Dashboard (Landing Page)**

**12-widget layout:**

```
┌─────────────────────────────────────────────────────────────┐
│  Synapse Observability      [Date Range: Last 7 days] [Refresh]│
├─────────────────────────────────────────────────────────────┤
│                                                               │
│  ┌──────────────┐  ┌──────────────┐  ┌──────────────┐       │
│  │ Avg Quality  │  │ P95 Latency  │  │ Error Rate   │       │
│  │   0.82/1.0   │  │   18ms       │  │   0.24%      │       │
│  │  ↑ +0.05     │  │  ↑ +2ms      │  │  ↑ -0.10%    │       │
│  └──────────────┘  └──────────────┘  └──────────────┘       │
│                                                               │
│  ┌────────────────────────────────────────────────────────┐ │
│  │ Query Trend (Last 7 days)                              │ │
│  │                                                         │ │
│  │      ╱╲        ╱╲        ╱╲        ╱╲                 │ │
│  │     ╱  ╲      ╱  ╲      ╱  ╲      ╱  ╲               │ │
│  │    ╱    ╲____╱    ╲____╱    ╲____╱    ╲              │ │
│  │   Mon   Tue     Wed     Thu     Fri   Sat   Sun      │ │
│  │ 1.2K   1.8K   2.1K    1.9K    2.3K  1.1K  0.8K     │ │
│  └────────────────────────────────────────────────────────┘ │
│                                                               │
│  ┌────────────────────────┐  ┌───────────────────────────┐  │
│  │ Search Methods (Today) │  │ Alerts & Warnings         │  │
│  │                        │  │                           │  │
│  │  ■ Vector: 78%        │  │ ⚠️ Keyword fallback: 35%  │  │
│  │  ■ Keyword: 12%       │  │ 🔴 Stale embeddings: 8%   │  │
│  │  ■ Hybrid: 10%        │  │ ℹ️ Index updated: now    │  │
│  │                        │  │                           │  │
│  └────────────────────────┘  └───────────────────────────┘  │
│                                                               │
│  ┌────────────────────────┐  ┌───────────────────────────┐  │
│  │ Quality Distribution   │  │ Top Failed Queries        │  │
│  │ (Histogram)            │  │                           │  │
│  │  0.95-1.0:  ▓▓▓▓▓      │  │ 1. "find auth flow"      │  │
│  │  0.85-0.95: ▓▓▓▓▓▓     │  │ 2. "database queries"    │  │
│  │  0.75-0.85: ▓▓▓        │  │ 3. "payment logic"       │  │
│  │  0.65-0.75: ▓          │  │                           │  │
│  │  < 0.65:    ▓          │  │                           │  │
│  └────────────────────────┘  └───────────────────────────┘  │
│                                                               │
└─────────────────────────────────────────────────────────────┘
```

### 2. **Quality Deep-Dive Tab**

Detailed breakdown of search quality:

- Relevance score distribution (histogram)
- Confidence score distribution
- Retrieval method effectiveness comparison
- Quality by hour (heatmap)
- Top performing queries vs. bottom
- Suggestions for improvement

### 3. **Performance Tab**

Performance analysis:

- Latency by percentile (p50, p95, p99)
- Latency trends over time
- Throughput (queries/minute)
- Resource usage (CPU, memory, disk)
- Slowest queries (with breakdown)
- Index stats (size, document count, age)

### 4. **Cost Tab**

Cost analysis:

- Daily cost breakdown
- Cost per query
- Cost per token (if using external LLM)
- Cost forecast (if trend continues)
- Cost optimization recommendations
- Budget alerts

### 5. **Alerts & Incidents Tab**

Alert management:

- All active alerts
- Alert history
- Alert configuration
- Recommended actions
- One-click remediation (e.g., "Reindex now")

### 6. **Logs Tab**

Detailed logs:

- Search queries with quality scores
- Index operations
- Errors and failures
- Filter by: date, query, result quality, error type
- Export capability (CSV, JSON)

---

## Database Schema

### Main Observability Tables

```sql
-- Core metrics table (time-series)
CREATE TABLE observability_metrics (
  id BIGSERIAL PRIMARY KEY,
  tenant_id UUID NOT NULL REFERENCES tenants(id),
  timestamp TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW(),
  metric_name VARCHAR(255) NOT NULL,
  metric_value FLOAT NOT NULL,
  metadata JSONB,

  -- Partitioning by month for performance
  CONSTRAINT metrics_date_check CHECK (timestamp >= '2025-01-01'),
  INDEX idx_metrics_tenant_time (tenant_id, timestamp DESC),
  INDEX idx_metrics_name_time (metric_name, timestamp DESC)
);

-- Partition by month
CREATE TABLE observability_metrics_202501 PARTITION OF observability_metrics
  FOR VALUES FROM ('2025-01-01') TO ('2025-02-01');

-- Search log (detailed record of each search)
CREATE TABLE search_operations (
  id BIGSERIAL PRIMARY KEY,
  tenant_id UUID NOT NULL REFERENCES tenants(id),
  request_id UUID NOT NULL UNIQUE,
  query_text TEXT NOT NULL,
  query_embedding VECTOR(1536),

  -- Quality metrics
  relevance_score FLOAT,
  confidence_score FLOAT,
  retrieval_method VARCHAR(50),  -- vector, keyword, hybrid

  -- Performance
  latency_ms INT,
  tokens_used INT,
  cost_usd DECIMAL(10,6),

  -- Results
  result_count INT,
  top_result_score FLOAT,

  -- Tracking
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  status VARCHAR(50),  -- success, partial_success, failure
  error_message TEXT,

  INDEX idx_search_tenant_time (tenant_id, created_at DESC),
  INDEX idx_search_quality (tenant_id, relevance_score DESC)
);

-- Index operations log
CREATE TABLE index_operations (
  id BIGSERIAL PRIMARY KEY,
  tenant_id UUID NOT NULL REFERENCES tenants(id),

  -- Operation details
  operation VARCHAR(50),  -- full_index, incremental, update
  path_pattern TEXT,
  file_count INT,

  -- Performance
  duration_ms INT,
  documents_indexed INT,
  documents_deleted INT,

  -- Results
  status VARCHAR(50),
  error_message TEXT,
  tokens_used INT,
  cost_usd DECIMAL(10,6),

  -- Tracking
  started_at TIMESTAMP WITH TIME ZONE,
  completed_at TIMESTAMP WITH TIME ZONE,

  INDEX idx_index_tenant_time (tenant_id, completed_at DESC)
);

-- Embedding staleness tracking
CREATE TABLE embedding_freshness (
  id BIGSERIAL PRIMARY KEY,
  tenant_id UUID NOT NULL REFERENCES tenants(id),
  file_path TEXT NOT NULL,
  last_indexed TIMESTAMP WITH TIME ZONE,
  last_modified_in_repo TIMESTAMP WITH TIME ZONE,
  age_days INT,
  status VARCHAR(50),  -- fresh, stale, very_stale

  UNIQUE(tenant_id, file_path),
  INDEX idx_freshness_tenant_age (tenant_id, age_days DESC)
);

-- Alerts & incidents
CREATE TABLE observability_alerts (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id UUID NOT NULL REFERENCES tenants(id),

  -- Alert definition
  alert_type VARCHAR(255),  -- low_quality, high_latency, high_error_rate
  severity VARCHAR(50),  -- critical, warning, info
  condition VARCHAR(255),  -- e.g., "relevance_score < 0.65"
  threshold FLOAT,

  -- Incident tracking
  triggered_at TIMESTAMP WITH TIME ZONE,
  resolved_at TIMESTAMP WITH TIME ZONE,
  metadata JSONB,

  -- Actions
  action_type VARCHAR(255),  -- email, slack, webhook
  action_status VARCHAR(50),

  INDEX idx_alerts_tenant_time (tenant_id, triggered_at DESC),
  INDEX idx_alerts_active (tenant_id, resolved_at) WHERE resolved_at IS NULL
);

-- Query suggestions (ML-generated recommendations)
CREATE TABLE query_suggestions (
  id BIGSERIAL PRIMARY KEY,
  tenant_id UUID NOT NULL REFERENCES tenants(id),

  suggestion_type VARCHAR(255),  -- reindex, adjust_chunking, refresh_embeddings
  target_path TEXT,
  rationale TEXT,
  estimated_impact FLOAT,

  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  dismissed_at TIMESTAMP WITH TIME ZONE,

  INDEX idx_suggestions_tenant (tenant_id)
);
```

### Data Retention & Partitioning

- **search_operations:** Partition by month, keep 90 days
- **index_operations:** Partition by month, keep 1 year (audit trail)
- **observability_metrics:** Partition by month, keep 1 year
- **audit_logs:** Partition by month, keep 3 years (compliance)
- **embedding_freshness:** Updated daily, no partitioning

---

## API Endpoints for Dashboard

### Metrics Retrieval

```
GET /api/observability/metrics

Query params:
  - start_date: ISO 8601 (default: 7 days ago)
  - end_date: ISO 8601 (default: now)
  - granularity: hour|day|week (default: hour)
  - metrics: list of metric names (default: all)

Response:
{
  "metrics": {
    "mean_relevance": [
      {timestamp: "2025-02-01T00:00:00Z", value: 0.82},
      {timestamp: "2025-02-01T01:00:00Z", value: 0.84},
      ...
    ],
    "p95_latency": [...],
    ...
  }
}
```

### Search Operations

```
GET /api/observability/searches

Query params:
  - limit: 100
  - offset: 0
  - quality_min: 0.65
  - quality_max: 1.0
  - method: vector|keyword|hybrid
  - status: success|failure

Response:
{
  "searches": [
    {
      request_id: "uuid",
      query: "authentication",
      relevance_score: 0.89,
      confidence_score: 0.25,
      latency_ms: 12,
      method: "vector",
      result_count: 5,
      status: "success"
    }
  ],
  "total": 15243,
  "page": 1
}
```

### Alerts

```
GET /api/observability/alerts

Response:
{
  "active": [
    {
      alert_type: "low_quality",
      severity: "warning",
      description: "Mean relevance dropped below 0.75",
      triggered_at: "2025-02-05T14:30:00Z",
      metadata: {current_value: 0.72, threshold: 0.75}
    }
  ],
  "suggested_actions": [
    {
      action: "reindex",
      reason: "Many embeddings are stale (>30 days)",
      estimated_impact: 0.08
    }
  ]
}
```

---

## Dashboard Frontend Components

### Tech Stack

- React + TypeScript
- Recharts or Plotly for visualizations
- Tanstack Query for data fetching
- Zustand for state management

### Key Components

```typescript
// Main dashboard view
<ObservabilityDashboard />
  └─ <OverviewCards />      // 3x3 metric cards
  └─ <TrendChart />         // 7-day trend line
  └─ <MethodDistribution /> // Pie chart: vector/keyword/hybrid
  └─ <QualityHistogram />   // Distribution of relevance scores
  └─ <AlertsPanel />        // Active alerts & suggestions
  └─ <DateRangeSelector />  // 7d, 30d, 90d, custom

// Detailed tabs
<QualityDetails />
<PerformanceDetails />
<CostAnalysis />
<AlertManagement />
<Logs />
```

---

## Implementation Roadmap

### Week 1-2: Foundation

- [ ] Database schema creation (observability tables)
- [ ] Metrics emission middleware (hook into search/index endpoints)
- [ ] Prometheus metrics export (`GET /metrics`)
- [ ] Basic data collection (latency, quality, method distribution)

### Week 2-3: Core Dashboard

- [ ] React dashboard scaffolding
- [ ] Overview cards (quality, latency, error rate)
- [ ] Trend charts (7-day query volume, quality trend)
- [ ] Search method distribution pie chart

### Week 3-4: Advanced Features

- [ ] Quality deep-dive tab
- [ ] Performance tab with latency analysis
- [ ] Alerts management
- [ ] Query logs & search history

### Week 4-5: Intelligence & Polish

- [ ] Query suggestions (ML recommendations)
- [ ] Cost analysis & optimization
- [ ] Alert evaluation & testing
- [ ] Performance optimization (query caching)

---

## Success Criteria

✅ **Core Metrics:**

- All key metrics (quality, latency, errors) captured and displayed
- Dashboard loads in <2s
- Metrics update in real-time (<1s lag)
- Can query any 7-day date range efficiently

✅ **Functionality:**

- Alerts trigger correctly for all defined conditions
- Suggestions are actionable and accurate
- Cost tracking within 5% of actual
- Silent failure detection catches 90%+ of issues

✅ **Performance:**

- Handle 1M+ metrics without degradation
- Dashboard with 30 days of data loads in <2s
- Metrics API responds in <500ms
- No impact on search latency (< 5% overhead)

✅ **User Experience:**

- Intuitive navigation between tabs
- Clear visualization of metrics
- Actionable recommendations
- One-click remediation (e.g., "Reindex now")

---

## Monitoring the Monitors

How do we know the observability system itself is working?

- Metrics collection success rate (should be 99.9%+)
- Dashboard uptime (99.9%+)
- Metadata accuracy (spot-check 10% of metrics)
- Alert false positive rate (< 5%)

---

## Future Enhancements (Post-Phase 1)

- **Machine learning** for anomaly detection
- **Predictive** alerts (quality will degrade in 2 hours based on trend)
- **SLA tracking** (uptime, response time SLAs)
- **Team comparison** (compare quality across teams)
- **Integrations:** Datadog, New Relic, Grafana
- **Custom metrics:** Allow tenants to define custom metrics
- **ML-powered insights:** "Your team searches for X 50% more than peers"

---

## Competitive Advantage

This observability dashboard is:

- ✅ **First in class** for open-source RAG
- ✅ **Production-grade** (not beta, not POC)
- ✅ **Differentiation** (0 competitors have this)
- ✅ **Enterprise requirement** (enables large deployments)
- ✅ **Trust builder** (visibility = confidence)

**Messaging:** "The only open-source RAG tool with production observability."

---

## Q&A / Design Decisions

**Q: Why PostgreSQL for metrics instead of time-series DB?**
A: Simplicity. Teams already have PostgreSQL. Partitioning handles scale. Reduces dependencies.

**Q: What's the data retention policy?**
A: 90 days hot (fast queries), 1 year warm (archived for compliance). Matches enterprise audit requirements.

**Q: Can we stripe metrics by query type?**
A: Yes, add `category` field (auth, payment, search, etc.). Plan for Phase 2.

**Q: How do we handle high-throughput scenarios?**
A: Batch metrics inserts (10-100 per transaction). Use connection pooling. Partition by month.

**Q: What about privacy? Aren't we logging all queries?**
A: Log structure/metadata only, not full query text. Encrypt sensitive queries. Add privacy controls per tenant.

---

**Document version:** 1.0
**Last updated:** February 5, 2025
