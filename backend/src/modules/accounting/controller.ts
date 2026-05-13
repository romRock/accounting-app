import { Request, Response } from 'express';
import { PrismaClient } from '@prisma/client';
import { createError } from '../../middlewares/errorHandler';

const prisma = new PrismaClient();

export const createLedgerEntry = async (req: Request, res: Response) => {
  try {
    const {
      date,
      accountId,
      accountType,
      description,
      debitAmount,
      creditAmount,
      transactionId,
    } = req.body;

    const userId = req.user?.id;

    // Calculate running balance
    const lastEntry = await prisma.ledgerEntry.findFirst({
      where: {
        accountId,
        accountType,
        isActive: true,
        isDeleted: false,
      },
      orderBy: { date: 'desc' },
    });

    const lastBalance = lastEntry?.balance || 0;
    const newBalance = lastBalance + (debitAmount || 0) - (creditAmount || 0);

    const ledgerEntry = await prisma.ledgerEntry.create({
      data: {
        date: new Date(date),
        accountId,
        accountType,
        description,
        debitAmount: debitAmount ? Number(debitAmount) : null,
        creditAmount: creditAmount ? Number(creditAmount) : null,
        balance: newBalance,
        transactionId,
        createdBy: userId!,
      },
    });

    res.status(201).json({
      message: 'Ledger entry created successfully',
      ledgerEntry,
    });
  } catch (error) {
    throw error;
  }
};

export const getLedgerEntries = async (req: Request, res: Response) => {
  try {
    const {
      page = 1,
      limit = 10,
      accountId,
      accountType,
      dateFrom,
      dateTo,
      search,
    } = req.query;

    const userRole = req.user?.role.name;
    const userBranchId = req.user?.branchId;

    // Build where clause
    const where: any = {
      isActive: true,
      isDeleted: false,
    };

    // Apply role-based filtering
    if (userRole !== 'Super Admin' && userRole !== 'Admin') {
      // No branch-based filtering - using centers only
    }

    if (accountId) where.accountId = accountId as string;
    if (accountType) where.accountType = accountType as string;

    if (dateFrom || dateTo) {
      where.date = {};
      if (dateFrom) where.date.gte = new Date(dateFrom as string);
      if (dateTo) where.date.lte = new Date(dateTo as string);
    }

    if (search) {
      where.OR = [
        { description: { contains: search as string, mode: 'insensitive' } },
        { accountId: { contains: search as string, mode: 'insensitive' } },
      ];
    }

    // Get total count for pagination
    const total = await prisma.ledgerEntry.count({ where });

    // Get ledger entries with pagination
    const ledgerEntries = await prisma.ledgerEntry.findMany({
      where,
      include: {
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
    });

    res.json({
      ledgerEntries,
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

export const getLedgerEntryById = async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    const userRole = req.user?.role.name;
    const userBranchId = req.user?.branchId;

    const where: any = {
      id: id as string,
      isActive: true,
      isDeleted: false,
    };

    // Apply role-based filtering
    if (userRole !== 'Super Admin' && userRole !== 'Admin') {
      // No branch-based filtering - using centers only
    }

    const ledgerEntry = await prisma.ledgerEntry.findFirst({
      where,
      include: {
        creator: {
          select: {
            id: true,
            firstName: true,
            lastName: true,
          },
        },
      },
    });

    if (!ledgerEntry) {
      throw createError('Ledger entry not found', 404);
    }

    res.json(ledgerEntry);
  } catch (error) {
    throw error;
  }
};

export const updateLedgerEntry = async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    const {
      date,
      accountId,
      accountType,
      description,
      debitAmount,
      creditAmount,
    } = req.body;

    const userId = req.user?.id;

    // Check if ledger entry exists
    const existingEntry = await prisma.ledgerEntry.findFirst({
      where: {
        id: id as string,
        isActive: true,
        isDeleted: false,
      },
    });

    if (!existingEntry) {
      throw createError('Ledger entry not found', 404);
    }

    // Update ledger entry
    const ledgerEntry = await prisma.ledgerEntry.update({
      where: { id: id as string },
      data: {
        date: date ? new Date(date) : undefined,
        accountId,
        accountType,
        description,
        debitAmount: debitAmount ? Number(debitAmount) : undefined,
        creditAmount: creditAmount ? Number(creditAmount) : undefined,
      },
    });

    // Create audit log
    await prisma.auditLog.create({
      data: {
        entity: 'LedgerEntry',
        entityId: id as string,
        action: 'UPDATE',
        oldValues: JSON.stringify(existingEntry),
        newValues: JSON.stringify(ledgerEntry),
        ipAddress: req.ip,
        userAgent: req.get('User-Agent'),
        createdBy: userId!,
      },
    });

    res.json({
      message: 'Ledger entry updated successfully',
      ledgerEntry,
    });
  } catch (error) {
    throw error;
  }
};

export const deleteLedgerEntry = async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    const userId = req.user?.id;

    // Check if ledger entry exists
    const existingEntry = await prisma.ledgerEntry.findFirst({
      where: {
        id: id as string,
        isActive: true,
        isDeleted: false,
      },
    });

    if (!existingEntry) {
      throw createError('Ledger entry not found', 404);
    }

    // Soft delete ledger entry
    await prisma.ledgerEntry.update({
      where: { id: id as string },
      data: {
        isActive: false,
        isDeleted: true,
      },
    });

    // Create audit log
    await prisma.auditLog.create({
      data: {
        entity: 'LedgerEntry',
        entityId: id as string,
        action: 'DELETE',
        oldValues: JSON.stringify(existingEntry),
        ipAddress: req.ip,
        userAgent: req.get('User-Agent'),
        createdBy: userId!,
      },
    });

    res.json({ message: 'Ledger entry deleted successfully' });
  } catch (error) {
    throw error;
  }
};

