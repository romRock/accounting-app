import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

export async function createHawalaTableProduction() {
  console.log('🔄 Creating Hawala table in production database...');

  try {
    // Step 1: Check if Hawala table exists by trying to access it
    console.log('🔍 Checking if Hawala table exists...');
    try {
      await prisma.hawala.findFirst();
      console.log('✅ Hawala table already exists');
      return;
    } catch (error: any) {
      if (error.code === 'P2025') {
        console.log('❌ Hawala table does not exist, creating it...');
      } else {
        console.log('❌ Error checking Hawala table:', error.message);
        throw error;
      }
    }

    // Step 2: Force create the table using raw SQL if needed
    console.log('🗄️ Creating Hawala table using raw SQL...');
    await prisma.$executeRaw`
      CREATE TABLE IF NOT EXISTS "Hawala" (
        "id" TEXT NOT NULL,
        "transactionId" TEXT NOT NULL,
        "tokenNo" INTEGER,
        "date" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
        "time" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
        "partyA" TEXT NOT NULL,
        "partyB" TEXT NOT NULL,
        "amount" INTEGER NOT NULL,
        "remark" TEXT,
        "status" BOOLEAN NOT NULL DEFAULT true,
        "statusTime" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
        "isActive" BOOLEAN NOT NULL DEFAULT true,
        "isDeleted" BOOLEAN NOT NULL DEFAULT false,
        "branchId" TEXT,
        "createdBy" TEXT NOT NULL,
        "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
        "updatedAt" TIMESTAMP(3) NOT NULL,
        CONSTRAINT "Hawala_pkey" PRIMARY KEY ("id"),
        CONSTRAINT "Hawala_transactionId_key" UNIQUE ("transactionId")
      );
    `;

    // Step 3: Create indexes
    console.log('📊 Creating indexes for Hawala table...');
    await prisma.$executeRaw`
      CREATE INDEX IF NOT EXISTS "Hawala_transactionId_idx" ON "Hawala"("transactionId");
    `;
    await prisma.$executeRaw`
      CREATE INDEX IF NOT EXISTS "Hawala_date_idx" ON "Hawala"("date");
    `;
    await prisma.$executeRaw`
      CREATE INDEX IF NOT EXISTS "Hawala_partyA_idx" ON "Hawala"("partyA");
    `;
    await prisma.$executeRaw`
      CREATE INDEX IF NOT EXISTS "Hawala_partyB_idx" ON "Hawala"("partyB");
    `;
    await prisma.$executeRaw`
      CREATE INDEX IF NOT EXISTS "Hawala_createdBy_idx" ON "Hawala"("createdBy");
    `;

    console.log('✅ Hawala table created successfully');
    }

    // Step 4: Verify table creation
    console.log('🔍 Verifying Hawala table creation...');
    const testEntry = await prisma.hawala.findFirst();
    console.log('✅ Hawala table verification successful');

  } catch (error) {
    console.error('❌ Error creating Hawala table:', error);
    throw error;
  } finally {
    await prisma.$disconnect();
  }
}

// Run if this file is executed directly
if (require.main === module) {
  createHawalaTableProduction()
    .catch((e) => {
      console.error(e);
      process.exit(1);
    });
}
