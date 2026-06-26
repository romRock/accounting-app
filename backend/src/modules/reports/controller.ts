import { Request, Response } from 'express';
import { PrismaClient } from '@prisma/client';
import { createError } from '../../middlewares/errorHandler';
import {
  applyEntryBranchScope,
  getEntryBranchFilter,
  getMasterBranchFilter,
  isSuperAdminUser,
} from '../../utils/branchScope';
import {
  accountingEntryInvolvesClient,
  isPartyNameMatch,
  isTransactionReceiver,
  isTransactionSender,
  transactionInvolvesClient,
} from '../../lib/client-match';
import { buildPartyAliasMap } from '../../lib/party-name-aliases';

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

    const userBranchId = req.user?.branchId;
    const assignedBranchIds = req.user?.assignedBranchIds;
    const userPermissions = req.user?.role?.permissions as any;
    const isSuperAdmin = isSuperAdminUser(userPermissions);

    const where: any = {
      type: TransactionType.INWARD,
      isActive: true,
      isDeleted: false,
    };

    await applyEntryBranchScope(where, prisma, userBranchId, isSuperAdmin, req.user?.assignedBranchIds);

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

    const userBranchId = req.user?.branchId;
    const assignedBranchIds = req.user?.assignedBranchIds;
    const userPermissions = req.user?.role?.permissions as any;
    const isSuperAdmin = isSuperAdminUser(userPermissions);

    const where: any = {
      type: TransactionType.OUTWARD,
      isActive: true,
      isDeleted: false,
    };

    await applyEntryBranchScope(where, prisma, userBranchId, isSuperAdmin, req.user?.assignedBranchIds);

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

    const userBranchId = req.user?.branchId;
    const assignedBranchIds = req.user?.assignedBranchIds;
    const userPermissions = req.user?.role?.permissions as any;
    const isSuperAdmin = isSuperAdminUser(userPermissions);

    const where: any = {
      isActive: true,
      isDeleted: false,
    };

    await applyEntryBranchScope(where, prisma, userBranchId, isSuperAdmin, req.user?.assignedBranchIds);

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

    const userBranchId = req.user?.branchId;
    const assignedBranchIds = req.user?.assignedBranchIds;
    const userPermissions = req.user?.role?.permissions as any;
    const isSuperAdmin = isSuperAdminUser(userPermissions);

    const where: any = {
      isActive: true,
      isDeleted: false,
    };

    await applyEntryBranchScope(where, prisma, userBranchId, isSuperAdmin, req.user?.assignedBranchIds);

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
    } = req.query;

    const userBranchId = req.user?.branchId;
    const assignedBranchIds = req.user?.assignedBranchIds;
    const userPermissions = req.user?.role?.permissions as any;
    const isSuperAdmin = isSuperAdminUser(userPermissions);

    // Build date filter
    const dateFilter: any = {};
    if (dateFrom || dateTo) {
      dateFilter.date = {};
      if (dateFrom) dateFilter.date.gte = new Date(dateFrom as string);
      if (dateTo) dateFilter.date.lte = new Date(dateTo as string);
    }

    // Default to last 30 days if no date range provided for performance
    if (!dateFrom && !dateTo) {
      const thirtyDaysAgo = new Date();
      thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);
      dateFilter.date = { gte: thirtyDaysAgo };
    }

    // Build branch filter for queries
    const masterBranchFilter = getMasterBranchFilter(userBranchId, isSuperAdmin, assignedBranchIds);
    const entryBranchFilter = await getEntryBranchFilter(
      prisma,
      userBranchId,
      isSuperAdmin,
      assignedBranchIds
    );

    // Fetch all clients/parties filtered by branch
    const clients = await prisma.party.findMany({
      where: { 
        isActive: true, 
        isDeleted: false,
        ...masterBranchFilter
      },
      select: { id: true, name: true, city: true }
    });

    // Fetch data from all modules in parallel with sufficient limits for accurate calculations
    const [transactions, accountEntries, hawalaEntries, specialEntries] = await Promise.all([
      prisma.transaction.findMany({
        where: {
          isActive: true,
          isDeleted: false,
          ...entryBranchFilter,
          ...(dateFrom || dateTo ? dateFilter : {})
        },
        take: 1000,
        orderBy: { date: 'desc' }
      }),
      prisma.accountEntry.findMany({
        where: {
          isActive: true,
          isDeleted: false,
          ...entryBranchFilter,
          ...(dateFrom || dateTo ? dateFilter : {})
        },
        include: { party: true },
        take: 1000,
        orderBy: { date: 'desc' }
      }),
      prisma.hawala.findMany({
        where: {
          isActive: true,
          isDeleted: false,
          ...entryBranchFilter,
          ...(dateFrom || dateTo ? dateFilter : {})
        },
        take: 1000,
        orderBy: { date: 'desc' }
      }),
      prisma.specialEntry.findMany({
        where: {
          isActive: true,
          isDeleted: false,
          ...entryBranchFilter,
          ...(dateFrom || dateTo ? dateFilter : {})
        },
        take: 1000,
        orderBy: { date: 'desc' }
      })
    ]);

    // Create a Map for O(1) client lookups
    const clientBalanceMap = new Map<string, { totalCredit: number; totalDebit: number }>();
    const aliasMap = await buildPartyAliasMap(
      prisma,
      clients.map((client) => client.id),
    );
    const clientRefs = clients.map((client) => ({
      id: client.id,
      name: client.name,
      knownNames: aliasMap.get(client.id) || [client.name],
    }));

    clientRefs.forEach((client) => {
      clientBalanceMap.set(client.id, { totalCredit: 0, totalDebit: 0 });
    });

    const applyBalance = (clientId: string, credit: number, debit: number) => {
      const balance = clientBalanceMap.get(clientId);
      if (!balance) return;
      balance.totalCredit += credit;
      balance.totalDebit += debit;
    };

    // Process transactions - O(n)
    transactions.forEach((txn) => {
      clientRefs.forEach((client) => {
        if (!transactionInvolvesClient(txn, client)) return;

        if (txn.type === 'OUTWARD') {
          if (txn.amountType === 'CREDIT' && isTransactionSender(txn, client)) {
            applyBalance(client.id, 0, (txn.amount || 0) + (txn.commission || 0));
          } else if (isTransactionReceiver(txn, client)) {
            applyBalance(client.id, (txn.amount || 0) + (txn.centerCommission || 0), 0);
          }
        } else if (txn.type === 'INWARD') {
          if (txn.amountType === 'CREDIT' && isTransactionReceiver(txn, client)) {
            applyBalance(client.id, txn.amount || 0, 0);
          } else {
            applyBalance(client.id, 0, txn.amount || 0);
          }
        }
      });
    });

    // Process accounting entries - O(n)
    accountEntries.forEach((entry) => {
      clientRefs.forEach((client) => {
        if (!accountingEntryInvolvesClient(entry, client)) return;

        if ((entry as any).type === 'INCOME') {
          applyBalance(
            client.id,
            (entry as any).creditAmount || (entry as any).amount || 0,
            0,
          );
        } else if ((entry as any).type === 'EXPENSE') {
          applyBalance(
            client.id,
            0,
            (entry as any).debitAmount || (entry as any).amount || 0,
          );
        }
      });
    });

    // Process hawala entries - O(n)
    hawalaEntries.forEach((entry) => {
      clientRefs.forEach((client) => {
        if (isPartyNameMatch(entry.partyA, client)) {
          applyBalance(client.id, entry.amount || 0, 0);
        }
        if (isPartyNameMatch(entry.partyB, client)) {
          applyBalance(client.id, 0, entry.amount || 0);
        }
      });
    });

    // Process special entries - O(n)
    specialEntries.forEach((entry) => {
      clientRefs.forEach((client) => {
        if (isPartyNameMatch(entry.partyA, client)) {
          applyBalance(client.id, 0, entry.amountA || 0);
        }
        if (isPartyNameMatch(entry.partyB, client)) {
          applyBalance(client.id, entry.amountB || 0, 0);
        }
        if (isPartyNameMatch(entry.partyC, client)) {
          const amountC = entry.amountC || 0;
          if (amountC > 0) applyBalance(client.id, amountC, 0);
          else applyBalance(client.id, 0, Math.abs(amountC));
        }
      });
    });

    // Convert Map to array and calculate net balances
    const clientBalances = clients.map(client => {
      const balance = clientBalanceMap.get(client.id) || { totalCredit: 0, totalDebit: 0 };
      const netBalance = balance.totalCredit - balance.totalDebit;

      return {
        clientId: client.id,
        clientName: client.name,
        city: client.city,
        totalCredit: balance.totalCredit,
        totalDebit: balance.totalDebit,
        netBalance
      };
    });

    // Filter out clients with 0 balance and sort by net balance (negative to positive)
    const filteredClients = clientBalances
      .filter(client => client.netBalance !== 0)
      .sort((a, b) => a.netBalance - b.netBalance);

    // Separate into income (negative/credit) and expense (positive/debit) sides
    const incomeSide = filteredClients.filter(c => c.netBalance < 0);
    const expenseSide = filteredClients.filter(c => c.netBalance > 0);

    const totalIncome = incomeSide.reduce((sum, c) => sum + Math.abs(c.netBalance), 0);
    const totalExpense = expenseSide.reduce((sum, c) => sum + c.netBalance, 0);

    res.set('Cache-Control', 'public, max-age=300');
    res.json({
      incomeSide,
      expenseSide,
      summary: {
        totalIncome,
        totalExpense,
        netBalance: totalExpense - totalIncome
      },
      dataRange: dateFilter.date ? 'Custom date range' : 'Last 30 days',
      recordsProcessed: {
        transactions: transactions.length,
        accountEntries: accountEntries.length,
        hawalaEntries: hawalaEntries.length,
        specialEntries: specialEntries.length
      }
    });
  } catch (error) {
    console.error('Balance sheet error:', error);
    res.status(500).json({ error: 'Failed to load balance sheet', message: error instanceof Error ? error.message : 'Unknown error' });
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

    const userBranchId = req.user?.branchId;
    const assignedBranchIds = req.user?.assignedBranchIds;
    const userPermissions = req.user?.role?.permissions as any;
    const isSuperAdmin = isSuperAdminUser(userPermissions);

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

    const entryBranchFilter = await getEntryBranchFilter(
      prisma,
      userBranchId,
      isSuperAdmin,
      assignedBranchIds
    );

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
          ...entryBranchFilter,
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
          ...entryBranchFilter,
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
          ...entryBranchFilter,
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
          ...entryBranchFilter,
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
