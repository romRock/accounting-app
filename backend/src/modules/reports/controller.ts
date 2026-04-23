import { Request, Response } from 'express';
import { PrismaClient } from '@prisma/client';
import { createError } from '../../middlewares/errorHandler';

// Define TransactionType enum locally since Prisma exports are not available
const TransactionType = {
  INWARD: 'INWARD',
  OUTWARD: 'OUTWARD',
} as const;

const prisma = new PrismaClient();

export const getInwardReport = async (req: Request, res: Response) => {
  try {
    const {
      dateFrom,
      dateTo,
      fromCityId,
      toCityId,
      partyId,
      page = 1,
      limit = 10,
    } = req.query;

    const userRole = req.user?.role.name;
    const userBranchId = req.user?.branchId;

    const where: any = {
      type: TransactionType.INWARD,
      isActive: true,
      isDeleted: false,
    };

    // Apply role-based filtering
    if (userRole !== 'Super Admin' && userRole !== 'Admin') {
      where.branchId = userBranchId;
    }

    if (dateFrom || dateTo) {
      where.date = {};
      if (dateFrom) where.date.gte = new Date(dateFrom as string);
      if (dateTo) where.date.lte = new Date(dateTo as string);
    }

    if (fromCityId) where.fromCityId = fromCityId as string;
    if (toCityId) where.toCityId = toCityId as string;
    if (partyId) where.partyId = partyId as string;

    // Get transactions and calculate totals
    const [transactions, total] = await Promise.all([
      prisma.transaction.findMany({
        where,
        include: {
          fromCity: true,
          toCity: true,
          party: true,
          creator: {
            select: {
              id: true,
              firstName: true,
              lastName: true,
            },
          },
        },
        orderBy: { date: 'desc' },
        skip: (Number(page) - 1) * Number(limit),
        take: Number(limit),
      }),
      prisma.transaction.count({ where }),
    ]);

    // Calculate summary
    const summary = await prisma.transaction.aggregate({
      where,
      _sum: {
        amount: true,
        commission: true,
      },
      _count: {
        id: true,
      },
    });

    res.json({
      transactions,
      summary: {
        totalTransactions: summary._count.id || 0,
        totalAmount: summary._sum.amount || 0,
        totalCommission: summary._sum.commission || 0,
      },
      pagination: {
        page: Number(page),
        limit: Number(limit),
        total,
        pages: Math.ceil(total / Number(limit)),
      },
    });
  } catch (error) {
    throw error;
  }
};

export const getOutwardReport = async (req: Request, res: Response) => {
  try {
    const {
      dateFrom,
      dateTo,
      fromCityId,
      toCityId,
      partyId,
      page = 1,
      limit = 10,
    } = req.query;

    const userRole = req.user?.role.name;
    const userBranchId = req.user?.branchId;

    const where: any = {
      type: TransactionType.OUTWARD,
      isActive: true,
      isDeleted: false,
    };

    // Apply role-based filtering
    if (userRole !== 'Super Admin' && userRole !== 'Admin') {
      where.branchId = userBranchId;
    }

    if (dateFrom || dateTo) {
      where.date = {};
      if (dateFrom) where.date.gte = new Date(dateFrom as string);
      if (dateTo) where.date.lte = new Date(dateTo as string);
    }

    if (fromCityId) where.fromCityId = fromCityId as string;
    if (toCityId) where.toCityId = toCityId as string;
    if (partyId) where.partyId = partyId as string;

    // Get transactions and calculate totals
    const [transactions, total] = await Promise.all([
      prisma.transaction.findMany({
        where,
        include: {
          fromCity: true,
          toCity: true,
          party: true,
          creator: {
            select: {
              id: true,
              firstName: true,
              lastName: true,
            },
          },
        },
        orderBy: { date: 'desc' },
        skip: (Number(page) - 1) * Number(limit),
        take: Number(limit),
      }),
      prisma.transaction.count({ where }),
    ]);

    // Calculate summary
    const summary = await prisma.transaction.aggregate({
      where,
      _sum: {
        amount: true,
        commission: true,
      },
      _count: {
        id: true,
      },
    });

    res.json({
      transactions,
      summary: {
        totalTransactions: summary._count.id || 0,
        totalAmount: summary._sum.amount || 0,
        totalCommission: summary._sum.commission || 0,
      },
      pagination: {
        page: Number(page),
        limit: Number(limit),
        total,
        pages: Math.ceil(total / Number(limit)),
      },
    });
  } catch (error) {
    throw error;
  }
};

