import { FastifyInstance } from 'fastify';
import { ZodTypeProvider } from 'fastify-type-provider-zod';
import { z } from 'zod';
import { verifyAuth } from '../middleware/auth.js';
import { chatService } from '../services/chatService.js';

const chatSchema = z.object({
  message: z.string().min(1),
  conversationHistory: z.array(z.object({ role: z.string(), content: z.string() })).optional(),
  stream: z.boolean().default(false).optional(),
});

/**
 * Chat routes for RAG-based conversation
 * All routes require authentication
 */
export async function chatRoutes(app: FastifyInstance) {
  // POST /chat - Chat endpoint with optional streaming
  app.withTypeProvider<ZodTypeProvider>().post<{ Body: z.infer<typeof chatSchema> }>(
    '/chat',
    {
      onRequest: [verifyAuth],
      schema: { body: chatSchema },
    },
    async (request, reply) => {
      const { message, conversationHistory = [], stream = false } = request.body;

      try {
        if (stream) {
          // Enable streaming response
          reply.header('Content-Type', 'text/event-stream');
          reply.header('Cache-Control', 'no-cache');
          reply.header('Connection', 'keep-alive');

          // Stream the response
          const generator = chatService.chatStream(message, conversationHistory);

          for await (const chunk of generator) {
            reply.raw.write(`data: ${JSON.stringify({ content: chunk })}\n\n`);
          }

          reply.raw.write('data: [DONE]\n\n');
          reply.raw.end();
        } else {
          // Non-streaming response
          const response = await chatService.chat(message, conversationHistory);

          return reply.status(200).send({
            success: true,
            message,
            response,
            conversationHistory: [
              ...conversationHistory,
              { role: 'user', content: message },
              { role: 'assistant', content: response },
            ],
          });
        }
      } catch (error) {
        console.error('Chat error:', error);
        return reply.status(500).send({
          success: false,
          error: 'Chat failed',
        });
      }
    }
  );
}
