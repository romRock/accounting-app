import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

export async function fixProductionHawala() {
  console.log('🔧 Fixing production Hawala database...');

  try {
    // Step 1: Check database connection
    console.log('📊 Testing database connection...');
    await prisma.$connect();
    console.log('✅ Database connection successful');

    // Step 2: List all tables to see what's actually there
    console.log('📋 Listing all tables in production database...');
    const tables = await prisma.$queryRaw`
      SELECT table_name 
      FROM information_schema.tables 
      WHERE table_schema = 'public' 
      ORDER BY table_name;
    `;
    
    console.log('🔍 Tables found in production:', tables);
    
    // Step 3: Check specifically for Hawala table (case insensitive)
    const hawalaTable = tables.find((table: any) => 
      table.table_name.toLowerCase() === 'hawala'
    );
    
    if (hawalaTable) {
      console.log('✅ Hawala table found in production database');
      
      // Step 4: Test direct query to Hawala table
      console.log('🔍 Testing direct query to Hawala table...');
      try {
        const count = await prisma.hawala.count();
        console.log(`✅ Direct query successful: ${count} entries found`);
        
        // Step 5: Try findMany query
        console.log('🔍 Testing findMany query...');
        const entries = await prisma.hawala.findMany({
          take: 5,
          where: {
            isActive: true,
            isDeleted: false
          }
        });
        console.log(`✅ findMany successful: ${entries.length} entries retrieved`);
        
      } catch (queryError: any) {
        console.error('❌ Query failed:', queryError.message);
        console.error('❌ Error code:', queryError.code);
        console.error('❌ Full error:', queryError);
      }
    } else {
      console.log('❌ Hawala table NOT found in production database');
      
      // Step 4: Create table if not found
      console.log('🗄️ Creating Hawala table...');
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
      
      // Step 5: Create indexes
      console.log('📊 Creating indexes...');
      await prisma.$executeRaw`CREATE INDEX IF NOT EXISTS "Hawala_transactionId_idx" ON "Hawala"("transactionId");`;
      await prisma.$executeRaw`CREATE INDEX IF NOT EXISTS "Hawala_date_idx" ON "Hawala"("date");`;
      await prisma.$executeRaw`CREATE INDEX IF NOT EXISTS "Hawala_partyA_idx" ON "Hawala"("partyA");`;
      await prisma.$executeRaw`CREATE INDEX IF NOT EXISTS "Hawala_partyB_idx" ON "Hawala"("partyB");`;
      await prisma.$executeRaw`CREATE INDEX IF NOT EXISTS "Hawala_createdBy_idx" ON "Hawala"("createdBy");`;
      
      console.log('✅ Hawala table and indexes created successfully');
    }

  } catch (error) {
    console.error('❌ Error fixing production Hawala:', error);
    throw error;
  } finally {
    await prisma.$disconnect();
  }
}

// Run if this file is executed directly
if (require.main === module) {
  fixProductionHawala()
    .catch((e) => {
      console.error(e);
      process.exit(1);
    });
}
