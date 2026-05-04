import { Request, Response } from 'express';
import { PrismaClient } from '@prisma/client';
import { createError } from '../../middlewares/errorHandler';

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
    console.log('=== CREATE TRANSACTION DEBUG ===');
    console.log('Request body:', req.body);
    
    const {
      date,
      time,
      centerId,
      amount,
      amountType,
      autoCommission,
      commission,
      bookingCommission,
      centerCommission,
      receiverName,
      receiverNumber,
      senderName,
      senderNumber,
      receiverClientId,
      senderClientId,
      remark,
      type = 'OUTWARD'
    } = req.body;

    const userId = req.user?.id;
    const branchId = req.user?.branchId;

    // Find the actual center ID from city code/name
    let actualCenterId = centerId;
    if (centerId && typeof centerId === 'string') {
      const center = await prisma.city.findFirst({
        where: {
          OR: [
            { code: centerId },
            { name: centerId }
          ]
        },
        select: { id: true }
      });
      actualCenterId = center?.id || centerId;
      console.log('Center lookup:', { input: centerId, found: actualCenterId });
    }

    // Generate unique transaction ID (PM2_001, PM2_002...)
    const transactionId = await generateTransactionId();
    
    // Generate token number (daily reset)
    const tokenNo = await generateTokenNumber(date);

    // Calculate commission if auto is enabled
    let calculatedCommission = commission || 0;
    let calculatedBookingCommission = bookingCommission || 0;
    let calculatedCenterCommission = centerCommission || 0;

    if (autoCommission) {
      calculatedCommission = Math.round(Number(amount) * 0.001); // 0.1% commission
      calculatedBookingCommission = Math.round(calculatedCommission * 0.35); // 35%
      calculatedCenterCommission = Math.round(calculatedCommission * 0.65); // 65%
    }

    // Create transaction with new schema
    const transaction = await prisma.transaction.create({
      data: {
        transactionId,
        tokenNo,
        date: new Date(date),
        time: time ? new Date(`${date}T${time}:00`) : new Date(),
        centerId: actualCenterId,
        amount: Number(amount),
        amountType: amountType as PaymentType,
        commission: calculatedCommission,
        bookingCommission: calculatedBookingCommission,
        centerCommission: calculatedCenterCommission,
        autoCommission: autoCommission || true,
        receiverName,
        receiverNumber: receiverNumber || null,
        senderName,
        senderNumber: senderNumber || null,
        receiverClientId: receiverClientId || null,
        senderClientId: senderClientId || null,
        remark: remark || null,
        status: true,
        statusTime: new Date(),
        type: type as TransactionType,
        branchId,
        createdBy: userId!,
      },
      include: {
        center: true,
        receiverClient: {
          select: {
            id: true,
            name: true,
            phone: true,
            city: true,
          },
        },
        senderClient: {
          select: {
            id: true,
            name: true,
            phone: true,
            city: true,
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

    // Create corresponding ledger entries for credit transactions
    if (amountType === 'CREDIT' && senderClientId) {
      await createClientLedgerEntries(transaction);
    }

    res.status(201).json({
      message: 'Transaction created successfully',
      transaction,
    });
  } catch (error) {
    console.error('=== TRANSACTION CREATION ERROR ===');
    console.error('Error details:', error);
    console.error('Error message:', error instanceof Error ? error.message : 'Unknown error');
    console.error('Error stack:', error instanceof Error ? error.stack : 'No stack trace');
    
    // Handle specific database errors
    if (error instanceof Error) {
      if (error.message.includes('Unique constraint')) {
        throw createError('Transaction ID already exists', 400);
      } else if (error.message.includes('Foreign key constraint')) {
        throw createError('Invalid center or user reference', 400);
      } else if (error.message.includes('Database operation failed')) {
        throw createError('Database operation failed. Please check your data.', 400);
      } else {
        throw createError(`Transaction creation failed: ${error.message}`, 500);
      }
    } else {
      throw createError('Transaction creation failed: Unknown error', 500);
    }
  }
};

export const getTransactions = async (req: Request, res: Response) => {
  try {
    const {
      page = 1,
      limit = 10,
      type,
      status,
      centerId,
      receiverClientId,
      senderClientId,
      dateFrom,
      dateTo,
      search,
    } = req.query;

    const userId = req.user?.id;
    const userRole = req.user?.role.name;
    const userBranchId = req.user?.branchId;

    // Build where clause
    const where: any = {
      isActive: true,
      isDeleted: false,
    };

    // Apply role-based filtering only if user is authenticated
    if (req.user && userRole !== 'Super Admin' && userRole !== 'Admin') {
      where.branchId = userBranchId;
    }

    if (type) where.type = type as TransactionType;
    if (status !== undefined) where.status = status === 'true';
    if (centerId) where.centerId = centerId as string;
    if (receiverClientId) where.receiverClientId = receiverClientId as string;
    if (senderClientId) where.senderClientId = senderClientId as string;

    if (dateFrom || dateTo) {
      where.date = {};
      if (dateFrom) where.date.gte = new Date(dateFrom as string);
      if (dateTo) where.date.lte = new Date(dateTo as string);
    }

    if (search) {
      where.OR = [
        { transactionId: { contains: search as string, mode: 'insensitive' } },
        { receiverName: { contains: search as string, mode: 'insensitive' } },
        { senderName: { contains: search as string, mode: 'insensitive' } },
        { remark: { contains: search as string, mode: 'insensitive' } },
        { center: { name: { contains: search as string, mode: 'insensitive' } } },
      ];
    }

    // Get total count for pagination
    const total = await prisma.transaction.count({ where });

    // Get transactions with pagination
    const transactions = await prisma.transaction.findMany({
      where,
      include: {
        center: {
          select: {
            id: true,
            name: true,
            code: true,
          },
        },
        receiverClient: {
          select: {
            id: true,
            name: true,
            phone: true,
            city: true,
          },
        },
        senderClient: {
          select: {
            id: true,
            name: true,
            phone: true,
            city: true,
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

    const transaction = await prisma.transaction.findFirst({
      where,
      include: {
        center: true,
        receiverClient: {
          select: {
            id: true,
            name: true,
            phone: true,
            city: true,
          },
        },
        senderClient: {
          select: {
            id: true,
            name: true,
            phone: true,
            city: true,
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
      time,
      centerId,
      amount,
      amountType,
      autoCommission,
      commission,
      bookingCommission,
      centerCommission,
      receiverName,
      receiverNumber,
      senderName,
      senderNumber,
      receiverClientId,
      senderClientId,
      remark,
      status,
      type,
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
      where: { id: id as string },
      data: {
        date: date ? new Date(date) : undefined,
        time: time ? new Date(time) : undefined,
        centerId,
        amount: amount ? Number(amount) : undefined,
        amountType: amountType as PaymentType,
        autoCommission: autoCommission !== undefined ? autoCommission : undefined,
        commission: commission !== undefined ? Number(commission) : undefined,
        bookingCommission: bookingCommission !== undefined ? Number(bookingCommission) : undefined,
        centerCommission: centerCommission !== undefined ? Number(centerCommission) : undefined,
        receiverName,
        receiverNumber: receiverNumber || null,
        senderName,
        senderNumber: senderNumber || null,
        receiverClientId: receiverClientId || null,
        senderClientId: senderClientId || null,
        remark: remark || null,
        status: status !== undefined ? status : undefined,
        type: type as TransactionType,
      },
      include: {
        center: true,
        receiverClient: {
          select: {
            id: true,
            name: true,
            phone: true,
            city: true,
          },
        },
        senderClient: {
          select: {
            id: true,
            name: true,
            phone: true,
            city: true,
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

    // Create audit log
    await prisma.auditLog.create({
      data: {
        entity: 'Transaction',
        entityId: id as string,
        action: 'UPDATE',
        oldValues: JSON.stringify(existingTransaction),
        newValues: JSON.stringify(transaction),
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
      where: { id: id as string },
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
        oldValues: JSON.stringify(existingTransaction),
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

export const getNextTransactionIds = async (req: Request, res: Response) => {
  try {
    const { date, type } = req.query;
    
    // Generate next transaction ID for the specific type (outward/inward)
    const nextTransactionId = await generateTransactionIdByType(type as string || 'OUTWARD');
    
    // Generate next token number for the given date and type
    const nextTokenNo = await generateTokenNumberByType(date as string || new Date().toISOString().split('T')[0], type as string || 'OUTWARD');

    res.json({
      nextTransactionId,
      nextTokenNo,
    });
  } catch (error) {
    throw error;
  }
};

export const getTransactionStats = async (req: Request, res: Response) => {
  try {
    const { dateFrom, dateTo } = req.query;
    const userBranchId = req.user?.branchId;
    const userRole = req.user?.role.name;

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
        where: { ...where, status: false },
      }),
      prisma.transaction.count({
        where: { ...where, status: true },
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

// Helper function to generate transaction ID (PM2_001, PM2_002...)
async function generateTransactionId(): Promise<string> {
  try {
    // Get the last transaction ID
    const lastTransaction = await prisma.transaction.findFirst({
      orderBy: { createdAt: 'desc' },
      select: { transactionId: true },
    });

    let nextNumber = 1;
    if (lastTransaction && lastTransaction.transactionId) {
      // Extract number from PM2_XXX format
      const match = lastTransaction.transactionId.match(/PM2_(\d+)/);
      if (match) {
        nextNumber = parseInt(match[1]) + 1;
      }
    }

    return `PM2_${nextNumber.toString().padStart(3, '0')}`;
  } catch (error) {
    // If there's an error, start from 1
    return 'PM2_001';
  }
}

// Helper function to generate transaction ID by type (separate for outward/inward)
async function generateTransactionIdByType(type: string): Promise<string> {
  try {
    // Get the last transaction ID for the specific type
    const lastTransaction = await prisma.transaction.findFirst({
      where: { type: type as TransactionType },
      orderBy: { createdAt: 'desc' },
      select: { transactionId: true },
    });

    let nextNumber = 1;
    if (lastTransaction && lastTransaction.transactionId) {
      // Extract number from PM2_XXX format
      const match = lastTransaction.transactionId.match(/PM2_(\d+)/);
      if (match) {
        nextNumber = parseInt(match[1]) + 1;
      }
    }

    return `PM2_${nextNumber.toString().padStart(3, '0')}`;
  } catch (error) {
    // If there's an error, start from 1
    return 'PM2_001';
  }
}

// Helper function to generate token number (daily reset at 12:00 AM IST)
async function generateTokenNumber(date: string): Promise<number> {
  try {
    const targetDate = new Date(date);
    // Set time to start of day in IST (UTC+5:30)
    targetDate.setHours(0, 0, 0, 0);
    const nextDay = new Date(targetDate);
    nextDay.setDate(nextDay.getDate() + 1);

    // Get the last token number for the given date
    const lastTransaction = await prisma.transaction.findFirst({
      where: {
        date: {
          gte: targetDate,
          lt: nextDay,
        },
      },
      orderBy: { tokenNo: 'desc' },
      select: { tokenNo: true },
    });

    return lastTransaction ? lastTransaction.tokenNo + 1 : 1;
  } catch (error) {
    // If there's an error, start from 1
    return 1;
  }
}

// Helper function to generate token number by type (separate for outward/inward, daily reset at 12:00 AM IST)
async function generateTokenNumberByType(date: string, type: string): Promise<number> {
  try {
    const targetDate = new Date(date);
    // Set time to start of day in IST (UTC+5:30)
    targetDate.setHours(0, 0, 0, 0);
    const nextDay = new Date(targetDate);
    nextDay.setDate(nextDay.getDate() + 1);

    // Get the last token number for the given date and type
    const lastTransaction = await prisma.transaction.findFirst({
      where: {
        type: type as TransactionType,
        date: {
          gte: targetDate,
          lt: nextDay,
        },
      },
      orderBy: { tokenNo: 'desc' },
      select: { tokenNo: true },
    });

    return lastTransaction ? lastTransaction.tokenNo + 1 : 1;
  } catch (error) {
    // If there's an error, start from 1
    return 1;
  }
}

// Helper function to create ledger entries for client accounts
async function createClientLedgerEntries(transaction: any) {
  try {
    // Only create ledger entries for credit transactions
    if (transaction.amountType !== 'CREDIT' || !transaction.senderClientId) {
      return;
    }

    // Debit entry for sender (money sent out)
    await prisma.ledgerEntry.create({
      data: {
        date: transaction.date,
        accountId: transaction.senderClientId,
        accountType: 'CLIENT',
        description: `Outward transaction ${transaction.transactionId} - ${transaction.receiverName}`,
        debitAmount: transaction.amount,
        creditAmount: 0,
        balance: 0, // Would be calculated based on previous entries
        transactionId: transaction.id,
        branchId: transaction.branchId,
        createdBy: transaction.createdBy,
      },
    });

    // If receiver is also a client, create credit entry
    if (transaction.receiverClientId) {
      await prisma.ledgerEntry.create({
        data: {
          date: transaction.date,
          accountId: transaction.receiverClientId,
          accountType: 'CLIENT',
          description: `Inward transaction ${transaction.transactionId} - ${transaction.senderName}`,
          debitAmount: 0,
          creditAmount: transaction.amount,
          balance: 0, // Would be calculated based on previous entries
          transactionId: transaction.id,
          branchId: transaction.branchId,
          createdBy: transaction.createdBy,
        },
      });
    }
  } catch (error) {
    console.error('Error creating ledger entries:', error);
    // Don't throw error to avoid failing the transaction
  }
}

// Helper function to create ledger entries for double entry accounting (legacy)
async function createLedgerEntries(transaction: any) {
  // This function is kept for backward compatibility
  // New transactions use createClientLedgerEntries
  await createClientLedgerEntries(transaction);
}
