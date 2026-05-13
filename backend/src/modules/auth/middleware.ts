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

    console.log('=== AUTH DEBUG ===');
    console.log('Auth header:', authHeader);
    console.log('Token extracted:', token ? 'YES' : 'NO');
    console.log('Token length:', token?.length || 0);
    console.log('JWT_SECRET exists:', !!process.env.JWT_SECRET);
    console.log('JWT_SECRET value:', process.env.JWT_SECRET ? 'SET' : 'NOT_SET');
    console.log('Fallback secret:', 'your-secret-key');

    if (!token) {
      console.log('ERROR: No token provided');
      throw createError('Access token required', 401);
    }

    // Verify JWT token
    console.log('Attempting to verify token...');
    const decoded = jwt.verify(token, process.env.JWT_SECRET || 'your-secret-key') as any;
    console.log('Token decoded successfully:', decoded);
    console.log('Token userId:', decoded.userId);
    console.log('Token email:', decoded.email);
    console.log('Token username:', decoded.username);
    
    if (!decoded.userId) {
      console.log('ERROR: Token missing userId');
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
    console.log('=== AUTH ERROR DEBUG ===');
    console.log('Error type:', error instanceof Error ? error.constructor.name : 'Unknown');
    console.log('Error message:', error instanceof Error ? error.message : 'Unknown error');
    console.log('Error stack:', error instanceof Error ? error.stack : 'No stack available');
    
    if (error instanceof jwt.JsonWebTokenError) {
      console.log('JWT Error - Invalid token');
      next(createError('Invalid token', 401));
    } else if (error instanceof jwt.TokenExpiredError) {
      console.log('JWT Error - Token expired');
      next(createError('Token expired', 401));
    } else if (error instanceof jwt.NotBeforeError) {
      console.log('JWT Error - Token not active');
      next(createError('Token not active', 401));
    } else {
      console.log('Other authentication error:', error);
      next(error);
    }
  }
};

export const requireRole = (roles: string[]) => {
  return (req: Request, res: Response, next: NextFunction) => {
    console.log('=== REQUIRE ROLE DEBUG ===');
    console.log('Required roles:', roles);
    console.log('req.user exists:', !!req.user);
    
    if (!req.user) {
      console.log('ERROR: No user found in request');
      return next(createError('Authentication required', 401));
    }

    console.log('req.user.role exists:', !!req.user?.role);
    console.log('req.user.role:', req.user?.role);

    if (!req.user.role || !req.user.role.name) {
      console.log('ERROR: No role found for user or role name is missing');
      return next(createError('User role not found', 403));
    }

    const userRole = req.user.role.name;
    console.log('User role:', userRole);
    
    if (!roles.includes(userRole)) {
      console.log('ERROR: User role not in allowed roles');
      console.log('Allowed roles:', roles);
      console.log('User role:', userRole);
      return next(createError('Insufficient permissions', 403));
    }

    console.log('Role check passed');
    next();
  };
};

export const requirePermission = (permission: string) => {
  return (req: Request, res: Response, next: NextFunction) => {
    console.log('=== REQUIRE PERMISSION DEBUG ===');
    console.log('Required permission:', permission);
    console.log('req.user exists:', !!req.user);
    
    if (!req.user) {
      console.log('ERROR: No user found in request');
      return next(createError('Authentication required', 401));
    }

    const userPermissions = req.user.role.permissions;
    console.log('User permissions:', userPermissions);
    
    if (!userPermissions) {
      console.log('ERROR: No permissions found for user');
      return next(createError('Insufficient permissions', 403));
    }

    // Parse permissions if they're stored as string
    let parsedPermissions = userPermissions;
    if (typeof userPermissions === 'string') {
      try {
        parsedPermissions = JSON.parse(userPermissions);
      } catch (error) {
        console.log('ERROR: Failed to parse permissions JSON');
        return next(createError('Invalid permissions format', 403));
      }
    }

    // Check nested permission (e.g., transactions.create)
    const [module, action] = permission.split('.');
    const hasPermission = parsedPermissions[module] && parsedPermissions[module][action];
    
    // Special handling for general module permissions like 'accounting', 'transactions', etc.
    // If user has general access to a module, they should have access to all operations
    const generalModuleAccess = parsedPermissions[module];
    if (generalModuleAccess === true || generalModuleAccess === 'all') {
      console.log('User has general access to module:', module);
      console.log('Permission check passed');
      next();
      return;
    }
    
    console.log('Module:', module);
    console.log('Action:', action);
    console.log('Has permission:', hasPermission);
    
    if (!hasPermission) {
      console.log('ERROR: User does not have required permission');
      return next(createError('Insufficient permissions', 403));
    }

    console.log('Permission check passed');
    next();
  };
};
