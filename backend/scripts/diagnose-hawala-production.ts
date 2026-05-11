import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

export async function diagnoseHawalaProduction() {
  console.log('🔍 Diagnosing Hawala table in production database...');

  try {
    // Step 1: Check database connection
    console.log('📊 Testing database connection...');
    await prisma.$connect();
    console.log('✅ Database connection successful');

    // Step 2: List all tables in the database
    console.log('📋 Listing all tables in database...');
    const tables = await prisma.$queryRaw`
      SELECT table_name 
      FROM information_schema.tables 
      WHERE table_schema = 'public' 
      ORDER BY table_name;
    `;
    
    console.log('Tables found:', tables);
    
    // Step 3: Check specifically for Hawala table
    const hawalaTable = tables.find((table: any) => 
      table.table_name.toLowerCase() === 'hawala'
    );
    
    if (hawalaTable) {
      console.log('✅ Hawala table found in database');
      
      // Step 4: Try to query Hawala table
      console.log('🔍 Testing Hawala table query...');
      try {
        const count = await prisma.hawala.count();
        console.log(`✅ Hawala table accessible, ${count} entries found`);
        
        // Step 5: Show sample data
        if (count > 0) {
          const sample = await prisma.hawala.findFirst();
          console.log('📝 Sample Hawala entry:', sample);
        }
      } catch (queryError: any) {
        console.error('❌ Error querying Hawala table:', queryError.message);
        console.error('Error code:', queryError.code);
      }
    } else {
      console.log('❌ Hawala table NOT found in database');
      
      // Step 4: Show what similar tables exist
      const similarTables = tables.filter((table: any) => 
        table.table_name.toLowerCase().includes('hawala') ||
        table.table_name.toLowerCase().includes('transaction')
      );
      
      if (similarTables.length > 0) {
        console.log('🔍 Similar tables found:', similarTables);
      }
    }

  } catch (error) {
    console.error('❌ Error diagnosing Hawala table:', error);
  } finally {
    await prisma.$disconnect();
  }
}

// Run if this file is executed directly
if (require.main === module) {
  diagnoseHawalaProduction()
    .catch((e) => {
      console.error(e);
      process.exit(1);
    });
}
