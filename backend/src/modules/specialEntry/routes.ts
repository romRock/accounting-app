import { Router } from 'express';
import {
  createSpecialEntry,
  getSpecialEntries,
  getSpecialEntryById,
  updateSpecialEntry,
  deleteSpecialEntry
} from './controller';
import { authenticateToken, requirePermission } from '../auth/middleware';

const router = Router();

// Create special entry - Only require authentication, no specific permission needed
router.post('/', authenticateToken, createSpecialEntry);

// Get all special entries - Public route like transactions API
router.get('/', getSpecialEntries);

// Get single special entry
router.get('/:id', authenticateToken, requirePermission('transactions.read'), getSpecialEntryById);

// Update special entry - Only require authentication, no specific permission needed
router.put('/:id', authenticateToken, updateSpecialEntry);

// Delete special entry - Only require authentication, no specific permission needed
router.delete('/:id', authenticateToken, deleteSpecialEntry);

export default router;
