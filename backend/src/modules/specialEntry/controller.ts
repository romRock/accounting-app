import { Request, Response } from 'express';
import { PrismaClient } from '@prisma/client';
import { generateAuditLog } from '../audit/auditService';
import { token } from 'morgan';

const prisma = new PrismaClient();

// Generate unique special entry ID (SPL001, SPL002...)
async function generateSpecialEntryId(): Promise<string> {
  try {
    const lastEntry = await prisma.specialEntry.findFirst({
      orderBy: { createdAt: 'desc' }
    });

    if (lastEntry) {
      const lastNumber = parseInt(lastEntry.transactionId.replace('SPL', ''));
      const nextNumber = lastNumber + 1;
      return `SPL${String(nextNumber).padStart(3, '0')}`;
    }

    return 'SPL001';
  } catch (error) {
    return 'SPL001';
  }
}

// Generate token number for special entry (branch-specific, per selected date)
async function generateSpecialEntryTokenNo(date?: string, branchId?: string): Promise<number> {
  try {
    const targetDate = date ? new Date(date) : new Date();
    const istDate = new Date(targetDate.toLocaleString("en-US", { timeZone: "Asia/Kolkata" }));
    const dayStart = new Date(istDate.getFullYear(), istDate.getMonth(), istDate.getDate());
    const nextDay = new Date(dayStart);
    nextDay.setDate(nextDay.getDate() + 1);

    const where: any = {
      date: {
        gte: dayStart,
        lt: nextDay,
      },
    };

    // Filter by branch if branchId is provided
    if (branchId) {
      where.branchId = branchId;
    }

    // Get last special entry for this branch today
    const lastSpecialEntry = await prisma.specialEntry.findFirst({
      where: where,
      orderBy: { tokenNo: 'desc' },
      select: { tokenNo: true },
    });

    return lastSpecialEntry?.tokenNo ? lastSpecialEntry.tokenNo + 1 : 1;
  } catch (error) {
    return 1;
  }
}

// Get next special entry IDs
export const getSpecialEntryNextIds = async (req: Request, res: Response) => {
  try {
    const { date } = req.query;
    const branchId = req.user?.branchId;

    const dateStr = (date as string) || new Date().toISOString().split('T')[0];
    const nextTokenNo = await generateSpecialEntryTokenNo(dateStr, branchId);

    // Get last special entry globally for transaction ID
    const lastGlobalSpecialEntry = await prisma.specialEntry.findFirst({
      orderBy: { createdAt: 'desc' },
      select: { transactionId: true },
    });

    let nextTransactionId = 'SPL001';
    if (lastGlobalSpecialEntry) {
      const lastNumber = parseInt(lastGlobalSpecialEntry.transactionId.replace('SPL', ''));
      const nextNumber = lastNumber + 1;
      nextTransactionId = `SPL${String(nextNumber).padStart(3, '0')}`;
    }

    res.status(200).json({
      success: true,
      nextTransactionId,
      nextTokenNo
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Failed to get next special entry IDs',
      error: error instanceof Error ? error.message : 'Unknown error'
    });
  }
};