export const getAccountBalance = async (req: Request, res: Response) => {
  try {
    const { accountId, accountType } = req.query;
    const userRole = req.user?.role.name;
    const userBranchId = req.user?.branchId;

    const where: any = {
      isActive: true,
      isDeleted: false,
    };

    // Apply role-based filtering
    if (userRole !== 'Super Admin' && userRole !== 'Admin') {
      // No branch-based filtering - using centers only
    }

    if (accountId) where.accountId = accountId as string;
    if (accountType) where.accountType = accountType as string;

    // Get latest balance for the account
    const latestEntry = await prisma.ledgerEntry.findFirst({
      where,
      orderBy: { date: 'desc' },
    });

    // Get summary statistics
    const [
      totalDebits,
      totalCredits,
      entryCount,
    ] = await Promise.all([
      prisma.ledgerEntry.aggregate({
        where: { ...where, debitAmount: { not: null } },
        _sum: { debitAmount: true },
      }),
      prisma.ledgerEntry.aggregate({
        where: { ...where, creditAmount: { not: null } },
        _sum: { creditAmount: true },
      }),
      prisma.ledgerEntry.count({ where }),
    ]);

    res.json({
      currentBalance: latestEntry?.balance || 0,
      totalDebits: totalDebits._sum.debitAmount || 0,
      totalCredits: totalCredits._sum.creditAmount || 0,
      entryCount,
      lastUpdated: latestEntry?.date || null,
    });
  } catch (error) {
    throw error;
  }
};

export const getTrialBalance = async (req: Request, res: Response) => {
  try {
    const { dateFrom, dateTo } = req.query;
    const userRole = req.user?.role.name;
    const userBranchId = req.user?.branchId;

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

    // Get trial balance by account type
    const trialBalance = await prisma.ledgerEntry.groupBy({
      by: ['accountType'],
      where,
      _sum: {
        debitAmount: true,
        creditAmount: true,
      },
    });

    // Calculate totals
    const totalDebits = trialBalance.reduce((sum: number, entry: any) => 
      sum + Number(entry._sum.debitAmount || 0), 0
    );
    const totalCredits = trialBalance.reduce((sum: number, entry: any) => 
      sum + Number(entry._sum.creditAmount || 0), 0
    );

    res.json({
      trialBalance: trialBalance.map((entry: any) => ({
        accountType: entry.accountType,
        totalDebits: entry._sum.debitAmount || 0,
        totalCredits: entry._sum.creditAmount || 0,
      })),
      summary: {
        totalDebits,
        totalCredits,
        difference: totalDebits - totalCredits,
      },
    });
  } catch (error) {
    throw error;
  }
};

