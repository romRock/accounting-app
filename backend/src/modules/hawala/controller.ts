import { Request, Response } from 'express';
import { PrismaClient } from '@prisma/client';
import { generateAuditLog } from '../audit/auditService';
import {
  applyEntryBranchScope,
  getActiveBranchHeaderFromRequest,
  isSuperAdminUser,
  resolveActiveTransactionBranchId,
} from '../../utils/branchScope';

const prisma = new PrismaClient();

// Helper functions moved from transactions/utils to avoid circular dependencies
// Generate unique transaction ID for hawala (HWL001, HWL002...)
async function generateHawalaTransactionId(): Promise<string> {
  try {
    const lastHawala = await prisma.hawala.findFirst({
      orderBy: { createdAt: 'desc' }
    });

    if (lastHawala) {
      const lastNumber = parseInt(lastHawala.transactionId.replace('HWL', ''));
      const nextNumber = lastNumber + 1;
      return `HWL${String(nextNumber).padStart(3, '0')}`;
    }

    return 'HWL001';
  } catch (error) {
    return 'HWL001';
  }
}

// Generate token number (daily reset at 12:00 AM IST, branch-specific, per selected date)
async function generateHawalaTokenNo(date?: string, branchId?: string): Promise<number> {
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

    // Get last hawala entry for this branch today
    const lastHawala = await prisma.hawala.findFirst({
      where: where,
      orderBy: { tokenNo: 'desc' },
      select: { tokenNo: true },
    });

    return lastHawala?.tokenNo ? lastHawala.tokenNo + 1 : 1;
  } catch (error) {
    return 1;
  }
}

// Create hawala entry
export const createHawala = async (req: Request, res: Response) => {
  try {
    const {
      transactionId,
      tokenNo,
      date,
      time,
      partyA,
      partyB,
      amount,
      remark
    } = req.body;

    // Get authenticated user from JWT token
    const authenticatedUser = (req as any).user;
    const createdBy = authenticatedUser?.id || 'system';
    const userBranchId = await resolveActiveTransactionBranchId(req, prisma);

    // Validate required fields (transactionId is optional - backend will generate it)
    if (!date || !time || !partyA || !partyB || !amount) {
      return res.status(400).json({
        success: false,
        message: 'Missing required fields',
        error: 'date, time, partyA, partyB, and amount are required'
      });
    }

    // Generate transaction ID if not provided, or handle duplicates
    let finalTransactionId = transactionId;
    if (!finalTransactionId) {
      finalTransactionId = await generateHawalaTransactionId();
    }

    // Handle duplicate transaction ID - generate a new one if it already exists
    let attempts = 0;
    const maxAttempts = 10;
    while (attempts < maxAttempts) {
      const existingHawala = await prisma.hawala.findFirst({
        where: { transactionId: finalTransactionId }
      });

      if (!existingHawala) {
        break; // transactionId is unique, proceed
      }

      // Generate a new transactionId
      const match = finalTransactionId.match(/HWL(\d+)/);
      if (match) {
        const currentNumber = parseInt(match[1], 10);
        finalTransactionId = `HWL${(currentNumber + 1).toString().padStart(3, '0')}`;
      } else {
        // If format doesn't match, append timestamp
        finalTransactionId = `HWL${Date.now()}`;
      }

      attempts++;
    }

    // Create hawala entry
    const hawala = await prisma.hawala.create({
      data: {
        transactionId: finalTransactionId,
        tokenNo: tokenNo ? parseInt(tokenNo) : await generateHawalaTokenNo(date, userBranchId || undefined),
        date: new Date(date),
        time: new Date(`${date}T${time}`),
        partyA,
        partyB,
        amount: parseInt(amount),
        remark: remark || null,
        statusTime: new Date(),
        createdBy,
        branchId: userBranchId
      }
    });

    // Create client ledger entries for Hawala - BATCHED for performance
    try {
      const [partyAEntity, partyBEntity] = await Promise.all([
        prisma.party.findFirst({
          where: {
            name: partyA,
            isActive: true,
            isDeleted: false,
            ...(userBranchId ? { branchId: userBranchId } : {}),
          },
        }),
        prisma.party.findFirst({
          where: {
            name: partyB,
            isActive: true,
            isDeleted: false,
            ...(userBranchId ? { branchId: userBranchId } : {}),
          },
        }),
      ]);

      const ledgerPromises = [];

      if (partyAEntity) {
        ledgerPromises.push(
          prisma.clientLedger.findUnique({ where: { clientId: partyAEntity.id } })
            .then(receiverClientLedger => {
              if (receiverClientLedger) {
                return prisma.ledgerEntry.create({
                  data: {
                    date: new Date(date),
                    accountId: partyAEntity.id,
                    accountType: 'CLIENT',
                    description: `Hawala ${hawala.transactionId} - Income from ${partyB} - Amount: ${amount}`,
                    debitAmount: 0,
                    creditAmount: parseInt(amount),
                    balance: 0,
                    transactionId: hawala.id,
                    createdBy,
                  },
                });
              }
            })
        );
      }

      if (partyBEntity) {
        ledgerPromises.push(
          prisma.clientLedger.findUnique({ where: { clientId: partyBEntity.id } })
            .then(senderClientLedger => {
              if (senderClientLedger) {
                return prisma.ledgerEntry.create({
                  data: {
                    date: new Date(date),
                    accountId: partyBEntity.id,
                    accountType: 'CLIENT',
                    description: `Hawala ${hawala.transactionId} - Expense to ${partyA} - Amount: ${amount}`,
                    debitAmount: parseInt(amount),
                    creditAmount: 0,
                    balance: 0,
                    transactionId: hawala.id,
                    createdBy,
                  },
                });
              }
            })
        );
      }

      await Promise.all(ledgerPromises);
    } catch (ledgerError) {
      // Don't fail the hawala entry creation if ledger fails
    }

    // Generate audit log - fire and forget (non-blocking)
    generateAuditLog({
      entity: 'Hawala',
      entityId: hawala.id,
      action: 'CREATE',
      newValues: JSON.stringify(hawala),
      ipAddress: req.ip,
      userAgent: req.get('User-Agent'),
      createdBy
    }).catch(() => {
      // Ignore audit log errors
    });

    res.status(201).json({
      success: true,
      message: 'Hawala entry created successfully',
      data: hawala
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Failed to create hawala entry',
      error: error instanceof Error ? error.message : 'Unknown error'
    });
  }
};

