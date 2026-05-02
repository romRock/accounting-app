import { Request, Response } from 'express';
import { PrismaClient } from '@prisma/client';
import { createError } from '../../middlewares/errorHandler';
import bcrypt from 'bcryptjs';

const prisma = new PrismaClient();

// Helper function to handle query parameters that can be arrays
const getFirstValue = (value: any): string | undefined => {
  if (Array.isArray(value)) {
    return value[0];
  }
  return value;
};

// RBAC Permissions validation function
function validateRBACPermissions(permissions: any) {
  const errors: string[] = [];
  
  // Check required modules
  const requiredModules = ['dashboard', 'transactions', 'accounting', 'hawala', 'specialEntry', 'reports', 'balanceSheet', 'masterData'];
  
  for (const module of requiredModules) {
    if (!permissions[module]) {
      errors.push(`${module} is required`);
      continue;
    }
    
    // Validate specific module structures
    switch (module) {
      case 'dashboard':
        if (typeof permissions[module] !== 'object' || typeof permissions[module].view !== 'boolean') {
          errors.push(`${module} must have a view boolean property`);
        }
        break;
        
      case 'transactions':
        if (typeof permissions[module] !== 'object' || 
            typeof permissions[module].outward !== 'boolean' || 
            typeof permissions[module].inward !== 'boolean') {
          errors.push(`${module} must have outward and inward boolean properties`);
        }
        break;
        
      case 'reports':
        if (typeof permissions[module] !== 'object') {
          errors.push(`${module} must be an object`);
        } else {
          for (let i = 1; i <= 7; i++) {
            const reportKey = `report_${i}`;
            if (typeof permissions[module][reportKey] !== 'boolean') {
              errors.push(`${module}.${reportKey} must be boolean`);
            }
          }
        }
        break;
        
      case 'accounting':
      case 'hawala':
      case 'specialEntry':
      case 'balanceSheet':
        if (permissions[module] !== 'all' && permissions[module] !== 'none') {
          errors.push(`${module} must be 'all' or 'none'`);
        }
        break;
        
      case 'masterData':
        if (permissions[module] !== 'full_access' && permissions[module] !== 'role_based_access') {
          errors.push(`${module} must be 'full_access' or 'role_based_access'`);
        }
        break;
    }
  }
  
  return {
    isValid: errors.length === 0,
    errors
  };
}

// User Management
export const getUsers = async (req: Request, res: Response) => {
  try {
    const {
      page = 1,
      limit = 10,
      search,
      roleId,
      branchId,
      isActive,
    } = req.query;

    const where: any = {
      isDeleted: false,
    };

    if (search) {
      const searchValue = getFirstValue(search);
      if (searchValue) {
        where.OR = [
          { firstName: { contains: searchValue, mode: 'insensitive' } },
          { lastName: { contains: searchValue, mode: 'insensitive' } },
          { email: { contains: searchValue, mode: 'insensitive' } },
          { username: { contains: searchValue, mode: 'insensitive' } },
        ];
      }
    }

    if (roleId) {
      const roleIdValue = getFirstValue(roleId);
      if (roleIdValue) where.roleId = roleIdValue;
    }
    if (branchId) {
      const branchIdValue = getFirstValue(branchId);
      if (branchIdValue) where.branchId = branchIdValue;
    }
    if (isActive !== undefined) where.isActive = isActive === 'true';

    const [users, total] = await Promise.all([
      prisma.user.findMany({
        where,
        select: {
          id: true,
          email: true,
          username: true,
          firstName: true,
          lastName: true,
          phone: true,
          isActive: true,
          createdAt: true,
          updatedAt: true,
          role: {
            select: {
              id: true,
              name: true,
              permissions: true,
            },
          },
          branch: {
            select: {
              id: true,
              name: true,
              code: true,
              address: true,
              phone: true,
              email: true,
              isActive: true,
            },
          },
        },
        orderBy: { createdAt: 'desc' },
        skip: (Number(page) - 1) * Number(limit),
        take: Number(limit),
      }),
      prisma.user.count({ where }),
    ]);

    res.json({
      users,
      pagination: {
        page: Number(page),
        limit: Number(limit),
        total,
        pages: Math.ceil(total / Number(limit)),
      },
    });
  } catch (error) {
    throw error;
  }
};

export const getUserById = async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    const userId = getFirstValue(id);
    
    if (!userId) {
      throw createError('User ID is required', 400);
    }

    const user = await prisma.user.findFirst({
      where: { id: userId, isDeleted: false },
      select: {
        id: true,
        email: true,
        username: true,
        firstName: true,
        lastName: true,
        phone: true,
        isActive: true,
        createdAt: true,
        updatedAt: true,
        role: {
          select: {
            id: true,
            name: true,
            description: true,
            permissions: true,
          },
        },
        branch: {
          select: {
            id: true,
            name: true,
            code: true,
            address: true,
            phone: true,
            email: true,
            isActive: true,
          },
        },
      },
    });

    if (!user) {
      throw createError('User not found', 404);
    }

    res.json(user);
  } catch (error) {
    throw error;
  }
};

