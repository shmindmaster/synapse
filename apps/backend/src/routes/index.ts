import { FastifyInstance } from 'fastify';
import { ZodTypeProvider } from 'fastify-type-provider-zod';
import { z } from 'zod';
import { VectorStoreService } from '../services/vectorStore.js';
import { verifyAuth } from '../middleware/auth.js';

const indexBrowserFilesSchema = z.object({
  files: z
    .array(
      z.object({
        path: z.string(),
        content: z.string(),
        preview: z.string().optional(),
      })
    )
    .min(1),
});

const indexWatchSchema = z.object({
  directory: z.string(),
  patterns: z.array(z.string()).optional(),
});

/**
 * Indexing routes for file and directory indexing
 * All routes require authentication
 */
export async function indexRoutes(app: FastifyInstance) {
  const vectorStore = new VectorStoreService();

  // POST /index-browser-files - Index files from browser/API
  app.withTypeProvider<ZodTypeProvider>().post<{ Body: z.infer<typeof indexBrowserFilesSchema> }>(
    '/index-browser-files',
    {
      onRequest: [verifyAuth],
      schema: { body: indexBrowserFilesSchema },
    },
    async (request, reply) => {
      const { files } = request.body;

      try {
        // Upsert vectors for each file
        await vectorStore.upsertVectors(
          files.map(file => ({
            path: file.path,
            content: file.content,
            preview: file.preview || file.content.substring(0, 200),
            embedding: null, // Embedding will be generated separately
          }))
        );

        return reply.status(202).send({
          success: true,
          message: `Indexed ${files.length} file(s)`,
          indexedCount: files.length,
        });
      } catch (error) {
        console.error('Indexing error:', error);
        return reply.status(500).send({
          success: false,
          error: 'Indexing failed',
        });
      }
    }
  );

  // POST /index-watch - Start watching a directory (requires backend implementation)
  app.withTypeProvider<ZodTypeProvider>().post<{ Body: z.infer<typeof indexWatchSchema> }>(
    '/index-watch',
    {
      onRequest: [verifyAuth],
      schema: { body: indexWatchSchema },
    },
    async (request, reply) => {
      const { directory, patterns = [] } = request.body;

      try {
        // TODO: Implement file watcher using FileWatcherService
        // For now, return a placeholder response

        return reply.status(202).send({
          success: true,
          message: `Starting to watch directory: ${directory}`,
          directory,
          patterns,
          status: 'watching',
        });
      } catch (error) {
        console.error('Watch error:', error);
        return reply.status(500).send({
          success: false,
          error: 'Failed to start watching',
        });
      }
    }
  );

  // GET /index-browser-files - Get list of indexed browser files
  app.get('/index-browser-files', { onRequest: [verifyAuth] }, async (request, reply) => {
    try {
      // Get all indexed paths
      const paths = await vectorStore.getAllPaths();

      return reply.status(200).send({
        success: true,
        files: paths,
        count: paths.length,
      });
    } catch (error) {
      console.error('Error getting indexed files:', error);
      return reply.status(500).send({
        success: false,
        error: 'Failed to get indexed files',
      });
    }
  });
}
