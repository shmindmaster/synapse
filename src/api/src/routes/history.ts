import { FastifyInstance } from 'fastify';
import { ZodTypeProvider } from 'fastify-type-provider-zod';
import { z } from 'zod';
import { verifyAuth } from '../middleware/auth.js';
import { prisma } from '../config/db.js';

const createQuerySchema = z.object({
  query: z.string().min(1),
  queryType: z.enum(['semantic', 'text', 'chat']),
  resultCount: z.number().optional(),
  metadata: z.record(z.any()).optional(),
});

const toggleSaveSchema = z.object({
  queryId: z.string().uuid(),
  isSaved: z.boolean(),
});

/**
 * Query history routes for tracking and managing search history
 */
export async function historyRoutes(app: FastifyInstance) {
  // GET /history - Get query history for current user
  app.withTypeProvider<ZodTypeProvider>().get(
    '/history',
    { onRequest: [verifyAuth] },
    async (request, reply) => {
      const userId = (request as any).user?.id;
      const { limit = 50, saved } = request.query as { limit?: number; saved?: string };

      try {
        const where: any = {};
        if (userId) where.userId = userId;
        if (saved === 'true') where.isSaved = true;

        const history = await prisma.queryHistory.findMany({
          where,
          orderBy: { createdAt: 'desc' },
          take: Math.min(limit, 100),
          select: {
            id: true,
            query: true,
            queryType: true,
            resultCount: true,
            isSaved: true,
            metadata: true,
            createdAt: true,
          },
        });

        return reply.status(200).send({
          success: true,
          history,
          count: history.length,
        });
      } catch (error) {
        console.error('History fetch error:', error);
        return reply.status(500).send({
          success: false,
          error: 'Failed to fetch query history',
        });
      }
    }
  );

  // POST /history - Record a new query (called internally by search routes)
  app.withTypeProvider<ZodTypeProvider>().post<{ Body: z.infer<typeof createQuerySchema> }>(
    '/history',
    {
      onRequest: [verifyAuth],
      schema: { body: createQuerySchema },
    },
    async (request, reply) => {
      const userId = (request as any).user?.id;
      const { query, queryType, resultCount = 0, metadata } = request.body;

      try {
        const entry = await prisma.queryHistory.create({
          data: {
            userId,
            query,
            queryType,
            resultCount,
            metadata: metadata || {},
          },
        });

        return reply.status(201).send({
          success: true,
          id: entry.id,
        });
      } catch (error) {
        console.error('History create error:', error);
        return reply.status(500).send({
          success: false,
          error: 'Failed to record query',
        });
      }
    }
  );

  // PATCH /history/save - Toggle saved status for a query
  app.withTypeProvider<ZodTypeProvider>().patch<{ Body: z.infer<typeof toggleSaveSchema> }>(
    '/history/save',
    {
      onRequest: [verifyAuth],
      schema: { body: toggleSaveSchema },
    },
    async (request, reply) => {
      const userId = (request as any).user?.id;
      const { queryId, isSaved } = request.body;

      try {
        // Verify ownership
        const existing = await prisma.queryHistory.findFirst({
          where: { id: queryId, userId },
        });

        if (!existing) {
          return reply.status(404).send({
            success: false,
            error: 'Query not found',
          });
        }

        await prisma.queryHistory.update({
          where: { id: queryId },
          data: { isSaved },
        });

        return reply.status(200).send({
          success: true,
          isSaved,
        });
      } catch (error) {
        console.error('History save toggle error:', error);
        return reply.status(500).send({
          success: false,
          error: 'Failed to update saved status',
        });
      }
    }
  );

  // DELETE /history/:id - Delete a query from history
  app.withTypeProvider<ZodTypeProvider>().delete(
    '/history/:id',
    { onRequest: [verifyAuth] },
    async (request, reply) => {
      const userId = (request as any).user?.id;
      const { id } = request.params as { id: string };

      try {
        // Verify ownership
        const existing = await prisma.queryHistory.findFirst({
          where: { id, userId },
        });

        if (!existing) {
          return reply.status(404).send({
            success: false,
            error: 'Query not found',
          });
        }

        await prisma.queryHistory.delete({
          where: { id },
        });

        return reply.status(200).send({
          success: true,
        });
      } catch (error) {
        console.error('History delete error:', error);
        return reply.status(500).send({
          success: false,
          error: 'Failed to delete query',
        });
      }
    }
  );

  // DELETE /history - Clear all history for current user
  app.withTypeProvider<ZodTypeProvider>().delete(
    '/history/clear',
    { onRequest: [verifyAuth] },
    async (request, reply) => {
      const userId = (request as any).user?.id;
      const { keepSaved } = request.query as { keepSaved?: string };

      try {
        const where: any = { userId };
        if (keepSaved === 'true') {
          where.isSaved = false; // Only delete non-saved
        }

        const result = await prisma.queryHistory.deleteMany({ where });

        return reply.status(200).send({
          success: true,
          deleted: result.count,
        });
      } catch (error) {
        console.error('History clear error:', error);
        return reply.status(500).send({
          success: false,
          error: 'Failed to clear history',
        });
      }
    }
  );
}
