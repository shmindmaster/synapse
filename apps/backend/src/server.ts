import Fastify from 'fastify';
import { z } from 'zod';
import { serializerCompiler, validatorCompiler, ZodTypeProvider } from 'fastify-type-provider-zod';
import dotenv from 'dotenv';

// Load environment variables from .env.shared first, then .env
dotenv.config({ path: '../../.env.shared' });
dotenv.config();

const app = Fastify({
  logger: {
    level: process.env.LOG_LEVEL || 'info',
  },
}).withTypeProvider<ZodTypeProvider>();

app.setValidatorCompiler(validatorCompiler);
app.setSerializerCompiler(serializerCompiler);

// Health endpoint
app.get('/health', async () => {
  return {
    status: 'ok',
    stack: 'fastify-langgraph-js',
    version: '8.1',
    timestamp: new Date().toISOString(),
  };
});

// API Agent Chat endpoint
const chatBodySchema = z.object({
  message: z.string(),
  threadId: z.string(),
});

app.post('/api/agent/chat', {
  schema: {
    body: chatBodySchema,
  },
}, async (req, reply) => {
  const { message, threadId } = req.body;
  
  // TODO: Connect to LangGraph.js here
  return {
    response: 'AI Logic Placeholder',
    threadId,
    timestamp: new Date().toISOString(),
  };
});

// Start server
const start = async () => {
  try {
    const port = parseInt(process.env.PORT || '8000', 10);
    const host = process.env.HOST || '0.0.0.0';
    
    await app.listen({ port, host });
    
    console.log(`🚀 Synapse API Server (Pendoah v8.1) running on ${host}:${port}`);
    console.log(`📊 Health: http://localhost:${port}/health`);
    console.log(`💬 Chat: http://localhost:${port}/api/agent/chat`);
  } catch (err) {
    app.log.error(err);
    process.exit(1);
  }
};

// Graceful shutdown
const closeGracefully = async (signal: string) => {
  console.log(`\n${signal} received, shutting down gracefully...`);
  await app.close();
  process.exit(0);
};

process.on('SIGTERM', () => closeGracefully('SIGTERM'));
process.on('SIGINT', () => closeGracefully('SIGINT'));

start();
