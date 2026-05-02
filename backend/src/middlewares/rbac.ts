import { Request, Response, NextFunction } from 'express';
import { PrismaClient } from '@prisma/client';
import { createError } from './errorHandler';

const prisma = new PrismaClient();

// Permission types for the RBAC system
export interface Permission {
  dashboard?: { view: boolean };
  transactions?: { outward: boolean; inward: boolean };
  accounting?: 'all' | 'none';
  hawala?: 'all' | 'none';
  specialEntry?: 'all' | 'none';
  reports?: {
    report_1: boolean;
    report_2: boolean;
    report_3: boolean;
    report_4: boolean;
    report_5: boolean;
    report_6: boolean;
    report_7: boolean;
  };
  balanceSheet?: 'all' | 'none';
  masterData?: 'full_access' | 'role_based_access';
}

/**
 * Check if user has permission for a specific module and action
 */
export function checkPermission(module: keyof Permission, action?: string) {
  return async (req: Request, res: Response, next: NextFunction) => {
    try {
      if (!req.user) {
        return next(createError('Authentication required', 401));
      }

      // Get user with role and permissions
      const user = await prisma.user.findUnique({
        where: { id: req.user.id },
        include: {
          role: {
            select: {
              permissions: true
            }
          }
        }
      });

      if (!user || !user.role) {
        return next(createError('User role not found', 403));
      }

      const permissions = user.role.permissions as Permission;

      // Check if module exists in permissions
      if (!permissions[module]) {
        return next(createError(`Access denied to ${String(module)}`, 403));
      }

      const modulePermission = permissions[module];

      // Handle different permission types
      if (typeof modulePermission === 'string') {
        // For 'all' | 'none' type permissions
        if (modulePermission === 'none') {
          return next(createError(`Access denied to ${String(module)}`, 403));
        }
        // 'all' means full access
      } else if (typeof modulePermission === 'object' && action) {
        // For object permissions with specific actions
        const actionPermission = (modulePermission as any)[action];
        if (actionPermission === undefined || actionPermission === false) {
          return next(createError(`Access denied to ${String(module)}.${action}`, 403));
        }
      }

      // Store permissions in request for later use
      // Note: permissions are already available via req.user.role.permissions
      next();
    } catch (error) {
      console.error('Permission check error:', error);
      next(createError('Internal server error', 500));
    }
  };
}

/**
 * Check if user has admin or super admin role
 */
export function requireAdmin(req: Request, res: Response, next: NextFunction) {
  if (!req.user) {
    return next(createError('Authentication required', 401));
  }

  // This will be populated by the auth middleware after fetching user role
  // Check permissions via user.role
  
  if (!req.user?.role?.permissions) {
    return next(createError('Permissions not loaded', 403));
  }

  const permissions = req.user.role.permissions as Permission;
  const masterDataPermission = permissions.masterData;
  if (masterDataPermission !== 'full_access') {
    return next(createError('Admin access required', 403));
  }

  next();
}

/**
 * Middleware to load user permissions
 */
export async function loadPermissions(req: Request, res: Response, next: NextFunction) {
  try {
    if (!req.user) {
      return next();
    }

    const user = await prisma.user.findUnique({
      where: { id: req.user.id },
      include: {
        role: {
          select: {
            name: true,
            permissions: true
          }
        }
      }
    });

    if (user && user.role) {
      // Permissions are already available via user.role.permissions
      // No need to store separately
    }

    next();
  } catch (error) {
    console.error('Error loading permissions:', error);
    next();
  }
}

/**
 * Check if user can access a specific report
 */
export function checkReportAccess(reportNumber: number) {
  return async (req: Request, res: Response, next: NextFunction) => {
    try {
      if (!req.user?.role?.permissions?.reports) {
        return next(createError('No reports access', 403));
      }

      const reportKey = `report_${reportNumber}` as keyof Permission['reports'];
      const reports = req.user.role.permissions.reports as any;

      if (!reports[reportKey]) {
        return next(createError(`Access denied to report ${String(reportNumber)}`, 403));
      }

      next();
    } catch (error) {
      console.error('Report access check error:', error);
      next(createError('Internal server error', 500));
    }
  };
}

/**
 * Check transaction type access (outward/inward)
 */
export function checkTransactionAccess(type: 'outward' | 'inward') {
  return async (req: Request, res: Response, next: NextFunction) => {
    try {
      if (!req.user?.role?.permissions?.transactions) {
        return next(createError('No transactions access', 403));
      }

      const transactions = req.user.role.permissions.transactions as any;
      if (!transactions[type]) {
        return next(createError(`Access denied to ${type} transactions`, 403));
      }

      next();
    } catch (error) {
      console.error('Transaction access check error:', error);
      next(createError('Internal server error', 500));
    }
  };
}