export const createUser = async (req: Request, res: Response) => {
  try {
    const {
      email,
      username,
      password,
      firstName,
      lastName,
      phone,
      roleId,
      branchId,
    } = req.body;

    const userId = req.user?.id;

    // Check if user already exists
    const existingUser = await prisma.user.findFirst({
      where: {
        OR: [
          { email },
          { username },
        ],
        isDeleted: false,
      },
    });

    if (existingUser) {
      throw createError('User with this email or username already exists', 409);
    }

    // Hash password
    const hashedPassword = await bcrypt.hash(password, 12);

    const user = await prisma.user.create({
      data: {
        email,
        username,
        password: hashedPassword,
        firstName,
        lastName,
        phone,
        roleId,
        branchId,
      },
      select: {
        id: true,
        email: true,
        username: true,
        firstName: true,
        lastName: true,
        phone: true,
        isActive: true,
        createdAt: true,
        updatedAt: true,
        role: {
          select: {
            id: true,
            name: true,
            permissions: true,
          },
        },
        branch: {
          select: {
            id: true,
            name: true,
            code: true,
            address: true,
            phone: true,
            email: true,
            isActive: true,
          },
        },
      },
    });

    res.status(201).json({
      message: 'User created successfully',
      user,
    });
  } catch (error) {
    throw error;
  }
};

export const updateUser = async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    const userIdParam = getFirstValue(id);
    
    if (!userIdParam) {
      throw createError('User ID is required', 400);
    }
    const {
      email,
      username,
      firstName,
      lastName,
      phone,
      roleId,
      branchId,
      isActive,
      password,
    } = req.body;

    const userId = req.user?.id;

    // Check if user exists
    const existingUser = await prisma.user.findFirst({
      where: { id: userIdParam, isDeleted: false },
    });

    if (!existingUser) {
      throw createError('User not found', 404);
    }

    // Check if email/username is already taken by another user
    if (email || username) {
      const duplicateUser = await prisma.user.findFirst({
        where: {
          AND: [
            { id: { not: userIdParam } },
            { isDeleted: false },
            {
              OR: [
                email ? { email } : {},
                username ? { username } : {},
              ].filter(condition => Object.keys(condition).length > 0),
            },
          ],
        },
      });

      if (duplicateUser) {
        throw createError('Email or username already taken', 409);
      }
    }

    // Prepare update data
    const updateData: any = {
      email,
      username,
      firstName,
      lastName,
      phone,
      roleId,
      branchId,
      isActive,
    };

    // Hash new password if provided
    if (password) {
      updateData.password = await bcrypt.hash(password, 12);
    }

    const user = await prisma.user.update({
      where: { id: userIdParam },
      data: updateData,
      select: {
        id: true,
        email: true,
        username: true,
        firstName: true,
        lastName: true,
        phone: true,
        isActive: true,
        createdAt: true,
        updatedAt: true,
        role: {
          select: {
            id: true,
            name: true,
            description: true,
          },
        },
        branch: {
          select: {
            id: true,
            name: true,
            code: true,
            address: true,
            phone: true,
            email: true,
            isActive: true,
          },
        },
      },
    });

    // Create audit log
    await prisma.auditLog.create({
      data: {
        entity: 'User',
        entityId: userIdParam,
        action: 'UPDATE',
        oldValues: JSON.stringify(existingUser),
        newValues: JSON.stringify(user),
        ipAddress: req.ip,
        userAgent: req.get('User-Agent'),
        createdBy: userId!,
      },
    });

    res.json({
      message: 'User updated successfully',
      user,
    });
  } catch (error) {
    throw error;
  }
};

export const deleteUser = async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    const userIdParam = getFirstValue(id);
    const userId = req.user?.id;
    
    if (!userIdParam) {
      throw createError('User ID is required', 400);
    }

    // Check if user exists
    const existingUser = await prisma.user.findFirst({
      where: { id: userIdParam, isDeleted: false },
    });

    if (!existingUser) {
      throw createError('User not found', 404);
    }

    // Soft delete user
    await prisma.user.update({
      where: { id: userIdParam },
      data: {
        isActive: false,
        isDeleted: true,
      },
    });

    // Create audit log
    await prisma.auditLog.create({
      data: {
        entity: 'User',
        entityId: userIdParam,
        action: 'DELETE',
        oldValues: JSON.stringify(existingUser),
        ipAddress: req.ip,
        userAgent: req.get('User-Agent'),
        createdBy: userId!,
      },
    });

    res.json({ message: 'User deleted successfully' });
  } catch (error) {
    throw error;
  }
};

