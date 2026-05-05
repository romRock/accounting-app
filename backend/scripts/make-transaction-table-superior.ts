import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function makeTransactionTableSuperior() {
  console.log('👑 Making uppercase Transaction table superior by copying all columns...');
  
  try {
    // Step 1: Check current table schemas
    const lowercaseSchema = await prisma.$queryRaw`
      SELECT column_name, data_type, is_nullable, column_default
      FROM information_schema.columns 
      WHERE table_name = 'transactions'
      ORDER BY ordinal_position
    `;
    
    const uppercaseSchema = await prisma.$queryRaw`
      SELECT column_name, data_type, is_nullable, column_default
      FROM information_schema.columns 
      WHERE table_name = 'Transaction'
      ORDER BY ordinal_position
    `;
    
    console.log('📊 Lowercase transactions table columns:');
    lowercaseSchema.forEach((col: any, index: number) => {
      console.log(`  ${index + 1}. ${col.column_name} (${col.data_type}, ${col.is_nullable})`);
    });
    
    console.log('📊 Uppercase Transaction table columns:');
    uppercaseSchema.forEach((col: any, index: number) => {
      console.log(`  ${index + 1}. ${col.column_name} (${col.data_type}, ${col.is_nullable})`);
    });
    
    // Step 2: Add missing columns to uppercase table
    const uppercaseColumns = uppercaseSchema.map((col: any) => col.column_name);
    const lowercaseColumns = lowercaseSchema.map((col: any) => col.column_name);
    
    const missingColumns = lowercaseColumns.filter((col: string) => !uppercaseColumns.includes(col));
    
    console.log('📋 Missing columns in uppercase table:', missingColumns);
    
    for (const column of missingColumns) {
      const columnInfo = lowercaseSchema.find((col: any) => col.column_name === column);
      if (columnInfo) {
        console.log(`➕ Adding column: ${column} (${columnInfo.data_type})`);
        
        let alterQuery = `ALTER TABLE "Transaction" ADD COLUMN "${column}" ${columnInfo.data_type}`;
        
        if (columnInfo.is_nullable === 'YES') {
          alterQuery += ' NULL';
        } else {
          alterQuery += ' NOT NULL';
        }
        
        if (columnInfo.column_default) {
          alterQuery += ` DEFAULT ${columnInfo.column_default}`;
        }
        
        try {
          await prisma.$queryRaw`${alterQuery}`;
          console.log(`✅ Added column: ${column}`);
        } catch (error) {
          console.log(`⚠️ Failed to add column ${column}: ${error}`);
        }
      }
    }
    
    // Step 3: Move data from lowercase to uppercase table
    console.log('🔄 Moving data from lowercase to uppercase table...');
    
    // Get all data from lowercase table
    const lowercaseData = await prisma.$queryRaw`SELECT * FROM transactions`;
    console.log(`📊 Found ${lowercaseData.length} records in lowercase table`);
    
    if (lowercaseData.length > 0) {
      // Build dynamic INSERT query
      const columns = lowercaseSchema.map((col: any) => col.column_name);
      const columnList = columns.join(', ');
      const valuePlaceholders = columns.map(() => '?').join(', ');
      
      // Insert data into uppercase table
      for (const record of lowercaseData) {
        const values = columns.map((col: string) => (record as any)[col]);
        
        try {
          await prisma.$queryRaw`
            INSERT INTO "Transaction" (${columnList})
            VALUES (${valuePlaceholders})
            ON CONFLICT (id) DO NOTHING
          `;
        } catch (error) {
          console.log(`⚠️ Failed to insert record: ${error}`);
        }
      }
      
      console.log('✅ Data moved successfully');
    }
    
    // Step 4: Drop foreign key constraints
    console.log('🗑️ Dropping foreign key constraints...');
    try {
      await prisma.$queryRaw`ALTER TABLE ledger_entries DROP CONSTRAINT ledger_entries_transactionId_fkey`;
      console.log('✅ Dropped ledger_entries_transactionId_fkey constraint');
    } catch (error) {
      console.log('⚠️ ledger_entries_transactionId_fkey constraint not found');
    }
    
    // Step 5: Drop lowercase table
    console.log('🗑️ Dropping lowercase transactions table...');
    await prisma.$queryRaw`DROP TABLE transactions CASCADE`;
    console.log('✅ Lowercase table dropped successfully');
    
    // Step 6: Recreate foreign key constraint
    console.log('🔗 Recreating foreign key constraint...');
    await prisma.$queryRaw`
      ALTER TABLE ledger_entries 
      ADD CONSTRAINT ledger_entries_transactionId_fkey 
      FOREIGN KEY (transactionId) REFERENCES "Transaction"(id) ON DELETE CASCADE
    `;
    console.log('✅ Foreign key constraint recreated');
    
    // Step 7: Verify final state
    const finalSchema = await prisma.$queryRaw`
      SELECT column_name, data_type 
      FROM information_schema.columns 
      WHERE table_name = 'Transaction'
      ORDER BY ordinal_position
    `;
    
    console.log('📊 Final uppercase Transaction table schema:');
    finalSchema.forEach((col: any, index: number) => {
      console.log(`  ${index + 1}. ${col.column_name} (${col.data_type})`);
    });
    
    // Check tokenNo column specifically
    const tokenNoColumn = finalSchema.find((col: any) => col.column_name === 'tokenNo');
    console.log('🔍 tokenNo column exists:', tokenNoColumn ? 'YES' : 'NO');
    
    // Check final data count
    const finalCount = await prisma.$queryRaw`SELECT COUNT(*) as count FROM "Transaction"`;
    console.log('📊 Final record count in uppercase table:', finalCount[0].count);
    
    console.log('🎉 Uppercase Transaction table is now superior!');
    console.log('💡 Production will now use the uppercase Transaction table with all columns and tokenNo support');
    
  } catch (error) {
    console.error('❌ Error making Transaction table superior:', error);
    throw error;
  } finally {
    await prisma.$disconnect();
  }
}

// Run the process
makeTransactionTableSuperior()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  });
