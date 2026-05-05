import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function fixProductionSchema() {
  console.log('🔧 Fixing production database schema...');

  try {
    // Check if tokenNo column exists in Transaction table
    const tableInfo = await prisma.$queryRaw`
      SELECT column_name 
      FROM information_schema.columns 
      WHERE table_name = 'Transaction' 
      AND column_name = 'tokenNo'
    `;

    console.log('📊 TokenNo column check:', tableInfo.length > 0 ? 'EXISTS' : 'MISSING');

    if (tableInfo.length === 0) {
      console.log('➕ Adding tokenNo column to Transaction table...');
      
      // Add tokenNo column to Transaction table
      await prisma.$executeRaw`
        ALTER TABLE "Transaction" 
        ADD COLUMN "tokenNo" INTEGER
      `;
      
      console.log('✅ tokenNo column added successfully');
    } else {
      console.log('✅ tokenNo column already exists');
    }

    console.log('🎉 Production schema fix completed!');
  } catch (error) {
    console.error('❌ Error fixing production schema:', error);
    throw error;
  } finally {
    await prisma.$disconnect();
  }
}

// Run the schema fix
fixProductionSchema()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  });
