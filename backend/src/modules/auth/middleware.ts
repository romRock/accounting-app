import { Request, Response, NextFunction } from 'express';
import jwt from 'jsonwebtoken';
import { PrismaClient } from '@prisma/client';
import { createError } from '../../middlewares/errorHandler';
import { isCurrentUserSession } from './utils';
import { getUserAssignedBranchIds } from '../../utils/userBranches';
import { getJwtSecret } from '../../config/secrets';

const prisma = new PrismaClient();
const isDev = process.env.NODE_ENV !== 'production';

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
        assignedBranchIds?: string[];
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
    const token = authHeader && authHeader.split(' ')[1];

    if (!token) {
      throw createError('Access token required', 401);
    }

    const decoded = jwt.verify(token, getJwtSecret()) as {
      userId: string;
      email: string;
      username: string;
      sessionId?: string;
    };

    if (!decoded.userId) {
      throw createError('Invalid token', 401);
    }

    if (!decoded.sessionId) {
      throw createError('Invalid token', 401);
    }

    const sessionValid = await isCurrentUserSession(decoded.userId, decoded.sessionId);
    if (!sessionValid) {
      throw createError('Session expired or logged in on another device', 401);
    }

    const user = await prisma.user.findUnique({
      where: {
        id: decoded.userId,
        isActive: true,
        isDeleted: false,
      },
      include: {
        role: true,
        branch: true,
      },
    });

    if (!user) {
      throw createError('User not found', 401);
    }

    let parsedRole = user.role;
    if (user.role && typeof user.role.permissions === 'string') {
      try {
        parsedRole = {
          ...user.role,
          permissions: JSON.parse(user.role.permissions),
        };
      } catch (error) {
        if (isDev) console.error('Error parsing permissions JSON:', error);
      }
    }

    const assignedBranchIds = await getUserAssignedBranchIds(prisma, user.id);

    req.user = {
      id: user.id,
      email: user.email,
      username: user.username,
      firstName: user.firstName,
      lastName: user.lastName,
      roleId: user.roleId,
      branchId: user.branchId || undefined,
      assignedBranchIds,
      role: parsedRole || undefined,
      branch: user.branch || undefined,
    };

    next();
  } catch (error) {
    if (error instanceof jwt.JsonWebTokenError) {
      next(createError('Invalid token', 401));
    } else if (error instanceof jwt.TokenExpiredError) {
      next(createError('Token expired', 401));
    } else if (error instanceof jwt.NotBeforeError) {
      next(createError('Token not active', 401));
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

    if (!req.user.role || !req.user.role.name) {
      return next(createError('User role not found', 403));
    }

    if (!roles.includes(req.user.role.name)) {
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

    if (!userPermissions) {
      return next(createError('Insufficient permissions', 403));
    }

    let parsedPermissions = userPermissions;
    if (typeof userPermissions === 'string') {
      try {
        parsedPermissions = JSON.parse(userPermissions);
      } catch {
        return next(createError('Invalid permissions format', 403));
      }
    }

    const [module, action] = permission.split('.');

    if (module === 'master') {
      if (parsedPermissions.masterData === 'full_access') {
        next();
        return;
      }

      const masterPermissions = parsedPermissions.master;
      if (!masterPermissions) {
        return next(createError('Insufficient permissions', 403));
      }

      if (action === 'users' && masterPermissions.users !== 'all') {
        return next(createError('Insufficient permissions', 403));
      }
      if (action === 'roles' && masterPermissions.roles !== 'all') {
        return next(createError('Insufficient permissions', 403));
      }
      if (action === 'cities' && masterPermissions.cities !== 'all') {
        return next(createError('Insufficient permissions', 403));
      }
      if (action === 'clients' && masterPermissions.clients !== 'all') {
        return next(createError('Insufficient permissions', 403));
      }
      if (action === 'branches' && masterPermissions.branches !== 'all') {
        return next(createError('Insufficient permissions', 403));
      }

      next();
      return;
    }

    const generalModuleAccess = parsedPermissions[module];
    if (generalModuleAccess === true || generalModuleAccess === 'all') {
      next();
      return;
    }

    const hasPermission = parsedPermissions[module] && parsedPermissions[module][action];
    if (!hasPermission) {
      return next(createError('Insufficient permissions', 403));
    }

    next();
  };
};