// Get all special entries
export const getSpecialEntries = async (req: Request, res: Response) => {
  try {

    const { page = 1, limit = 100, search, dateFrom, dateTo, partyA, partyB, status } = req.query;

    const skip = (Number(page) - 1) * Number(limit);

    const userBranchId = req.user?.branchId;
    const userPermissions = req.user?.role?.permissions as any;
    const isSuperAdmin = userPermissions?.masterData === 'full_access';

    // Get current date in Indian timezone for default filtering
    const now = new Date();
    const istDate = new Date(now.toLocaleString('en-US', { timeZone: 'Asia/Kolkata' }));
    const today = new Date(istDate.getFullYear(), istDate.getMonth(), istDate.getDate());
    const tomorrow = new Date(today);
    tomorrow.setDate(tomorrow.getDate() + 1);

    // Build where clause
    const where: any = {
      isActive: true,
      isDeleted: false
    };

    // Filter by branch if user is not Super Admin
    if (!isSuperAdmin) {
      if (userBranchId) {
        where.branchId = userBranchId;
      } else {
        // User has no branch assigned - return empty results
        where.branchId = 'non-existent-branch-id-to-return-empty';
      }
    }

    // Add search filter
    if (search) {
      where.OR = [
        { transactionId: { contains: search as string, mode: 'insensitive' } },
        { partyA: { contains: search as string, mode: 'insensitive' } },
        { partyB: { contains: search as string, mode: 'insensitive' } },
        { remark: { contains: search as string, mode: 'insensitive' } }
      ];
    }

    // If date range is specified, use it; otherwise filter to current day (Indian timezone)
    if (dateFrom || dateTo) {
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

    // Add party filters
    if (partyA) where.partyA = { contains: partyA as string, mode: 'insensitive' };
    if (partyB) where.partyB = { contains: partyB as string, mode: 'insensitive' };
    if (status) where.status = status as string;


    const [specialEntries, total] = await Promise.all([
      prisma.specialEntry.findMany({
        where,
        skip,
        take: Number(limit),
        orderBy: [
          { date: 'desc' },
          { time: 'desc' }
        ]
      }),
      prisma.specialEntry.count({ where })
    ]);

    res.setHeader('Cache-Control', 'no-store, no-cache, must-revalidate, private');
    res.setHeader('Pragma', 'no-cache');
    res.setHeader('Expires', '0');
    res.status(200).json({
      success: true,
      message: 'Special entries retrieved successfully',
      data: specialEntries,
      pagination: {
        page: Number(page),
        limit: Number(limit),
        total,
        pages: Math.ceil(total / Number(limit))
      }
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Failed to retrieve special entries',
      error: error instanceof Error ? error.message : 'Unknown error'
    });
  }
};

// Get single special entry
export const getSpecialEntryById = async (req: Request, res: Response) => {
  try {
    const { id } = req.params;

    const specialEntry = await prisma.specialEntry.findFirst({
      where: {
        id: id as string,
        isActive: true,
        isDeleted: false
      }
    });

    if (!specialEntry) {
      return res.status(404).json({
        success: false,
        message: 'Special entry not found'
      });
    }

    res.status(200).json({
      success: true,
      message: 'Special entry retrieved successfully',
      data: specialEntry
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Failed to retrieve special entry',
      error: error instanceof Error ? error.message : 'Unknown error'
    });
  }
};

// Create new special entry
export const createSpecialEntry = async (req: Request, res: Response) => {
  try {
    const {
      tokenNo,
      date,
      time,
      partyA,
      amountA,
      partyB,
      amountB,
      partyC,
      amountC,
      remark,
      status,
      createdBy
    } = req.body;

    const userBranchId = req.user?.branchId;

    // Validation
    if (!date || !time || !partyA || !partyB || !partyC || !amountA || !amountB || !amountC) {
      return res.status(400).json({
        success: false,
        message: 'Required fields are missing'
      });
    }

    if (partyA === partyB) {
      return res.status(400).json({
        success: false,
        message: 'Party A and Party B cannot be the same'
      });
    }

    const transactionId = await generateSpecialEntryId();

    const specialEntry = await prisma.specialEntry.create({
      data: {
        transactionId,
        tokenNo: tokenNo ? parseInt(tokenNo.toString()) : await generateSpecialEntryTokenNo(date, userBranchId),
        date: new Date(date),
        time: new Date(`${date}T${time}`),
        partyA,
        amountA: parseFloat(amountA),
        partyB,
        amountB: parseFloat(amountB),
        partyC: partyC || null,
        amountC: amountC ? parseFloat(amountC) : null,
        remark: remark || '',
        status: status || 'pending',
        statusTime: new Date(),
        createdBy: createdBy || req.user?.id || 'system',
        branchId: userBranchId
      }
    });

    // Create client ledger entries for Special Entry - BATCHED for performance
    try {
      const [partyAEntity, partyBEntity, partyCEntity] = await Promise.all([
        prisma.party.findFirst({ where: { name: partyA } }),
        prisma.party.findFirst({ where: { name: partyB } }),
        partyC ? prisma.party.findFirst({ where: { name: partyC } }) : Promise.resolve(null)
      ]);

      const ledgerPromises = [];

      // Create ledger entry for partyA - DEBIT (EXPENSE)
      if (partyAEntity) {
        ledgerPromises.push(
          prisma.clientLedger.findUnique({ where: { clientId: partyAEntity.id } })
            .then(partyAClientLedger => {
              if (partyAClientLedger) {
                return prisma.ledgerEntry.create({
                  data: {
                    date: new Date(date),
                    accountId: partyAEntity.id,
                    accountType: 'CLIENT',
                    description: `Special Entry ${specialEntry.transactionId} - Expense to ${partyB} - Amount A: ${amountA}`,
                    debitAmount: parseFloat(amountA),
                    creditAmount: 0,
                    balance: 0,
                    transactionId: specialEntry.id,
                    createdBy: createdBy || req.user?.id || 'system',
                  },
                });
              }
            })
        );
      }

      // Create ledger entry for partyB - CREDIT (INCOME)
      if (partyBEntity) {
        ledgerPromises.push(
          prisma.clientLedger.findUnique({ where: { clientId: partyBEntity.id } })
            .then(partyBClientLedger => {
              if (partyBClientLedger) {
                return prisma.ledgerEntry.create({
                  data: {
                    date: new Date(date),
                    accountId: partyBEntity.id,
                    accountType: 'CLIENT',
                    description: `Special Entry ${specialEntry.transactionId} - Income from ${partyA} - Amount B: ${amountB}`,
                    debitAmount: 0,
                    creditAmount: parseFloat(amountB),
                    balance: 0,
                    transactionId: specialEntry.id,
                    createdBy: createdBy || req.user?.id || 'system',
                  },
                });
              }
            })
        );
      }

      // Create ledger entry for partyC - DYNAMIC based on amountC sign
      if (partyCEntity && amountC) {
        ledgerPromises.push(
          prisma.clientLedger.findUnique({ where: { clientId: partyCEntity.id } })
            .then(partyCClientLedger => {
              if (partyCClientLedger) {
                const amountCValue = parseFloat(amountC);
                const isCredit = amountCValue > 0;

                return prisma.ledgerEntry.create({
                  data: {
                    date: new Date(date),
                    accountId: partyCEntity.id,
                    accountType: 'CLIENT',
                    description: `Special Entry ${specialEntry.transactionId} - ${isCredit ? 'Income' : 'Expense'} (Remaining A-B) - Amount C: ${amountC}`,
                    debitAmount: isCredit ? 0 : Math.abs(amountCValue),
                    creditAmount: isCredit ? amountCValue : 0,
                    balance: 0,
                    transactionId: specialEntry.id,
                    createdBy: createdBy || req.user?.id || 'system',
                  },
                });
              }
            })
        );
      }

      await Promise.all(ledgerPromises);
    } catch (ledgerError) {
      // Don't fail the special entry creation if ledger fails
    }

    // Generate audit log - fire and forget (non-blocking)
    generateAuditLog({
      entity: 'SpecialEntry',
      entityId: specialEntry.id,
      action: 'CREATE',
      newValues: JSON.stringify(specialEntry),
      ipAddress: req.ip,
      userAgent: req.get('User-Agent'),
      createdBy: createdBy || req.user?.id || 'system'
    }).catch(() => {
      // Ignore audit log errors
    });

    res.status(201).json({
      success: true,
      message: 'Special entry created successfully',
      data: specialEntry
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Failed to create special entry',
      error: error instanceof Error ? error.message : 'Unknown error'
    });
  }
};

// Update special entry
export const updateSpecialEntry = async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    const {
      date,
      time,
      partyA,
      amountA,
      partyB,
      amountB,
      partyC,
      amountC,
      remark,
      status,
      createdBy
    } = req.body;

    // Check if special entry exists
    const existingEntry = await prisma.specialEntry.findFirst({
      where: {
        id: id as string,
        isActive: true,
        isDeleted: false
      }
    });

    if (!existingEntry) {
      return res.status(404).json({
        success: false,
        message: 'Special entry not found'
      });
    }

    // Validation
    if (partyA === partyB) {
      return res.status(400).json({
        success: false,
        message: 'Party A and Party B cannot be the same'
      });
    }

    // Get old values for audit log
    const oldValues = JSON.stringify(existingEntry);

    // Update special entry
    const updatedEntry = await prisma.specialEntry.update({
      where: { id: id as string },
      data: {
        date: date ? new Date(date) : existingEntry.date,
        time: time ? new Date(`${date || existingEntry.date.toISOString().split('T')[0]}T${time}`) : existingEntry.time,
        partyA: partyA || existingEntry.partyA,
        amountA: amountA ? parseFloat(amountA) : existingEntry.amountA,
        partyB: partyB || existingEntry.partyB,
        amountB: amountB ? parseFloat(amountB) : existingEntry.amountB,
        partyC: partyC !== undefined ? partyC : existingEntry.partyC,
        amountC: amountC !== undefined ? parseFloat(amountC) : existingEntry.amountC,
        remark: remark !== undefined ? remark : existingEntry.remark,
        status: status || existingEntry.status,
        updatedAt: new Date()
      }
    });

    // Generate audit log
    await generateAuditLog({
      entity: 'SpecialEntry',
      entityId: updatedEntry.id,
      action: 'UPDATE',
      oldValues,
      newValues: JSON.stringify(updatedEntry),
      ipAddress: req.ip,
      userAgent: req.get('User-Agent'),
      createdBy: createdBy || req.user?.id || 'system'
    });

    res.status(200).json({
      success: true,
      message: 'Special entry updated successfully',
      data: updatedEntry
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Failed to update special entry',
      error: error instanceof Error ? error.message : 'Unknown error'
    });
  }
};

// Delete special entry
export const deleteSpecialEntry = async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    const userId = req.user?.id;

    // Check if special entry exists
    const existingEntry = await prisma.specialEntry.findFirst({
      where: {
        id: id as string,
        isActive: true,
        isDeleted: false
      }
    });

    if (!existingEntry) {
      return res.status(404).json({
        success: false,
        message: 'Special entry not found'
      });
    }

    // Soft delete the special entry
    await prisma.specialEntry.update({
      where: { id: id as string },
      data: {
        isActive: false,
        isDeleted: true,
        deletedAt: new Date(),
        deletedBy: userId!,
      }
    });

    // Generate audit log
    // Generate audit log - fire and forget (non-blocking)
    generateAuditLog({
      entity: 'SpecialEntry',
      entityId: existingEntry.id,
      action: 'DELETE',
      oldValues: JSON.stringify(existingEntry),
      ipAddress: req.ip,
      userAgent: req.get('User-Agent'),
      createdBy: userId || 'system'
    }).catch(() => {
      // Ignore audit log errors
    });

    res.status(200).json({
      success: true,
      message: 'Special entry deleted successfully'
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Failed to delete special entry',
      error: error instanceof Error ? error.message : 'Unknown error'
    });
  }
};