export const getUserLedgerReport = async (req: Request, res: Response) => {
  try {
    const {
      userId,
      dateFrom,
      dateTo,
      page = 1,
      limit = 10,
    } = req.query;

    const userRole = req.user?.role.name;
    const userBranchId = req.user?.branchId;

    const where: any = {
      isActive: true,
      isDeleted: false,
    };

    // Apply role-based filtering
    if (userRole !== 'Super Admin' && userRole !== 'Admin') {
      where.branchId = userBranchId;
    }

    if (dateFrom || dateTo) {
      where.date = {};
      if (dateFrom) where.date.gte = new Date(dateFrom as string);
      if (dateTo) where.date.lte = new Date(dateTo as string);
    }

    if (userId) {
      // Get transactions created by specific user
      where.createdBy = userId as string;
    }

    // Get transactions and ledger entries
    const [transactions, ledgerEntries] = await Promise.all([
      prisma.transaction.findMany({
        where: {
          ...where,
          createdBy: userId as string,
        },
        include: {
          fromCity: true,
          toCity: true,
          party: true,
        },
        orderBy: { date: 'desc' },
      }),
      prisma.ledgerEntry.findMany({
        where: {
          ...where,
          createdBy: userId as string,
        },
        include: {
          transaction: {
            include: {
              fromCity: true,
              toCity: true,
              party: true,
            },
          },
        },
        orderBy: { date: 'desc' },
      }),
    ]);

    // Calculate summary
    const transactionSummary = await prisma.transaction.aggregate({
      where: {
        ...where,
        createdBy: userId as string,
      },
      _sum: {
        amount: true,
        commission: true,
      },
      _count: {
        id: true,
      },
    });

    const ledgerSummary = await prisma.ledgerEntry.aggregate({
      where: {
        ...where,
        createdBy: userId as string,
      },
      _sum: {
        debitAmount: true,
        creditAmount: true,
      },
      _count: {
        id: true,
      },
    });

    res.json({
      transactions,
      ledgerEntries,
      summary: {
        transactions: {
          totalTransactions: transactionSummary._count.id || 0,
          totalAmount: transactionSummary._sum.amount || 0,
          totalCommission: transactionSummary._sum.commission || 0,
        },
        ledger: {
          totalEntries: ledgerSummary._count.id || 0,
          totalDebits: ledgerSummary._sum.debitAmount || 0,
          totalCredits: ledgerSummary._sum.creditAmount || 0,
        },
      },
    });
  } catch (error) {
    throw error;
  }
};

