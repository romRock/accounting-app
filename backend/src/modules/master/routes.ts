import { Router } from 'express';
import { authenticateToken, requirePermission } from '../auth/middleware';
import {
  // Users
  getUsers,
  getUserById,
  createUser,
  updateUser,
  deleteUser,
  
  // Roles
  getRoles,
  getRoleById,
  createRole,
  updateRole,
  deleteRole,
  
  // Cities
  getCities,
  getCityById,
  createCity,
  updateCity,
  deleteCity,
  
  // Parties
  getParties,
  getPartyById,
  createParty,
  updateParty,
  deleteParty,
  
  // Branches
  getBranches,
  getBranchById,
  createBranch,
  updateBranch,
  deleteBranch,
  
  // Commission Rates
  getCommissionRates,
  getCommissionRateById,
  createCommissionRate,
  updateCommissionRate,
  deleteCommissionRate,
} from './controller';
import { validateCreateUser, validateUpdateUser, validateCreateRole, validateUpdateRole, validateCreateCity, validateUpdateCity, validateCreateParty, validateUpdateParty, validateCreateBranch, validateUpdateBranch, validateCreateCommissionRate, validateUpdateCommissionRate } from './validation';

const router = Router();

// Apply authentication to all routes
router.use(authenticateToken);

// User management
router.get('/users', requirePermission('users.read'), getUsers);
router.get('/users/:id', requirePermission('users.read'), getUserById);
router.post('/users', requirePermission('users.create'), validateCreateUser, createUser);
router.put('/users/:id', requirePermission('users.update'), validateUpdateUser, updateUser);
router.delete('/users/:id', requirePermission('users.delete'), deleteUser);

// Role management
router.get('/roles', requirePermission('roles.read'), getRoles);
router.get('/roles/:id', requirePermission('roles.read'), getRoleById);
router.post('/roles', requirePermission('roles.create'), validateCreateRole, createRole);
router.put('/roles/:id', requirePermission('roles.update'), validateUpdateRole, updateRole);
router.delete('/roles/:id', requirePermission('roles.delete'), deleteRole);

// City management
router.get('/cities', requirePermission('cities.read'), getCities);
router.get('/cities/:id', requirePermission('cities.read'), getCityById);
router.post('/cities', requirePermission('cities.create'), validateCreateCity, createCity);
router.put('/cities/:id', requirePermission('cities.update'), validateUpdateCity, updateCity);
router.delete('/cities/:id', requirePermission('cities.delete'), deleteCity);

// Party management
router.get('/parties', requirePermission('parties.read'), getParties);
router.get('/parties/:id', requirePermission('parties.read'), getPartyById);
router.post('/parties', requirePermission('parties.create'), validateCreateParty, createParty);
router.put('/parties/:id', requirePermission('parties.update'), validateUpdateParty, updateParty);
router.delete('/parties/:id', requirePermission('parties.delete'), deleteParty);

// Branch management
router.get('/branches', requirePermission('branches.read'), getBranches);
router.get('/branches/:id', requirePermission('branches.read'), getBranchById);
router.post('/branches', requirePermission('branches.create'), validateCreateBranch, createBranch);
router.put('/branches/:id', requirePermission('branches.update'), validateUpdateBranch, updateBranch);
router.delete('/branches/:id', requirePermission('branches.delete'), deleteBranch);

// Commission rate management
router.get('/commission-rates', requirePermission('commission_rates.read'), getCommissionRates);
router.get('/commission-rates/:id', requirePermission('commission_rates.read'), getCommissionRateById);
router.post('/commission-rates', requirePermission('commission_rates.create'), validateCreateCommissionRate, createCommissionRate);
router.put('/commission-rates/:id', requirePermission('commission_rates.update'), validateUpdateCommissionRate, updateCommissionRate);
router.delete('/commission-rates/:id', requirePermission('commission_rates.delete'), deleteCommissionRate);

export default router;
