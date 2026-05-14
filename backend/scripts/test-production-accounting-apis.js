const { PrismaClient } = require('@prisma/client');

const prisma = new PrismaClient({
  datasources: {
    db: {
      url: process.env.DATABASE_URL,
    },
  },
});

async function testProductionAccountingAPIs() {
  try {
    console.log('🔍 Testing production accounting APIs...\n');

    // Test 1: Get Account Categories
    console.log('--- Test 1: Get Account Categories ---');
    try {
      const categories = await prisma.accountCategory.findMany();
      console.log(`✅ Success: Found ${categories.length} categories`);
      console.log(`   Sample:`, JSON.stringify(categories[0], null, 2));
    } catch (error) {
      console.log(`❌ Failed: ${error.message}`);
      console.log(`   Error code: ${error.code}`);
      console.log(`   Error meta:`, error.meta);
    }

    // Test 2: Get Account Entries
    console.log('\n--- Test 2: Get Account Entries ---');
    try {
      const entries = await prisma.accountEntry.findMany({
        include: {
          category: true,
          party: true,
        },
      });
      console.log(`✅ Success: Found ${entries.length} entries`);
      if (entries.length > 0) {
        console.log(`   Sample:`, JSON.stringify(entries[0], null, 2));
      }
    } catch (error) {
      console.log(`❌ Failed: ${error.message}`);
      console.log(`   Error code: ${error.code}`);
      console.log(`   Error meta:`, error.meta);
    }

    // Test 3: Get Next Transaction ID
    console.log('\n--- Test 3: Get Next Transaction ID ---');
    try {
      const lastEntry = await prisma.accountEntry.findFirst({
        where: {
          entryId: {
            startsWith: 'TRN',
          },
          isActive: true,
          isDeleted: false,
        },
        orderBy: {
          createdAt: 'desc',
        },
      });

      if (!lastEntry || !lastEntry.entryId) {
        console.log(`✅ Success: Next ID would be TRN001`);
      } else {
        const match = lastEntry.entryId.match(/TRN(\d+)/);
        if (!match) {
          console.log(`✅ Success: Next ID would be TRN001`);
        } else {
          const nextNumber = parseInt(match[1], 10) + 1;
          console.log(`✅ Success: Next ID would be TRN${nextNumber.toString().padStart(3, '0')}`);
        }
      }
    } catch (error) {
      console.log(`❌ Failed: ${error.message}`);
      console.log(`   Error code: ${error.code}`);
      console.log(`   Error meta:`, error.meta);
    }

    // Test 4: Create a test Account Entry
    console.log('\n--- Test 4: Create Test Account Entry ---');
    try {
      const category = await prisma.accountCategory.findFirst({
        where: { type: 'INCOME' },
      });

      if (!category) {
        console.log(`❌ Failed: No INCOME category found`);
      } else {
        const testEntry = await prisma.accountEntry.create({
          data: {
            entryId: `TEST${Date.now()}`,
            date: new Date(),
            categoryId: category.id,
            amount: 100,
            description: 'Test entry',
            totalAmount: 100,
            type: 'INCOME',
            statusTime: new Date(),
            createdBy: 'test-user',
          },
        });

        console.log(`✅ Success: Created test entry with ID ${testEntry.id}`);
        
        // Clean up test entry
        await prisma.accountEntry.delete({
          where: { id: testEntry.id },
        });
        console.log(`✅ Cleaned up test entry`);
      }
    } catch (error) {
      console.log(`❌ Failed: ${error.message}`);
      console.log(`   Error code: ${error.code}`);
      console.log(`   Error meta:`, error.meta);
    }

    console.log('\n✅ Production accounting API tests completed');
  } catch (error) {
    console.error('❌ Error testing production APIs:', error);
    throw error;
  } finally {
    await prisma.$disconnect();
  }
}

testProductionAccountingAPIs()
  .catch((error) => {
    console.error(error);
    process.exit(1);
  });
