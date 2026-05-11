import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

export async function forceCreateHawalaProduction() {
  console.log('🔧 Force creating Hawala table in production database...');

  try {
    // Step 1: Check database connection
    console.log('📊 Testing database connection...');
    await prisma.$connect();
    console.log('✅ Database connection successful');

    // Step 2: Check if Hawala table exists
    console.log('🔍 Checking if Hawala table exists...');
    try {
      await prisma.hawala.findFirst();
      console.log('✅ Hawala table already exists and is accessible');
      
      // Step 3: Verify table structure
      console.log('🔍 Verifying table structure...');
      const sampleEntry = await prisma.hawala.findFirst();
      console.log('📝 Sample entry found:', sampleEntry);
      
      return;
    } catch (error: any) {
      console.log('❌ Hawala table not accessible:', error.message);
    }

    // Step 4: Force create table using raw SQL
    console.log('🗄️ Force creating Hawala table...');
    
    // Drop table if it exists with wrong case
    await prisma.$executeRaw`DROP TABLE IF EXISTS "hawala";`;
    await prisma.$executeRaw`DROP TABLE IF EXISTS "Hawala";`;
    
    // Create table with correct case
    await prisma.$executeRaw`
      CREATE TABLE "Hawala" (
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

    console.log('✅ Hawala table created successfully');

    // Step 5: Create indexes
    console.log('📊 Creating indexes...');
    await prisma.$executeRaw`CREATE INDEX IF NOT EXISTS "Hawala_transactionId_idx" ON "Hawala"("transactionId");`;
    await prisma.$executeRaw`CREATE INDEX IF NOT EXISTS "Hawala_date_idx" ON "Hawala"("date");`;
    await prisma.$executeRaw`CREATE INDEX IF NOT EXISTS "Hawala_partyA_idx" ON "Hawala"("partyA");`;
    await prisma.$executeRaw`CREATE INDEX IF NOT EXISTS "Hawala_partyB_idx" ON "Hawala"("partyB");`;
    await prisma.$executeRaw`CREATE INDEX IF NOT EXISTS "Hawala_createdBy_idx" ON "Hawala"("createdBy");`;

    console.log('✅ Indexes created successfully');

    // Step 6: Regenerate Prisma client
    console.log('🔄 Regenerating Prisma client...');
    const { execSync } = require('child_process');
    execSync('npx prisma generate', { stdio: 'inherit' });

    // Step 7: Test table access
    console.log('🔍 Testing table access...');
    const count = await prisma.hawala.count();
    console.log(`✅ Table accessible, ${count} entries found`);

    // Step 8: Add sample data if empty
    if (count === 0) {
      console.log('📝 Adding sample data...');
      const user = await prisma.user.findFirst({ where: { isActive: true } });
      
      if (user) {
        await prisma.hawala.create({
          data: {
            transactionId: 'HWL001',
            tokenNo: 1,
            date: new Date(),
            time: new Date(),
            partyA: 'Test Party A',
            partyB: 'Test Party B',
            amount: 50000,
            remark: 'Test entry',
            statusTime: new Date(),
            createdBy: user.id
          }
        });
        console.log('✅ Sample data added');
      }
    }

  } catch (error) {
    console.error('❌ Error creating Hawala table:', error);
    throw error;
  } finally {
    await prisma.$disconnect();
  }
}

// Run if this file is executed directly
if (require.main === module) {
  forceCreateHawalaProduction()
    .catch((e) => {
      console.error(e);
      process.exit(1);
    });
}
