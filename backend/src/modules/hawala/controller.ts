import { Request, Response } from 'express';
import { PrismaClient } from '@prisma/client';
import { generateAuditLog } from '../audit/auditService';

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
    console.error('Error generating hawala transaction ID:', error);
    return 'HWL001';
  }
}

// Generate token number (daily reset at 12:00 AM IST)
async function generateHawalaTokenNo(date?: string): Promise<number> {
  try {
    const today = new Date();
    const istToday = new Date(today.toLocaleString("en-US", {timeZone: "Asia/Kolkata"}));
    const todayStart = new Date(istToday.getFullYear(), istToday.getMonth(), istToday.getDate());
    
    // Count today's hawala entries
    const todayEntries = await prisma.hawala.count({
      where: {
        date: {
          gte: todayStart
        }
      }
    });
    
    return todayEntries + 1;
  } catch (error) {
    console.error('Error generating hawala token number:', error);
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
    const createdBy = authenticatedUser?.email || authenticatedUser?.id || 'system';

    // Validate required fields
    if (!transactionId || !date || !time || !partyA || !partyB || !amount) {
      return res.status(400).json({
        success: false,
        message: 'Missing required fields',
        error: 'transactionId, date, time, partyA, partyB, and amount are required'
      });
    }

    // Check if transaction ID already exists
    const existingHawala = await prisma.hawala.findFirst({
      where: { transactionId }
    });

    if (existingHawala) {
      return res.status(400).json({
        success: false,
        message: 'Transaction ID already exists',
        error: 'A hawala entry with this transaction ID already exists'
      });
    }

    // Create hawala entry
    const hawala = await prisma.hawala.create({
      data: {
        transactionId: transactionId || await generateHawalaTransactionId(),
        tokenNo: tokenNo ? parseInt(tokenNo) : await generateHawalaTokenNo(date),
        date: new Date(date),
        time: new Date(`${date}T${time}`),
        partyA,
        partyB,
        amount: parseInt(amount),
        remark: remark || null,
        statusTime: new Date(),
        createdBy
      }
    });

    // Generate audit log - handle foreign key constraint gracefully
    try {
      await generateAuditLog({
        entity: 'Hawala',
        entityId: hawala.id,
        action: 'CREATE',
        newValues: JSON.stringify(hawala),
        ipAddress: req.ip,
        userAgent: req.get('User-Agent'),
        createdBy
      });
    } catch (auditError) {
      console.warn('Audit log creation failed, but hawala entry was created:', auditError);
      // Don't fail the entire operation if audit log fails
    }

    res.status(201).json({
      success: true,
      message: 'Hawala entry created successfully',
      data: hawala
    });
  } catch (error) {
    console.error('Error creating hawala entry:', error);
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
    const { page = 1, limit = 100, search, dateFrom, dateTo, partyA, partyB } = req.query;

    const skip = (Number(page) - 1) * Number(limit);

    // Build where clause
    const where: any = {
      isActive: true,
      isDeleted: false
    };

    // Add search filter
    if (search) {
      where.OR = [
        { transactionId: { contains: search as string, mode: 'insensitive' } },
        { partyA: { contains: search as string, mode: 'insensitive' } },
        { partyB: { contains: search as string, mode: 'insensitive' } },
        { remark: { contains: search as string, mode: 'insensitive' } }
      ];
    }

    // Add date range filter
    if (dateFrom || dateTo) {
      where.date = {};
      if (dateFrom) where.date.gte = new Date(dateFrom as string);
      if (dateTo) where.date.lte = new Date(dateTo as string);
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
    console.error('Error getting hawala entries:', error);
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
    console.error('Error getting hawala entry:', error);
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
    console.error('Error updating hawala entry:', error);
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
    const { date, type } = req.query;
    
    const today = new Date();
    const istToday = new Date(today.toLocaleString("en-US", {timeZone: "Asia/Kolkata"}));
    const todayStart = new Date(istToday.getFullYear(), istToday.getMonth(), istToday.getDate());
    
    // Count today's hawala entries
    const todayEntries = await prisma.hawala.count({
      where: {
        date: {
          gte: todayStart
        }
      }
    });
    
    // Get last hawala entry
    const lastHawala = await prisma.hawala.findFirst({
      orderBy: { createdAt: 'desc' }
    });
    
    let nextTransactionId = 'HWL001';
    let nextTokenNo = '1';
    
    if (lastHawala) {
      const lastNumber = parseInt(lastHawala.transactionId.replace('HWL', ''));
      nextTransactionId = `HWL${String(lastNumber + 1).padStart(3, '0')}`;
      nextTokenNo = String((todayEntries as number) + 1);
    }
    
    res.json({
      success: true,
      nextTransactionId,
      nextTokenNo
    });
  } catch (error) {
    console.error('Error getting next hawala IDs:', error);
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

    // Hard delete hawala entry
    await prisma.hawala.delete({
      where: { id: id as string }
    });

    // Generate audit log - handle foreign key constraint gracefully
    try {
      await generateAuditLog({
        entity: 'Hawala',
        entityId: existingHawala.id,
        action: 'DELETE',
        oldValues,
        ipAddress: req.ip,
        userAgent: req.get('User-Agent'),
        createdBy: existingHawala.createdBy
      });
    } catch (auditError) {
      console.warn('Audit log creation failed, but hawala entry was deleted:', auditError);
      // Don't fail the entire operation if audit log fails
    }

    res.status(200).json({
      success: true,
      message: 'Hawala entry deleted successfully'
    });
  } catch (error) {
    console.error('Error deleting hawala entry:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to delete hawala entry',
      error: error instanceof Error ? error.message : 'Unknown error'
    });
  }
};
