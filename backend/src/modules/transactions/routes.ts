import { Router } from 'express';
import { authenticateToken, requirePermission } from '../auth/middleware';
import {
  createTransaction,
  getTransactions,
  getTransactionById,
  updateTransaction,
  deleteTransaction,
  getTransactionStats,
} from './controller';
import { validateCreateTransaction, validateUpdateTransaction } from './validation';

const router = Router();

// Apply authentication to all routes
router.use(authenticateToken);

// Transaction CRUD operations
router.post('/', requirePermission('transactions.create'), validateCreateTransaction, createTransaction);
router.get('/', requirePermission('transactions.read'), getTransactions);
router.get('/stats', requirePermission('transactions.read'), getTransactionStats);
router.get('/:id', requirePermission('transactions.read'), getTransactionById);
router.put('/:id', requirePermission('transactions.update'), validateUpdateTransaction, updateTransaction);
router.delete('/:id', requirePermission('transactions.delete'), deleteTransaction);

// Special routes
router.get('/inward', requirePermission('transactions.read'), getTransactions);
router.get('/outward', requirePermission('transactions.read'), getTransactions);

export default router;
