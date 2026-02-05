import { FastifyInstance } from 'fastify';
import { ZodTypeProvider } from 'fastify-type-provider-zod';
import { z } from 'zod';
import { verifyAuth } from '../middleware/auth.js';
import { searchService } from '../services/searchService.js';

const semanticSearchSchema = z.object({
  query: z.string().min(1),
  limit: z.number().default(10).optional(),
  threshold: z.number().default(0.7).optional(),
});

/**
 * Search routes for semantic and text-based search
 * All routes require authentication
 */
export async function searchRoutes(app: FastifyInstance) {
  // POST /semantic-search - Semantic search with embeddings
  app.withTypeProvider<ZodTypeProvider>().post<{ Body: z.infer<typeof semanticSearchSchema> }>(
    '/semantic-search',
    {
      onRequest: [verifyAuth],
      schema: { body: semanticSearchSchema },
    },
    async (request, reply) => {
      const { query, limit = 10, threshold = 0.7 } = request.body;

      try {
        const results = await searchService.semanticSearch(query, limit, threshold);

        return reply.status(200).send({
          success: true,
          query,
          results,
          count: results.length,
        });
      } catch (error) {
        console.error('Search error:', error);
        return reply.status(500).send({
          success: false,
          error: 'Search failed',
        });
      }
    }
  );

  // POST /search - Text-based search (fallback)
  app.withTypeProvider<ZodTypeProvider>().post<{ Body: z.infer<typeof semanticSearchSchema> }>(
    '/search',
    {
      onRequest: [verifyAuth],
      schema: { body: semanticSearchSchema },
    },
    async (request, reply) => {
      const { query, limit = 10 } = request.body;

      try {
        const results = await searchService.textSearch(query, limit);

        return reply.status(200).send({
          success: true,
          query,
          results,
          count: results.length,
        });
      } catch (error) {
        console.error('Search error:', error);
        return reply.status(500).send({
          success: false,
          error: 'Search failed',
        });
      }
    }
  );

  // GET /index-status - Get indexing status
  app.get('/index-status', { onRequest: [verifyAuth] }, async (request, reply) => {
    try {
      const stats = await searchService.getIndexStats();

      return reply.status(200).send({
        success: true,
        ...stats,
      });
    } catch (error) {
      console.error('Error getting index status:', error);
      return reply.status(500).send({
        success: false,
        error: 'Failed to get index status',
      });
    }
  });

  // GET /index-summary - Get index summary/statistics
  app.get('/index-summary', { onRequest: [verifyAuth] }, async (request, reply) => {
    try {
      const stats = await searchService.getIndexStats();

      return reply.status(200).send({
        success: true,
        summary: {
          totalDocuments: stats.documentCount,
          indexed: stats.hasIndex,
          withEmbeddings: stats.withEmbeddings,
          status: stats.hasIndex ? 'indexed' : 'not_indexed',
        },
      });
    } catch (error) {
      console.error('Error getting index summary:', error);
      return reply.status(500).send({
        success: false,
        error: 'Failed to get index summary',
      });
    }
  });
}
