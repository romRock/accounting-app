import { Request, Response } from 'express';
import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import { PrismaClient } from '@prisma/client';
import { createError } from '../../middlewares/errorHandler';
import { loginSchema } from './validation';
import { generateTokens, verifyRefreshToken } from './utils';

const prisma = new PrismaClient();

export const login = async (req: Request, res: Response) => {
  try {
    const { email, password } = loginSchema.parse(req.body);

    // Find user with role and branch
    const user = await prisma.user.findUnique({
      where: { email, isActive: true, isDeleted: false },
      include: {
        role: true,
        branch: true,
      },
    });

    if (!user) {
      throw createError('Invalid credentials', 401);
    }

    // Verify password
    const isPasswordValid = await bcrypt.compare(password, user.password);
    if (!isPasswordValid) {
      throw createError('Invalid credentials', 401);
    }

    // Generate tokens
    const { accessToken, refreshToken } = generateTokens(user);

    // Store refresh token in database
    await prisma.userSession.create({
      data: {
        userId: user.id,
        refreshToken,
        ipAddress: req.ip,
        userAgent: req.get('User-Agent'),
        expiresAt: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000), // 7 days
      },
    });

    // Remove password from response
    const { password: _, ...userWithoutPassword } = user;

    res.json({
      message: 'Login successful',
      user: userWithoutPassword,
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

    // Check if refresh token exists in database
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
