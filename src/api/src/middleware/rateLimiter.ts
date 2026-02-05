/**
 * Rate Limiting Middleware for Fastify
 * Protects API endpoints from abuse
 */
import { FastifyPluginAsync, FastifyReply, FastifyRequest } from 'fastify';
import fp from 'fastify-plugin';

interface RateLimitConfig {
  max: number; // Maximum requests
  timeWindow: number; // Time window in milliseconds
  message?: string;
}

interface RateLimitStore {
  [key: string]: {
    count: number;
    resetTime: number;
  };
}

const store: RateLimitStore = {};

// Clean up expired entries every minute
setInterval(() => {
  const now = Date.now();
  Object.keys(store).forEach(key => {
    if (store[key].resetTime < now) {
      delete store[key];
    }
  });
}, 60000);

/**
 * Get client identifier (IP or user ID)
 */
function getClientId(request: FastifyRequest): string {
  // Try JWT user ID first
  const user = (request as any).user;
  if (user?.sub) {
    return `user:${user.sub}`;
  }

  // Fall back to IP address
  const forwarded = request.headers['x-forwarded-for'];
  const ip = forwarded
    ? Array.isArray(forwarded)
      ? forwarded[0]
      : forwarded.split(',')[0]
    : request.ip;
  return `ip:${ip}`;
}

/**
 * Check rate limit for a client
 */
function checkRateLimit(
  clientId: string,
  config: RateLimitConfig
): { allowed: boolean; remaining: number; resetTime: number } {
  const now = Date.now();
  const entry = store[clientId];

  if (!entry || entry.resetTime < now) {
    // New or expired entry
    store[clientId] = {
      count: 1,
      resetTime: now + config.timeWindow,
    };
    return {
      allowed: true,
      remaining: config.max - 1,
      resetTime: store[clientId].resetTime,
    };
  }

  if (entry.count >= config.max) {
    // Rate limit exceeded
    return {
      allowed: false,
      remaining: 0,
      resetTime: entry.resetTime,
    };
  }

  // Increment count
  entry.count++;
  return {
    allowed: true,
    remaining: config.max - entry.count,
    resetTime: entry.resetTime,
  };
}

/**
 * Create rate limit middleware
 */
export function createRateLimiter(config: RateLimitConfig) {
  return async (request: FastifyRequest, reply: FastifyReply) => {
    const clientId = getClientId(request);
    const result = checkRateLimit(clientId, config);

    // Add rate limit headers
    reply.header('X-RateLimit-Limit', config.max);
    reply.header('X-RateLimit-Remaining', result.remaining);
    reply.header('X-RateLimit-Reset', Math.ceil(result.resetTime / 1000));

    if (!result.allowed) {
      const retryAfter = Math.ceil((result.resetTime - Date.now()) / 1000);
      reply.header('Retry-After', retryAfter);

      return reply.code(429).send({
        statusCode: 429,
        error: 'Too Many Requests',
        message: config.message || 'Rate limit exceeded. Please try again later.',
        retryAfter,
      });
    }
  };
}

/**
 * Rate limiter plugin for Fastify
 */
const rateLimiterPlugin: FastifyPluginAsync<RateLimitConfig> = async (fastify, options) => {
  const limiter = createRateLimiter(options);
  fastify.addHook('onRequest', limiter);
};

export default fp(rateLimiterPlugin, {
  name: 'rate-limiter',
  fastify: '5.x',
});

/**
 * Pre-configured rate limiters for different endpoints
 */
export const rateLimiters = {
  // Authentication endpoints - stricter limits
  auth: createRateLimiter({
    max: 5,
    timeWindow: 15 * 60 * 1000, // 15 minutes
    message: 'Too many authentication attempts. Please try again in 15 minutes.',
  }),

  // Chat endpoints - moderate limits
  chat: createRateLimiter({
    max: 30,
    timeWindow: 60 * 1000, // 1 minute
    message: 'Too many chat requests. Please wait a moment.',
  }),

  // Search endpoints - generous limits
  search: createRateLimiter({
    max: 100,
    timeWindow: 60 * 1000, // 1 minute
    message: 'Too many search requests. Please wait a moment.',
  }),

  // General API - default limits
  api: createRateLimiter({
    max: 60,
    timeWindow: 60 * 1000, // 1 minute
    message: 'Rate limit exceeded. Please try again later.',
  }),
};
