const { PrismaClient } = require('@prisma/client');

const prisma = new PrismaClient();

async function fixAllInwardTokenNumbers() {
  try {
    console.log('=== FIXING ALL INWARD TOKEN NUMBERS ===');
    
    // Get all INWARD transactions, ordered by date and creation time
    const allInwardTransactions = await prisma.transaction.findMany({
      where: {
        type: 'INWARD',
      },
      orderBy: [
        { date: 'asc' },
        { createdAt: 'asc' }
      ],
      select: {
        id: true,
        transactionId: true,
        tokenNo: true,
        date: true,
        createdAt: true,
      },
    });

    console.log('Found INWARD transactions:', allInwardTransactions);

    // Group transactions by date
    const transactionsByDate = {};
    allInwardTransactions.forEach(transaction => {
      const date = transaction.date.toISOString().split('T')[0];
      if (!transactionsByDate[date]) {
        transactionsByDate[date] = [];
      }
      transactionsByDate[date].push(transaction);
    });

    console.log('Transactions grouped by date:', transactionsByDate);

    // Update token numbers for each date
    for (const [date, transactions] of Object.entries(transactionsByDate)) {
      console.log(`\nProcessing date: ${date}`);
      
      // Update token numbers to start from 1 for each date
      for (let i = 0; i < transactions.length; i++) {
        const transaction = transactions[i];
        const newTokenNo = i + 1;
        
        console.log(`Updating ${transaction.transactionId}: tokenNo ${transaction.tokenNo} → ${newTokenNo}`);
        
        await prisma.transaction.update({
          where: { id: transaction.id },
          data: { tokenNo: newTokenNo },
        });
      }
    }

    console.log('\n✅ All INWARD token numbers fixed successfully!');
    
    // Verify the changes
    const updatedTransactions = await prisma.transaction.findMany({
      where: {
        type: 'INWARD',
      },
      orderBy: [
        { date: 'asc' },
        { tokenNo: 'asc' }
      ],
      select: {
        transactionId: true,
        tokenNo: true,
        date: true,
      },
    });

    console.log('\nUpdated INWARD transactions:', updatedTransactions);
    
  } catch (error) {
    console.error('Error fixing INWARD token numbers:', error);
  } finally {
    await prisma.$disconnect();
  }
}

fixAllInwardTokenNumbers();
