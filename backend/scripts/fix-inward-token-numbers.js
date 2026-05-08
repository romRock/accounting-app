const { PrismaClient } = require('@prisma/client');

const prisma = new PrismaClient();

async function fixInwardTokenNumbers() {
  try {
    console.log('=== FIXING INWARD TOKEN NUMBERS ===');
    
    // Get all INWARD transactions for 2026-05-08, ordered by creation time
    const inwardTransactions = await prisma.transaction.findMany({
      where: {
        type: 'INWARD',
        date: {
          gte: new Date('2026-05-08T00:00:00.000Z'),
          lt: new Date('2026-05-09T00:00:00.000Z'),
        },
      },
      orderBy: { createdAt: 'asc' },
      select: {
        id: true,
        transactionId: true,
        tokenNo: true,
        createdAt: true,
      },
    });

    console.log('Found INWARD transactions:', inwardTransactions);

    // Update token numbers to start from 1
    for (let i = 0; i < inwardTransactions.length; i++) {
      const transaction = inwardTransactions[i];
      const newTokenNo = i + 1;
      
      console.log(`Updating ${transaction.transactionId}: tokenNo ${transaction.tokenNo} → ${newTokenNo}`);
      
      await prisma.transaction.update({
        where: { id: transaction.id },
        data: { tokenNo: newTokenNo },
      });
    }

    console.log('✅ INWARD token numbers fixed successfully!');
    
    // Verify the changes
    const updatedTransactions = await prisma.transaction.findMany({
      where: {
        type: 'INWARD',
        date: {
          gte: new Date('2026-05-08T00:00:00.000Z'),
          lt: new Date('2026-05-09T00:00:00.000Z'),
        },
      },
      orderBy: { tokenNo: 'asc' },
      select: {
        transactionId: true,
        tokenNo: true,
      },
    });

    console.log('Updated INWARD transactions:', updatedTransactions);
    
  } catch (error) {
    console.error('Error fixing INWARD token numbers:', error);
  } finally {
    await prisma.$disconnect();
  }
}

fixInwardTokenNumbers();
