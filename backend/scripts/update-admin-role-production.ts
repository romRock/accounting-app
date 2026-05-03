import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient({
  datasources: {
    db: {
      url: process.env.DATABASE_URL,
    },
  },
});

async function updateAdminRoleProduction() {
  try {
    console.log('🔧 Updating admin role permissions in production...');

    // Find the admin role
    const adminRole = await prisma.role.findFirst({
      where: {
        name: {
          in: ['Admin', 'Super Admin']
        }
      }
    });

    if (!adminRole) {
      console.log('❌ No admin role found to update');
      return;
    }

    console.log(`✅ Found admin role: ${adminRole.name}`);

    // Parse existing permissions
    let existingPermissions;
    try {
      existingPermissions = typeof adminRole.permissions === 'string' 
        ? JSON.parse(adminRole.permissions) 
        : adminRole.permissions;
    } catch (error) {
      console.error('❌ Error parsing existing permissions:', error);
      existingPermissions = {};
    }

    console.log('📋 Current permissions:', existingPermissions);

    // Update with complete permission structure
    const updatedPermissions = {
      // Keep existing permissions
      ...existingPermissions,
      // Add missing permissions
      hawala: 'all',
      specialEntry: 'all',
      balanceSheet: 'all',
      masterData: 'full_access',
      // Ensure dashboard has proper permissions
      dashboard: existingPermissions.dashboard || { read: true },
      // Ensure transactions has proper permissions
      transactions: existingPermissions.transactions || { outward: true, inward: true },
      // Ensure accounting has proper permissions
      accounting: existingPermissions.accounting || 'all',
      // Ensure reports has proper permissions
      reports: existingPermissions.reports || {
        report_1: true,
        report_2: true,
        report_3: true,
        report_4: true,
        report_5: true,
        report_6: true,
        report_7: true
      }
    };

    console.log('🔄 Updating admin role with complete permissions...');
    console.log('📝 Updated permissions:', updatedPermissions);

    // Update the admin role
    const updatedRole = await prisma.role.update({
      where: { id: adminRole.id },
      data: {
        permissions: JSON.stringify(updatedPermissions),
        updatedAt: new Date()
      }
    });

    console.log('✅ Admin role updated successfully!');
    console.log('📊 Updated role:', updatedRole);

  } catch (error) {
    console.error('❌ Error updating admin role:', error);
    throw error;
  } finally {
    await prisma.$disconnect();
  }
}

// Run the update
updateAdminRoleProduction()
  .then(() => {
    console.log('🎉 Admin role update completed successfully!');
    process.exit(0);
  })
  .catch((error) => {
    console.error('💥 Fatal error during admin role update:', error);
    process.exit(1);
  });
