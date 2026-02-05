import { FastifyReply, FastifyRequest } from 'fastify';

/**
 * Verify JWT token in Authorization header
 * Expects: Authorization: Bearer {token}
 */
export async function verifyAuth(request: FastifyRequest, reply: FastifyReply): Promise<void> {
  try {
    await (request as any).jwtVerify();
  } catch (err) {
    reply.status(401).send({
      success: false,
      error: 'Authentication required',
    });
  }
}

/**
 * Generate JWT token (called after login verification)
 */
export function generateToken(app: any, userId: string): string {
  return app.jwt.sign({ userId });
}
