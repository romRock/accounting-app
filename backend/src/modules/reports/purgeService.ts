import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

/**
 * Purge deleted entries older than 7 days from all modules.
 * Disabled by default — entries are only removed when a user manually deletes them.
 */
export const purgeOldDeletedEntries = async () => {
  console.log('Purge skipped: automatic deletion is disabled. Entries are only removed on manual delete.');
  return {
    success: true,
    totalPurged: 0,
    details: {
      transactions: 0,
      accountEntries: 0,
      hawalas: 0,
      specialEntries: 0,
      ledgerEntries: 0,
    },
  };
};

/**
 * Get statistics on deleted entries (for monitoring)
 */
export const getDeletedEntriesStats = async () => {
  try {
    const cutoffDate = new Date();
    cutoffDate.setDate(cutoffDate.getDate() - 7);

    const [
      totalDeletedTransactions,
      oldDeletedTransactions,
      totalDeletedAccountEntries,
      oldDeletedAccountEntries,
      totalDeletedHawalas,
      oldDeletedHawalas,
      totalDeletedSpecialEntries,
      oldDeletedSpecialEntries,
      totalDeletedLedgerEntries,
      oldDeletedLedgerEntries,
    ] = await Promise.all([
      prisma.transaction.count({ where: { isDeleted: true } }),
      prisma.transaction.count({ 
        where: { 
          isDeleted: true,
          deletedAt: { lt: cutoffDate },
        } 
      }),
      prisma.accountEntry.count({ where: { isDeleted: true } }),
      prisma.accountEntry.count({ 
        where: { 
          isDeleted: true,
          deletedAt: { lt: cutoffDate },
        } 
      }),
      prisma.hawala.count({ where: { isDeleted: true } }),
      prisma.hawala.count({ 
        where: { 
          isDeleted: true,
          deletedAt: { lt: cutoffDate },
        } 
      }),
      prisma.specialEntry.count({ where: { isDeleted: true } }),
      prisma.specialEntry.count({ 
        where: { 
          isDeleted: true,
          deletedAt: { lt: cutoffDate },
        } 
      }),
      prisma.ledgerEntry.count({ where: { isDeleted: true } }),
      prisma.ledgerEntry.count({ 
        where: { 
          isDeleted: true,
          deletedAt: { lt: cutoffDate },
        } 
      }),
    ]);

    return {
      transactions: {
        total: totalDeletedTransactions,
        old: oldDeletedTransactions,
      },
      accountEntries: {
        total: totalDeletedAccountEntries,
        old: oldDeletedAccountEntries,
      },
      hawalas: {
        total: totalDeletedHawalas,
        old: oldDeletedHawalas,
      },
      specialEntries: {
        total: totalDeletedSpecialEntries,
        old: oldDeletedSpecialEntries,
      },
      ledgerEntries: {
        total: totalDeletedLedgerEntries,
        old: oldDeletedLedgerEntries,
      },
      total: 
        totalDeletedTransactions + 
        totalDeletedAccountEntries + 
        totalDeletedHawalas + 
        totalDeletedSpecialEntries +
        totalDeletedLedgerEntries,
      oldTotal:
        oldDeletedTransactions +
        oldDeletedAccountEntries +
        oldDeletedHawalas +
        oldDeletedSpecialEntries +
        oldDeletedLedgerEntries,
      cutoffDate,
    };
  } catch (error) {
    console.error('❌ Error getting deleted entries stats:', error);
    throw error;
  }
};
