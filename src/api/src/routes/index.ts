import { FastifyInstance } from 'fastify';
import { ZodTypeProvider } from 'fastify-type-provider-zod';
import { z } from 'zod';
import { verifyAuth } from '../middleware/auth.js';
import { VectorStoreService } from '../services/vectorStore.js';
import { generateEmbeddingsBatch } from '../services/embeddingService.js';
import { config } from '../config/configuration.js';

// Accepts both formats:
// 1. Chunked (new): { name, path, chunks[] } — each chunk becomes a vector
// 2. Flat (legacy): { path, content, preview } — single vector per file
const indexBrowserFilesSchema = z.object({
  files: z
    .array(
      z.object({
        name: z.string().optional(),
        path: z.string(),
        content: z.string().optional(),
        preview: z.string().optional(),
        chunks: z.array(z.string()).optional(),
      })
    )
    .min(1),
});

const indexWatchSchema = z.object({
  directory: z.string(),
  patterns: z.array(z.string()).optional(),
});

/**
 * Derive file type from path for metadata
 */
function getFileType(path: string): string {
  const lastDot = path.lastIndexOf('.');
  if (lastDot === -1) return 'unknown';
  return path.slice(lastDot + 1).toLowerCase();
}

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
        // Flatten files into individual documents (one per chunk)
        const documents: Array<{
          path: string;
          content: string;
          preview: string;
          metadata: Record<string, any>;
        }> = [];

        for (const file of files) {
          const fileType = getFileType(file.path);
          const baseMeta = {
            sourceFile: file.path,
            fileName: file.name || file.path.split('/').pop() || '',
            fileType,
          };

          if (file.chunks && file.chunks.length > 0) {
            // Chunked format: each chunk becomes a separate vector
            file.chunks.forEach((chunk, idx) => {
              documents.push({
                path: file.chunks!.length > 1 ? `${file.path}#chunk-${idx}` : file.path,
                content: chunk,
                preview: chunk.substring(0, 200),
                metadata: { ...baseMeta, chunkIndex: idx, totalChunks: file.chunks!.length },
              });
            });
          } else if (file.content) {
            // Legacy flat format: single vector per file
            documents.push({
              path: file.path,
              content: file.content,
              preview: file.preview || file.content.substring(0, 200),
              metadata: { ...baseMeta, chunkIndex: 0, totalChunks: 1 },
            });
          }
        }

        if (documents.length === 0) {
          return reply.status(400).send({
            success: false,
            error: 'No indexable content found in the provided files.',
          });
        }

        // Check if AI is configured for embeddings
        const canGenerateEmbeddings = !!(config.ai.openaiApiKey || config.ai.doInferenceApiKey ||
          config.ai.baseUrl || config.ai.useLocalModels);

        let embeddings: number[][] | null = null;

        // Generate embeddings if AI is configured
        if (canGenerateEmbeddings) {
          try {
            const contents = documents.map(d => d.content);
            embeddings = await generateEmbeddingsBatch(contents, {
              model: config.ai.useLocalModels
                ? config.ai.local.embeddingModel
                : config.ai.embeddingModel,
              dimensions: config.ai.useLocalModels
                ? config.ai.local.embeddingDimensions
                : config.ai.embeddingDimensions,
              batchSize: config.ai.embeddingBatchSize,
            });
          } catch (embeddingError) {
            console.warn('Failed to generate embeddings, storing text-only:', embeddingError);
          }
        }

        // Upsert vectors for each document chunk (with embeddings if available)
        await vectorStore.upsertVectors(
          documents.map((doc, idx) => ({
            path: doc.path,
            content: doc.content,
            preview: doc.preview,
            metadata: doc.metadata,
            embedding: embeddings ? embeddings[idx] : null,
          }))
        );

        return reply.status(202).send({
          success: true,
          message: `Indexed ${documents.length} chunks from ${files.length} file(s)${embeddings ? ' with embeddings' : ' (text-only, no AI configured)'}`,
          count: documents.length,
          fileCount: files.length,
          embeddingsGenerated: !!embeddings,
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
