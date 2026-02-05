import { FastifyInstance } from 'fastify';
import { ZodTypeProvider } from 'fastify-type-provider-zod';
import { z } from 'zod';
import { generateToken } from '../middleware/auth.js';
import { authService } from '../services/authService.js';

const loginSchema = z.object({
  email: z.string().email(),
  password: z.string().min(1),
});

const registerSchema = z.object({
  email: z.string().email(),
  password: z.string().min(6),
  name: z.string().optional(),
});

/**
 * Authentication routes
 * POST /auth/login - Login with email and password
 * POST /auth/register - Register a new user
 */
export async function authRoutes(app: FastifyInstance) {
  // POST /auth/login - User login
  app.withTypeProvider<ZodTypeProvider>().post<{ Body: z.infer<typeof loginSchema> }>(
    '/auth/login',
    {
      schema: { body: loginSchema },
    },
    async (request, reply) => {
      const { email, password } = request.body;

      try {
        // Verify credentials
        const user = await authService.verifyCredentials(email, password);

        if (!user) {
          return reply.status(401).send({
            success: false,
            error: 'Invalid credentials',
          });
        }

        // Generate JWT token
        const token = generateToken(app, user.id);

        return reply.status(200).send({
          success: true,
          user: {
            id: user.id,
            email: user.email,
            name: user.name,
            role: user.role,
          },
          token,
        });
      } catch (error) {
        console.error('Login error:', error);
        return reply.status(500).send({
          success: false,
          error: 'Internal server error',
        });
      }
    }
  );

  // POST /auth/register - User registration
  app.withTypeProvider<ZodTypeProvider>().post<{ Body: z.infer<typeof registerSchema> }>(
    '/auth/register',
    {
      schema: { body: registerSchema },
    },
    async (request, reply) => {
      const { email, password, name } = request.body;

      try {
        // Register user
        const user = await authService.registerUser(email, password, name);

        // Generate JWT token
        const token = generateToken(app, user.id);

        return reply.status(201).send({
          success: true,
          user: {
            id: user.id,
            email: user.email,
            name: user.name,
            role: user.role,
          },
          token,
        });
      } catch (error: any) {
        console.error('Registration error:', error);

        if (error.message.includes('User already exists')) {
          return reply.status(409).send({
            success: false,
            error: 'User already exists',
          });
        }

        return reply.status(500).send({
          success: false,
          error: 'Internal server error',
        });
      }
    }
  );

  // POST /auth/logout - User logout (stateless, just for API consistency)
  app.post('/auth/logout', async (request, reply) => {
    return reply.status(200).send({
      success: true,
      message: 'Logged out successfully',
    });
  });
}
