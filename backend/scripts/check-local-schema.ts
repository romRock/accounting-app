// Check local database schema to match with production
const { PrismaClient } = require('@prisma/client');

const LOCAL_DB_URL = "postgresql://postgres:Romil@7151@localhost:5432/hawala_app";

async function checkLocalSchema() {
  console.log('🔍 Checking local database schema...');
  
  try {
    const prisma = new PrismaClient({
      datasources: {
        db: {
          url: LOCAL_DB_URL
        }
      }
    });
    
    console.log('✅ Connected to local database');
    
    // Get Transaction table schema
    const schema = await prisma.$queryRaw`
      SELECT column_name, data_type 
        FROM information_schema.columns 
        WHERE table_schema = 'public' 
        AND table_name = 'Transaction'
        ORDER BY ordinal_position
      `;
    
    console.log('📊 Local Transaction table schema:');
    schema.forEach(col => {
      console.log(`  ${col.column_name} (${col.data_type})`);
    });
    
    // Check for specific columns
    const hasTransactionId = schema.some(col => col.column_name === 'transactionId');
    const hasTokenNo = schema.some(col => col.column_name === 'tokenNo');
    
    console.log('🔍 Local column analysis:');
    console.log(`  Has transactionId: ${hasTransactionId}`);
    console.log(`  Has tokenNo: ${hasTokenNo}`);
    
    await prisma.$disconnect();
    console.log('🎉 Local schema check completed!');
    
  } catch (error) {
    console.error('❌ Error checking local schema:', error.message);
    process.exit(1);
  }
}

// Run the check
checkLocalSchema();
