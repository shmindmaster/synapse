import Fastify from 'fastify';
import { z } from 'zod';
import { serializerCompiler, validatorCompiler, ZodTypeProvider } from 'fastify-type-provider-zod';

const app = Fastify().withTypeProvider<ZodTypeProvider>();
app.setValidatorCompiler(validatorCompiler);
app.setSerializerCompiler(serializerCompiler);

// Standard Health Check
app.get('/health', async () => ({
  status: 'ok',
  stack: 'fastify-langgraph-js',
  model: process.env.LLM_MODEL_ID
}));

// Standard Agent Chat Endpoint
app.post('/api/agent/chat', {
  schema: { body: z.object({ message: z.string(), threadId: z.string() }) },
}, async (req, reply) => {
  return { response: "Refactor: Connect LangGraph.js here" };
});

const start = async () => {
  try {
    await app.listen({ port: 8000, host: '0.0.0.0' });
  } catch (err) {
    app.log.error(err);
    process.exit(1);
  }
};
start();
