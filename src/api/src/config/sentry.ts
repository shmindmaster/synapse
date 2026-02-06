/**
 * Enhanced Sentry Configuration for AI Application Monitoring
 * Tracks AI operations, embeddings, and performance
 */
import * as Sentry from '@sentry/node';
import { FastifyRequest } from 'fastify';

// Custom metrics for AI operations
export interface AIOperationMetrics {
  operation: 'chat' | 'search' | 'embedding' | 'batch_embedding';
  duration: number;
  success: boolean;
  model?: string;
  tokensUsed?: number;
  embeddingDimensions?: number;
  batchSize?: number;
  error?: Error;
}

/**
 * Track AI operation with custom metrics
 */
export function trackAIOperation(metrics: AIOperationMetrics): void {
  const span = Sentry.startInactiveSpan({
    op: `ai.${metrics.operation}`,
    name: `AI ${metrics.operation}`,
  });

  // Add custom measurements (attributes in v8)
  if (metrics.tokensUsed) {
    span.setAttribute('tokens_used', metrics.tokensUsed);
  }
  if (metrics.embeddingDimensions) {
    span.setAttribute('embedding_dimensions', metrics.embeddingDimensions);
  }
  if (metrics.batchSize) {
    span.setAttribute('batch_size', metrics.batchSize);
  }

  // Add tags (attributes)
  span.setAttribute('ai.operation', metrics.operation);
  span.setAttribute('ai.success', metrics.success);
  if (metrics.model) {
    span.setAttribute('ai.model', metrics.model);
  }

  // Track error if failed
  if (!metrics.success && metrics.error) {
    Sentry.captureException(metrics.error, {
      extra: {
        ai_operation: metrics.operation,
        ai_model: metrics.model,
        duration: metrics.duration,
      },
    });
  }

  // setMeasurement is replaced by setAttribute for standard metrics, or specific metrics API?
  // For duration, we just record it via end timestamp? 
  // But here we are recording a past duration.
  // startInactiveSpan returns a span that is already started? Yes.
  // To record manual duration, we might need to manually handle start/end times if we wanted, 
  // but here we just want to log it.
  // We can set attribute 'duration_ms'.
  span.setAttribute('duration_ms', metrics.duration);

  if (metrics.success) {
    span.setStatus({ code: 1 }); // OK
  } else {
    span.setStatus({ code: 2 }); // ERROR
  }

  span.end();
}

/**
 * Track database query performance
 */
export function trackDatabaseQuery(query: string, duration: number, success: boolean): void {
  const span = Sentry.startInactiveSpan({
    op: 'db.query',
    name: 'Database Query',
  });

  span.setAttribute('duration_ms', duration);
  span.setAttribute('db.success', success);

  if (success) {
    span.setStatus({ code: 1 });
  } else {
    span.setStatus({ code: 2 });
  }

  // Truncate query for privacy
  const truncatedQuery = query.length > 100 ? query.substring(0, 100) + '...' : query;
  span.setAttribute('db.statement', truncatedQuery);

  span.end();
}

/**
 * Track API endpoint performance with user context
 */
export function trackAPIEndpoint(
  request: FastifyRequest,
  duration: number,
  statusCode: number
): void {
  const user = (request as any).user;

  if (user?.sub) {
    Sentry.setUser({
      id: user.sub,
      email: user.email,
    });
  }

  // In v8 Contexts are handled differently, but setContext still exists on Scope? 
  // Sentry.getCurrentScope().setContext(...)
  // We'll leave global context setting as is if valid, or remove if causing issues.
  // Sentry.setContext is deprecated? It's Sentry.getCurrentScope().setContext(...)
  Sentry.getCurrentScope().setContext('request', {
    method: request.method,
    url: request.url,
    headers: {
      'user-agent': request.headers['user-agent'],
      'content-type': request.headers['content-type'],
    },
  });

  const span = Sentry.startInactiveSpan({
    op: 'http.server',
    name: `${request.method} ${request.url}`,
  });

  span.setAttribute('duration_ms', duration);
  span.setAttribute('http.response.status_code', statusCode);
  span.end();
}

/**
 * Track vector search performance
 */
export function trackVectorSearch(params: {
  query: string;
  resultsCount: number;
  duration: number;
  similarityThreshold: number;
  success: boolean;
}): void {
  const span = Sentry.startInactiveSpan({
    op: 'vector.search',
    name: 'Vector Search',
  });

  span.setAttribute('results_count', params.resultsCount);
  span.setAttribute('similarity_threshold', params.similarityThreshold);
  span.setAttribute('duration_ms', params.duration);

  span.setAttribute('vector.success', params.success);

  if (params.success) {
    span.setStatus({ code: 1 });
  } else {
    span.setStatus({ code: 2 });
  }

  span.end();
}


/**
 * Set up performance monitoring hooks for Prisma
 */
export function setupPrismaMonitoring(prisma: any): void {
  if (!prisma.$on) return;

  prisma.$on('query', (e: any) => {
    const duration = e.duration;
    const query = e.query;

    if (duration > 1000) {
      // Log slow queries
      Sentry.captureMessage(`Slow database query: ${duration}ms`, {
        level: 'warning',
        extra: {
          query: query.substring(0, 200),
          duration,
        },
      });
    }

    trackDatabaseQuery(query, duration, true);
  });
}

/**
 * Breadcrumb for AI operations
 */
export function addAIBreadcrumb(operation: string, data: Record<string, any>): void {
  Sentry.addBreadcrumb({
    category: 'ai',
    message: `AI operation: ${operation}`,
    level: 'info',
    data,
  });
}

/**
 * Initialize Sentry with enhanced configuration
 */
export function initializeSentry(): void {
  if (!process.env.SENTRY_DSN) {
    console.warn('Sentry DSN not configured. Monitoring disabled.');
    return;
  }

  Sentry.init({
    dsn: process.env.SENTRY_DSN,
    environment: process.env.NODE_ENV || 'development',

    // Performance monitoring
    tracesSampleRate: process.env.NODE_ENV === 'production' ? 0.1 : 1.0,

    // Enhanced error tracking
    beforeSend(event, hint) {
      // Filter out certain errors
      const error = hint.originalException;
      if (error && typeof error === 'object' && 'statusCode' in error) {
        const statusCode = (error as any).statusCode;
        // Don't report 4xx errors
        if (statusCode >= 400 && statusCode < 500) {
          return null;
        }
      }
      return event;
    },

    // Integrations
    integrations: [Sentry.httpIntegration(), Sentry.expressIntegration()],
  });

  console.log('Sentry monitoring initialized');
}
