import { Router } from 'express';
import {
  getTotalOutwardBookingCommission,
  getTotalInwardBookingCommission,
  getTotalTransactionCounts,
  getCustomerReviewProgram,
  getDashboardMetrics,
} from './controller';

const router = Router();

// Get all dashboard metrics in one call (public endpoint)
router.get('/metrics', getDashboardMetrics);

// Get total outward booking commission (our commission only)
router.get('/outward-booking-commission', getTotalOutwardBookingCommission);

// Get total inward booking commission (our commission only)
router.get('/inward-booking-commission', getTotalInwardBookingCommission);

// Get total transaction counts by type
router.get('/transaction-counts', getTotalTransactionCounts);

// Get customer review program (plus/minus customers)
router.get('/customer-review', getCustomerReviewProgram);

export default router;
