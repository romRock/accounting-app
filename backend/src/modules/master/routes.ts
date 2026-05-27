import { Router } from 'express';
import { authenticateToken, requirePermission } from '../auth/middleware';
import { requireAdmin, checkPermission } from '../../middlewares/rbac';
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

// User management - Only users with master.users permission can manage users
router.get('/users', requirePermission('master.users'), getUsers);
router.get('/users/:id', requirePermission('master.users'), getUserById);
router.post('/users', requirePermission('master.users'), validateCreateUser, createUser);
router.put('/users/:id', requirePermission('master.users'), validateUpdateUser, updateUser);
router.delete('/users/:id', requirePermission('master.users'), deleteUser);

// Role management - Only users with master.roles permission can manage roles
router.get('/roles', requirePermission('master.roles'), getRoles);
router.get('/roles/:id', requirePermission('master.roles'), getRoleById);
router.post('/roles', requirePermission('master.roles'), validateCreateRole, createRole);
router.put('/roles/:id', requirePermission('master.roles'), validateUpdateRole, updateRole);
router.delete('/roles/:id', requirePermission('master.roles'), deleteRole);

// City management - Only users with master.cities permission can manage cities
router.get('/cities', requirePermission('master.cities'), getCities);
router.get('/cities/:id', requirePermission('master.cities'), getCityById);
router.post('/cities', requirePermission('master.cities'), validateCreateCity, createCity);
router.put('/cities/:id', requirePermission('master.cities'), validateUpdateCity, updateCity);
router.delete('/cities/:id', requirePermission('master.cities'), deleteCity);

// Party management - Only users with master.clients permission can manage parties
router.get('/parties', requirePermission('master.clients'), getParties);
router.get('/parties/:id', requirePermission('master.clients'), getPartyById);
router.post('/parties', requirePermission('master.clients'), validateCreateParty, createParty);
router.put('/parties/:id', requirePermission('master.clients'), validateUpdateParty, updateParty);
router.delete('/parties/:id', requirePermission('master.clients'), deleteParty);

// Branch management - Only users with master.branches permission can manage branches
router.get('/branches', requirePermission('master.branches'), getBranches);
router.get('/branches/:id', requirePermission('master.branches'), getBranchById);
router.post('/branches', requirePermission('master.branches'), validateCreateBranch, createBranch);
router.put('/branches/:id', requirePermission('master.branches'), validateUpdateBranch, updateBranch);
router.delete('/branches/:id', requirePermission('master.branches'), deleteBranch);

// Commission rate management
router.get('/commission-rates', requirePermission('commission_rates.read'), getCommissionRates);
router.get('/commission-rates/:id', requirePermission('commission_rates.read'), getCommissionRateById);
router.post('/commission-rates', requirePermission('commission_rates.create'), validateCreateCommissionRate, createCommissionRate);
router.put('/commission-rates/:id', requirePermission('commission_rates.update'), validateUpdateCommissionRate, updateCommissionRate);
router.delete('/commission-rates/:id', requirePermission('commission_rates.delete'), deleteCommissionRate);

export default router;
