import { Router } from 'express';
import { authenticateToken, requirePermission } from '../auth/middleware';
import {
  getInwardReport,
  getOutwardReport,
  getUserLedgerReport,
  getBranchPerformanceReport,
  getBalanceSummaryReport,
  exportToPDF,
  exportToExcel,
} from './controller';
import { validateReportFilters } from './validation';

const router = Router();

// Apply authentication to all routes
router.use(authenticateToken);

// Report endpoints
router.get('/inward', requirePermission('reports.read'), validateReportFilters, getInwardReport);
router.get('/outward', requirePermission('reports.read'), validateReportFilters, getOutwardReport);
router.get('/user-ledger', requirePermission('reports.read'), validateReportFilters, getUserLedgerReport);
router.get('/branch-performance', requirePermission('reports.read'), validateReportFilters, getBranchPerformanceReport);
router.get('/balance-summary', requirePermission('reports.read'), validateReportFilters, getBalanceSummaryReport);

// Export endpoints
router.get('/export/pdf', requirePermission('reports.export'), exportToPDF);
router.get('/export/excel', requirePermission('reports.export'), exportToExcel);

export default router;
