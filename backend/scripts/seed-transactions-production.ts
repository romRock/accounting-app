import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function seedTransactionsProduction() {
  console.log('🌱 Seeding transactions for production...');

  try {
    // Get existing centers and clients
    const centers = await prisma.city.findMany({
      where: { isActive: true, isDeleted: false },
      take: 5,
      orderBy: { createdAt: 'asc' }
    });

    const clients = await prisma.party.findMany({
      where: { isActive: true, isDeleted: false },
      take: 10,
      orderBy: { createdAt: 'asc' }
    });

    const branches = await prisma.branch.findMany({
      where: { isActive: true, isDeleted: false },
      take: 1
    });

    const users = await prisma.user.findMany({
      where: { isActive: true, isDeleted: false },
      take: 1
    });

    if (centers.length === 0 || clients.length === 0) {
      console.log('⚠️  No centers or clients found. Please seed them first.');
      return;
    }

    if (branches.length === 0) {
      console.log('⚠️  No branches found. Please seed them first.');
      return;
    }

    if (users.length === 0) {
      console.log('⚠️  No users found. Please seed them first.');
      return;
    }

    // Create production sample transactions
    const productionTransactions = [
      {
        transactionId: 'PM2_001',
        tokenNo: 1,
        date: new Date(),
        time: new Date(),
        centerId: centers[0].id,
        amount: 10000,
        amountType: 'CASH',
        commission: 10, // 0.1% of 10000
        bookingCommission: 4, // 35% of 10
        centerCommission: 6, // 65% of 10
        autoCommission: true,
        receiverName: 'John Doe',
        receiverNumber: '9876543210',
        senderName: 'Jane Smith',
        senderNumber: '9876543211',
        receiverClientId: clients[0]?.id || null,
        senderClientId: clients[1]?.id || null,
        remark: 'Production transaction 1',
        status: true,
        statusTime: new Date(),
        type: 'OUTWARD',
        isActive: true,
        isDeleted: false,
        branchId: branches[0].id,
        createdBy: users[0].id,
      },
      {
        transactionId: 'PM2_002',
        tokenNo: 2,
        date: new Date(),
        time: new Date(),
        centerId: centers[1]?.id || centers[0].id,
        amount: 25000,
        amountType: 'CREDIT',
        commission: 25, // 0.1% of 25000
        bookingCommission: 9, // 35% of 25
        centerCommission: 16, // 65% of 25
        autoCommission: true,
        receiverName: 'Alice Johnson',
        receiverNumber: '9876543212',
        senderName: 'Bob Wilson',
        senderNumber: '9876543213',
        receiverClientId: clients[2]?.id || null,
        senderClientId: clients[3]?.id || null,
        remark: 'Production transaction 2',
        status: true,
        statusTime: new Date(),
        type: 'OUTWARD',
        isActive: true,
        isDeleted: false,
        branchId: branches[0].id,
        createdBy: users[0].id,
      },
      {
        transactionId: 'PM2_003',
        tokenNo: 3,
        date: new Date(),
        time: new Date(),
        centerId: centers[2]?.id || centers[0].id,
        amount: 15000,
        amountType: 'CASH',
        commission: 15, // 0.1% of 15000
        bookingCommission: 5, // 35% of 15
        centerCommission: 10, // 65% of 15
        autoCommission: true,
        receiverName: 'Charlie Brown',
        receiverNumber: '9876543214',
        senderName: 'Diana Prince',
        senderNumber: '9876543215',
        receiverClientId: clients[4]?.id || null,
        senderClientId: clients[5]?.id || null,
        remark: 'Production transaction 3',
        status: true,
        statusTime: new Date(),
        type: 'INWARD',
        isActive: true,
        isDeleted: false,
        branchId: branches[0].id,
        createdBy: users[0].id,
      },
      {
        transactionId: 'PM2_004',
        tokenNo: 4,
        date: new Date(Date.now() - 24 * 60 * 60 * 1000), // Yesterday
        time: new Date(Date.now() - 24 * 60 * 60 * 1000),
        centerId: centers[3]?.id || centers[0].id,
        amount: 5000,
        amountType: 'CREDIT',
        commission: 5, // 0.1% of 5000
        bookingCommission: 2, // 35% of 5
        centerCommission: 3, // 65% of 5
        autoCommission: true,
        receiverName: 'Eve Adams',
        receiverNumber: '9876543216',
        senderName: 'Frank Miller',
        senderNumber: '9876543217',
        receiverClientId: clients[6]?.id || null,
        senderClientId: clients[7]?.id || null,
        remark: 'Production transaction 4',
        status: false,
        statusTime: new Date(Date.now() - 24 * 60 * 60 * 1000),
        type: 'OUTWARD',
        isActive: true,
        isDeleted: false,
        branchId: branches[0].id,
        createdBy: users[0].id,
      },
      {
        transactionId: 'PM2_005',
        tokenNo: 5,
        date: new Date(Date.now() - 48 * 60 * 60 * 1000), // 2 days ago
        time: new Date(Date.now() - 48 * 60 * 60 * 1000),
        centerId: centers[4]?.id || centers[0].id,
        amount: 30000,
        amountType: 'CASH',
        commission: 30, // 0.1% of 30000
        bookingCommission: 11, // 35% of 30
        centerCommission: 19, // 65% of 30
        autoCommission: true,
        receiverName: 'Grace Lee',
        receiverNumber: '9876543218',
        senderName: 'Henry Ford',
        senderNumber: '9876543219',
        receiverClientId: clients[8]?.id || null,
        senderClientId: clients[9]?.id || null,
        remark: 'Production transaction 5',
        status: true,
        statusTime: new Date(Date.now() - 48 * 60 * 60 * 1000),
        type: 'OUTWARD',
        isActive: true,
        isDeleted: false,
        branchId: branches[0].id,
        createdBy: users[0].id,
      },
    ];

    // Clear all existing transactions to avoid unique constraint conflicts
    await prisma.transaction.deleteMany();

    // Insert new transactions
    for (const transaction of productionTransactions) {
      await prisma.transaction.create({
        data: transaction
      });
    }

    console.log(`✅ Created ${productionTransactions.length} production transactions`);
    console.log('🎉 Transaction seeding completed successfully!');
  } catch (error) {
    console.error('❌ Error seeding production transactions:', error);
    throw error;
  } finally {
    await prisma.$disconnect();
  }
}

// Run the seed function
seedTransactionsProduction()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  });
