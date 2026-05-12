// Production script to create SpecialEntry table
// This script ensures SpecialEntry table exists in production database

const { PrismaClient } = require('@prisma/client');

const prisma = new PrismaClient();

async function createSpecialEntryTable() {
  try {
    console.log('🔍 Checking SpecialEntry table existence...');
    
    // Check if SpecialEntry table exists
    const result = await prisma.$queryRaw`
      SELECT EXISTS (
        SELECT FROM information_schema.tables 
        WHERE table_schema = 'public' 
        AND table_name = 'SpecialEntry'
      );
    `;
    
    const tableExists = result[0].exists;
    
    if (!tableExists) {
      console.log('📋 Creating SpecialEntry table...');
      
      // Create SpecialEntry table using raw SQL
      await prisma.$queryRaw`
        CREATE TABLE "SpecialEntry" (
          "id" TEXT NOT NULL,
          "transactionId" TEXT NOT NULL,
          "tokenNo" INTEGER,
          "date" TIMESTAMP(3) NOT NULL,
          "time" TIMESTAMP(3) NOT NULL,
          "partyA" TEXT NOT NULL,
          "amountA" INTEGER NOT NULL,
          "partyB" TEXT NOT NULL,
          "amountB" INTEGER NOT NULL,
          "partyC" TEXT,
          "amountC" INTEGER,
          "remark" TEXT,
          "status" TEXT NOT NULL,
          "statusTime" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
          "isActive" BOOLEAN NOT NULL DEFAULT true,
          "isDeleted" BOOLEAN NOT NULL DEFAULT false,
          "branchId" TEXT,
          "createdBy" TEXT,
          "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
          "updatedAt" TIMESTAMP(3) NOT NULL,

          CONSTRAINT "SpecialEntry_pkey" PRIMARY KEY ("id")
        );
      `;
      
      // Create indexes for performance
      await prisma.$queryRaw`
        CREATE INDEX "SpecialEntry_transactionId_idx" ON "SpecialEntry"("transactionId");
      `;
      
      await prisma.$queryRaw`
        CREATE INDEX "SpecialEntry_date_idx" ON "SpecialEntry"("date");
      `;
      
      await prisma.$queryRaw`
        CREATE INDEX "SpecialEntry_partyA_idx" ON "SpecialEntry"("partyA");
      `;
      
      await prisma.$queryRaw`
        CREATE INDEX "SpecialEntry_partyB_idx" ON "SpecialEntry"("partyB");
      `;
      
      await prisma.$queryRaw`
        CREATE INDEX "SpecialEntry_partyC_idx" ON "SpecialEntry"("partyC");
      `;
      
      await prisma.$queryRaw`
        CREATE INDEX "SpecialEntry_createdBy_idx" ON "SpecialEntry"("createdBy");
      `;
      
      console.log('✅ SpecialEntry table created successfully!');
    } else {
      console.log('✅ SpecialEntry table already exists!');
    }
    
  } catch (error) {
    console.error('❌ Error creating SpecialEntry table:', error);
    throw error;
  } finally {
    await prisma.$disconnect();
  }
}

// Run the function
createSpecialEntryTable()
  .then(() => {
    console.log('🎉 SpecialEntry table setup completed!');
    process.exit(0);
  })
  .catch((error) => {
    console.error('💥 SpecialEntry table setup failed:', error);
    process.exit(1);
  });
