import { Request, Response } from 'express';
import { PrismaClient } from '@prisma/client';
import { createError } from '../../middlewares/errorHandler';
import bcrypt from 'bcryptjs';

const prisma = new PrismaClient();

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
      where.OR = [
        { firstName: { contains: search as string, mode: 'insensitive' } },
        { lastName: { contains: search as string, mode: 'insensitive' } },
        { email: { contains: search as string, mode: 'insensitive' } },
        { username: { contains: search as string, mode: 'insensitive' } },
      ];
    }

    if (roleId) where.roleId = roleId as string;
    if (branchId) where.branchId = branchId as string;
    if (isActive !== undefined) where.isActive = isActive === 'true';

    const [users, total] = await Promise.all([
      prisma.user.findMany({
        where,
        include: {
          role: true,
          branch: true,
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
              description: true,
            },
          },
          branch: {
            select: {
              id: true,
              name: true,
              code: true,
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

    const user = await prisma.user.findFirst({
      where: { id, isDeleted: false },
      include: {
        role: true,
        branch: true,
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
        createdBy: userId!,
      },
      include: {
        role: true,
        branch: true,
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
            description: true,
          },
        },
        branch: {
          select: {
            id: true,
            name: true,
            code: true,
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
      where: { id, isDeleted: false },
    });

    if (!existingUser) {
      throw createError('User not found', 404);
    }

    // Check if email/username is already taken by another user
    if (email || username) {
      const duplicateUser = await prisma.user.findFirst({
        where: {
          AND: [
            { id: { not: id } },
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
      where: { id },
      data: updateData,
      include: {
        role: true,
        branch: true,
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
            description: true,
          },
        },
        branch: {
          select: {
            id: true,
            name: true,
            code: true,
          },
        },
      },
    });

    // Create audit log
    await prisma.auditLog.create({
      data: {
        entity: 'User',
        entityId: id,
        action: 'UPDATE',
        oldValues: existingUser,
        newValues: user,
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
    const userId = req.user?.id;

    // Check if user exists
    const existingUser = await prisma.user.findFirst({
      where: { id, isDeleted: false },
    });

    if (!existingUser) {
      throw createError('User not found', 404);
    }

    // Soft delete user
    await prisma.user.update({
      where: { id },
      data: {
        isActive: false,
        isDeleted: true,
      },
    });

    // Create audit log
    await prisma.auditLog.create({
      data: {
        entity: 'User',
        entityId: id,
        action: 'DELETE',
        oldValues: existingUser,
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
      orderBy: { name: 'asc' },
    });

    res.json({ roles });
  } catch (error) {
    throw error;
  }
};

export const getRoleById = async (req: Request, res: Response) => {
  try {
    const { id } = req.params;

    const role = await prisma.role.findFirst({
      where: {
        id,
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
        permissions,
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
    const { name, description, permissions } = req.body;
    const userId = req.user?.id;

    // Check if role exists
    const existingRole = await prisma.role.findFirst({
      where: {
        id,
        isActive: true,
        isDeleted: false,
      },
    });

    if (!existingRole) {
      throw createError('Role not found', 404);
    }

    // Check if name is already taken by another role
    if (name && name !== existingRole.name) {
      const duplicateRole = await prisma.role.findFirst({
        where: {
          AND: [
            { id: { not: id } },
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

    const role = await prisma.role.update({
      where: { id },
      data: {
        name,
        description,
        permissions,
      },
    });

    // Create audit log
    await prisma.auditLog.create({
      data: {
        entity: 'Role',
        entityId: id,
        action: 'UPDATE',
        oldValues: existingRole,
        newValues: role,
        ipAddress: req.ip,
        userAgent: req.get('User-Agent'),
        createdBy: userId!,
      },
    });

    res.json({
      message: 'Role updated successfully',
      role,
    });
  } catch (error) {
    throw error;
  }
};

export const deleteRole = async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    const userId = req.user?.id;

    // Check if role exists
    const existingRole = await prisma.role.findFirst({
      where: {
        id,
        isActive: true,
        isDeleted: false,
      },
    });

    if (!existingRole) {
      throw createError('Role not found', 404);
    }

    // Check if role is being used by any users
    const usersWithRole = await prisma.user.count({
      where: {
        roleId: id,
        isActive: true,
        isDeleted: false,
      },
    });

    if (usersWithRole > 0) {
      throw createError('Cannot delete role that is assigned to users', 400);
    }

    // Soft delete role
    await prisma.role.update({
      where: { id },
      data: {
        isActive: false,
        isDeleted: true,
      },
    });

    // Create audit log
    await prisma.auditLog.create({
      data: {
        entity: 'Role',
        entityId: id,
        action: 'DELETE',
        oldValues: existingRole,
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

    const city = await prisma.city.findFirst({
      where: {
        id,
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
        createdBy: userId!,
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
    const { name, code, state } = req.body;
    const userId = req.user?.id;

    // Check if city exists
    const existingCity = await prisma.city.findFirst({
      where: {
        id,
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
            { id: { not: id } },
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
      where: { id },
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
        entityId: id,
        action: 'UPDATE',
        oldValues: existingCity,
        newValues: city,
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
    const userId = req.user?.id;

    // Check if city exists
    const existingCity = await prisma.city.findFirst({
      where: {
        id,
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
          fromCityId: id,
          isActive: true,
          isDeleted: false,
        },
      }),
      prisma.transaction.count({
        where: {
          toCityId: id,
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
      where: { id },
      data: {
        isActive: false,
        isDeleted: true,
      },
    });

    // Create audit log
    await prisma.auditLog.create({
      data: {
        entity: 'City',
        entityId: id,
        action: 'DELETE',
        oldValues: existingCity,
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

    if (cityId) where.cityId = cityId as string;

    const parties = await prisma.party.findMany({
      where,
      include: {
        city: true,
      },
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

    const party = await prisma.party.findFirst({
      where: {
        id,
        isActive: true,
        isDeleted: false,
      },
      include: {
        city: true,
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
      cityId,
    } = req.body;

    const userId = req.user?.id;

    const party = await prisma.party.create({
      data: {
        name,
        phone,
        email,
        address,
        panNumber,
        gstNumber,
        cityId,
        createdBy: userId!,
      },
      include: {
        city: true,
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
    const {
      name,
      phone,
      email,
      address,
      panNumber,
      gstNumber,
      cityId,
    } = req.body;

    const userId = req.user?.id;

    // Check if party exists
    const existingParty = await prisma.party.findFirst({
      where: {
        id,
        isActive: true,
        isDeleted: false,
      },
    });

    if (!existingParty) {
      throw createError('Party not found', 404);
    }

    const party = await prisma.party.update({
      where: { id },
      data: {
        name,
        phone,
        email,
        address,
        panNumber,
        gstNumber,
        cityId,
      },
      include: {
        city: true,
      },
    });

    // Create audit log
    await prisma.auditLog.create({
      data: {
        entity: 'Party',
        entityId: id,
        action: 'UPDATE',
        oldValues: existingParty,
        newValues: party,
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
    const userId = req.user?.id;

    // Check if party exists
    const existingParty = await prisma.party.findFirst({
      where: {
        id,
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
        partyId: id,
        isActive: true,
        isDeleted: false,
      },
    });

    if (transactions > 0) {
      throw createError('Cannot delete party that is used in transactions', 400);
    }

    // Soft delete party
    await prisma.party.update({
      where: { id },
      data: {
        isActive: false,
        isDeleted: true,
      },
    });

    // Create audit log
    await prisma.auditLog.create({
      data: {
        entity: 'Party',
        entityId: id,
        action: 'DELETE',
        oldValues: existingParty,
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
      where.OR = [
        { name: { contains: search as string, mode: 'insensitive' } },
        { code: { contains: search as string, mode: 'insensitive' } },
      ];
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

    const branch = await prisma.branch.findFirst({
      where: {
        id,
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

    const userId = req.user?.id;

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
        createdBy: userId!,
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
    const {
      name,
      code,
      address,
      phone,
      email,
    } = req.body;

    const userId = req.user?.id;

    // Check if branch exists
    const existingBranch = await prisma.branch.findFirst({
      where: {
        id,
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
            { id: { not: id } },
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
      where: { id },
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
        entityId: id,
        action: 'UPDATE',
        oldValues: existingBranch,
        newValues: branch,
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
    const userId = req.user?.id;

    // Check if branch exists
    const existingBranch = await prisma.branch.findFirst({
      where: {
        id,
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
        branchId: id,
        isActive: true,
        isDeleted: false,
      },
    });

    if (users > 0) {
      throw createError('Cannot delete branch that is assigned to users', 400);
    }

    // Soft delete branch
    await prisma.branch.update({
      where: { id },
      data: {
        isActive: false,
        isDeleted: true,
      },
    });

    // Create audit log
    await prisma.auditLog.create({
      data: {
        entity: 'Branch',
        entityId: id,
        action: 'DELETE',
        oldValues: existingBranch,
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

    if (fromCityId) where.fromCityId = fromCityId as string;
    if (toCityId) where.toCityId = toCityId as string;

    const commissionRates = await prisma.commissionRate.findMany({
      where,
      include: {
        fromCity: true,
        toCity: true,
      },
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

    const commissionRate = await prisma.commissionRate.findFirst({
      where: {
        id,
        isActive: true,
        isDeleted: false,
      },
      include: {
        fromCity: true,
        toCity: true,
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
        createdBy: userId!,
      },
      include: {
        fromCity: true,
        toCity: true,
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
    const {
      fromCityId,
      toCityId,
      rateType,
      rate,
      minAmount,
      maxAmount,
    } = req.body;

    const userId = req.user?.id;

    // Check if commission rate exists
    const existingRate = await prisma.commissionRate.findFirst({
      where: {
        id,
        isActive: true,
        isDeleted: false,
      },
    });

    if (!existingRate) {
      throw createError('Commission rate not found', 404);
    }

    const commissionRate = await prisma.commissionRate.update({
      where: { id },
      data: {
        fromCityId,
        toCityId,
        rateType,
        rate: Number(rate),
        minAmount: minAmount ? Number(minAmount) : null,
        maxAmount: maxAmount ? Number(maxAmount) : null,
      },
      include: {
        fromCity: true,
        toCity: true,
      },
    });

    // Create audit log
    await prisma.auditLog.create({
      data: {
        entity: 'CommissionRate',
        entityId: id,
        action: 'UPDATE',
        oldValues: existingRate,
        newValues: commissionRate,
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
    const userId = req.user?.id;

    // Check if commission rate exists
    const existingRate = await prisma.commissionRate.findFirst({
      where: {
        id,
        isActive: true,
        isDeleted: false,
      },
    });

    if (!existingRate) {
      throw createError('Commission rate not found', 404);
    }

    // Soft delete commission rate
    await prisma.commissionRate.update({
      where: { id },
      data: {
        isActive: false,
        isDeleted: true,
      },
    });

    // Create audit log
    await prisma.auditLog.create({
      data: {
        entity: 'CommissionRate',
        entityId: id,
        action: 'DELETE',
        oldValues: existingRate,
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
