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
    }

    // Generate unique transaction ID based on type (book_001 for outward, cut_001 for inward)
    const transactionId = await generateTransactionIdByType(type);
    
    // Generate token number (daily reset, separate for outward/inward)
    const tokenNo = await generateTokenNumberByType(date, type);

    // Calculate commission if auto is enabled
    let calculatedCommission = commission || 0;
    let calculatedBookingCommission = bookingCommission || 0;
    let calculatedCenterCommission = centerCommission || 0;

    if (autoCommission) {
      const amountNum = Number(amount);
      
      if (type === 'INWARD') {
        // INWARD commission calculation (cutting)
        const minCharge = 50;
        
        if (amountNum <= 50000) {
          // 0 to 50,000: Fixed minimum charge of 50
          calculatedCommission = minCharge;
        } else if (amountNum > 50000 && amountNum <= 60000) {
          // 50,001 to 60,000: Calculate on 60,000 base (next 10,000 round figure)
          calculatedCommission = 60;
        } else if (amountNum > 60000 && amountNum <= 70000) {
          // 60,001 to 70,000: Calculate on 70,000 base
          calculatedCommission = 70;
        } else if (amountNum > 70000 && amountNum <= 80000) {
          // 70,001 to 80,000: Calculate on 80,000 base
          calculatedCommission = 80;
        } else if (amountNum > 80000 && amountNum <= 90000) {
          // 80,001 to 90,000: Calculate on 90,000 base
          calculatedCommission = 90;
        } else if (amountNum > 90000 && amountNum <= 100000) {
          // 90,001 to 100,000: Calculate on 100,000 base
          calculatedCommission = 100;
        } else {
          // For any amount above 100,000, round up to next 10,000 and use as commission base
          // Example: 110,000 → 110, 115,000 → 120, 1,510,000 → 1,510
          calculatedCommission = Math.ceil(amountNum / 10000) * 10;
        }
        
        // Our commission (booking commission) is 35% of total commission for inward
        calculatedBookingCommission = Math.floor(calculatedCommission * 0.35);
        calculatedCenterCommission = 0; // No center commission for inward transactions
        
        // Ensure minimum charge
        if (calculatedCommission < minCharge) {
          calculatedCommission = minCharge;
          calculatedBookingCommission = Math.floor(minCharge * 0.35);
        }
      } else {
        // OUTWARD commission calculation (booking) - same logic as inward but with 33%/67% split
        const minCharge = 50;
        
        if (amountNum <= 50000) {
          // 0 to 50,000: Fixed minimum charge of 50
          calculatedCommission = minCharge;
        } else if (amountNum > 50000 && amountNum <= 60000) {
          // 50,001 to 60,000: Calculate on 60,000 base
          calculatedCommission = 60;
        } else if (amountNum > 60000 && amountNum <= 70000) {
          // 60,001 to 70,000: Calculate on 70,000 base
          calculatedCommission = 70;
        } else if (amountNum > 70000 && amountNum <= 80000) {
          // 70,001 to 80,000: Calculate on 80,000 base
          calculatedCommission = 80;
        } else if (amountNum > 80000 && amountNum <= 90000) {
          // 80,001 to 90,000: Calculate on 90,000 base
          calculatedCommission = 90;
        } else if (amountNum > 90000 && amountNum <= 100000) {
          // 90,001 to 100,000: Calculate on 100,000 base
          calculatedCommission = 100;
        } else {
          // For any amount above 100,000, round up to next 10,000 and use as commission base
          // Example: 110,000 → 110, 115,000 → 120, 1,510,000 → 1,510
          calculatedCommission = Math.ceil(amountNum / 10000) * 10;
        }
        
        // 35% our commission, 65% center commission for outward
        calculatedBookingCommission = Math.floor(calculatedCommission * 0.35);
        calculatedCenterCommission = calculatedCommission - calculatedBookingCommission;
        
        // Ensure minimum charge
        if (calculatedCommission < minCharge) {
          calculatedCommission = minCharge;
          calculatedBookingCommission = Math.floor(minCharge * 0.35);
          calculatedCenterCommission = minCharge - calculatedBookingCommission;
        }
      }
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
        branchId: null, // Provide null value for optional branchId
        createdBy: userId!,
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
      limit,
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

    // No branch-based filtering needed - using centers only

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

    // Get transactions with pagination (only if limit is provided)
    const limitNum = limit ? Number(limit) : undefined;
    const transactions = await prisma.transaction.findMany({
      where,
      orderBy: { date: 'asc' },
      ...(limitNum && {
        skip: (Number(page) - 1) * limitNum,
        take: limitNum,
      }),
    });

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

    res.json({
      transactions: transactionsWithCenters,
      pagination: limitNum ? {
        page: Number(page),
        limit: limitNum,
        total,
        pages: Math.ceil(total / limitNum),
      } : {
        page: 1,
        limit: total,
        total,
        pages: 1,
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

    // No branch-based filtering needed - using centers only

    const transaction = await prisma.transaction.findFirst({
      where,
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

    // Calculate commission if auto is enabled
    let calculatedCommission = commission;
    let calculatedBookingCommission = bookingCommission;
    let calculatedCenterCommission = centerCommission;

    if (autoCommission && amount) {
      const amountNum = Number(amount);
      
      if (type === 'INWARD') {
        // INWARD commission calculation (cutting)
        const minCharge = 50;
        
        if (amountNum <= 50000) {
          // 0 to 50,000: Fixed minimum charge of 50
          calculatedCommission = minCharge;
        } else if (amountNum > 50000 && amountNum <= 60000) {
          // 50,001 to 60,000: Calculate on 60,000 base (next 10,000 round figure)
          calculatedCommission = 60;
        } else if (amountNum > 60000 && amountNum <= 70000) {
          // 60,001 to 70,000: Calculate on 70,000 base
          calculatedCommission = 70;
        } else if (amountNum > 70000 && amountNum <= 80000) {
          // 70,001 to 80,000: Calculate on 80,000 base
          calculatedCommission = 80;
        } else if (amountNum > 80000 && amountNum <= 90000) {
          // 80,001 to 90,000: Calculate on 90,000 base
          calculatedCommission = 90;
        } else if (amountNum > 90000 && amountNum <= 100000) {
          // 90,001 to 100,000: Calculate on 100,000 base
          calculatedCommission = 100;
        } else {
          // For any amount above 100,000, round up to next 10,000 and use as commission base
          // Example: 110,000 → 110, 115,000 → 120, 1,510,000 → 1,510
          calculatedCommission = Math.ceil(amountNum / 10000) * 10;
        }
        
        // Our commission (booking commission) is 35% of total commission for inward
        calculatedBookingCommission = Math.floor(calculatedCommission * 0.35);
        calculatedCenterCommission = 0; // No center commission for inward transactions
        
        // Ensure minimum charge
        if (calculatedCommission < minCharge) {
          calculatedCommission = minCharge;
          calculatedBookingCommission = Math.floor(minCharge * 0.35);
        }
      } else {
        // OUTWARD commission calculation (booking) - same logic as inward but with 33%/67% split
        const minCharge = 50;
        
        if (amountNum <= 50000) {
          // 0 to 50,000: Fixed minimum charge of 50
          calculatedCommission = minCharge;
        } else if (amountNum > 50000 && amountNum <= 60000) {
          // 50,001 to 60,000: Calculate on 60,000 base
          calculatedCommission = 60;
        } else if (amountNum > 60000 && amountNum <= 70000) {
          // 60,001 to 70,000: Calculate on 70,000 base
          calculatedCommission = 70;
        } else if (amountNum > 70000 && amountNum <= 80000) {
          // 70,001 to 80,000: Calculate on 80,000 base
          calculatedCommission = 80;
        } else if (amountNum > 80000 && amountNum <= 90000) {
          // 80,001 to 90,000: Calculate on 90,000 base
          calculatedCommission = 90;
        } else if (amountNum > 90000 && amountNum <= 100000) {
          // 90,001 to 100,000: Calculate on 100,000 base
          calculatedCommission = 100;
        } else {
          // For any amount above 100,000, round up to next 10,000 and use as commission base
          // Example: 110,000 → 110, 115,000 → 120, 1,510,000 → 1,510
          calculatedCommission = Math.ceil(amountNum / 10000) * 10;
        }
        
        // 35% our commission, 65% center commission for outward
        calculatedBookingCommission = Math.floor(calculatedCommission * 0.35);
        calculatedCenterCommission = calculatedCommission - calculatedBookingCommission;
        
        // Ensure minimum charge
        if (calculatedCommission < minCharge) {
          calculatedCommission = minCharge;
          calculatedBookingCommission = Math.floor(minCharge * 0.35);
          calculatedCenterCommission = minCharge - calculatedBookingCommission;
        }
      }
    }

    // Update transaction
    const transaction = await prisma.transaction.update({
      where: { id: id as string },
      data: {
        date: date ? new Date(date) : undefined,
        time: time && date ? new Date(`${date}T${time}:00`) : undefined,
        centerId,
        amount: amount ? Number(amount) : undefined,
        amountType: amountType as PaymentType,
        autoCommission: autoCommission !== undefined ? autoCommission : undefined,
        commission: calculatedCommission !== undefined ? Number(calculatedCommission) : undefined,
        bookingCommission: calculatedBookingCommission !== undefined ? Number(calculatedBookingCommission) : undefined,
        centerCommission: calculatedCenterCommission !== undefined ? Number(calculatedCenterCommission) : undefined,
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

    // Soft delete transaction - mark as deleted but keep in database
    await prisma.transaction.update({
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
    console.log('=== GET NEXT TRANSACTION IDS DEBUG ===');
    console.log('Query params:', { date, type });
    
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

// Helper function to generate transaction ID by type (separate for outward/inward)
async function generateTransactionIdByType(type: string): Promise<string> {
  try {
    const lastTransaction = await prisma.transaction.findFirst({
      where: { type: type as TransactionType },
      orderBy: { createdAt: 'desc' },
      select: { transactionId: true },
    });

    let nextNumber = 1;
    if (lastTransaction && lastTransaction.transactionId) {
      const match = lastTransaction.transactionId.match(/(book|cut)_(\d+)/);
      if (match) {
        nextNumber = parseInt(match[2]) + 1;
      }
    }

    if (type === 'OUTWARD') {
      return `book_${nextNumber.toString().padStart(3, '0')}`;
    } else if (type === 'INWARD') {
      return `cut_${nextNumber.toString().padStart(3, '0')}`;
    } else {
      return `PM2_${nextNumber.toString().padStart(3, '0')}`;
    }
  } catch (error) {
    if (type === 'OUTWARD') {
      return 'book_001';
    } else if (type === 'INWARD') {
      return 'cut_001';
    } else {
      return 'PM2_001';
    }
  }
}

// Helper function to generate token number by type (separate for outward/inward, daily reset at 12:00 AM IST)
export const generateTokenNumberByType = async (date: string, type: string) => {
  try {
    
    const targetDate = new Date(date);
    // Set time to start of day in IST (UTC+5:30)
    targetDate.setHours(0, 0, 0, 0);
    const nextDay = new Date(targetDate);
    nextDay.setDate(nextDay.getDate() + 1);

    const lastTransaction = await prisma.transaction.findFirst({
      where: {
        type: type, // Direct string comparison
        date: {
          gte: targetDate,
          lt: nextDay,
        },
      },
      orderBy: { tokenNo: 'desc' },
      select: { tokenNo: true },
    });


    const nextTokenNo = lastTransaction?.tokenNo ? lastTransaction.tokenNo + 1 : 1;

    return nextTokenNo;
  } catch (error) {
    // If there's an error, start from 1
    return 1;
  }
}

// Helper function to create ledger entries for client accounts
async function createClientLedgerEntries(transaction: any) {
  try {
    // Only create ledger entries for credit transactions
    if (transaction.amountType !== 'CREDIT') {
      return;
    }

    // Case 1: OUTWARD credit booking - Sender is client
    // Client owes us amount + commission (DEBIT)
    if (transaction.type === 'OUTWARD' && transaction.senderClientId) {
      const totalDebit = transaction.amount + transaction.commission;
      await prisma.ledgerEntry.create({
        data: {
          date: transaction.date,
          accountId: transaction.senderClientId,
          accountType: 'CLIENT',
          description: `Outward transaction ${transaction.transactionId} - ${transaction.receiverName} - Amount: ${transaction.amount}, Commission: ${transaction.commission}`,
          debitAmount: totalDebit,
          creditAmount: 0,
          balance: 0,
          transactionId: transaction.id,
          branchId: transaction.branchId,
          createdBy: transaction.createdBy,
        },
      });
    }

    // Case 2: INWARD credit booking - Receiver is client
    // We receive money for client (CREDIT only amount, commission is our profit)
    if (transaction.type === 'INWARD' && transaction.receiverClientId) {
      await prisma.ledgerEntry.create({
        data: {
          date: transaction.date,
          accountId: transaction.receiverClientId,
          accountType: 'CLIENT',
          description: `Inward transaction ${transaction.transactionId} - ${transaction.senderName} - Amount: ${transaction.amount}`,
          debitAmount: 0,
          creditAmount: transaction.amount,
          balance: 0,
          transactionId: transaction.id,
          branchId: transaction.branchId,
          createdBy: transaction.createdBy,
        },
      });
    }
  } catch (error) {
    // Don't throw error to avoid failing the transaction
  }
}

// Helper function to create ledger entries for double entry accounting (legacy)
async function createLedgerEntries(transaction: any) {
  // This function is kept for backward compatibility
  // New transactions use createClientLedgerEntries
  await createClientLedgerEntries(transaction);
}
