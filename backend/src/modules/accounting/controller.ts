import { Request, Response } from 'express';
import { PrismaClient } from '@prisma/client';
import { createError } from '../../middlewares/errorHandler';
import {
  applyEntryBranchScope,
  isSuperAdminUser,
  resolveUserBranchId,
} from '../../utils/branchScope';

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
    const userPermissions = req.user?.role?.permissions as any;
    const isSuperAdmin = isSuperAdminUser(userPermissions);

    // Build where clause
    const where: any = {
      isActive: true,
      isDeleted: false,
    };

    await applyEntryBranchScope(where, prisma, userBranchId, isSuperAdmin, req.user?.assignedBranchIds);

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

    // Create audit log - fire and forget (non-blocking)
    prisma.auditLog.create({
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
    }).catch(() => {
      // Ignore audit log errors
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
    prisma.auditLog.create({
      data: {
        entity: 'LedgerEntry',
        entityId: id as string,
        action: 'DELETE',
        oldValues: JSON.stringify(existingEntry),
        ipAddress: req.ip,
        userAgent: req.get('User-Agent'),
        createdBy: userId!,
      },
    }).catch(() => {
      // Ignore audit log errors
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

    // Check if categories exist in database
    let categories = await prisma.accountCategory.findMany({
      where: type ? { type: String(type) } : {},
      skip: (Number(page) - 1) * Number(limit),
      take: Number(limit),
      orderBy: { createdAt: 'desc' },
    });

    // If no categories exist, seed with mock data
    if (categories.length === 0 && !type) {
      const mockCategories = [
        {
          id: 'cat-1',
          name: 'Cash',
          type: 'INCOME',
          description: 'Cash income entries',
          parentId: null,
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
          parentId: null,
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
          parentId: null,
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
          parentId: null,
          gstApplicable: false,
          tdsApplicable: false,
          isActive: true,
          isDeleted: false,
          createdAt: new Date(),
          updatedAt: new Date(),
        },
      ];

      // Insert mock categories into database
      for (const cat of mockCategories) {
        await prisma.accountCategory.create({ data: cat });
      }

      categories = mockCategories;
    }

    const total = await prisma.accountCategory.count({
      where: type ? { type: String(type) } : {},
    });

    res.status(200).json({
      message: 'Account categories retrieved successfully',
      categories,
      pagination: {
        page: Number(page),
        limit: Number(limit),
        total,
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
      time,
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
    const branchId = await resolveUserBranchId(prisma, userId!, req.user?.branchId);

    // Validate required fields
    if (!date || !categoryId || !amount || !type) {
      throw createError('Missing required fields: date, categoryId, amount, type', 400);
    }

    // Validate that category exists
    const category = await prisma.accountCategory.findUnique({
      where: { id: categoryId },
    });
    if (!category) {
      // Log available categories for debugging
      const availableCategories = await prisma.accountCategory.findMany({
        select: { id: true, name: true, type: true },
      });
      throw createError(
        `Category with ID '${categoryId}' not found. Available categories: ${availableCategories.map(c => `${c.id} (${c.name})`).join(', ')}`,
        400
      );
    }

    // Generate sequential TRN ID if not provided
    let finalEntryId = entryId;
    if (!finalEntryId) {
      finalEntryId = await getLatestAccountTransactionId();
    }

    // Handle duplicate entryId - generate a new one if it already exists
    let attempts = 0;
    const maxAttempts = 10;
    while (attempts < maxAttempts) {
      const existingEntry = await prisma.accountEntry.findUnique({
        where: { entryId: finalEntryId },
      });
      
      if (!existingEntry) {
        break; // entryId is unique, proceed
      }
      
      // Generate a new entryId
      const match = finalEntryId.match(/TRN(\d+)/);
      if (match) {
        const currentNumber = parseInt(match[1], 10);
        finalEntryId = `TRN${(currentNumber + 1).toString().padStart(3, '0')}`;
      } else {
        // If format doesn't match, append timestamp
        finalEntryId = `TRN${Date.now()}`;
      }
      
      attempts++;
    }

    // Parse time safely
    let statusTime = new Date();
    if (time) {
      const parsedTime = new Date(time);
      if (!isNaN(parsedTime.getTime())) {
        statusTime = parsedTime;
      }
    }

    // Handle partyId - if provided, find or create party
    let finalPartyId: string | undefined = undefined;
    if (partyId) {
      // Try to find party by ID first
      let party = await prisma.party.findUnique({
        where: { id: partyId },
      });

      // If not found by ID, try to find by name or create
      if (!party) {
        party = await prisma.party.findFirst({
          where: { name: partyId },
        });

        // If still not found, create new party
        if (!party) {
          party = await prisma.party.create({
            data: {
              name: partyId,
              isActive: true,
            },
          });
        }
      }
      finalPartyId = party.id;
    }

    // Create AccountEntry record first
    const accountEntry = await prisma.accountEntry.create({
      data: {
        entryId: finalEntryId,
        date: new Date(date),
        statusTime,
        categoryId,
        amount: Number(amount),
        description: description || '',
        partyId: finalPartyId || undefined,
        paymentMethod: paymentMethod || undefined,
        referenceNo: referenceNo || undefined,
        gstAmount: gstAmount ? Number(gstAmount) : 0,
        tdsAmount: tdsAmount ? Number(tdsAmount) : 0,
        totalAmount: totalAmount ? Number(totalAmount) : Number(amount),
        type,
        branchId: branchId || undefined,
        createdBy: userId!,
      },
      select: {
        id: true,
        entryId: true,
        date: true,
        statusTime: true,
        categoryId: true,
        partyId: true,
        amount: true,
        description: true,
        type: true,
        totalAmount: true,
        gstAmount: true,
        tdsAmount: true,
        paymentMethod: true,
        referenceNo: true,
        branchId: true,
        createdBy: true,
        createdAt: true,
        updatedAt: true,
        category: {
          select: {
            id: true,
            name: true,
            type: true,
            description: true,
            gstApplicable: true,
            tdsApplicable: true,
            isActive: true,
            isDeleted: true,
            createdAt: true,
            updatedAt: true,
          },
        },
        party: {
          select: {
            id: true,
            name: true,
            phone: true,
            email: true,
            address: true,
            city: true,
            panNumber: true,
            gstNumber: true,
            isActive: true,
            isDeleted: true,
            createdAt: true,
            updatedAt: true,
          },
        },
      },
    });

    // Create corresponding LedgerEntry record
    await prisma.ledgerEntry.create({
      data: {
        date: new Date(date),
        accountId: finalPartyId ?? 'GENERAL',
        accountType: type === 'INCOME' ? 'INCOME_ACCOUNT' : 'EXPENSE_ACCOUNT',
        description: description || `${type} entry`,
        debitAmount: type === 'EXPENSE' ? Number(amount) : null,
        creditAmount: type === 'INCOME' ? Number(amount) : null,
        balance: 0,
        transactionId: finalEntryId,
        branchId: branchId || undefined,
        createdBy: userId!,
        accountEntryId: accountEntry.id,
      },
    });

    res.status(201).json({
      message: 'Account entry created successfully',
      entry: accountEntry,
    });
  } catch (error) {
    throw error;
  }
};

async function getLatestAccountTransactionId(): Promise<string> {
  const lastEntry = await prisma.accountEntry.findFirst({
    where: {
      entryId: {
        startsWith: 'TRN',
      },
      isActive: true,
      isDeleted: false,
    },
    orderBy: {
      createdAt: 'desc',
    },
  });

  if (!lastEntry || !lastEntry.entryId) {
    return 'TRN001';
  }

  const match = lastEntry.entryId.match(/TRN(\d+)/);
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
      allDates,
    } = req.query;

    const userBranchId = req.user?.branchId;
    const userPermissions = req.user?.role?.permissions as any;
    const isSuperAdmin = isSuperAdminUser(userPermissions);

    // Get current date in Indian timezone for default filtering
    const now = new Date();
    const istDate = new Date(now.toLocaleString('en-US', { timeZone: 'Asia/Kolkata' }));
    const today = new Date(istDate.getFullYear(), istDate.getMonth(), istDate.getDate());
    const tomorrow = new Date(today);
    tomorrow.setDate(tomorrow.getDate() + 1);

    const where: any = {
      isActive: true,
      isDeleted: false,
    };

    await applyEntryBranchScope(where, prisma, userBranchId, isSuperAdmin, req.user?.assignedBranchIds);

    // Map accounting params to AccountEntry fields
    if (categoryId) where.categoryId = categoryId as string;
    if (type) where.type = type as string;
    if (partyId) where.partyId = partyId as string;

    // allDates=true skips date filter (used by customer report / balance sheet for cumulative balances)
    if (allDates === 'true') {
      // no date filter
    } else if (dateFrom || dateTo) {
      where.date = {};
      if (dateFrom) where.date.gte = new Date(dateFrom as string);
      if (dateTo) where.date.lte = new Date(dateTo as string);
    } else {
      // Default: filter to current day (Indian timezone)
      where.date = {
        gte: today,
        lt: tomorrow,
      };
    }
    if (search) {
      where.OR = [
        { description: { contains: search as string, mode: 'insensitive' } },
        { partyId: { contains: search as string, mode: 'insensitive' } },
        { type: { contains: search as string, mode: 'insensitive' } },
        { entryId: { contains: search as string, mode: 'insensitive' } },
      ];
    }

    // Get total count for pagination
    const total = await prisma.accountEntry.count({ where });

    // Get account entries with pagination
    const entries = await prisma.accountEntry.findMany({
      where,
      select: {
        id: true,
        entryId: true,
        date: true,
        statusTime: true,
        categoryId: true,
        partyId: true,
        amount: true,
        description: true,
        type: true,
        totalAmount: true,
        gstAmount: true,
        tdsAmount: true,
        paymentMethod: true,
        referenceNo: true,
        branchId: true,
        createdBy: true,
        createdAt: true,
        updatedAt: true,
        category: {
          select: {
            id: true,
            name: true,
            type: true,
            description: true,
            gstApplicable: true,
            tdsApplicable: true,
            isActive: true,
            isDeleted: true,
            createdAt: true,
            updatedAt: true,
          },
        },
        party: {
          select: {
            id: true,
            name: true,
            phone: true,
            email: true,
            address: true,
            city: true,
            panNumber: true,
            gstNumber: true,
            isActive: true,
            isDeleted: true,
            createdAt: true,
            updatedAt: true,
          },
        },
      },
      orderBy: { date: 'desc' },
      skip: (Number(page) - 1) * Number(limit),
      take: Number(limit),
    });

    // Calculate totals
    const incomeTotal = await prisma.accountEntry.aggregate({
      where: { ...where, type: 'INCOME' },
      _sum: { amount: true },
    });

    const expenseTotal = await prisma.accountEntry.aggregate({
      where: { ...where, type: 'EXPENSE' },
      _sum: { amount: true },
    });

    res.setHeader('Cache-Control', 'no-store, no-cache, must-revalidate, private');
    res.setHeader('Pragma', 'no-cache');
    res.setHeader('Expires', '0');
    res.json({
      entries,
      pagination: {
        page: Number(page),
        limit: Number(limit),
        total,
      },
      incomeTotal: (incomeTotal._sum?.amount) || 0,
      expenseTotal: (expenseTotal._sum?.amount) || 0,
      sum: ((incomeTotal._sum?.amount) || 0) - ((expenseTotal._sum?.amount) || 0),
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
      time,
    } = req.body;
    const userId = req.user?.id;

    const existingEntry = await prisma.accountEntry.findFirst({
      where: {
        id: id as string,
        isActive: true,
        isDeleted: false,
      },
      include: {
        category: true,
        party: true,
      },
    });

    if (!existingEntry) {
      throw createError('Account entry not found', 404);
    }

    // Parse time safely
    let statusTime = existingEntry.statusTime || new Date();
    if (time) {
      const parsedTime = new Date(time);
      if (!isNaN(parsedTime.getTime())) {
        statusTime = parsedTime;
      }
    }

    // Handle partyId - if provided, find or create party
    let finalPartyId: string | null | undefined = partyId ? undefined : existingEntry.partyId;
    if (partyId) {
      // Try to find party by ID first
      let party = await prisma.party.findUnique({
        where: { id: partyId },
      });

      // If not found by ID, try to find by name or create
      if (!party) {
        party = await prisma.party.findFirst({
          where: { name: partyId },
        });

        // If still not found, create new party
        if (!party) {
          party = await prisma.party.create({
            data: {
              name: partyId,
              isActive: true,
            },
          });
        }
      }
      finalPartyId = party.id;
    }

    const updatedEntry = await prisma.accountEntry.update({
      where: { id: id as string },
      data: {
        date: date ? new Date(date) : undefined,
        categoryId: categoryId || existingEntry.categoryId,
        amount: amount ? Number(amount) : undefined,
        description: description || existingEntry.description,
        partyId: finalPartyId !== undefined ? finalPartyId : existingEntry.partyId,
        paymentMethod: paymentMethod || existingEntry.paymentMethod,
        referenceNo: referenceNo || existingEntry.referenceNo,
        gstAmount: gstAmount ? Number(gstAmount) : existingEntry.gstAmount,
        tdsAmount: tdsAmount ? Number(tdsAmount) : existingEntry.tdsAmount,
        totalAmount: totalAmount ? Number(totalAmount) : existingEntry.totalAmount,
        type: type || existingEntry.type,
        statusTime,
      },
      select: {
        id: true,
        entryId: true,
        date: true,
        statusTime: true,
        categoryId: true,
        partyId: true,
        amount: true,
        description: true,
        type: true,
        totalAmount: true,
        gstAmount: true,
        tdsAmount: true,
        paymentMethod: true,
        referenceNo: true,
        branchId: true,
        createdBy: true,
        createdAt: true,
        updatedAt: true,
        category: {
          select: {
            id: true,
            name: true,
            type: true,
            description: true,
            gstApplicable: true,
            tdsApplicable: true,
            isActive: true,
            isDeleted: true,
            createdAt: true,
            updatedAt: true,
          },
        },
        party: {
          select: {
            id: true,
            name: true,
            phone: true,
            email: true,
            address: true,
            city: true,
            panNumber: true,
            gstNumber: true,
            isActive: true,
            isDeleted: true,
            createdAt: true,
            updatedAt: true,
          },
        },
      },
    });

    // Update corresponding LedgerEntry
    await prisma.ledgerEntry.updateMany({
      where: {
        accountEntryId: id as string,
      },
      data: {
        date: date ? new Date(date) : undefined,
        accountId: finalPartyId ?? existingEntry.partyId ?? 'GENERAL',
        accountType: (type || existingEntry.type) === 'INCOME' ? 'INCOME_ACCOUNT' : 'EXPENSE_ACCOUNT',
        description: description || existingEntry.description || `${type || existingEntry.type} entry`,
        debitAmount: (type || existingEntry.type) === 'EXPENSE' ? Number(amount || existingEntry.amount) : null,
        creditAmount: (type || existingEntry.type) === 'INCOME' ? Number(amount || existingEntry.amount) : null,
      },
    });

    // Create audit log - fire and forget (non-blocking)
    prisma.auditLog.create({
      data: {
        entity: 'AccountEntry',
        entityId: id as string,
        action: 'UPDATE',
        oldValues: JSON.stringify(existingEntry),
        newValues: JSON.stringify(updatedEntry),
        ipAddress: req.ip,
        userAgent: req.get('User-Agent'),
        createdBy: userId!,
      },
    }).catch(() => {
      // Ignore audit log errors
    });

    res.json({
      message: 'Account entry updated successfully',
      entry: updatedEntry,
    });
  } catch (error) {
    throw error;
  }
};
export const deleteAccountEntry = async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    const userId = req.user?.id;

    const existingEntry = await prisma.accountEntry.findFirst({
      where: {
        id: id as string,
        isActive: true,
        isDeleted: false,
      },
    });

    if (!existingEntry) {
      throw createError('Account entry not found', 404);
    }

    // Soft delete corresponding LedgerEntry records first
    await prisma.ledgerEntry.updateMany({
      where: {
        accountEntryId: id as string,
      },
      data: {
        isActive: false,
        isDeleted: true,
        deletedAt: new Date(),
        deletedBy: userId!,
      },
    });

    // Soft delete from database
    await prisma.accountEntry.update({
      where: { id: id as string },
      data: {
        isActive: false,
        isDeleted: true,
        deletedAt: new Date(),
        deletedBy: userId!,
      },
    });

    // Create audit log
    await prisma.auditLog.create({
      data: {
        entity: 'AccountEntry',
        entityId: id as string,
        action: 'DELETE',
        oldValues: JSON.stringify(existingEntry),
        newValues: JSON.stringify({ deleted: true, softDelete: true }),
        ipAddress: req.ip,
        userAgent: req.get('User-Agent'),
        createdBy: userId!,
      },
    });

    res.json({
      message: 'Account entry deleted successfully',
      entry: existingEntry,
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
