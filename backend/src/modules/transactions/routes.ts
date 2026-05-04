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

// Transaction CRUD operations - Main GET routes without authentication
router.get('/', getTransactions);
router.get('/next-ids', getNextTransactionIds);
router.get('/stats', getTransactionStats);
router.get('/:id', getTransactionById);

// Special routes with RBAC protection - these require authentication for permission checking
router.get('/inward', authenticateToken, requirePermission('transactions.read'), getTransactions);
router.get('/outward', authenticateToken, requirePermission('transactions.read'), getTransactions);

// Apply authentication to POST, PUT, DELETE routes (no permission check required)
router.use(authenticateToken);
router.post('/', validateCreateTransaction, createTransaction);
router.put('/:id', validateUpdateTransaction, updateTransaction);
router.delete('/:id', deleteTransaction);

export default router;
