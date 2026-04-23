import { z } from 'zod';

// User validation schemas
export const createUserSchema = z.object({
  email: z.string().email('Invalid email address'),
  username: z.string().min(3, 'Username must be at least 3 characters'),
  password: z.string().min(6, 'Password must be at least 6 characters'),
  firstName: z.string().min(1, 'First name is required'),
  lastName: z.string().min(1, 'Last name is required'),
  phone: z.string().optional(),
  roleId: z.string().min(1, 'Role is required'),
  branchId: z.string().optional(),
});

export const updateUserSchema = z.object({
  email: z.string().email('Invalid email address').optional(),
  username: z.string().min(3, 'Username must be at least 3 characters').optional(),
  firstName: z.string().min(1, 'First name is required').optional(),
  lastName: z.string().min(1, 'Last name is required').optional(),
  phone: z.string().optional(),
  roleId: z.string().min(1, 'Role is required').optional(),
  branchId: z.string().optional(),
  isActive: z.boolean().optional(),
  password: z.string().min(6, 'Password must be at least 6 characters').optional(),
});

// Role validation schemas
export const createRoleSchema = z.object({
  name: z.string().min(1, 'Role name is required'),
  description: z.string().optional(),
  permissions: z.record(z.string(), z.boolean()),
});

export const updateRoleSchema = z.object({
  name: z.string().min(1, 'Role name is required').optional(),
  description: z.string().optional(),
  permissions: z.record(z.string(), z.boolean()).optional(),
});

// City validation schemas
export const createCitySchema = z.object({
  name: z.string().min(1, 'City name is required'),
  code: z.string().min(1, 'City code is required'),
  state: z.string().optional(),
});

export const updateCitySchema = z.object({
  name: z.string().min(1, 'City name is required').optional(),
  code: z.string().min(1, 'City code is required').optional(),
  state: z.string().optional(),
});

// Party validation schemas
export const createPartySchema = z.object({
  name: z.string().min(1, 'Party name is required'),
  phone: z.string().optional(),
  email: z.string().email('Invalid email address').optional(),
  address: z.string().optional(),
  panNumber: z.string().optional(),
  gstNumber: z.string().optional(),
  cityId: z.string().min(1, 'City is required'),
});

export const updatePartySchema = z.object({
  name: z.string().min(1, 'Party name is required').optional(),
  phone: z.string().optional(),
  email: z.string().email('Invalid email address').optional(),
  address: z.string().optional(),
  panNumber: z.string().optional(),
  gstNumber: z.string().optional(),
  cityId: z.string().min(1, 'City is required').optional(),
});

// Branch validation schemas
export const createBranchSchema = z.object({
  name: z.string().min(1, 'Branch name is required'),
  code: z.string().min(1, 'Branch code is required'),
  address: z.string().optional(),
  phone: z.string().optional(),
  email: z.string().email('Invalid email address').optional(),
});

export const updateBranchSchema = z.object({
  name: z.string().min(1, 'Branch name is required').optional(),
  code: z.string().min(1, 'Branch code is required').optional(),
  address: z.string().optional(),
  phone: z.string().optional(),
  email: z.string().email('Invalid email address').optional(),
});

// Commission rate validation schemas
export const createCommissionRateSchema = z.object({
  fromCityId: z.string().min(1, 'From city is required'),
  toCityId: z.string().min(1, 'To city is required'),
  rateType: z.enum(['PERCENTAGE', 'FIXED']),
  rate: z.number().positive('Rate must be positive'),
  minAmount: z.number().nonnegative().optional(),
  maxAmount: z.number().nonnegative().optional(),
});

export const updateCommissionRateSchema = z.object({
  fromCityId: z.string().min(1, 'From city is required').optional(),
  toCityId: z.string().min(1, 'To city is required').optional(),
  rateType: z.enum(['PERCENTAGE', 'FIXED']).optional(),
  rate: z.number().positive('Rate must be positive').optional(),
  minAmount: z.number().nonnegative().optional(),
  maxAmount: z.number().nonnegative().optional(),
});

// Validation middleware functions
export const validateCreateUser = (req: any, res: any, next: any) => {
  try {
    createUserSchema.parse(req.body);
    next();
  } catch (error) {
    next(error);
  }
};

export const validateUpdateUser = (req: any, res: any, next: any) => {
  try {
    updateUserSchema.parse(req.body);
    next();
  } catch (error) {
    next(error);
  }
};

export const validateCreateRole = (req: any, res: any, next: any) => {
  try {
    createRoleSchema.parse(req.body);
    next();
  } catch (error) {
    next(error);
  }
};

export const validateUpdateRole = (req: any, res: any, next: any) => {
  try {
    updateRoleSchema.parse(req.body);
    next();
  } catch (error) {
    next(error);
  }
};

export const validateCreateCity = (req: any, res: any, next: any) => {
  try {
    createCitySchema.parse(req.body);
    next();
  } catch (error) {
    next(error);
  }
};

export const validateUpdateCity = (req: any, res: any, next: any) => {
  try {
    updateCitySchema.parse(req.body);
    next();
  } catch (error) {
    next(error);
  }
};

export const validateCreateParty = (req: any, res: any, next: any) => {
  try {
    createPartySchema.parse(req.body);
    next();
  } catch (error) {
    next(error);
  }
};

export const validateUpdateParty = (req: any, res: any, next: any) => {
  try {
    updatePartySchema.parse(req.body);
    next();
  } catch (error) {
    next(error);
  }
};

export const validateCreateBranch = (req: any, res: any, next: any) => {
  try {
    createBranchSchema.parse(req.body);
    next();
  } catch (error) {
    next(error);
  }
};

export const validateUpdateBranch = (req: any, res: any, next: any) => {
  try {
    updateBranchSchema.parse(req.body);
    next();
  } catch (error) {
    next(error);
  }
};

export const validateCreateCommissionRate = (req: any, res: any, next: any) => {
  try {
    createCommissionRateSchema.parse(req.body);
    next();
  } catch (error) {
    next(error);
  }
};

export const validateUpdateCommissionRate = (req: any, res: any, next: any) => {
  try {
    updateCommissionRateSchema.parse(req.body);
    next();
  } catch (error) {
    next(error);
  }
};
