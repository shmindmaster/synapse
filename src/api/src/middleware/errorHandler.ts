/**
 * Enhanced Error Handler Middleware
 * Provides structured error responses with proper logging
 */
import { FastifyError, FastifyReply, FastifyRequest } from 'fastify';

export async function errorHandler(
  error: FastifyError,
  request: FastifyRequest,
  reply: FastifyReply
) {
  // Log error with context
  request.log.error(
    {
      err: error,
      url: request.url,
      method: request.method,
      params: request.params,
      query: request.query,
    },
    'Request error occurred'
  );

  // Determine status code
  const statusCode = error.statusCode || 500;

  // Build structured error response
  const errorResponse: any = {
    error: error.name || 'Error',
    message: error.message || 'An unexpected error occurred',
    statusCode,
    timestamp: new Date().toISOString(),
    path: request.url,
  };

  // Include validation errors if present
  if (error.validation) {
    errorResponse.validation = error.validation;
  }

  // Include stack trace in development
  if (process.env.NODE_ENV === 'development') {
    errorResponse.stack = error.stack;
  }

  // Send error response
  await reply.status(statusCode).send(errorResponse);
}
