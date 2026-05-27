import { Router } from 'express';
import {
  createSpecialEntry,
  getSpecialEntries,
  getSpecialEntryById,
  updateSpecialEntry,
  deleteSpecialEntry,
  getSpecialEntryNextIds
} from './controller';
import { authenticateToken } from '../auth/middleware';

const router = Router();

// Apply authentication to all routes
router.use(authenticateToken);

// Create special entry - Only require authentication, no specific permission needed
router.post('/', createSpecialEntry);

// Get all special entries - Public route like transactions API
router.get('/', getSpecialEntries);

// Get next special entry IDs
router.get('/next-ids', getSpecialEntryNextIds);

// Get single special entry
router.get('/:id', getSpecialEntryById);

// Update special entry - Only require authentication, no specific permission needed
router.put('/:id', updateSpecialEntry);

// Delete special entry - Only require authentication, no specific permission needed
router.delete('/:id', deleteSpecialEntry);

export default router;