// Role Management
export const getRoles = async (req: Request, res: Response) => {
  try {
    const roles = await prisma.role.findMany({
      where: {
        isActive: true,
        isDeleted: false,
      },
      select: {
        id: true,
        name: true,
        description: true,
        permissions: true,
        createdAt: true,
        updatedAt: true,
        _count: {
          select: {
            users: {
              where: {
                isActive: true,
                isDeleted: false,
              },
            },
          },
        },
      },
      orderBy: { name: 'asc' },
    });

    // Parse permissions JSON for each role
    const rolesWithParsedPermissions = roles.map(role => ({
      ...role,
      permissions: typeof role.permissions === 'string' 
        ? JSON.parse(role.permissions) 
        : role.permissions,
      userCount: role._count.users,
    }));

    res.json({ roles: rolesWithParsedPermissions });
  } catch (error) {
    throw error;
  }
};

export const getRoleById = async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    const roleId = getFirstValue(id);
    
    if (!roleId) {
      throw createError('Role ID is required', 400);
    }

    const role = await prisma.role.findFirst({
      where: {
        id: roleId,
        isActive: true,
        isDeleted: false,
      },
    });

    if (!role) {
      throw createError('Role not found', 404);
    }

    res.json(role);
  } catch (error) {
    throw error;
  }
};

export const createRole = async (req: Request, res: Response) => {
  try {
    const { name, description, permissions } = req.body;
    const userId = req.user?.id;

    // Validate required fields
    if (!name || !permissions) {
      throw createError('Role name and permissions are required', 400);
    }

    // Validate RBAC permissions structure
    const validPermissions = validateRBACPermissions(permissions);
    if (!validPermissions.isValid) {
      throw createError(`Invalid permissions: ${validPermissions.errors.join(', ')}`, 400);
    }

    // Check if role already exists
    const existingRole = await prisma.role.findFirst({
      where: {
        name,
        isActive: true,
        isDeleted: false,
      },
    });

    if (existingRole) {
      throw createError('Role with this name already exists', 409);
    }

    const role = await prisma.role.create({
      data: {
        name,
        description,
        permissions: permissions, // Store as JSON object, not string
      },
    });

    // Create audit log
    await prisma.auditLog.create({
      data: {
        entity: 'Role',
        entityId: role.id,
        action: 'CREATE',
        newValues: JSON.stringify(role),
        ipAddress: req.ip,
        userAgent: req.get('User-Agent'),
        createdBy: userId!,
      },
    });

    res.status(201).json({
      message: 'Role created successfully',
      role,
    });
  } catch (error) {
    throw error;
  }
};

export const updateRole = async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    const roleId = getFirstValue(id);
    const { name, description, permissions } = req.body;
    const userId = req.user?.id;
    
    if (!roleId) {
      throw createError('Role ID is required', 400);
    }

    // Check if role exists
    const existingRole = await prisma.role.findFirst({
      where: {
        id: roleId,
        isActive: true,
        isDeleted: false,
      },
    });

    if (!existingRole) {
      throw createError('Role not found', 404);
    }

    // Prevent modification of Super Admin role
    if (existingRole.name === 'Super Admin') {
      throw createError('Cannot modify Super Admin role', 403);
    }

    // Validate RBAC permissions if provided
    if (permissions) {
      const validPermissions = validateRBACPermissions(permissions);
      if (!validPermissions.isValid) {
        throw createError(`Invalid permissions: ${validPermissions.errors.join(', ')}`, 400);
      }
    }

    // Check if name is already taken by another role
    if (name && name !== existingRole.name) {
      const duplicateRole = await prisma.role.findFirst({
        where: {
          AND: [
            { id: { not: roleId } },
            { name },
            { isActive: true },
            { isDeleted: false },
          ],
        },
      });

      if (duplicateRole) {
        throw createError('Role name already taken', 409);
      }
    }

    const updateData: any = {
      name,
      description,
    };

    if (permissions) {
      updateData.permissions = permissions; // Store as JSON object, not string
    }

    const role = await prisma.role.update({
      where: { id: roleId },
      data: updateData,
    });

    // Create audit log
    await prisma.auditLog.create({
      data: {
        entity: 'Role',
        entityId: roleId,
        action: 'UPDATE',
        oldValues: JSON.stringify(existingRole),
        newValues: JSON.stringify(role),
        ipAddress: req.ip,
        userAgent: req.get('User-Agent'),
        createdBy: userId!,
      },
    });

    res.json({
      message: 'Role updated successfully',
      role: {
        ...role,
        permissions: JSON.parse(role.permissions as string),
      },
    });
  } catch (error) {
    throw error;
  }
};

