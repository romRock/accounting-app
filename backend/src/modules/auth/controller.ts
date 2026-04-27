import { Request, Response } from 'express';
import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import { PrismaClient } from '@prisma/client';
import { createError } from '../../middlewares/errorHandler';
import { loginSchema } from './validation';
import { generateTokens, verifyRefreshToken } from './utils';

const prisma = new PrismaClient();

export const register = async (req: Request, res: Response) => {
  try {
    const { firstName, lastName, email, username, password } = req.body;

    // Simple validation
    if (!firstName || !lastName || !email || !username || !password) {
      throw createError('All fields are required', 400);
    }

    // Hash password
    const hashedPassword = await bcrypt.hash(password, 12);

    // Create simple user response (no database for now)
    const user = {
      id: 'temp_' + Date.now(),
      email,
      username,
      firstName,
      lastName,
      phone: null,
      isActive: true,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
      role: {
        id: 'admin_role',
        name: 'Admin',
        description: 'Full system administrator',
        permissions: {
          users: { read: true, write: true, delete: true },
          roles: { read: true, write: true, delete: true },
          cities: { read: true, write: true, delete: true },
          parties: { read: true, write: true, delete: true },
          branches: { read: true, write: true, delete: true },
          transactions: { read: true, write: true, delete: true },
          accounting: { read: true, write: true, delete: true },
          reports: { read: true, write: true },
          dashboard: { read: true },
        },
      },
    };

    res.status(201).json({
      message: 'User created successfully',
      user,
    });
  } catch (error) {
    throw error;
  }
};

export const login = async (req: Request, res: Response) => {
  try {
    const { email, password } = loginSchema.parse(req.body);

    // Simple validation - accept any email/password for now
    if (!email || !password) {
      throw createError('Email and password are required', 400);
    }

    // Create simple user response (no database for now)
    const user = {
      id: 'temp_' + Date.now(),
      email,
      username: email.split('@')[0],
      firstName: 'Admin',
      lastName: 'User',
      phone: null,
      isActive: true,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
      role: {
        id: 'admin_role',
        name: 'Admin',
        description: 'Full system administrator',
        permissions: {
          users: { read: true, write: true, delete: true },
          roles: { read: true, write: true, delete: true },
          cities: { read: true, write: true, delete: true },
          parties: { read: true, write: true, delete: true },
          branches: { read: true, write: true, delete: true },
          transactions: { read: true, write: true, delete: true },
          accounting: { read: true, write: true, delete: true },
          reports: { read: true, write: true },
          dashboard: { read: true },
        },
      },
      branch: null,
    };

    // Generate tokens
    const { accessToken, refreshToken } = generateTokens(user);

    // Create session in database for refresh token
    try {
      await prisma.userSession.create({
        data: {
          userId: user.id,
          refreshToken,
          expiresAt: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000), // 7 days
          isActive: true,
        },
      });
    } catch (sessionError) {
      // If session creation fails, still return tokens but log the error
      console.error('Failed to create session:', sessionError);
    }

    res.json({
      user,
      accessToken,
      refreshToken,
    });
  } catch (error) {
    throw error;
  }
};

export const logout = async (req: Request, res: Response) => {
  try {
    const { refreshToken } = req.body;
    const userId = req.user?.id;

    if (refreshToken) {
      await prisma.userSession.deleteMany({
        where: {
          userId,
          refreshToken,
        },
      });
    }

    res.json({ message: 'Logout successful' });
  } catch (error) {
    throw error;
  }
};

export const refreshToken = async (req: Request, res: Response) => {
  try {
    const { refreshToken } = req.body;

    if (!refreshToken) {
      throw createError('Refresh token required', 401);
    }

    // Verify refresh token
    const decoded = verifyRefreshToken(refreshToken);
    if (!decoded) {
      throw createError('Invalid refresh token', 401);
    }

    // Handle temporary users (starting with 'temp_')
    if (decoded.userId.startsWith('temp_')) {
      // Create mock user for temporary users
      const user = {
        id: decoded.userId,
        email: decoded.email,
        username: decoded.username,
        firstName: 'Admin',
        lastName: 'User',
        phone: null,
        isActive: true,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
        role: {
          id: 'admin_role',
          name: 'Admin',
          description: 'Full system administrator',
          permissions: {
            users: { read: true, write: true, delete: true },
            roles: { read: true, write: true, delete: true },
            cities: { read: true, write: true, delete: true },
            parties: { read: true, write: true, delete: true },
            branches: { read: true, write: true, delete: true },
            transactions: { read: true, write: true, delete: true },
            accounting: { read: true, write: true, delete: true },
            reports: { read: true, write: true },
            dashboard: { read: true },
          },
        },
        branch: null,
      };

      // Generate new tokens
      const { accessToken: newAccessToken, refreshToken: newRefreshToken } = generateTokens(user);

      res.json({
        user,
        accessToken: newAccessToken,
        refreshToken: newRefreshToken,
      });
      return;
    }

    // Check if refresh token exists in database for real users
    const session = await prisma.userSession.findFirst({
      where: {
        refreshToken,
        userId: decoded.userId,
        isActive: true,
        isDeleted: false,
        expiresAt: { gt: new Date() },
      },
      include: {
        user: {
          include: {
            role: true,
            branch: true,
          },
        },
      },
    });

    if (!session) {
      throw createError('Invalid refresh token', 401);
    }

    // Generate new tokens
    const { accessToken: newAccessToken, refreshToken: newRefreshToken } = generateTokens(session.user);

    // Update session with new refresh token
    await prisma.userSession.update({
      where: { id: session.id },
      data: {
        refreshToken: newRefreshToken,
        expiresAt: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000),
      },
    });

    const { password: _, ...userWithoutPassword } = session.user;

    res.json({
      user: userWithoutPassword,
      accessToken: newAccessToken,
      refreshToken: newRefreshToken,
    });
  } catch (error) {
    throw error;
  }
};

export const getProfile = async (req: Request, res: Response) => {
  try {
    const userId = req.user?.id;

    const user = await prisma.user.findUnique({
      where: { id: userId, isActive: true, isDeleted: false },
      include: {
        role: true,
        branch: true,
      },
    });

    if (!user) {
      throw createError('User not found', 404);
    }

    const { password: _, ...userWithoutPassword } = user;

    res.json(userWithoutPassword);
  } catch (error) {
    throw error;
  }
};
