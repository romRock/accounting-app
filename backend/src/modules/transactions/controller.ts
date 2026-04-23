import { Request, Response } from 'express';
import { PrismaClient } from '@prisma/client';
import { createError } from '../../middlewares/errorHandler';
import { generateTransactionId, calculateCommission } from '../auth/utils';

// Define enum values as strings since Prisma enums aren't being exported properly
enum TransactionType {
  INWARD = 'INWARD',
  OUTWARD = 'OUTWARD'
}

enum PaymentType {
  CASH = 'CASH',
  CREDIT = 'CREDIT'
}

enum TransactionStatus {
  PENDING = 'PENDING',
  COMPLETED = 'COMPLETED',
  CANCELLED = 'CANCELLED'
}

const prisma = new PrismaClient();

export const createTransaction = async (req: Request, res: Response) => {
  try {
    const {
      date,
      type,
      fromCityId,
      toCityId,
      partyId,
      amount,
      paymentType,
      referenceId,
      notes,
    } = req.body;

    const userId = req.user?.id;
    const branchId = req.user?.branchId;

    // Generate unique transaction ID
    const transactionId = generateTransactionId();

    // Calculate commission (you may want to get commission rates from database)
    let commission = 0;
    const commissionRate = await prisma.commissionRate.findFirst({
      where: {
        fromCityId,
        toCityId,
        isActive: true,
        isDeleted: false,
      },
    });

    if (commissionRate) {
      commission = calculateCommission(
        Number(amount),
        Number(commissionRate.rate),
        commissionRate.rateType as 'PERCENTAGE' | 'FIXED',
        commissionRate.minAmount ? Number(commissionRate.minAmount) : undefined,
        commissionRate.maxAmount ? Number(commissionRate.maxAmount) : undefined
      );
    }

    // Create transaction
    const transaction = await prisma.transaction.create({
      data: {
        transactionId,
        date: new Date(date),
        type: type as TransactionType,
        fromCityId,
        toCityId,
        partyId,
        amount: Number(amount),
        commission,
        paymentType: paymentType as PaymentType,
        referenceId,
        notes,
        status: TransactionStatus.PENDING,
        branchId,
        createdBy: userId!,
      },
      include: {
        fromCity: true,
        toCity: true,
        party: true,
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

    // Create corresponding ledger entries (double entry)
    await createLedgerEntries(transaction);

    res.status(201).json({
      message: 'Transaction created successfully',
      transaction,
    });
  } catch (error) {
    throw error;
  }
};

export const getTransactions = async (req: Request, res: Response) => {
  try {
    const {
      page = 1,
      limit = 10,
      type,
      status,
      fromCityId,
      toCityId,
      partyId,
      dateFrom,
      dateTo,
      search,
    } = req.query;

    const userId = req.user?.id;
    const userRole = req.user?.role?.name;
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

    if (type) where.type = type as TransactionType;
    if (status) where.status = status as TransactionStatus;
    if (fromCityId) where.fromCityId = fromCityId as string;
    if (toCityId) where.toCityId = toCityId as string;
    if (partyId) where.partyId = partyId as string;

    if (dateFrom || dateTo) {
      where.date = {};
      if (dateFrom) where.date.gte = new Date(dateFrom as string);
      if (dateTo) where.date.lte = new Date(dateTo as string);
    }

    if (search) {
      where.OR = [
        { transactionId: { contains: search as string, mode: 'insensitive' } },
        { referenceId: { contains: search as string, mode: 'insensitive' } },
        { notes: { contains: search as string, mode: 'insensitive' } },
        { party: { name: { contains: search as string, mode: 'insensitive' } } },
      ];
    }

    // Get total count for pagination
    const total = await prisma.transaction.count({ where });

    // Get transactions with pagination
    const transactions = await prisma.transaction.findMany({
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
            email: true,
          },
        },
      },
      orderBy: { date: 'desc' },
      skip: (Number(page) - 1) * Number(limit),
      take: Number(limit),
    });

    res.json({
      transactions,
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

export const getTransactionById = async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    const userRole = req.user?.role?.name;
    const userBranchId = req.user?.branchId;

    const where: any = {
      id,
      isActive: true,
      isDeleted: false,
    };

    // Apply role-based filtering
    if (userRole !== 'Super Admin' && userRole !== 'Admin') {
      where.branchId = userBranchId;
    }

    const transaction = await prisma.transaction.findFirst({
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
            email: true,
          },
        },
        ledgerEntries: true,
      },
    });

    if (!transaction) {
      throw createError('Transaction not found', 404);
    }

    res.json(transaction);
  } catch (error) {
    throw error;
  }
};