export const deleteRole = async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    const roleId = getFirstValue(id);
    const userId = req.user?.id;
    
    if (!roleId) {
      throw createError('Role ID is required', 400);
    }

    // Check if role exists
    const existingRole = await prisma.role.findFirst({
      where: {
        id: roleId,
        isActive: true,
        isDeleted: false,
      },
    });

    if (!existingRole) {
      throw createError('Role not found', 404);
    }

    // Prevent deletion of Super Admin role
    if (existingRole.name === 'Super Admin') {
      throw createError('Cannot delete Super Admin role', 403);
    }

    // Check if role is being used by any users
    const usersWithRole = await prisma.user.count({
      where: {
        roleId: roleId,
        isActive: true,
        isDeleted: false,
      },
    });

    if (usersWithRole > 0) {
      throw createError('Cannot delete role that is assigned to users', 400);
    }

    // Soft delete role
    await prisma.role.update({
      where: { id: roleId },
      data: {
        isActive: false,
        isDeleted: true,
      },
    });

    // Create audit log
    await prisma.auditLog.create({
      data: {
        entity: 'Role',
        entityId: roleId,
        action: 'DELETE',
        oldValues: JSON.stringify(existingRole),
        ipAddress: req.ip,
        userAgent: req.get('User-Agent'),
        createdBy: userId!,
      },
    });

    res.json({ message: 'Role deleted successfully' });
  } catch (error) {
    throw error;
  }
};

// City Management
export const getCities = async (req: Request, res: Response) => {
  try {
    const { search, state } = req.query;

    const where: any = {
      isActive: true,
      isDeleted: false,
    };

    if (search) {
      where.OR = [
        { name: { contains: search as string, mode: 'insensitive' } },
        { code: { contains: search as string, mode: 'insensitive' } },
      ];
    }

    if (state) where.state = state as string;

    const cities = await prisma.city.findMany({
      where,
      orderBy: { name: 'asc' },
    });

    res.json({ cities });
  } catch (error) {
    throw error;
  }
};

export const getCityById = async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    const cityId = getFirstValue(id);
    
    if (!cityId) {
      throw createError('City ID is required', 400);
    }

    const city = await prisma.city.findFirst({
      where: {
        id: cityId,
        isActive: true,
        isDeleted: false,
      },
    });

    if (!city) {
      throw createError('City not found', 404);
    }

    res.json(city);
  } catch (error) {
    throw error;
  }
};

export const createCity = async (req: Request, res: Response) => {
  try {
    const { name, code, state } = req.body;
    const userId = req.user?.id;

    // Check if city already exists
    const existingCity = await prisma.city.findFirst({
      where: {
        OR: [
          { name },
          { code },
        ],
        isActive: true,
        isDeleted: false,
      },
    });

    if (existingCity) {
      throw createError('City with this name or code already exists', 409);
    }

    const city = await prisma.city.create({
      data: {
        name,
        code,
        state,
      },
    });

    res.status(201).json({
      message: 'City created successfully',
      city,
    });
  } catch (error) {
    throw error;
  }
};

export const updateCity = async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    const cityId = getFirstValue(id);
    const { name, code, state } = req.body;
    const userId = req.user?.id;
    
    if (!cityId) {
      throw createError('City ID is required', 400);
    }

    // Check if city exists
    const existingCity = await prisma.city.findFirst({
      where: {
        id: cityId,
        isActive: true,
        isDeleted: false,
      },
    });

    if (!existingCity) {
      throw createError('City not found', 404);
    }

    // Check if name/code is already taken by another city
    if (name || code) {
      const duplicateCity = await prisma.city.findFirst({
        where: {
          AND: [
            { id: { not: cityId } },
            { isActive: true },
            { isDeleted: false },
            {
              OR: [
                name ? { name } : {},
                code ? { code } : {},
              ].filter(condition => Object.keys(condition).length > 0),
            },
          ],
        },
      });

      if (duplicateCity) {
        throw createError('City name or code already taken', 409);
      }
    }

    const city = await prisma.city.update({
      where: { id: cityId },
      data: {
        name,
        code,
        state,
      },
    });

    // Create audit log
    await prisma.auditLog.create({
      data: {
        entity: 'City',
        entityId: cityId,
        action: 'UPDATE',
        oldValues: JSON.stringify(existingCity),
        newValues: JSON.stringify(city),
        ipAddress: req.ip,
        userAgent: req.get('User-Agent'),
        createdBy: userId!,
      },
    });

    res.json({
      message: 'City updated successfully',
      city,
    });
  } catch (error) {
    throw error;
  }
};

