import { FastifyInstance } from 'fastify';

/**
 * Health check endpoint
 * No authentication required
 */
export async function healthRoutes(app: FastifyInstance) {
  app.get('/health', async (request, reply) => {
    return reply.status(200).send({
      status: 'healthy',
      service: 'Synapse API',
      timestamp: new Date().toISOString(),
      version: '2.0.0',
    });
  });
}
