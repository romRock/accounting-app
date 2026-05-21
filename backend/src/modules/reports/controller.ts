import { Request, Response } from 'express';
import { PrismaClient } from '@prisma/client';
import { createError } from '../../middlewares/errorHandler';

const prisma = new PrismaClient();

// Define TransactionType enum locally since Prisma exports are not available
const TransactionType = {
  INWARD: 'INWARD',
  OUTWARD: 'OUTWARD',
} as const;

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

    const where: any = {
      type: TransactionType.INWARD,
      isActive: true,
      isDeleted: false,
    };

    // Apply role-based filtering
    if (userRole !== 'Super Admin' && userRole !== 'Admin') {
      // No branch-based filtering - using centers only
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
        orderBy: { date: 'desc' },
        skip: (Number(page) - 1) * Number(limit),
        take: Number(limit),
      }),
      prisma.transaction.count({ where }),
    ]);

    // Get center details for all transactions
    const centerIds = [...new Set(transactions.map((t: any) => t.centerId).filter((id: any): id is string => id !== null))];
    const centers = await (prisma as any).city.findMany({
      where: { id: { in: centerIds } },
      select: { id: true, name: true, code: true }
    });

    // Attach center details to transactions
    const transactionsWithCenters = transactions.map((transaction: any) => ({
      ...transaction,
      center: centers.find((c: any) => c.id === transaction.centerId) || { id: transaction.centerId, name: 'Unknown', code: 'Unknown' }
    }));

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
      transactions: transactionsWithCenters,
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

    const where: any = {
      type: TransactionType.OUTWARD,
      isActive: true,
      isDeleted: false,
    };

    // Apply role-based filtering
    if (userRole !== 'Super Admin' && userRole !== 'Admin') {
      // No branch-based filtering - using centers only
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
        orderBy: { date: 'desc' },
        skip: (Number(page) - 1) * Number(limit),
        take: Number(limit),
      }),
      prisma.transaction.count({ where }),
    ]);

    // Get center details for all transactions
    const centerIds = [...new Set(transactions.map((t: any) => t.centerId).filter((id: any): id is string => id !== null))];
    const centers = await (prisma as any).city.findMany({
      where: { id: { in: centerIds } },
      select: { id: true, name: true, code: true }
    });

    // Attach center details to transactions
    const transactionsWithCenters = transactions.map((transaction: any) => ({
      ...transaction,
      center: centers.find((c: any) => c.id === transaction.centerId) || { id: transaction.centerId, name: 'Unknown', code: 'Unknown' }
    }));

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
      transactions: transactionsWithCenters,
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

    const where: any = {
      isActive: true,
      isDeleted: false,
    };

    // Apply role-based filtering
    if (userRole !== 'Super Admin' && userRole !== 'Admin') {
      // No branch-based filtering - using centers only
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
        orderBy: { date: 'desc' },
      }),
      prisma.ledgerEntry.findMany({
        where: {
          ...where,
          createdBy: userId as string,
        },
        include: {},
        orderBy: { date: 'desc' },
      }),
    ]);

    // Get center details for all transactions
    const centerIds = [...new Set(transactions.map((t: any) => t.centerId).filter((id: any): id is string => id !== null))];
    const centers = await (prisma as any).city.findMany({
      where: { id: { in: centerIds } },
      select: { id: true, name: true, code: true }
    });

    // Attach center details to transactions
    const transactionsWithCenters = transactions.map((transaction: any) => ({
      ...transaction,
      center: centers.find((c: any) => c.id === transaction.centerId) || { id: transaction.centerId, name: 'Unknown', code: 'Unknown' }
    }));

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
      transactions: transactionsWithCenters,
      ledgerEntries,
      summary: {
        transactions: {
          totalTransactions: transactionSummary._count.id || 0,
          totalAmount: transactionSummary._sum.amount || 0,
          totalCommission: transactionSummary._sum.commission || 0,
        },
        ledgerEntries: {
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
      };
    });

    const overallTotals = await prisma.transaction.aggregate({
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

    const where: any = {
      isActive: true,
      isDeleted: false,
    };

    // Apply role-based filtering
    if (userRole !== 'Super Admin' && userRole !== 'Admin') {
      // No branch-based filtering - using centers only
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
      balanceSummary: balanceSummary.map((entry: any) => ({
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

export const getTransactionRefundReport = async (req: Request, res: Response) => {
  try {
    const { date } = req.query;


    // Default to last 7 days if no date provided
    let startOfDay: Date;
    let endOfDay: Date;

    if (date) {
      // If specific date provided, use that date
      const targetDate = new Date(date as string);

      startOfDay = new Date(targetDate);
      startOfDay.setHours(0, 0, 0, 0);

      endOfDay = new Date(targetDate);
      endOfDay.setHours(23, 59, 59, 999);
    } else {
      // Default to last 7 days
      endOfDay = new Date();
      endOfDay.setHours(23, 59, 59, 999);

      startOfDay = new Date();
      startOfDay.setDate(startOfDay.getDate() - 6);
      startOfDay.setHours(0, 0, 0, 0);
    }

    // Query deleted entries from all 4 modules
    const [
      deletedTransactions,
      deletedAccountEntries,
      deletedHawalas,
      deletedSpecialEntries
    ] = await Promise.all([
      prisma.transaction.findMany({
        where: {
          isDeleted: true,
          deletedAt: {
            gte: startOfDay,
            lte: endOfDay,
          },
        },
        orderBy: { deletedAt: 'desc' },
      }),
      prisma.accountEntry.findMany({
        where: {
          isDeleted: true,
          deletedAt: {
            gte: startOfDay,
            lte: endOfDay,
          },
        },
        include: {
          category: {
            select: {
              id: true,
              name: true,
              type: true,
            },
          },
        },
        orderBy: { deletedAt: 'desc' },
      }),
      prisma.hawala.findMany({
        where: {
          isDeleted: true,
          deletedAt: {
            gte: startOfDay,
            lte: endOfDay,
          },
        },
        orderBy: { deletedAt: 'desc' },
      }),
      prisma.specialEntry.findMany({
        where: {
          isDeleted: true,
          deletedAt: {
            gte: startOfDay,
            lte: endOfDay,
          },
        },
        orderBy: { deletedAt: 'desc' },
      }),
    ]);


    // Get all unique user IDs who deleted entries
    const allDeletedByIds = [
      ...deletedTransactions.map((e: any) => e.deletedBy),
      ...deletedAccountEntries.map((e: any) => e.deletedBy),
      ...deletedHawalas.map((e: any) => e.deletedBy),
      ...deletedSpecialEntries.map((e: any) => e.deletedBy),
    ].filter((id): id is string => id !== null && id !== undefined);

    const uniqueUserIds = [...new Set(allDeletedByIds)];

    // Fetch user details for all deleters
    const users = await prisma.user.findMany({
      where: {
        id: { in: uniqueUserIds },
      },
      select: {
        id: true,
        firstName: true,
        lastName: true,
        email: true,
      },
    });

    // Create a user lookup map
    const userMap = new Map(users.map((u) => [u.id, u]));

    // Helper function to get user details
    const getUserDetails = (userId: string | null) => {
      if (!userId) return { name: 'Unknown', email: 'Unknown' };
      const user = userMap.get(userId);
      return {
        name: user ? `${user.firstName} ${user.lastName}`.trim() : 'Unknown',
        email: user?.email || 'Unknown',
      };
    };

    // Aggregate all deleted entries with module information
    const allDeletedEntries = [
      ...deletedTransactions.map((entry: any) => {
        const userDetails = getUserDetails(entry.deletedBy);
        return {
          id: entry.id,
          moduleId: entry.transactionId,
          moduleName: 'Transactions',
          deletedAt: entry.deletedAt,
          deletedBy: entry.deletedBy,
          deletedByName: userDetails.name,
          deletedByEmail: userDetails.email,
          details: {
            amount: entry.amount,
            type: entry.type,
            receiverName: entry.receiverName,
            senderName: entry.senderName,
          },
        };
      }),
      ...deletedAccountEntries.map((entry: any) => {
        const userDetails = getUserDetails(entry.deletedBy);
        return {
          id: entry.id,
          moduleId: entry.entryId,
          moduleName: 'Accounting',
          deletedAt: entry.deletedAt,
          deletedBy: entry.deletedBy,
          deletedByName: userDetails.name,
          deletedByEmail: userDetails.email,
          details: {
            amount: entry.amount,
            type: entry.type,
            categoryName: entry.category?.name || 'Unknown',
            categoryType: entry.category?.type || 'Unknown',
          },
        };
      }),
      ...deletedHawalas.map((entry: any) => {
        const userDetails = getUserDetails(entry.deletedBy);
        return {
          id: entry.id,
          moduleId: entry.transactionId,
          moduleName: 'Hawala',
          deletedAt: entry.deletedAt,
          deletedBy: entry.deletedBy,
          deletedByName: userDetails.name,
          deletedByEmail: userDetails.email,
          details: {
            amount: entry.amount,
            partyA: entry.partyA,
            partyB: entry.partyB,
          },
        };
      }),
      ...deletedSpecialEntries.map((entry: any) => {
        const userDetails = getUserDetails(entry.deletedBy);
        return {
          id: entry.id,
          moduleId: entry.transactionId,
          moduleName: 'Special Entry',
          deletedAt: entry.deletedAt,
          deletedBy: entry.deletedBy,
          deletedByName: userDetails.name,
          deletedByEmail: userDetails.email,
          details: {
            partyA: entry.partyA,
            amountA: entry.amountA,
            partyB: entry.partyB,
            amountB: entry.amountB,
            partyC: entry.partyC,
            amountC: entry.amountC,
          },
        };
      }),
    ];

    // Sort by deletion time (most recent first)
    allDeletedEntries.sort((a: any, b: any) => 
      new Date(b.deletedAt).getTime() - new Date(a.deletedAt).getTime()
    );

    // Calculate summary
    const summary = {
      totalDeletedRecords: allDeletedEntries.length,
      transactions: deletedTransactions.length,
      accounting: deletedAccountEntries.length,
      hawala: deletedHawalas.length,
      specialEntries: deletedSpecialEntries.length,
    };

    res.json({
      deletedEntries: allDeletedEntries,
      summary,
      date: date ? date : startOfDay.toISOString(),
    });
  } catch (error) {
    throw error;
  }
};