export const deleteCity = async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    const cityId = getFirstValue(id);
    const userId = req.user?.id;
    
    if (!cityId) {
      throw createError('City ID is required', 400);
    }

    // Check if city exists
    const existingCity = await prisma.city.findFirst({
      where: {
        id: cityId,
        isActive: true,
        isDeleted: false,
      },
    });

    if (!existingCity) {
      throw createError('City not found', 404);
    }

    // Check if city is being used in any transactions
    const [fromTransactions, toTransactions] = await Promise.all([
      prisma.transaction.count({
        where: {
          fromCityId: cityId,
          isActive: true,
          isDeleted: false,
        },
      }),
      prisma.transaction.count({
        where: {
          toCityId: cityId,
          isActive: true,
          isDeleted: false,
        },
      }),
    ]);

    if (fromTransactions > 0 || toTransactions > 0) {
      throw createError('Cannot delete city that is used in transactions', 400);
    }

    // Soft delete city
    await prisma.city.update({
      where: { id: cityId },
      data: {
        isActive: false,
        isDeleted: true,
      },
    });

    // Create audit log
    await prisma.auditLog.create({
      data: {
        entity: 'City',
        entityId: cityId,
        action: 'DELETE',
        oldValues: JSON.stringify(existingCity),
        ipAddress: req.ip,
        userAgent: req.get('User-Agent'),
        createdBy: userId!,
      },
    });

    res.json({ message: 'City deleted successfully' });
  } catch (error) {
    throw error;
  }
};

// Party Management
export const getParties = async (req: Request, res: Response) => {
  try {
    const { search, cityId } = req.query;

    const where: any = {
      isActive: true,
      isDeleted: false,
    };

    if (search) {
      where.OR = [
        { name: { contains: search as string, mode: 'insensitive' } },
        { phone: { contains: search as string, mode: 'insensitive' } },
        { email: { contains: search as string, mode: 'insensitive' } },
      ];
    }

    // City filtering removed - client city is separate from cities table

    const parties = await prisma.party.findMany({
      where,
      orderBy: { name: 'asc' },
    });

    res.json({ parties });
  } catch (error) {
    throw error;
  }
};

export const getPartyById = async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    const partyId = getFirstValue(id);
    
    if (!partyId) {
      throw createError('Party ID is required', 400);
    }

    const party = await prisma.party.findFirst({
      where: {
        id: partyId,
        isActive: true,
        isDeleted: false,
      },
    });

    if (!party) {
      throw createError('Party not found', 404);
    }

    res.json(party);
  } catch (error) {
    throw error;
  }
};

export const createParty = async (req: Request, res: Response) => {
  try {
    const {
      name,
      phone,
      email,
      address,
      panNumber,
      gstNumber,
      city,
    } = req.body;

    const party = await prisma.party.create({
      data: {
        name,
        phone,
        email,
        address,
        panNumber,
        gstNumber,
        city,
      },
    });

    res.status(201).json({
      message: 'Party created successfully',
      party,
    });
  } catch (error) {
    throw error;
  }
};

export const updateParty = async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    const partyId = getFirstValue(id);
    const {
      name,
      phone,
      email,
      address,
      panNumber,
      gstNumber,
      city,
    } = req.body;

    const userId = req.user?.id;
    
    if (!partyId) {
      throw createError('Party ID is required', 400);
    }

    // Check if party exists
    const existingParty = await prisma.party.findFirst({
      where: {
        id: partyId,
        isActive: true,
        isDeleted: false,
      },
    });

    if (!existingParty) {
      throw createError('Party not found', 404);
    }

    const party = await prisma.party.update({
      where: { id: partyId },
      data: {
        name,
        phone,
        email,
        address,
        panNumber,
        gstNumber,
        city,
      },
    });

    // Create audit log
    await prisma.auditLog.create({
      data: {
        entity: 'Party',
        entityId: partyId,
        action: 'UPDATE',
        oldValues: JSON.stringify(existingParty),
        newValues: JSON.stringify(party),
        ipAddress: req.ip,
        userAgent: req.get('User-Agent'),
        createdBy: userId!,
      },
    });

    res.json({
      message: 'Party updated successfully',
      party,
    });
  } catch (error) {
    throw error;
  }
};

