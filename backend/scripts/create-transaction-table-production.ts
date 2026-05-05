import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function createTransactionTableProduction() {
  console.log('🏗️ Creating Transaction table in production database...');

  try {
    // Check if Transaction table exists
    const tableExists = await prisma.$queryRaw`
      SELECT EXISTS (
        SELECT FROM information_schema.tables 
        WHERE table_schema = 'public' 
        AND table_name = 'Transaction'
      )
    `;

    console.log('📊 Transaction table exists:', tableExists[0].exists);

    if (!tableExists[0].exists) {
      console.log('➕ Creating Transaction table with all required columns...');
      
      // Create the complete Transaction table
      await prisma.$executeRaw`
        CREATE TABLE "Transaction" (
          "id" TEXT NOT NULL PRIMARY KEY,
          "transactionId" TEXT NOT NULL UNIQUE,
          "tokenNo" INTEGER,
          "date" TIMESTAMP(3) NOT NULL,
          "time" TIMESTAMP(3) NOT NULL,
          "centerId" TEXT NOT NULL,
          "amount" INTEGER NOT NULL,
          "amountType" TEXT NOT NULL,
          "commission" INTEGER NOT NULL DEFAULT 0,
          "bookingCommission" INTEGER NOT NULL DEFAULT 0,
          "centerCommission" INTEGER NOT NULL DEFAULT 0,
          "autoCommission" BOOLEAN NOT NULL DEFAULT true,
          "receiverName" TEXT NOT NULL,
          "receiverNumber" TEXT,
          "senderName" TEXT NOT NULL,
          "senderNumber" TEXT,
          "receiverClientId" TEXT,
          "senderClientId" TEXT,
          "remark" TEXT,
          "status" BOOLEAN NOT NULL DEFAULT true,
          "statusTime" TIMESTAMP(3) NOT NULL,
          "type" TEXT NOT NULL DEFAULT 'OUTWARD',
          "isActive" BOOLEAN NOT NULL DEFAULT true,
          "isDeleted" BOOLEAN NOT NULL DEFAULT false,
          "branchId" TEXT NOT NULL,
          "createdBy" TEXT NOT NULL,
          "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
          "updatedAt" TIMESTAMP(3) NOT NULL
        )
      `;
      
      console.log('✅ Transaction table created successfully');
      
      // Create indexes for better performance
      await prisma.$executeRaw`CREATE INDEX "Transaction_transactionId_idx" ON "Transaction"("transactionId")`;
      await prisma.$executeRaw`CREATE INDEX "Transaction_centerId_idx" ON "Transaction"("centerId")`;
      await prisma.$executeRaw`CREATE INDEX "Transaction_createdBy_idx" ON "Transaction"("createdBy")`;
      await prisma.$executeRaw`CREATE INDEX "Transaction_date_idx" ON "Transaction"("date")`;
      
      console.log('✅ Indexes created successfully');
    } else {
      console.log('✅ Transaction table already exists');
    }

    console.log('🎉 Production Transaction table creation completed!');
  } catch (error) {
    console.error('❌ Error creating Transaction table:', error);
    throw error;
  } finally {
    await prisma.$disconnect();
  }
}

// Run the table creation
createTransactionTableProduction()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  });