export const updateTransaction = async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    const {
      date,
      type,
      fromCityId,
      toCityId,
      partyId,
      amount,
      paymentType,
      referenceId,
      notes,
      status,
    } = req.body;

    const userId = req.user?.id;

    // Check if transaction exists and user has permission
    const existingTransaction = await prisma.transaction.findFirst({
      where: {
        id: id as string,
        isActive: true,
        isDeleted: false,
      },
    });

    if (!existingTransaction) {
      throw createError('Transaction not found', 404);
    }

    // Update transaction
    const transaction = await prisma.transaction.update({
      where: { id },
      data: {
        date: date ? new Date(date) : undefined,
        type: type as TransactionType,
        fromCityId,
        toCityId,
        partyId,
        amount: amount ? Number(amount) : undefined,
        paymentType: paymentType as PaymentType,
        referenceId,
        notes,
        status: status as TransactionStatus,
      },
      include: {
        fromCity: true,
        toCity: true,
        party: true,
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

    // Create audit log
    await prisma.auditLog.create({
      data: {
        entity: 'Transaction',
        entityId: id as string,
        action: 'UPDATE',
        oldValues: existingTransaction,
        newValues: transaction,
        ipAddress: req.ip,
        userAgent: req.get('User-Agent'),
        createdBy: userId!,
      },
    });

    res.json({
      message: 'Transaction updated successfully',
      transaction,
    });
  } catch (error) {
    throw error;
  }
};

export const deleteTransaction = async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    const userId = req.user?.id;

    // Check if transaction exists
    const existingTransaction = await prisma.transaction.findFirst({
      where: {
        id: id as string,
        isActive: true,
        isDeleted: false,
      },
    });

    if (!existingTransaction) {
      throw createError('Transaction not found', 404);
    }

    // Soft delete transaction
    await prisma.transaction.update({
      where: { id },
      data: {
        isActive: false,
        isDeleted: true,
      },
    });

    // Create audit log
    await prisma.auditLog.create({
      data: {
        entity: 'Transaction',
        entityId: id as string,
        action: 'DELETE',
        oldValues: existingTransaction,
        ipAddress: req.ip,
        userAgent: req.get('User-Agent'),
        createdBy: userId!,
      },
    });

    res.json({ message: 'Transaction deleted successfully' });
  } catch (error) {
    throw error;
  }
};

export const getTransactionStats = async (req: Request, res: Response) => {
  try {
    const { dateFrom, dateTo } = req.query;
    const userBranchId = req.user?.branchId;
    const userRole = req.user?.role?.name;

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

    // Get statistics
    const [
      totalTransactions,
      totalAmount,
      totalCommission,
      inwardTransactions,
      outwardTransactions,
      pendingTransactions,
      completedTransactions,
    ] = await Promise.all([
      prisma.transaction.count({ where }),
      prisma.transaction.aggregate({
        where,
        _sum: { amount: true },
      }),
      prisma.transaction.aggregate({
        where,
        _sum: { commission: true },
      }),
      prisma.transaction.count({
        where: { ...where, type: TransactionType.INWARD },
      }),
      prisma.transaction.count({
        where: { ...where, type: TransactionType.OUTWARD },
      }),
      prisma.transaction.count({
        where: { ...where, status: TransactionStatus.PENDING },
      }),
      prisma.transaction.count({
        where: { ...where, status: TransactionStatus.COMPLETED },
      }),
    ]);

    res.json({
      totalTransactions,
      totalAmount: totalAmount._sum.amount || 0,
      totalCommission: totalCommission._sum.commission || 0,
      inwardTransactions,
      outwardTransactions,
      pendingTransactions,
      completedTransactions,
    });
  } catch (error) {
    throw error;
  }
};

// Helper function to create ledger entries for double entry accounting
async function createLedgerEntries(transaction: any) {
  // This would implement double entry accounting logic
  // For now, we'll create basic entries
  const entries = [];

  // Debit entry (party owes money or we owe money)
  entries.push({
    date: transaction.date,
    accountId: transaction.partyId,
    accountType: 'PARTY',
    description: `${transaction.type} transaction ${transaction.transactionId}`,
    debitAmount: transaction.type === TransactionType.INWARD ? transaction.amount : 0,
    creditAmount: transaction.type === TransactionType.OUTWARD ? transaction.amount : 0,
    balance: 0, // Would be calculated based on previous entries
    transactionId: transaction.id,
    branchId: transaction.branchId,
    createdBy: transaction.createdBy,
  });

  // Credit entry (commission income)
  if (transaction.commission > 0) {
    entries.push({
      date: transaction.date,
      accountId: 'COMMISSION_INCOME',
      accountType: 'INCOME',
      description: `Commission on transaction ${transaction.transactionId}`,
      debitAmount: 0,
      creditAmount: transaction.commission,
      balance: 0,
      transactionId: transaction.id,
      branchId: transaction.branchId,
      createdBy: transaction.createdBy,
    });
  }

  await prisma.ledgerEntry.createMany({ data: entries });
}