// Get all hawala entries
export const getHawalaEntries = async (req: Request, res: Response) => {
  try {

    const { page = 1, limit = 100, search, dateFrom, dateTo, partyA, partyB, allDates } = req.query;

    const skip = (Number(page) - 1) * Number(limit);

    const userBranchId = req.user?.branchId;
    const userPermissions = req.user?.role?.permissions as any;
    const isSuperAdmin = isSuperAdminUser(userPermissions);

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

    const useActiveBranchOnly =
      !isSuperAdmin &&
      (getActiveBranchHeaderFromRequest(req) != null || allDates !== 'true');
    const activeBranchId = useActiveBranchOnly
      ? await resolveActiveTransactionBranchId(req, prisma)
      : null;

    // Filter by branch if user is not Super Admin
    await applyEntryBranchScope(
      where,
      prisma,
      userBranchId,
      isSuperAdmin,
      req.user?.assignedBranchIds,
      activeBranchId
    );

    // Add search filter
    if (search) {
      where.OR = [
        { transactionId: { contains: search as string, mode: 'insensitive' } },
        { partyA: { contains: search as string, mode: 'insensitive' } },
        { partyB: { contains: search as string, mode: 'insensitive' } },
        { remark: { contains: search as string, mode: 'insensitive' } }
      ];
    }

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

    // Add party filters
    if (partyA) where.partyA = { contains: partyA as string, mode: 'insensitive' };
    if (partyB) where.partyB = { contains: partyB as string, mode: 'insensitive' };

    // Get hawala entries
    const [hawalaEntries, total] = await Promise.all([
      prisma.hawala.findMany({
        where,
        skip,
        take: Number(limit),
        orderBy: [
          { date: 'desc' },
          { time: 'desc' }
        ]
      }),
      prisma.hawala.count({ where })
    ]);

    res.setHeader('Cache-Control', 'no-store, no-cache, must-revalidate, private');
    res.setHeader('Pragma', 'no-cache');
    res.setHeader('Expires', '0');
    res.status(200).json({
      success: true,
      message: 'Hawala entries retrieved successfully',
      data: hawalaEntries,
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
      message: 'Failed to retrieve hawala entries',
      error: error instanceof Error ? error.message : 'Unknown error'
    });
  }
};

// Get single hawala entry
export const getHawalaById = async (req: Request, res: Response) => {
  try {
    const { id } = req.params;

    const hawala = await prisma.hawala.findFirst({
      where: {
        id: id as string,
        isActive: true,
        isDeleted: false
      }
    });

    if (!hawala) {
      return res.status(404).json({
        success: false,
        message: 'Hawala entry not found',
        error: 'No hawala entry found with the given ID'
      });
    }

    res.status(200).json({
      success: true,
      message: 'Hawala entry retrieved successfully',
      data: hawala
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Failed to retrieve hawala entry',
      error: error instanceof Error ? error.message : 'Unknown error'
    });
  }
};

