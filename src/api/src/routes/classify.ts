import { FastifyInstance } from 'fastify';
import { ZodTypeProvider } from 'fastify-type-provider-zod';
import { z } from 'zod';
import { verifyAuth } from '../middleware/auth.js';
import { generateChatCompletion } from '../services/aiService.js';
import { isAIConfigured } from '../services/aiService.js';

const classifyDocumentSchema = z.object({
  filePath: z.string().optional(),
  content: z.string().optional(),
});

/**
 * Document classification routes
 * Uses LLM to classify document type, extract entities, and suggest tags
 */
export async function classifyRoutes(app: FastifyInstance) {
  // POST /classify-document - Classify a document using AI
  app.withTypeProvider<ZodTypeProvider>().post<{ Body: z.infer<typeof classifyDocumentSchema> }>(
    '/classify-document',
    {
      onRequest: [verifyAuth],
      schema: { body: classifyDocumentSchema },
    },
    async (request, reply) => {
      const { filePath, content } = request.body;

      if (!filePath && !content) {
        return reply.status(400).send({
          success: false,
          error: 'Either filePath or content is required',
        });
      }

      if (!isAIConfigured()) {
        return reply.status(503).send({
          success: false,
          error: 'AI is not configured. Set an OpenAI API key or enable local models.',
        });
      }

      try {
        const textToClassify = content || `[File: ${filePath}]`;
        const preview = textToClassify.slice(0, 3000);

        const prompt = `Analyze this document and return a JSON object with these fields:
- documentType: one of "code", "documentation", "legal", "financial", "research", "meeting_notes", "email", "config", "data", "other"
- category: a more specific category (e.g., "TypeScript source", "API documentation", "NDA contract", "quarterly report")
- confidence: number 0-1 indicating classification confidence
- suggestedPath: a logical file path/folder suggestion for organizing this document
- extractedEntities: array of key entities (people, companies, technologies, dates) found in the text
- tags: array of 3-8 relevant tags for search/filtering
- summary: a 1-2 sentence summary of the document content

${filePath ? `File path: ${filePath}` : ''}

Document content (first 3000 chars):
${preview}

Respond with ONLY valid JSON, no markdown fences.`;

        const result = await generateChatCompletion(
          [
            { role: 'system', content: 'You are a document classification engine. Always respond with valid JSON only.' },
            { role: 'user', content: prompt },
          ],
          { temperature: 0.3, max_tokens: 1000 }
        );

        let classification;
        try {
          // Strip markdown fences if present
          const jsonStr = result.content
            .replace(/^```json?\s*/i, '')
            .replace(/\s*```$/i, '')
            .trim();
          classification = JSON.parse(jsonStr);
        } catch {
          // If JSON parsing fails, return a structured fallback
          classification = {
            documentType: 'other',
            category: 'Unknown',
            confidence: 0.3,
            suggestedPath: filePath || 'uncategorized/',
            extractedEntities: [],
            tags: [],
            summary: result.content.slice(0, 200),
          };
        }

        return reply.status(200).send({
          success: true,
          classification,
        });
      } catch (error) {
        console.error('Classification error:', error);
        return reply.status(500).send({
          success: false,
          error: 'Classification failed',
        });
      }
    }
  );
}
