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
    const branchId = req.user?.branchId;

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
        branchId,
        createdBy: userId!,
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
      where.branchId = userBranchId;
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
        transaction: {
          include: {
            fromCity: true,
            toCity: true,
            party: true,
          },
        },
        creator: {
          select: {
            id: true,
            firstName: true,
            lastName: true,
            email: true,
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
      where.branchId = userBranchId;
    }

    const ledgerEntry = await prisma.ledgerEntry.findFirst({
      where,
      include: {
        transaction: {
          include: {
            fromCity: true,
            toCity: true,
            party: true,
          },
        },
        creator: {
          select: {
            id: true,
            firstName: true,
            lastName: true,
            email: true,
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
      include: {
        transaction: {
          include: {
            fromCity: true,
            toCity: true,
            party: true,
          },
        },
      },
    });

    // Create audit log
    await prisma.auditLog.create({
      data: {
        entity: 'LedgerEntry',
        entityId: id as string,
        action: 'UPDATE',
        oldValues: existingEntry,
        newValues: ledgerEntry,
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
        oldValues: existingEntry,
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
      where.branchId = userBranchId;
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
      where.branchId = userBranchId;
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
