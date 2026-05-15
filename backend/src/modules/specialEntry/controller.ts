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
    console.error('Error generating special entry ID:', error);
    return 'SPL001';
  }
}

// Get all special entries
export const getSpecialEntries = async (req: Request, res: Response) => {
  try {
    console.log('🔍 SPECIAL ENTRY API DEBUG: getSpecialEntries called');
    console.log('🔍 SPECIAL ENTRY API DEBUG: Query params:', req.query);
    
    const { page = 1, limit = 100, search, dateFrom, dateTo, partyA, partyB, status } = req.query;

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
    if (status) where.status = status as string;

    console.log('🔍 SPECIAL ENTRY API DEBUG: About to query specialEntry table...');

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

    console.log('🔍 SPECIAL ENTRY API DEBUG: Query successful, found entries:', specialEntries.length);
    console.log('🔍 SPECIAL ENTRY API DEBUG: Total count:', total);

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
    console.error('❌ SPECIAL ENTRY API DEBUG: Error getting special entries:', error);
    console.error('❌ SPECIAL ENTRY API DEBUG: Error details:', {
      message: error instanceof Error ? error.message : 'Unknown error',
      code: (error as any).code,
      meta: (error as any).meta
    });
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
    console.error('Error getting special entry:', error);
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
        tokenNo: tokenNo ? parseInt(tokenNo.toString()) : null,
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
        createdBy: createdBy || req.user?.id || 'system'
      }
    });

    // Generate audit log
    await generateAuditLog({
      entity: 'SpecialEntry',
      entityId: specialEntry.id,
      action: 'CREATE',
      newValues: JSON.stringify(specialEntry),
      ipAddress: req.ip,
      userAgent: req.get('User-Agent'),
      createdBy: createdBy || req.user?.id || 'system'
    });

    res.status(201).json({
      success: true,
      message: 'Special entry created successfully',
      data: specialEntry
    });
  } catch (error) {
    console.error('Error creating special entry:', error);
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
    console.error('Error updating special entry:', error);
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
    await generateAuditLog({
      entity: 'SpecialEntry',
      entityId: existingEntry.id,
      action: 'DELETE',
      oldValues: JSON.stringify(existingEntry),
      ipAddress: req.ip,
      userAgent: req.get('User-Agent'),
      createdBy: userId || 'system'
    });

    res.status(200).json({
      success: true,
      message: 'Special entry deleted successfully'
    });
  } catch (error) {
    console.error('Error deleting special entry:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to delete special entry',
      error: error instanceof Error ? error.message : 'Unknown error'
    });
  }
};
