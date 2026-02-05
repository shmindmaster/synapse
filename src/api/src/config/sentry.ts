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
  const transaction = Sentry.startTransaction({
    op: `ai.${metrics.operation}`,
    name: `AI ${metrics.operation}`,
  });

  // Add custom measurements
  if (metrics.tokensUsed) {
    Sentry.setMeasurement('tokens_used', metrics.tokensUsed, 'none');
  }
  if (metrics.embeddingDimensions) {
    Sentry.setMeasurement('embedding_dimensions', metrics.embeddingDimensions, 'none');
  }
  if (metrics.batchSize) {
    Sentry.setMeasurement('batch_size', metrics.batchSize, 'none');
  }

  // Add tags
  Sentry.setTag('ai.operation', metrics.operation);
  Sentry.setTag('ai.success', metrics.success);
  if (metrics.model) {
    Sentry.setTag('ai.model', metrics.model);
  }

  // Track error if failed
  if (!metrics.success && metrics.error) {
    Sentry.captureException(metrics.error, {
      contexts: {
        ai: {
          operation: metrics.operation,
          model: metrics.model,
          duration: metrics.duration,
        },
      },
    });
  }

  transaction.setMeasurement('duration', metrics.duration, 'millisecond');
  transaction.setStatus(metrics.success ? 'ok' : 'internal_error');
  transaction.finish();
}

/**
 * Track database query performance
 */
export function trackDatabaseQuery(query: string, duration: number, success: boolean): void {
  const transaction = Sentry.startTransaction({
    op: 'db.query',
    name: 'Database Query',
  });

  transaction.setMeasurement('duration', duration, 'millisecond');
  transaction.setTag('db.success', success);
  transaction.setStatus(success ? 'ok' : 'internal_error');

  // Truncate query for privacy
  const truncatedQuery = query.length > 100 ? query.substring(0, 100) + '...' : query;
  transaction.setData('query', truncatedQuery);

  transaction.finish();
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

  Sentry.setContext('request', {
    method: request.method,
    url: request.url,
    headers: {
      'user-agent': request.headers['user-agent'],
      'content-type': request.headers['content-type'],
    },
  });

  const transaction = Sentry.startTransaction({
    op: 'http.server',
    name: `${request.method} ${request.url}`,
  });

  transaction.setMeasurement('duration', duration, 'millisecond');
  transaction.setHttpStatus(statusCode);
  transaction.finish();
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
  const transaction = Sentry.startTransaction({
    op: 'vector.search',
    name: 'Vector Search',
  });

  Sentry.setMeasurement('results_count', params.resultsCount, 'none');
  Sentry.setMeasurement('similarity_threshold', params.similarityThreshold, 'none');
  transaction.setMeasurement('duration', params.duration, 'millisecond');

  Sentry.setTag('vector.success', params.success);
  transaction.setStatus(params.success ? 'ok' : 'internal_error');

  transaction.finish();
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
