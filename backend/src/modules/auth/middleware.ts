import { Request, Response, NextFunction } from 'express';
import jwt from 'jsonwebtoken';
import { PrismaClient } from '@prisma/client';
import { createError } from '../../middlewares/errorHandler';

const prisma = new PrismaClient();

// Extend Request interface to include user
declare global {
  namespace Express {
    interface Request {
      user?: {
        id: string;
        email: string;
        username: string;
        firstName: string;
        lastName: string;
        roleId: string;
        branchId?: string;
        role: {
          name: string;
          permissions: any;
        };
        branch?: {
          id: string;
          name: string;
          code: string;
        };
      };
    }
  }
}

export const authenticateToken = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const authHeader = req.headers.authorization;
    const token = authHeader && authHeader.split(' ')[1]; // Bearer TOKEN

    if (!token) {
      throw createError('Access token required', 401);
    }

    // Verify JWT token
    const decoded = jwt.verify(token, process.env.JWT_SECRET || 'your-secret-key') as any;
    
    if (!decoded.userId) {
      throw createError('Invalid token', 401);
    }

    // For temporary users (starting with 'temp_'), create a mock user
    if (decoded.userId.startsWith('temp_')) {
      req.user = {
        id: decoded.userId,
        email: decoded.email,
        username: decoded.username,
        firstName: 'Admin',
        lastName: 'User',
        roleId: 'admin_role',
        role: {
          name: 'Admin',
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
      next();
      return;
    }

    // Get user from database for real users
    const user = await prisma.user.findUnique({
      where: { 
        id: decoded.userId, 
        isActive: true, 
        isDeleted: false 
      },
      include: {
        role: true,
        branch: true,
      },
    });

    if (!user) {
      throw createError('User not found', 401);
    }

    // Attach user to request object
    req.user = {
      id: user.id,
      email: user.email,
      username: user.username,
      firstName: user.firstName,
      lastName: user.lastName,
      roleId: user.roleId,
      branchId: user.branchId || undefined,
      role: user.role || undefined,
      branch: user.branch || undefined,
    };

    next();
  } catch (error) {
    if (error instanceof jwt.JsonWebTokenError) {
      next(createError('Invalid token', 401));
    } else {
      next(error);
    }
  }
};

export const requireRole = (roles: string[]) => {
  return (req: Request, res: Response, next: NextFunction) => {
    if (!req.user) {
      return next(createError('Authentication required', 401));
    }

    const userRole = req.user.role.name;
    
    if (!roles.includes(userRole)) {
      return next(createError('Insufficient permissions', 403));
    }

    next();
  };
};

export const requirePermission = (permission: string) => {
  return (req: Request, res: Response, next: NextFunction) => {
    if (!req.user) {
      return next(createError('Authentication required', 401));
    }

    const userPermissions = req.user.role.permissions;
    
    if (!userPermissions || !userPermissions[permission]) {
      return next(createError('Insufficient permissions', 403));
    }

    next();
  };
};
