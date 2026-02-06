import fastifyCors from '@fastify/cors';
import fastifyJwt from '@fastify/jwt';
import Fastify from 'fastify';
import { serializerCompiler, validatorCompiler, ZodTypeProvider } from 'fastify-type-provider-zod';
import { config } from './config/configuration.js';
import { errorHandler } from './middleware/errorHandler.js';
import { rateLimiters } from './middleware/rateLimiter.js';
import { authRoutes } from './routes/auth.js';
import { chatRoutes } from './routes/chat.js';
import { healthRoutes } from './routes/health.js';
import { indexRoutes } from './routes/index.js';
import { searchRoutes } from './routes/search.js';
import { classifyRoutes } from './routes/classify.js';
import { synthesizeRoutes } from './routes/synthesize.js';
import { historyRoutes } from './routes/history.js';
import { extractRoutes } from './routes/extract.js';

const app = Fastify({
  logger: {
    level: process.env.LOG_LEVEL || 'info',
  },
}).withTypeProvider<ZodTypeProvider>();

app.setValidatorCompiler(validatorCompiler);
app.setSerializerCompiler(serializerCompiler);

// Set global error handler
app.setErrorHandler(errorHandler);

/**
 * Initialize plugins
 */
const initializePlugins = async () => {
  // JWT plugin for authentication
  await app.register(fastifyJwt, {
    secret: config.auth.secret,
    sign: {
      expiresIn: '24h',
    },
  });

  // CORS for frontend communication
  await app.register(fastifyCors, {
    origin: config.server.corsOrigin,
    credentials: true,
  });
};

/**
 * Register routes with rate limiting
 */
const registerRoutes = async () => {
  // Health check (no auth, no rate limit)
  await app.register(healthRoutes, { prefix: '/api' });

  // Authentication routes (no auth, strict rate limiting)
  await app.register(
    async instance => {
      instance.addHook('onRequest', rateLimiters.auth);
      await instance.register(authRoutes);
    },
    { prefix: '/api' }
  );

  // Protected routes with moderate rate limiting
  await app.register(
    async instance => {
      instance.addHook('onRequest', rateLimiters.api);
      await instance.register(searchRoutes);
      await instance.register(chatRoutes);
      await instance.register(indexRoutes);
      await instance.register(classifyRoutes);
      await instance.register(synthesizeRoutes);
      await instance.register(historyRoutes);
      await instance.register(extractRoutes);
    },
    { prefix: '/api' }
  );
};

/**
 * Start server
 */
const start = async () => {
  try {
    // Initialize plugins
    await initializePlugins();

    // Register routes
    await registerRoutes();

    // Start listening
    await app.listen({ port: config.port, host: '0.0.0.0' });

    console.log(`🚀 Synapse API Server running at http://localhost:${config.port}`);
    console.log(`📊 Environment: ${config.env}`);
    console.log(
      `🔐 JWT Secret: ${config.auth.secret === 'super-secret-auth-key-change-in-prod' ? '⚠️ CHANGE IN PRODUCTION' : '✅ Configured'}`
    );
  } catch (err) {
    app.log.error(err);
    process.exit(1);
  }
};

start();