export const deleteParty = async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    const partyId = getFirstValue(id);
    const userId = req.user?.id;
    
    if (!partyId) {
      throw createError('Party ID is required', 400);
    }

    // Check if party exists
    const existingParty = await prisma.party.findFirst({
      where: {
        id: partyId,
        isActive: true,
        isDeleted: false,
      },
    });

    if (!existingParty) {
      throw createError('Party not found', 404);
    }

    // Check if party is being used in any transactions
    const transactions = await prisma.transaction.count({
      where: {
        partyId: partyId,
        isActive: true,
        isDeleted: false,
      },
    });

    if (transactions > 0) {
      throw createError('Cannot delete party that is used in transactions', 400);
    }

    // Soft delete party
    await prisma.party.update({
      where: { id: partyId },
      data: {
        isActive: false,
        isDeleted: true,
      },
    });

    // Create audit log
    await prisma.auditLog.create({
      data: {
        entity: 'Party',
        entityId: partyId,
        action: 'DELETE',
        oldValues: JSON.stringify(existingParty),
        ipAddress: req.ip,
        userAgent: req.get('User-Agent'),
        createdBy: userId!,
      },
    });

    res.json({ message: 'Party deleted successfully' });
  } catch (error) {
    throw error;
  }
};

// Branch Management
export const getBranches = async (req: Request, res: Response) => {
  try {
    const { search } = req.query;

    const where: any = {
      isActive: true,
      isDeleted: false,
    };

    if (search) {
      const searchValue = getFirstValue(search);
      if (searchValue) {
        where.OR = [
          { name: { contains: searchValue, mode: 'insensitive' } },
          { code: { contains: searchValue, mode: 'insensitive' } },
        ];
      }
    }

    const branches = await prisma.branch.findMany({
      where,
      orderBy: { name: 'asc' },
    });

    res.json({ branches });
  } catch (error) {
    throw error;
  }
};

export const getBranchById = async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    const branchId = getFirstValue(id);
    
    if (!branchId) {
      throw createError('Branch ID is required', 400);
    }

    const branch = await prisma.branch.findFirst({
      where: {
        id: branchId,
        isActive: true,
        isDeleted: false,
      },
    });

    if (!branch) {
      throw createError('Branch not found', 404);
    }

    res.json(branch);
  } catch (error) {
    throw error;
  }
};

export const createBranch = async (req: Request, res: Response) => {
  try {
    const {
      name,
      code,
      address,
      phone,
      email,
    } = req.body;

    // Check if branch already exists
    const existingBranch = await prisma.branch.findFirst({
      where: {
        OR: [
          { name },
          { code },
        ],
        isActive: true,
        isDeleted: false,
      },
    });

    if (existingBranch) {
      throw createError('Branch with this name or code already exists', 409);
    }

    const branch = await prisma.branch.create({
      data: {
        name,
        code,
        address,
        phone,
        email,
      },
    });

    res.status(201).json({
      message: 'Branch created successfully',
      branch,
    });
  } catch (error) {
    throw error;
  }
};

export const updateBranch = async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    const branchId = getFirstValue(id);
    const {
      name,
      code,
      address,
      phone,
      email,
    } = req.body;

    const userId = req.user?.id;
    
    if (!branchId) {
      throw createError('Branch ID is required', 400);
    }

    // Check if branch exists
    const existingBranch = await prisma.branch.findFirst({
      where: {
        id: branchId,
        isActive: true,
        isDeleted: false,
      },
    });

    if (!existingBranch) {
      throw createError('Branch not found', 404);
    }

    // Check if name/code is already taken by another branch
    if (name || code) {
      const duplicateBranch = await prisma.branch.findFirst({
        where: {
          AND: [
            { id: { not: branchId } },
            { isActive: true },
            { isDeleted: false },
            {
              OR: [
                name ? { name } : {},
                code ? { code } : {},
              ].filter(condition => Object.keys(condition).length > 0),
            },
          ],
        },
      });

      if (duplicateBranch) {
        throw createError('Branch name or code already taken', 409);
      }
    }

    const branch = await prisma.branch.update({
      where: { id: branchId },
      data: {
        name,
        code,
        address,
        phone,
        email,
      },
    });

    // Create audit log
    await prisma.auditLog.create({
      data: {
        entity: 'Branch',
        entityId: branchId,
        action: 'UPDATE',
        oldValues: JSON.stringify(existingBranch),
        newValues: JSON.stringify(branch),
        ipAddress: req.ip,
        userAgent: req.get('User-Agent'),
        createdBy: userId!,
      },
    });

    res.json({
      message: 'Branch updated successfully',
      branch,
    });
  } catch (error) {
    throw error;
  }
};

