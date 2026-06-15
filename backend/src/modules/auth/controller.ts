import { Request, Response } from 'express';
import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import { PrismaClient } from '@prisma/client';
import { createError } from '../../middlewares/errorHandler';
import { loginSchema } from './validation';
import { generateTokens, verifyRefreshToken, isCurrentUserSession } from './utils';
import { getUserBranchesWithDetails } from '../../utils/userBranches';

const prisma = new PrismaClient();

export const login = async (req: Request, res: Response) => {
  try {
    const { email, password } = loginSchema.parse(req.body);

    // Find user in database
    const user = await prisma.user.findUnique({
      where: { 
        email, 
        isActive: true, 
        isDeleted: false 
      },
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

    const sessionExpiresAt = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000);

    // Single-device login: atomically revoke old sessions and create the new one
    const session = await prisma.$transaction(async (tx) => {
      await tx.userSession.deleteMany({
        where: { userId: user.id },
      });

      return tx.userSession.create({
        data: {
          userId: user.id,
          refreshToken: `pending-${user.id}-${Date.now()}`,
          expiresAt: sessionExpiresAt,
          isActive: true,
          ipAddress: req.ip || undefined,
          userAgent: req.get('user-agent') || undefined,
        },
      });
    });

    const { accessToken, refreshToken } = generateTokens(user, session.id);

    await prisma.userSession.update({
      where: { id: session.id },
      data: { refreshToken },
    });

    const { password: _, ...userWithoutPassword } = user;
    const branches = await getUserBranchesWithDetails(prisma, user.id);

    res.json({
      user: { ...userWithoutPassword, branches },
      accessToken,
      refreshToken,
    });
  } catch (error: any) {
    if (error.code === 'P2002') {
      throw createError('Invalid credentials', 401);
    }
    throw error;
  }
};

export const logout = async (req: Request, res: Response) => {
  try {
    const { refreshToken } = req.body;

    if (refreshToken) {
      await prisma.userSession.deleteMany({
        where: { refreshToken },
      });
    } else if (req.user?.id) {
      await prisma.userSession.deleteMany({
        where: { userId: req.user.id },
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

    if (
      !decoded.sessionId ||
      decoded.sessionId !== session.id ||
      !(await isCurrentUserSession(decoded.userId, session.id))
    ) {
      throw createError('Session expired or logged in on another device', 401);
    }

    // Generate new tokens
    const { accessToken: newAccessToken, refreshToken: newRefreshToken } = generateTokens(
      session.user,
      session.id
    );

    // Update session with new refresh token
    await prisma.userSession.update({
      where: { id: session.id },
      data: {
        refreshToken: newRefreshToken,
        expiresAt: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000),
      },
    });

    const { password: _, ...userWithoutPassword } = session.user;
    const branches = await getUserBranchesWithDetails(prisma, session.user.id);

    res.json({
      user: { ...userWithoutPassword, branches },
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
    const branches = await getUserBranchesWithDetails(prisma, user.id);

    res.json({ ...userWithoutPassword, branches });
  } catch (error) {
    throw error;
  }
};
