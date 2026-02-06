import { FastifyInstance } from 'fastify';
import { ZodTypeProvider } from 'fastify-type-provider-zod';
import { z } from 'zod';
import { verifyAuth } from '../middleware/auth.js';
import { 
  extractDocumentText, 
  checkExtractionCapabilities 
} from '../services/documentExtractor.js';

const extractSchema = z.object({
  filename: z.string(),
  content: z.string(), // Base64-encoded file content
});

/**
 * Document extraction routes for binary document processing
 */
export async function extractRoutes(app: FastifyInstance) {
  // GET /extract/capabilities - Check which extraction formats are supported
  app.get(
    '/extract/capabilities',
    { onRequest: [verifyAuth] },
    async (request, reply) => {
      try {
        const capabilities = await checkExtractionCapabilities();
        
        return reply.status(200).send({
          success: true,
          capabilities,
          supportedFormats: Object.entries(capabilities)
            .filter(([, supported]) => supported)
            .map(([format]) => format),
        });
      } catch (error) {
        console.error('Capabilities check error:', error);
        return reply.status(500).send({
          success: false,
          error: 'Failed to check extraction capabilities',
        });
      }
    }
  );

  // POST /extract - Extract text from a binary document
  app.withTypeProvider<ZodTypeProvider>().post<{ Body: z.infer<typeof extractSchema> }>(
    '/extract',
    {
      onRequest: [verifyAuth],
      schema: { body: extractSchema },
    },
    async (request, reply) => {
      const { filename, content } = request.body;

      try {
        // Decode base64 content to buffer
        const buffer = Buffer.from(content, 'base64');
        
        // Extract text
        const result = await extractDocumentText(buffer, filename);

        if (!result.success) {
          return reply.status(422).send({
            success: false,
            error: result.error,
            metadata: result.metadata,
          });
        }

        return reply.status(200).send({
          success: true,
          text: result.text,
          metadata: result.metadata,
        });
      } catch (error) {
        console.error('Extraction error:', error);
        return reply.status(500).send({
          success: false,
          error: 'Document extraction failed',
        });
      }
    }
  );
}
