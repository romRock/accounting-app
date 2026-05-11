import { Router } from 'express';
import {
  createHawala,
  getHawalaEntries,
  getHawalaById,
  updateHawala,
  deleteHawala,
  getHawalaNextIds
} from './controller';
import { authenticateToken, requirePermission } from '../auth/middleware';

const router = Router();

// Create hawala entry - Only require authentication, no specific permission needed
router.post('/', authenticateToken, createHawala);

// Get all hawala entries - Public route like transactions API
router.get('/', getHawalaEntries);

// Get next hawala IDs - Public route like transactions API
router.get('/next-ids', getHawalaNextIds);

// Get single hawala entry
router.get('/:id', authenticateToken, requirePermission('transactions.read'), getHawalaById);

// Update hawala entry - Only require authentication, no specific permission needed
router.put('/:id', authenticateToken, updateHawala);

// Delete hawala entry - Only require authentication, no specific permission needed
router.delete('/:id', authenticateToken, deleteHawala);

export default router;