// Update hawala entry
export const updateHawala = async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    const { date, time, partyA, partyB, amount, remark, createdBy } = req.body;

    // Check if hawala entry exists
    const existingHawala = await prisma.hawala.findFirst({
      where: {
        id: id as string,
        isActive: true,
        isDeleted: false
      }
    });

    if (!existingHawala) {
      return res.status(404).json({
        success: false,
        message: 'Hawala entry not found',
        error: 'No hawala entry found with the given ID'
      });
    }

    // Get old values for audit log
    const oldValues = JSON.stringify(existingHawala);

    // Update hawala entry
    const updatedHawala = await prisma.hawala.update({
      where: { id: id as string },
      data: {
        date: date ? new Date(date) : existingHawala.date,
        time: time ? new Date(`${date || existingHawala.date.toISOString().split('T')[0]}T${time}`) : existingHawala.time,
        partyA: partyA || existingHawala.partyA,
        partyB: partyB || existingHawala.partyB,
        amount: amount ? parseInt(amount) : existingHawala.amount,
        remark: remark !== undefined ? remark : existingHawala.remark,
        updatedAt: new Date()
      }
    });

    // Generate audit log - handle foreign key constraint gracefully
    try {
      await generateAuditLog({
        entity: 'Hawala',
        entityId: updatedHawala.id,
        action: 'UPDATE',
        oldValues,
        newValues: JSON.stringify(updatedHawala),
        ipAddress: req.ip,
        userAgent: req.get('User-Agent'),
        createdBy: createdBy || existingHawala.createdBy
      });
    } catch (auditError) {
      console.warn('Audit log creation failed, but hawala entry was updated:', auditError);
      // Don't fail the entire operation if audit log fails
    }

    res.status(200).json({
      success: true,
      message: 'Hawala entry updated successfully',
      data: updatedHawala
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Failed to update hawala entry',
      error: error instanceof Error ? error.message : 'Unknown error'
    });
  }
};

// Delete hawala entry
// Get next hawala IDs
export const getHawalaNextIds = async (req: Request, res: Response) => {
  try {
    const { date } = req.query;
    const branchId = await resolveActiveTransactionBranchId(req, prisma);

    const dateStr = (date as string) || new Date().toISOString().split('T')[0];
    const nextTokenNo = await generateHawalaTokenNo(dateStr, branchId || undefined);

    // Get last hawala entry globally for transaction ID
    const lastGlobalHawala = await prisma.hawala.findFirst({
      orderBy: { createdAt: 'desc' },
      select: { transactionId: true },
    });

    let nextTransactionId = 'HWL001';
    if (lastGlobalHawala) {
      const lastNumber = parseInt(lastGlobalHawala.transactionId.replace('HWL', ''));
      nextTransactionId = `HWL${String(lastNumber + 1).padStart(3, '0')}`;
    }

    res.json({
      success: true,
      nextTransactionId,
      nextTokenNo
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      error: 'Failed to get next hawala IDs'
    });
  }
};

export const deleteHawala = async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    const { createdBy } = req.body;
    const userId = req.user?.id || createdBy;

    // Check if hawala entry exists
    const existingHawala = await prisma.hawala.findFirst({
      where: {
        id: id as string,
        isActive: true,
        isDeleted: false
      }
    });

    if (!existingHawala) {
      return res.status(404).json({
        success: false,
        message: 'Hawala entry not found',
        error: 'No hawala entry found with the given ID'
      });
    }

    // Get old values for audit log
    const oldValues = JSON.stringify(existingHawala);

    // Soft delete hawala entry
    await prisma.hawala.update({
      where: { id: id as string },
      data: {
        isActive: false,
        isDeleted: true,
        deletedAt: new Date(),
        deletedBy: userId!,
      }
    });

    // Generate audit log - fire and forget (non-blocking)
    generateAuditLog({
      entity: 'Hawala',
      entityId: existingHawala.id,
      action: 'DELETE',
      oldValues,
      ipAddress: req.ip,
      userAgent: req.get('User-Agent'),
      createdBy: existingHawala.createdBy
    }).catch(() => {
      // Ignore audit log errors
    });

    res.status(200).json({
      success: true,
      message: 'Hawala entry deleted successfully'
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Failed to delete hawala entry',
      error: error instanceof Error ? error.message : 'Unknown error'
    });
  }
};
