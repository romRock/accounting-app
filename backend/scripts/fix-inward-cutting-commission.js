const { PrismaClient } = require('@prisma/client');

const prisma = new PrismaClient();

async function fixInwardCuttingCommission() {
  try {
    console.log('=== FIXING INWARD CUTTING COMMISSION ===');
    
    // Get all INWARD transactions that don't have booking commission (used as cutting commission for inward)
    const inwardTransactions = await prisma.transaction.findMany({
      where: {
        type: 'INWARD',
        OR: [
          { bookingCommission: null },
          { bookingCommission: 0 }
        ]
      },
      select: {
        id: true,
        transactionId: true,
        amount: true,
        bookingCommission: true,
        createdAt: true,
      },
    });

    console.log(`Found ${inwardTransactions.length} INWARD transactions without cutting commission`);

    // Update cutting commission for each transaction
    for (const transaction of inwardTransactions) {
      const amount = transaction.amount;
      const totalCommission = Math.round(amount * 0.001); // 1% total commission
      const cuttingCommission = Math.round(totalCommission * 0.35); // 35% of total commission
      
      console.log(`Updating ${transaction.transactionId}: amount=${amount}, bookingCommission=${transaction.bookingCommission} → ${cuttingCommission}`);
      
      await prisma.transaction.update({
        where: { id: transaction.id },
        data: { bookingCommission: cuttingCommission },
      });
    }

    console.log('✅ INWARD cutting commission fixed successfully!');
    
    // Verify the changes
    const updatedTransactions = await prisma.transaction.findMany({
      where: {
        type: 'INWARD',
      },
      select: {
        transactionId: true,
        amount: true,
        bookingCommission: true,
      },
      orderBy: { createdAt: 'asc' },
    });

    console.log('\nUpdated INWARD transactions:');
    updatedTransactions.forEach(t => {
      console.log(`${t.transactionId}: amount=${t.amount}, bookingCommission=${t.bookingCommission}`);
    });
    
  } catch (error) {
    console.error('Error fixing INWARD cutting commission:', error);
  } finally {
    await prisma.$disconnect();
  }
}

fixInwardCuttingCommission();