// Account Category Management
export const createAccountCategory = async (req: Request, res: Response) => {
  try {
    const { name, type, description, parentId, gstApplicable, tdsApplicable } = req.body;
    const userId = req.user?.id;

    // For now, return success without database operations
    // TODO: Implement after database tables are properly created
    res.status(201).json({
      message: 'Account category created successfully',
      accountCategory: {
        id: 'temp-id',
        name,
        type,
        description,
        parentId,
        gstApplicable: gstApplicable || false,
        tdsApplicable: tdsApplicable || false,
        createdBy: userId!,
        createdAt: new Date(),
        updatedAt: new Date(),
      },
    });
  } catch (error) {
    throw error;
  }
};

export const getAccountCategories = async (req: Request, res: Response) => {
  try {
    const { type, page = 1, limit = 50 } = req.query;
    const userId = req.user?.id;
    const branchId = req.user?.branchId;

    // For now, return success without database operations
    // TODO: Implement after database tables are properly created
    res.status(200).json({
      message: 'Account categories retrieved successfully',
      categories: [
        {
          id: 'cat-1',
          name: 'Cash',
          type: 'INCOME',
          description: 'Cash income entries',
          gstApplicable: false,
          tdsApplicable: false,
          isActive: true,
          isDeleted: false,
          createdAt: new Date(),
          updatedAt: new Date(),
        },
        {
          id: 'cat-2',
          name: 'LBL',
          type: 'INCOME',
          description: 'LBL income entries (Label/Entry/Token)',
          gstApplicable: false,
          tdsApplicable: false,
          isActive: true,
          isDeleted: false,
          createdAt: new Date(),
          updatedAt: new Date(),
        },
        {
          id: 'cat-3',
          name: 'LBL',
          type: 'EXPENSE',
          description: 'LBL expense entries (Label/Entry/Token)',
          gstApplicable: false,
          tdsApplicable: false,
          isActive: true,
          isDeleted: false,
          createdAt: new Date(),
          updatedAt: new Date(),
        },
        {
          id: 'cat-4',
          name: 'Money Transfer',
          type: 'EXPENSE',
          description: 'Money transfer expenses',
          gstApplicable: false,
          tdsApplicable: false,
          isActive: true,
          isDeleted: false,
          createdAt: new Date(),
          updatedAt: new Date(),
        },
      ],
      pagination: {
        page: Number(page),
        limit: Number(limit),
        total: 4,
      },
    });
  } catch (error) {
    throw error;
  }
};

export const updateAccountCategory = async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    const { name, type, description, parentId, gstApplicable, tdsApplicable } = req.body;
    const userId = req.user?.id;

    // For now, return success without database operations
    // TODO: Implement after database tables are properly created
    const accountCategory = {
      id,
      name,
      type,
      description,
      parentId,
      gstApplicable: gstApplicable || false,
      tdsApplicable: tdsApplicable || false,
      updatedAt: new Date(),
    };

    res.json({
      message: 'Account category updated successfully',
      accountCategory,
    });
  } catch (error) {
    throw error;
  }
};

export const deleteAccountCategory = async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    const userId = req.user?.id;

    // For now, return success without database operations
    // TODO: Implement after database tables are properly created
    res.status(200).json({
      message: 'Account category deleted successfully',
    });
  } catch (error) {
    throw error;
  }
};

