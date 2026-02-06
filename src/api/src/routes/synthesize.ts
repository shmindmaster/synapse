import { FastifyInstance } from 'fastify';
import { ZodTypeProvider } from 'fastify-type-provider-zod';
import { z } from 'zod';
import { verifyAuth } from '../middleware/auth.js';
import { generateChatCompletion, isAIConfigured } from '../services/aiService.js';
import { VectorStoreService } from '../services/vectorStore.js';

const synthesizeSchema = z.object({
  filePaths: z.array(z.string()).min(1).max(10),
  query: z.string().optional(),
  analysisType: z.enum([
    'synthesis', 'timeline', 'entities', 'comparative', 'knowledge_graph'
  ]).default('synthesis'),
});

/**
 * Multi-document synthesis routes
 * Uses LLM to synthesize insights across multiple indexed documents
 */
export async function synthesizeRoutes(app: FastifyInstance) {
  const vectorStore = new VectorStoreService();

  // POST /synthesize-documents - Synthesize across multiple documents
  app.withTypeProvider<ZodTypeProvider>().post<{ Body: z.infer<typeof synthesizeSchema> }>(
    '/synthesize-documents',
    {
      onRequest: [verifyAuth],
      schema: { body: synthesizeSchema },
    },
    async (request, reply) => {
      const { filePaths, query, analysisType } = request.body;

      if (!isAIConfigured()) {
        return reply.status(503).send({
          success: false,
          error: 'AI is not configured. Set an OpenAI API key or enable local models.',
        });
      }

      try {
        // Fetch content for each file path from the vector store
        const documents: { path: string; content: string }[] = [];
        for (const filePath of filePaths) {
          const results = await vectorStore.textSearch(filePath, 5, { path: filePath });
          if (results.length > 0) {
            // Combine all chunks for this path
            const combined = results.map(r => r.content).join('\n\n');
            documents.push({ path: filePath, content: combined.slice(0, 4000) });
          }
        }

        if (documents.length === 0) {
          return reply.status(404).send({
            success: false,
            error: 'No indexed content found for the specified file paths.',
          });
        }

        // Build analysis prompt based on type
        const analysisPrompts: Record<string, string> = {
          synthesis: `Provide a comprehensive synthesis of these documents. Identify key themes, connections, and insights that emerge from reading them together.`,
          timeline: `Extract a chronological timeline of events, decisions, and milestones mentioned across these documents. Include dates where available.`,
          entities: `Extract all key entities (people, organizations, technologies, concepts, locations) and map their relationships across these documents.`,
          comparative: `Compare and contrast these documents. Identify agreements, disagreements, unique perspectives, and complementary information.`,
          knowledge_graph: `Extract entities and their relationships to build a knowledge graph. Focus on "entity A [relationship] entity B" triples.`,
        };

        const docSummaries = documents
          .map((d, i) => `--- Document ${i + 1}: ${d.path} ---\n${d.content}`)
          .join('\n\n');

        const prompt = `${analysisPrompts[analysisType] || analysisPrompts.synthesis}

${query ? `Focus area: ${query}\n` : ''}
Documents to analyze (${documents.length}):

${docSummaries}

Respond with a JSON object containing:
- synthesis: string (main analysis text)
- keyThemes: string[] (3-8 key themes)
- entities: array of {name, type, mentions: number, documents: string[]}
- relationships: array of {from, to, type, strength: number 0-1}
- timeline: array of {date, event, source} (if temporal info exists)
- insights: string[] (3-6 key insights)
- contradictions: string[] (any contradictions found between documents)
- confidence: number 0-1

Respond with ONLY valid JSON, no markdown fences.`;

        const result = await generateChatCompletion(
          [
            { role: 'system', content: 'You are a multi-document analysis engine. Always respond with valid JSON only.' },
            { role: 'user', content: prompt },
          ],
          { temperature: 0.4, max_tokens: 3000 }
        );

        let synthesis;
        try {
          const jsonStr = result.content
            .replace(/^```json?\s*/i, '')
            .replace(/\s*```$/i, '')
            .trim();
          synthesis = JSON.parse(jsonStr);
        } catch {
          // Fallback: wrap raw text as synthesis
          synthesis = {
            synthesis: result.content,
            keyThemes: [],
            entities: [],
            relationships: [],
            timeline: [],
            insights: [],
            contradictions: [],
            confidence: 0.5,
          };
        }

        return reply.status(200).send({
          success: true,
          synthesis,
          documentsAnalyzed: documents.length,
        });
      } catch (error) {
        console.error('Synthesis error:', error);
        return reply.status(500).send({
          success: false,
          error: 'Synthesis failed',
        });
      }
    }
  );
}
