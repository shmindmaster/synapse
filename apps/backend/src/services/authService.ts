import bcrypt from 'bcrypt';
import { prisma } from '../config/db.js';

/**
 * Authentication service for user login and registration
 */
export class AuthService {
  /**
   * Find user by email and verify password
   */
  async verifyCredentials(email: string, password: string): Promise<any | null> {
    try {
      const user = await prisma.user.findUnique({
        where: { email },
      });

      if (!user) {
        return null;
      }

      // Verify password (Prisma stores hashed password in 'password' field)
      const passwordValid = await bcrypt.compare(password, user.password);

      if (!passwordValid) {
        return null;
      }

      return {
        id: user.id,
        email: user.email,
        name: user.name,
        role: user.role,
      };
    } catch (error) {
      console.error('Error verifying credentials:', error);
      return null;
    }
  }

  /**
   * Create a new user account
   */
  async registerUser(email: string, password: string, name?: string): Promise<any | null> {
    try {
      // Check if user already exists
      const existingUser = await prisma.user.findUnique({
        where: { email },
      });

      if (existingUser) {
        throw new Error('User already exists');
      }

      // Hash password
      const hashedPassword = await bcrypt.hash(password, 10);

      // Create user
      const user = await prisma.user.create({
        data: {
          email,
          password: hashedPassword,
          name: name || email.split('@')[0],
          role: 'VIEWER', // Default role
        },
      });

      return {
        id: user.id,
        email: user.email,
        name: user.name,
        role: user.role,
      };
    } catch (error) {
      console.error('Error registering user:', error);
      throw error;
    }
  }

  /**
   * Get user by ID
   */
  async getUserById(userId: string): Promise<any | null> {
    try {
      const user = await prisma.user.findUnique({
        where: { id: userId },
      });

      if (!user) {
        return null;
      }

      return {
        id: user.id,
        email: user.email,
        name: user.name,
        role: user.role,
      };
    } catch (error) {
      console.error('Error getting user:', error);
      return null;
    }
  }
}

export const authService = new AuthService();