export const deleteBranch = async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    const branchId = getFirstValue(id);
    const userId = req.user?.id;
    
    if (!branchId) {
      throw createError('Branch ID is required', 400);
    }

    // Check if branch exists
    const existingBranch = await prisma.branch.findFirst({
      where: {
        id: branchId,
        isActive: true,
        isDeleted: false,
      },
    });

    if (!existingBranch) {
      throw createError('Branch not found', 404);
    }

    // Check if branch is being used by any users
    const users = await prisma.user.count({
      where: {
        branchId: branchId,
        isActive: true,
        isDeleted: false,
      },
    });

    if (users > 0) {
      throw createError('Cannot delete branch that is assigned to users', 400);
    }

    // Soft delete branch
    await prisma.branch.update({
      where: { id: branchId },
      data: {
        isActive: false,
        isDeleted: true,
      },
    });

    // Create audit log
    await prisma.auditLog.create({
      data: {
        entity: 'Branch',
        entityId: branchId,
        action: 'DELETE',
        oldValues: JSON.stringify(existingBranch),
        ipAddress: req.ip,
        userAgent: req.get('User-Agent'),
        createdBy: userId!,
      },
    });

    res.json({ message: 'Branch deleted successfully' });
  } catch (error) {
    throw error;
  }
};

// Commission Rate Management
export const getCommissionRates = async (req: Request, res: Response) => {
  try {
    const { fromCityId, toCityId } = req.query;

    const where: any = {
      isActive: true,
      isDeleted: false,
    };

    if (fromCityId) {
      const fromCityIdValue = getFirstValue(fromCityId);
      if (fromCityIdValue) where.fromCityId = fromCityIdValue;
    }
    if (toCityId) {
      const toCityIdValue = getFirstValue(toCityId);
      if (toCityIdValue) where.toCityId = toCityIdValue;
    }

    const commissionRates = await prisma.commissionRate.findMany({
      where,
      orderBy: { createdAt: 'desc' },
    });

    res.json({ commissionRates });
  } catch (error) {
    throw error;
  }
};

export const getCommissionRateById = async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    const commissionRateId = getFirstValue(id);
    
    if (!commissionRateId) {
      throw createError('Commission rate ID is required', 400);
    }

    const commissionRate = await prisma.commissionRate.findFirst({
      where: {
        id: commissionRateId,
        isActive: true,
        isDeleted: false,
      },
    });

    if (!commissionRate) {
      throw createError('Commission rate not found', 404);
    }

    res.json(commissionRate);
  } catch (error) {
    throw error;
  }
};

export const createCommissionRate = async (req: Request, res: Response) => {
  try {
    const {
      fromCityId,
      toCityId,
      rateType,
      rate,
      minAmount,
      maxAmount,
    } = req.body;

    const userId = req.user?.id;

    const commissionRate = await prisma.commissionRate.create({
      data: {
        fromCityId,
        toCityId,
        rateType,
        rate: Number(rate),
        minAmount: minAmount ? Number(minAmount) : null,
        maxAmount: maxAmount ? Number(maxAmount) : null,
      },
    });

    res.status(201).json({
      message: 'Commission rate created successfully',
      commissionRate,
    });
  } catch (error) {
    throw error;
  }
};

export const updateCommissionRate = async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    const commissionRateId = getFirstValue(id);
    const {
      fromCityId,
      toCityId,
      rateType,
      rate,
      minAmount,
      maxAmount,
    } = req.body;

    const userId = req.user?.id;
    
    if (!commissionRateId) {
      throw createError('Commission rate ID is required', 400);
    }

    // Check if commission rate exists
    const existingRate = await prisma.commissionRate.findFirst({
      where: {
        id: commissionRateId,
        isActive: true,
        isDeleted: false,
      },
    });

    if (!existingRate) {
      throw createError('Commission rate not found', 404);
    }

    const commissionRate = await prisma.commissionRate.update({
      where: { id: commissionRateId },
      data: {
        fromCityId,
        toCityId,
        rateType,
        rate: Number(rate),
        minAmount: minAmount ? Number(minAmount) : null,
        maxAmount: maxAmount ? Number(maxAmount) : null,
      },
    });

    // Create audit log
    await prisma.auditLog.create({
      data: {
        entity: 'CommissionRate',
        entityId: commissionRateId,
        action: 'UPDATE',
        oldValues: JSON.stringify(existingRate),
        newValues: JSON.stringify(commissionRate),
        ipAddress: req.ip,
        userAgent: req.get('User-Agent'),
        createdBy: userId!,
      },
    });

    res.json({
      message: 'Commission rate updated successfully',
      commissionRate,
    });
  } catch (error) {
    throw error;
  }
};

