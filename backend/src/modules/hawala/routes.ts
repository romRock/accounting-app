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

// Apply authentication to all routes
router.use(authenticateToken);

// Hawala CRUD operations
router.post('/', createHawala);
router.get('/', getHawalaEntries);
router.get('/next-ids', getHawalaNextIds);
router.get('/:id', requirePermission('transactions.read'), getHawalaById);
router.put('/:id', updateHawala);
router.delete('/:id', deleteHawala);

export default router;