export const getBranchPerformanceReport = async (req: Request, res: Response) => {
  try {
    const {
      branchId,
      dateFrom,
      dateTo,
    } = req.query;

    const userRole = req.user?.role.name;

    const where: any = {
      isActive: true,
      isDeleted: false,
    };

    // Apply role-based filtering
    if (userRole !== 'Super Admin' && userRole !== 'Admin') {
      where.branchId = req.user?.branchId;
    } else if (branchId) {
      where.branchId = branchId as string;
    }

    if (dateFrom || dateTo) {
      where.date = {};
      if (dateFrom) where.date.gte = new Date(dateFrom as string);
      if (dateTo) where.date.lte = new Date(dateTo as string);
    }

    // Get branch performance data
    const branchPerformance = await prisma.transaction.groupBy({
      by: ['branchId'],
      where,
      _sum: {
        amount: true,
        commission: true,
      },
      _count: {
        id: true,
      },
    });

    // Get branch details
    const branchIds = branchPerformance.map((bp: any) => bp.branchId).filter((id: any): id is string => id !== null);
    const branches = await prisma.branch.findMany({
      where: {
        id: { in: branchIds },
        isActive: true,
        isDeleted: false,
      },
    });

    // Combine performance data with branch details
    const performanceReport = branchPerformance.map((perf: any) => {
      const branch = branches.find((b: any) => b.id === perf.branchId);
      return {
        branchId: perf.branchId,
        branchName: branch?.name || 'Unknown',
        branchCode: branch?.code || 'Unknown',
        totalTransactions: perf._count.id || 0,
        totalAmount: perf._sum.amount || 0,
        totalCommission: perf._sum.commission || 0,
      };
    });

    // Calculate overall totals
    const overallTotals = performanceReport.reduce(
      (acc: any, curr: any) => ({
        totalTransactions: acc.totalTransactions + curr.totalTransactions,
        totalAmount: Number(acc.totalAmount) + Number(curr.totalAmount),
        totalCommission: Number(acc.totalCommission) + Number(curr.totalCommission),
      }),
      { totalTransactions: 0, totalAmount: 0, totalCommission: 0 }
    );

    res.json({
      branchPerformance: performanceReport,
      summary: overallTotals,
    });
  } catch (error) {
    throw error;
  }
};

export const getBalanceSummaryReport = async (req: Request, res: Response) => {
  try {
    const {
      dateFrom,
      dateTo,
      accountType,
    } = req.query;

    const userRole = req.user?.role.name;
    const userBranchId = req.user?.branchId;

    const where: any = {
      isActive: true,
      isDeleted: false,
    };

    // Apply role-based filtering
    if (userRole !== 'Super Admin' && userRole !== 'Admin') {
      where.branchId = userBranchId;
    }

    if (dateFrom || dateTo) {
      where.date = {};
      if (dateFrom) where.date.gte = new Date(dateFrom as string);
      if (dateTo) where.date.lte = new Date(dateTo as string);
    }

    if (accountType) {
      where.accountType = accountType as string;
    }

    // Get balance summary by account type
    const balanceSummary = await prisma.ledgerEntry.groupBy({
      by: ['accountType', 'accountId'],
      where,
      _max: {
        balance: true,
      },
      _sum: {
        debitAmount: true,
        creditAmount: true,
      },
      _count: {
        id: true,
      },
    });

    // Calculate totals
    const totalDebits = balanceSummary.reduce((sum: number, entry: any) => 
      sum + (entry._sum.debitAmount || 0), 0
    );
    const totalCredits = balanceSummary.reduce((sum: number, entry: any) => 
      sum + (entry._sum.creditAmount || 0), 0
    );

    res.json({
      balanceSummary: balanceSummary.map(entry => ({
        accountType: entry.accountType,
        accountId: entry.accountId,
        currentBalance: entry._max.balance || 0,
        totalDebits: entry._sum.debitAmount || 0,
        totalCredits: entry._sum.creditAmount || 0,
        entryCount: entry._count.id || 0,
      })),
      summary: {
        totalDebits,
        totalCredits,
        netBalance: totalDebits - totalCredits,
      },
    });
  } catch (error) {
    throw error;
  }
};

export const exportToPDF = async (req: Request, res: Response) => {
  try {
    // This would implement PDF export functionality
    // For now, return a placeholder response
    res.json({
      message: 'PDF export functionality to be implemented',
      format: 'PDF',
    });
  } catch (error) {
    throw error;
  }
};

export const exportToExcel = async (req: Request, res: Response) => {
  try {
    // This would implement Excel export functionality
    // For now, return a placeholder response
    res.json({
      message: 'Excel export functionality to be implemented',
      format: 'Excel',
    });
  } catch (error) {
    throw error;
  }
};
