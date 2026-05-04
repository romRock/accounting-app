import { PrismaClient } from '@prisma/client';

export async function seedTransactions(prisma: PrismaClient) {
  console.log('🌱 Seeding transactions...');

  try {
    // Get existing centers, clients, and branches
    const centers = await prisma.city.findMany({
      where: { isActive: true, isDeleted: false },
      take: 5
    });

    const clients = await prisma.party.findMany({
      where: { isActive: true, isDeleted: false },
      take: 10
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

    const branchId = branches[0].id;
    const createdBy = users[0]?.id || 'admin-user';

    // Create sample transactions
    const sampleTransactions = [
      {
        transactionId: 'PM2_001',
        tokenNo: 1,
        date: new Date(),
        time: new Date(),
        centerId: centers[0].id,
        amount: 10000,
        amountType: 'CASH',
        commission: 100,
        bookingCommission: 35,
        centerCommission: 65,
        autoCommission: true,
        receiverName: 'John Doe',
        receiverNumber: '9876543210',
        senderName: 'Jane Smith',
        senderNumber: '9876543211',
        receiverClientId: clients[0]?.id || null,
        senderClientId: clients[1]?.id || null,
        remark: 'Sample transaction 1',
        status: true,
        statusTime: new Date(),
        type: 'OUTWARD',
        isActive: true,
        isDeleted: false,
        branchId,
        createdBy,
      },
      {
        transactionId: 'PM2_002',
        tokenNo: 2,
        date: new Date(),
        time: new Date(),
        centerId: centers[1]?.id || centers[0].id,
        amount: 25000,
        amountType: 'CREDIT',
        commission: 250,
        bookingCommission: 87,
        centerCommission: 163,
        autoCommission: true,
        receiverName: 'Alice Johnson',
        receiverNumber: '9876543212',
        senderName: 'Bob Wilson',
        senderNumber: '9876543213',
        receiverClientId: clients[2]?.id || null,
        senderClientId: clients[3]?.id || null,
        remark: 'Sample transaction 2',
        status: true,
        statusTime: new Date(),
        type: 'OUTWARD',
        isActive: true,
        isDeleted: false,
        branchId,
        createdBy,
      },
      {
        transactionId: 'PM2_003',
        tokenNo: 3,
        date: new Date(),
        time: new Date(),
        centerId: centers[2]?.id || centers[0].id,
        amount: 15000,
        amountType: 'CASH',
        commission: 150,
        bookingCommission: 52,
        centerCommission: 98,
        autoCommission: true,
        receiverName: 'Charlie Brown',
        receiverNumber: '9876543214',
        senderName: 'Diana Prince',
        senderNumber: '9876543215',
        receiverClientId: clients[4]?.id || null,
        senderClientId: clients[5]?.id || null,
        remark: 'Sample transaction 3',
        status: true,
        statusTime: new Date(),
        type: 'INWARD',
        isActive: true,
        isDeleted: false,
        branchId,
        createdBy,
      },
      {
        transactionId: 'PM2_004',
        tokenNo: 4,
        date: new Date(Date.now() - 24 * 60 * 60 * 1000), // Yesterday
        time: new Date(Date.now() - 24 * 60 * 60 * 1000),
        centerId: centers[3]?.id || centers[0].id,
        amount: 5000,
        amountType: 'CREDIT',
        commission: 50,
        bookingCommission: 17,
        centerCommission: 33,
        autoCommission: true,
        receiverName: 'Eve Adams',
        receiverNumber: '9876543216',
        senderName: 'Frank Miller',
        senderNumber: '9876543217',
        receiverClientId: clients[6]?.id || null,
        senderClientId: clients[7]?.id || null,
        remark: 'Sample transaction 4',
        status: false,
        statusTime: new Date(Date.now() - 24 * 60 * 60 * 1000),
        type: 'OUTWARD',
        isActive: true,
        isDeleted: false,
        branchId,
        createdBy,
      },
      {
        transactionId: 'PM2_005',
        tokenNo: 5,
        date: new Date(Date.now() - 48 * 60 * 60 * 1000), // 2 days ago
        time: new Date(Date.now() - 48 * 60 * 60 * 1000),
        centerId: centers[4]?.id || centers[0].id,
        amount: 30000,
        amountType: 'CASH',
        commission: 300,
        bookingCommission: 105,
        centerCommission: 195,
        autoCommission: true,
        receiverName: 'Grace Lee',
        receiverNumber: '9876543218',
        senderName: 'Henry Ford',
        senderNumber: '9876543219',
        receiverClientId: clients[8]?.id || null,
        senderClientId: clients[9]?.id || null,
        remark: 'Sample transaction 5',
        status: true,
        statusTime: new Date(Date.now() - 48 * 60 * 60 * 1000),
        type: 'OUTWARD',
        isActive: true,
        isDeleted: false,
        branchId,
        createdBy,
      },
    ];

    // Clear existing transactions
    await prisma.transaction.deleteMany({
      where: { createdBy }
    });

    // Insert new transactions
    for (const transaction of sampleTransactions) {
      await prisma.transaction.create({
        data: transaction
      });
    }

    console.log(`✅ Created ${sampleTransactions.length} sample transactions`);
  } catch (error) {
    console.error('❌ Error seeding transactions:', error);
    throw error;
  }
}