// Account Entry Management
export const createAccountEntry = async (req: Request, res: Response) => {
  try {
    const {
      date,
      categoryId,
      amount,
      description,
      partyId,
      paymentMethod,
      referenceNo,
      gstAmount,
      tdsAmount,
      totalAmount,
      type,
      status,
      entryId,
    } = req.body;
    const userId = req.user?.id;
    const branchId = req.user?.branchId;

    // Generate sequential TRN ID if not provided
    let finalEntryId = entryId;
    if (!finalEntryId) {
      finalEntryId = await getLatestAccountTransactionId();
    }

    const ledgerEntry = await prisma.ledgerEntry.create({
      data: {
        date: new Date(date),
        accountId: partyId || 'GENERAL',
        accountType: type === 'INCOME' ? 'INCOME_ACCOUNT' : 'EXPENSE_ACCOUNT',
        description: description || `${type} entry`,
        debitAmount: type === 'EXPENSE' ? Number(amount) : null,
        creditAmount: type === 'INCOME' ? Number(amount) : null,
        balance: 0, // Will be calculated based on previous entries
        transactionId: finalEntryId,
        branchId,
        createdBy: userId!,
      },
    });

    res.status(201).json({
      message: 'Account entry created successfully',
      ledgerEntry: {
        ...ledgerEntry,
        entryId: finalEntryId,
      },
    });
  } catch (error) {
    throw error;
  }
};

async function getLatestAccountTransactionId(): Promise<string> {
  const lastEntry = await prisma.ledgerEntry.findFirst({
    where: {
      transactionId: {
        startsWith: 'TRN',
      },
      isActive: true,
      isDeleted: false,
    },
    orderBy: {
      createdAt: 'desc',
    },
  });

  if (!lastEntry || !lastEntry.transactionId) {
    return 'TRN001';
  }

  const match = lastEntry.transactionId.match(/TRN(\d+)/);
  if (!match) {
    return 'TRN001';
  }

  const nextNumber = parseInt(match[1], 10) + 1;
  return `TRN${nextNumber.toString().padStart(3, '0')}`;
}

export const getNextAccountTransactionId = async (req: Request, res: Response) => {
  try {
    const nextTransactionId = await getLatestAccountTransactionId();
    res.json({ nextTransactionId });
  } catch (error) {
    throw error;
  }
};

