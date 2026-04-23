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
} from './controller';
import { validateCreateLedgerEntry, validateUpdateLedgerEntry } from './validation';

const router = Router();

// Apply authentication to all routes
router.use(authenticateToken);

// Ledger CRUD operations
router.post('/', requirePermission('accounting.create'), validateCreateLedgerEntry, createLedgerEntry);
router.get('/', requirePermission('accounting.read'), getLedgerEntries);
router.get('/balance', requirePermission('accounting.read'), getAccountBalance);
router.get('/trial-balance', requirePermission('accounting.read'), getTrialBalance);
router.get('/:id', requirePermission('accounting.read'), getLedgerEntryById);
router.put('/:id', requirePermission('accounting.update'), validateUpdateLedgerEntry, updateLedgerEntry);
router.delete('/:id', requirePermission('accounting.delete'), deleteLedgerEntry);

// Special routes for different account types
router.get('/party/:partyId', requirePermission('accounting.read'), getLedgerEntries);
router.get('/user/:userId', requirePermission('accounting.read'), getLedgerEntries);
router.get('/branch/:branchId', requirePermission('accounting.read'), getLedgerEntries);

export default router;
