import { Router } from 'express';
import { authenticateToken, requirePermission } from '../auth/middleware';
import {
  createTransaction,
  getTransactions,
  getTransactionById,
  updateTransaction,
  deleteTransaction,
  getTransactionStats,
  getNextTransactionIds,
} from './controller';
import { validateCreateTransaction, validateUpdateTransaction } from './validation';

const router = Router();

// Apply authentication to all routes
router.use(authenticateToken);

// Transaction CRUD operations - Main GET routes with authentication
router.get('/', getTransactions);
router.get('/next-ids', getNextTransactionIds);
router.get('/stats', getTransactionStats);
router.get('/:id', getTransactionById);

// Special routes with RBAC protection - these require permission checking
router.get('/inward', requirePermission('transactions.read'), getTransactions);
router.get('/outward', requirePermission('transactions.read'), getTransactions);

// POST, PUT, DELETE routes (no additional permission check required)
router.post('/', validateCreateTransaction, createTransaction);
router.put('/:id', validateUpdateTransaction, updateTransaction);
router.delete('/:id', deleteTransaction);

export default router;