export const getAccountEntries = async (req: Request, res: Response) => {
  try {
    const {
      page = 1,
      limit = 10,
      categoryId,
      type,
      partyId,
      dateFrom,
      dateTo,
      search,
    } = req.query;

    const where: any = {
      isActive: true,
      isDeleted: false,
    };

    // Map accounting params to ledgerEntry fields
    if (partyId) where.accountId = partyId as string;
    if (type) where.accountType = type === 'INCOME' ? 'INCOME_ACCOUNT' : 'EXPENSE_ACCOUNT';

    if (dateFrom || dateTo) {
      where.date = {};
      if (dateFrom) where.date.gte = new Date(dateFrom as string);
      if (dateTo) where.date.lte = new Date(dateTo as string);
    }
    if (search) {
      where.OR = [
        { description: { contains: search as string, mode: 'insensitive' } },
        { accountId: { contains: search as string, mode: 'insensitive' } },
        { accountType: { contains: search as string, mode: 'insensitive' } },
        { transactionId: { contains: search as string, mode: 'insensitive' } },
      ];
    }

    // Get total count for pagination
    const total = await prisma.ledgerEntry.count({ where });

    // Get ledger entries with pagination
    const entries = await prisma.ledgerEntry.findMany({
      where,
      include: {
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
    });

    // Calculate totals
    const incomeTotal = await prisma.ledgerEntry.aggregate({
      where: { ...where, creditAmount: { not: null } },
      _sum: { creditAmount: true },
    });

    const expenseTotal = await prisma.ledgerEntry.aggregate({
      where: { ...where, debitAmount: { not: null } },
      _sum: { debitAmount: true },
    });

    res.json({
      entries,
      pagination: {
        page: Number(page),
        limit: Number(limit),
        total,
      },
      incomeTotal: (incomeTotal._sum?.creditAmount) || 0,
      expenseTotal: (expenseTotal._sum?.debitAmount) || 0,
      sum: ((incomeTotal._sum?.creditAmount) || 0) - ((expenseTotal._sum?.debitAmount) || 0),
    });
  } catch (error) {
    throw error;
  }
};

export const updateAccountEntry = async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    const {
      date,
      categoryId,
      amount,
      description,
      partyId,
      paymentMethod,
      referenceNo,
      gstAmount,
      tdsAmount,
      totalAmount,
      type,
      status,
    } = req.body;
    const userId = req.user?.id;

    const existingEntry = await prisma.ledgerEntry.findFirst({
      where: {
        id: id as string,
        isActive: true,
        isDeleted: false,
      },
    });

    if (!existingEntry) {
      throw createError('Account entry not found', 404);
    }

    const ledgerEntry = await prisma.ledgerEntry.update({
      where: { id: id as string },
      data: {
        date: date ? new Date(date) : undefined,
        accountId: partyId || 'GENERAL',
        accountType: type === 'INCOME' ? 'INCOME_ACCOUNT' : 'EXPENSE_ACCOUNT',
        description: description || `${type} entry`,
        debitAmount: type === 'EXPENSE' ? Number(amount) : null,
        creditAmount: type === 'INCOME' ? Number(amount) : null,
        balance: 0, // Will be calculated based on previous entries
        transactionId: existingEntry.transactionId,
        branchId: existingEntry.branchId,
        createdBy: existingEntry.createdBy,
      },
    });

    // Create audit log
    await prisma.auditLog.create({
      data: {
        entity: 'LedgerEntry',
        entityId: id as string,
        action: 'UPDATE',
        oldValues: JSON.stringify(existingEntry),
        newValues: JSON.stringify(ledgerEntry),
        ipAddress: req.ip,
        userAgent: req.get('User-Agent'),
        createdBy: userId!,
      },
    });

    res.json({
      message: 'Account entry updated successfully',
      ledgerEntry,
    });
  } catch (error) {
    throw error;
  }
};
// ... (rest of the code remains the same)
export const deleteAccountEntry = async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    const userId = req.user?.id;

    const existingEntry = await prisma.ledgerEntry.findFirst({
      where: {
        id: id as string,
        isActive: true,
        isDeleted: false,
      },
    });

    if (!existingEntry) {
      throw createError('Account entry not found', 404);
    }

    await prisma.ledgerEntry.update({
      where: { id: id as string },
      data: {
        isActive: false,
        isDeleted: true,
      },
    });

    // Create audit log
    await prisma.auditLog.create({
      data: {
        entity: 'LedgerEntry',
        entityId: id as string,
        action: 'DELETE',
        oldValues: JSON.stringify(existingEntry),
        newValues: JSON.stringify({ deleted: true }),
        ipAddress: req.ip,
        userAgent: req.get('User-Agent'),
        createdBy: userId!,
      },
    });

    res.json({
      message: 'Account entry deleted successfully',
      ledgerEntry: existingEntry,
    });
  } catch (error) {
    throw error;
  }
};

export const getAccountingSummary = async (req: Request, res: Response) => {
  try {
    const { dateFrom, dateTo } = req.query;

    const where: any = {
      isActive: true,
      isDeleted: false,
    };

    if (dateFrom || dateTo) {
      where.date = {};
      if (dateFrom) where.date.gte = new Date(dateFrom as string);
      if (dateTo) where.date.lte = new Date(dateTo as string);
    }

    const [
      totalIncome,
      totalExpense,
    ] = await Promise.all([
      prisma.ledgerEntry.aggregate({
        where: { ...where, creditAmount: { not: null } },
        _sum: { creditAmount: true },
        _count: { id: true },
      }),
      prisma.ledgerEntry.aggregate({
        where: { ...where, debitAmount: { not: null } },
        _sum: { debitAmount: true },
        _count: { id: true },
      }),
    ]);

    const incomeAmount = totalIncome._sum.creditAmount || 0;
    const expenseAmount = totalExpense._sum.debitAmount || 0;

    res.json({
      totalIncome: incomeAmount,
      totalExpense: expenseAmount,
      netBalance: incomeAmount - expenseAmount,
      incomeCount: totalIncome._count.id,
      expenseCount: totalExpense._count.id,
    });
  } catch (error) {
    throw error;
  }
};