export const deleteCommissionRate = async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    const commissionRateId = getFirstValue(id);
    const userId = req.user?.id;
    
    if (!commissionRateId) {
      throw createError('Commission rate ID is required', 400);
    }

    // Check if commission rate exists
    const existingRate = await prisma.commissionRate.findFirst({
      where: {
        id: commissionRateId,
        isActive: true,
        isDeleted: false,
      },
    });

    if (!existingRate) {
      throw createError('Commission rate not found', 404);
    }

    // Soft delete commission rate
    await prisma.commissionRate.update({
      where: { id: commissionRateId },
      data: {
        isActive: false,
        isDeleted: true,
      },
    });

    // Create audit log
    await prisma.auditLog.create({
      data: {
        entity: 'CommissionRate',
        entityId: commissionRateId,
        action: 'DELETE',
        oldValues: JSON.stringify(existingRate),
        ipAddress: req.ip,
        userAgent: req.get('User-Agent'),
        createdBy: userId!,
      },
    });

    res.json({ message: 'Commission rate deleted successfully' });
  } catch (error) {
    throw error;
  }
};

// Public Cities Search Endpoint (for typeahead dropdown)
export const searchCities = async (req: Request, res: Response) => {
  try {
    console.log("=== CITIES API DEBUG ===");
    console.log("Cities API HIT");
    console.log("Environment:", process.env.NODE_ENV);
    console.log("Query params:", req.query);
    
    // Log DB connection (masked)
    const dbUrl = process.env.DATABASE_URL || '';
    const maskedUrl = dbUrl.includes('@') 
      ? dbUrl.substring(0, dbUrl.indexOf('@') + 1) + '***'
      : '***';
    console.log("DB URL (masked):", maskedUrl);
    
    const {
      search,
      limit = 20,
      page = 1
    } = req.query;

    // Convert and validate parameters
    const searchValue = getFirstValue(search);
    const limitNum = Math.min(Math.max(parseInt(getFirstValue(limit) || '20'), 1), 50); // Max 50 results
    const pageNum = Math.max(parseInt(getFirstValue(page) || '1'), 1);
    const offset = (pageNum - 1) * limitNum;
    
    console.log("Search:", searchValue);
    console.log("Limit:", limitNum);
    console.log("Page:", pageNum);

    const where: any = {
      isActive: true,
      isDeleted: false,
    };

    // Build search conditions
    if (searchValue && searchValue.trim()) {
      const searchTerm = searchValue.trim();
      where.OR = [
        { name: { contains: searchTerm, mode: 'insensitive' } },
        { code: { contains: searchTerm, mode: 'insensitive' } },
        { state: { contains: searchTerm, mode: 'insensitive' } },
      ];
    }

    // DEBUG: Check total cities in database first
    const totalCitiesInDb = await prisma.city.count({
      where: { isActive: true, isDeleted: false }
    });
    console.log("Total cities in DB:", totalCitiesInDb);

    // SAFE AUTO-SEEDING: Only if DB is completely empty
    if (totalCitiesInDb === 0 && process.env.NODE_ENV === 'production') {
      console.log("Database is empty in production - triggering auto-seed...");
      try {
        const { seedCities } = await import('../../seedCities');
        await seedCities();
        console.log("Auto-seeding completed successfully");
        
        // Re-check count after seeding
        const newCount = await prisma.city.count({
          where: { isActive: true, isDeleted: false }
        });
        console.log("Cities count after auto-seeding:", newCount);
      } catch (seedError) {
        console.error("Auto-seeding failed:", seedError);
        // Continue with empty response rather than failing the API
      }
    }

    // Get total count for pagination
    const total = await prisma.city.count({ where });
    console.log("Cities matching query:", total);

    // Build orderBy conditions - always sort A-Z
    let orderBy: any = { name: 'asc' };

    // FIX: Don't apply limit unless explicitly provided
    const shouldApplyLimit = req.query.limit !== undefined;
    const finalLimit = shouldApplyLimit ? limitNum : undefined;
    const finalOffset = shouldApplyLimit ? offset : undefined;
    
    console.log("Should apply limit:", shouldApplyLimit);
    console.log("Final limit:", finalLimit);

    // Fetch cities with optional pagination
    const cities = await prisma.city.findMany({
      where,
      orderBy,
      take: finalLimit,
      skip: finalOffset,
      select: {
        id: true,
        name: true,
        code: true,
        state: true,
        address: true,
        number: true,
      },
    });

    console.log("Cities fetched count:", cities.length);
    console.log("=== END CITIES API DEBUG ===");

    // Calculate pagination info only if limit is applied
    let pagination = null;
    if (shouldApplyLimit) {
      const totalPages = Math.ceil(total / limitNum);
      pagination = {
        page: pageNum,
        limit: limitNum,
        total,
        totalPages,
        hasNext: pageNum < totalPages,
        hasPrev: pageNum > 1,
      };
    }

    res.json({
      success: true,
      data: cities,
      pagination,
    });
  } catch (error) {
    console.error('Error in searchCities:', error);
    res.status(500).json({
      success: false,
      message: 'Error fetching cities',
    });
  }
};
