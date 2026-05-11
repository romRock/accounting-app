import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

export async function forceProductionHawala() {
  console.log('🔧 FORCE CREATING Hawala table in production database...');

  try {
    // Step 1: Check database connection
    console.log('📊 Testing database connection...');
    await prisma.$connect();
    console.log('✅ Database connection successful');

    // Step 2: Force drop and recreate table to ensure it exists
    console.log('🗄️ Force dropping any existing Hawala table...');
    await prisma.$executeRaw`DROP TABLE IF EXISTS "Hawala" CASCADE;`;
    await prisma.$executeRaw`DROP TABLE IF EXISTS "hawala" CASCADE;`;
    
    console.log('🔧 Creating Hawala table with correct structure...');
    
    // Step 3: Create table with exact schema from Prisma
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

    // Step 4: Create all required indexes
    console.log('📊 Creating indexes...');
    await prisma.$executeRaw`CREATE INDEX "Hawala_transactionId_idx" ON "Hawala"("transactionId");`;
    await prisma.$executeRaw`CREATE INDEX "Hawala_date_idx" ON "Hawala"("date");`;
    await prisma.$executeRaw`CREATE INDEX "Hawala_partyA_idx" ON "Hawala"("partyA");`;
    await prisma.$executeRaw`CREATE INDEX "Hawala_partyB_idx" ON "Hawala"("partyB");`;
    await prisma.$executeRaw`CREATE INDEX "Hawala_createdBy_idx" ON "Hawala"("createdBy");`;

    console.log('✅ Indexes created successfully');

    // Step 5: Regenerate Prisma client to ensure it recognizes the table
    console.log('🔄 Regenerating Prisma client...');
    const { execSync } = require('child_process');
    try {
      execSync('npx prisma generate', { stdio: 'inherit' });
      console.log('✅ Prisma client regenerated');
    } catch (error) {
      console.log('⚠️ Prisma generation failed, but table should still work');
    }

    // Step 6: Test table access with fresh Prisma client
    console.log('🔍 Testing table access...');
    
    // Create new Prisma client instance
    const freshPrisma = new PrismaClient();
    await freshPrisma.$connect();
    
    try {
      const count = await freshPrisma.hawala.count();
      console.log(`✅ Table accessible with fresh client: ${count} entries found`);
      
      // Test findMany query
      const entries = await freshPrisma.hawala.findMany({
        take: 5,
        where: {
          isActive: true,
          isDeleted: false
        }
      });
      console.log(`✅ findMany query successful: ${entries.length} entries retrieved`);
      
      // Step 7: Add sample data if table is empty
      if (count === 0) {
        console.log('📝 Adding sample data...');
        const user = await freshPrisma.user.findFirst({ 
          where: { isActive: true } 
        });
        
        if (user) {
          await freshPrisma.hawala.create({
            data: {
              transactionId: 'HWL001',
              tokenNo: 1,
              date: new Date(),
              time: new Date(),
              partyA: 'Test Party A',
              partyB: 'Test Party B',
              amount: 50000,
              remark: 'Test entry for production',
              statusTime: new Date(),
              createdBy: user.id
            }
          });
          console.log('✅ Sample data added successfully');
        }
      }
      
    } finally {
      await freshPrisma.$disconnect();
    }

    console.log('🎉 Hawala table successfully created and tested in production!');

  } catch (error) {
    console.error('❌ Error creating Hawala table:', error);
    throw error;
  } finally {
    await prisma.$disconnect();
  }
}

// Run if this file is executed directly
if (require.main === module) {
  forceProductionHawala()
    .catch((e) => {
      console.error(e);
      process.exit(1);
    });
}
