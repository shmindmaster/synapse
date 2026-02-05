import fastifyCors from '@fastify/cors';
import fastifyJwt from '@fastify/jwt';
import Fastify from 'fastify';
import { serializerCompiler, validatorCompiler, ZodTypeProvider } from 'fastify-type-provider-zod';
import { config } from './config/configuration.js';
import { errorHandler } from './middleware/errorHandler.js';
import { authRoutes } from './routes/auth.js';
import { chatRoutes } from './routes/chat.js';
import { healthRoutes } from './routes/health.js';
import { indexRoutes } from './routes/index.js';
import { searchRoutes } from './routes/search.js';

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
    origin: true, // Allow all origins (configure in production)
    credentials: true,
  });
};

/**
 * Register routes
 */
const registerRoutes = async () => {
  // Health check (no auth required)
  await app.register(healthRoutes, { prefix: '/api' });

  // Authentication routes (no auth required)
  await app.register(authRoutes, { prefix: '/api' });

  // Protected routes (auth required)
  await app.register(searchRoutes, { prefix: '/api' });
  await app.register(chatRoutes, { prefix: '/api' });
  await app.register(indexRoutes, { prefix: '/api' });
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
