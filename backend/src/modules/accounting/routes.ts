import { Router } from 'express';
import { authenticateToken, requirePermission } from '../auth/middleware';
import {
  createLedgerEntry,
  getLedgerEntries,
  getLedgerEntryById,
  updateLedgerEntry,
  deleteLedgerEntry,
  getAccountBalance,
  getTrialBalance,
  // Account Category APIs
  createAccountCategory,
  getAccountCategories,
  updateAccountCategory,
  deleteAccountCategory,
  // Account Entry APIs
  createAccountEntry,
  getAccountEntries,
  getNextAccountTransactionId,
  updateAccountEntry,
  deleteAccountEntry,
  getAccountingSummary,
} from './controller';
import { validateCreateLedgerEntry, validateUpdateLedgerEntry } from './validation';

const router = Router();

// Apply authentication to all routes
router.use(authenticateToken);

// Account Entry GET routes with authentication
router.get('/entries', getAccountEntries);
router.get('/entries/next-id', getNextAccountTransactionId);

// Account Category CRUD operations
router.post('/categories', requirePermission('accounting'), createAccountCategory);
router.get('/categories', requirePermission('accounting'), getAccountCategories);
router.put('/categories/:id', requirePermission('accounting'), updateAccountCategory);
router.delete('/categories/:id', requirePermission('accounting'), deleteAccountCategory);

// Ledger CRUD operations
router.post('/', requirePermission('accounting.create'), validateCreateLedgerEntry, createLedgerEntry);
router.get('/', requirePermission('accounting.read'), getLedgerEntries);
router.get('/balance', requirePermission('accounting.read'), getAccountBalance);
router.get('/trial-balance', requirePermission('accounting.read'), getTrialBalance);
router.get('/:id', requirePermission('accounting.read'), getLedgerEntryById);
router.put('/:id', requirePermission('accounting.update'), validateUpdateLedgerEntry, updateLedgerEntry);
router.delete('/:id', requirePermission('accounting.delete'), deleteLedgerEntry);

// Account Entry CRUD operations (except GET which is public)
router.post('/entries', requirePermission('accounting'), createAccountEntry);
router.put('/entries/:id', requirePermission('accounting'), updateAccountEntry);
router.delete('/entries/:id', requirePermission('accounting'), deleteAccountEntry);


// Special routes for different account types
router.get('/party/:partyId', requirePermission('accounting.read'), getLedgerEntries);
router.get('/user/:userId', requirePermission('accounting.read'), getLedgerEntries);

export default router;
