import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function fixTransactionTableConstraints() {
  console.log('🔧 Fixing transaction table constraints and dropping lowercase table...');
  
  try {
    // Step 1: Check current state
    const uppercaseTable = await prisma.$queryRaw`
      SELECT EXISTS (SELECT FROM information_schema.tables WHERE table_schema = 'public' AND table_name = 'Transaction')
    `;
    
    const lowercaseTable = await prisma.$queryRaw`
      SELECT EXISTS (SELECT FROM information_schema.tables WHERE table_schema = 'public' AND table_name = 'transactions')
    `;
    
    console.log('📊 Uppercase Transaction table exists:', uppercaseTable[0].exists);
    console.log('📊 Lowercase transactions table exists:', lowercaseTable[0].exists);
    
    if (lowercaseTable[0].exists && uppercaseTable[0].exists) {
      // Step 2: Drop foreign key constraints that point to lowercase table
      console.log('🗑️ Dropping foreign key constraints...');
      
      try {
        await prisma.$queryRaw`ALTER TABLE ledger_entries DROP CONSTRAINT ledger_entries_transactionId_fkey`;
        console.log('✅ Dropped ledger_entries_transactionId_fkey constraint');
      } catch (error) {
        console.log('⚠️ ledger_entries_transactionId_fkey constraint not found or already dropped');
      }
      
      // Step 3: Drop the lowercase table
      console.log('🗑️ Dropping lowercase transactions table...');
      await prisma.$queryRaw`DROP TABLE transactions CASCADE`;
      console.log('✅ Lowercase table dropped successfully');
      
      // Step 4: Recreate foreign key constraint pointing to uppercase table
      console.log('🔗 Creating foreign key constraint for uppercase table...');
      await prisma.$queryRaw`
        ALTER TABLE ledger_entries 
        ADD CONSTRAINT ledger_entries_transactionId_fkey 
        FOREIGN KEY (transactionId) REFERENCES "Transaction"(id) ON DELETE CASCADE
      `;
      console.log('✅ Foreign key constraint created for uppercase table');
    }
    
    // Step 5: Verify final state
    const finalTables = await prisma.$queryRaw`
      SELECT table_name 
      FROM information_schema.tables 
      WHERE table_schema = 'public' 
      AND (table_name = 'Transaction' OR table_name = 'transactions')
      ORDER BY table_name
    `;
    
    console.log('📊 Final transaction tables:', finalTables.length);
    finalTables.forEach((table: any) => {
      console.log(`  - ${table.table_name}`);
    });
    
    // Step 6: Verify uppercase table schema
    const uppercaseSchema = await prisma.$queryRaw`
      SELECT column_name, data_type 
      FROM information_schema.columns 
      WHERE table_name = 'Transaction'
      ORDER BY ordinal_position
    `;
    
    console.log('📊 Uppercase Transaction table schema:');
    uppercaseSchema.forEach((col: any, index: number) => {
      console.log(`  ${index + 1}. ${col.column_name} (${col.data_type})`);
    });
    
    // Check tokenNo column specifically
    const tokenNoColumn = uppercaseSchema.find((col: any) => col.column_name === 'tokenNo');
    console.log('🔍 tokenNo column exists:', tokenNoColumn ? 'YES' : 'NO');
    
    console.log('🎉 Transaction table constraints fixed successfully!');
    console.log('💡 Production will now use only the uppercase Transaction table with tokenNo column');
    
  } catch (error) {
    console.error('❌ Error fixing transaction table constraints:', error);
    throw error;
  } finally {
    await prisma.$disconnect();
  }
}

// Run the fix
fixTransactionTableConstraints()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  });
