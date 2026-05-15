import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

/**
 * Purge deleted entries older than 7 days from all modules
 * This function should be called daily (e.g., via cron job)
 */
export const purgeOldDeletedEntries = async () => {
  try {
    console.log('🧹 Starting purge of old deleted entries...');

    // Calculate the cutoff date (7 days ago)
    const cutoffDate = new Date();
    cutoffDate.setDate(cutoffDate.getDate() - 7);

    console.log(`📅 Cutoff date: ${cutoffDate.toISOString()}`);

    // Purge deleted entries from all 4 modules
    const [
      deletedTransactions,
      deletedAccountEntries,
      deletedHawalas,
      deletedSpecialEntries
    ] = await Promise.all([
      // Delete old deleted transactions
      prisma.transaction.deleteMany({
        where: {
          isDeleted: true,
          deletedAt: {
            lt: cutoffDate,
          },
        },
      }),
      // Delete old deleted account entries
      prisma.accountEntry.deleteMany({
        where: {
          isDeleted: true,
          deletedAt: {
            lt: cutoffDate,
          },
        },
      }),
      // Delete old deleted hawala entries
      prisma.hawala.deleteMany({
        where: {
          isDeleted: true,
          deletedAt: {
            lt: cutoffDate,
          },
        },
      }),
      // Delete old deleted special entries
      prisma.specialEntry.deleteMany({
        where: {
          isDeleted: true,
          deletedAt: {
            lt: cutoffDate,
          },
        },
      }),
    ]);

    // Also purge old ledger entries that were soft deleted
    const deletedLedgerEntries = await prisma.ledgerEntry.deleteMany({
      where: {
        isDeleted: true,
        deletedAt: {
          lt: cutoffDate,
        },
      },
    });

    const totalPurged = 
      deletedTransactions.count + 
      deletedAccountEntries.count + 
      deletedHawalas.count + 
      deletedSpecialEntries.count +
      deletedLedgerEntries.count;

    console.log(`✅ Purge completed successfully:`);
    console.log(`   - Transactions: ${deletedTransactions.count}`);
    console.log(`   - Account Entries: ${deletedAccountEntries.count}`);
    console.log(`   - Hawala Entries: ${deletedHawalas.count}`);
    console.log(`   - Special Entries: ${deletedSpecialEntries.count}`);
    console.log(`   - Ledger Entries: ${deletedLedgerEntries.count}`);
    console.log(`   - Total: ${totalPurged} records`);

    return {
      success: true,
      totalPurged,
      details: {
        transactions: deletedTransactions.count,
        accountEntries: deletedAccountEntries.count,
        hawalas: deletedHawalas.count,
        specialEntries: deletedSpecialEntries.count,
        ledgerEntries: deletedLedgerEntries.count,
      },
    };
  } catch (error) {
    console.error('❌ Error purging old deleted entries:', error);
    throw error;
  }
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
