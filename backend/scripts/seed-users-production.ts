import { PrismaClient } from '@prisma/client';
import bcrypt from 'bcryptjs';

const prisma = new PrismaClient({
  datasources: {
    db: {
      url: process.env.DATABASE_URL,
    },
  },
});

async function seedUsersProduction() {
  try {
    console.log('👤 Starting production users seeding...');

    // Get roles first
    const superAdminRole = await prisma.role.findUnique({ where: { name: 'Super Admin' } });
    const adminRole = await prisma.role.findUnique({ where: { name: 'Admin' } });
    const operatorRole = await prisma.role.findUnique({ where: { name: 'Operator' } });
    const cashierRole = await prisma.role.findUnique({ where: { name: 'Cashier' } });

    if (!superAdminRole || !adminRole || !operatorRole || !cashierRole) {
      throw new Error('Required roles not found. Please seed roles first.');
    }

    // Get default branch
    const defaultBranch = await prisma.branch.findUnique({ where: { code: 'HQ' } });
    if (!defaultBranch) {
      throw new Error('Default branch not found. Please seed branches first.');
    }

    const users = [
      {
        email: 'admin@mail.com',
        username: 'admin',
        password: 'admin@1234',
        firstName: 'System',
        lastName: 'Administrator',
        phone: '+91-9876543210',
        roleId: superAdminRole.id,
        branchId: defaultBranch.id,
        isActive: true,
        isDeleted: false
      },
      {
        email: 'manager@mail.com',
        username: 'manager',
        password: 'manager123',
        firstName: 'Accounting',
        lastName: 'Manager',
        phone: '+91-9876543211',
        roleId: adminRole.id,
        branchId: defaultBranch.id,
        isActive: true,
        isDeleted: false
      },
      {
        email: 'operator@mail.com',
        username: 'operator',
        password: 'operator123',
        firstName: 'Demo',
        lastName: 'Operator',
        phone: '+91-9876543212',
        roleId: operatorRole.id,
        branchId: defaultBranch.id,
        isActive: true,
        isDeleted: false
      },
      {
        email: 'cashier@mail.com',
        username: 'cashier',
        password: 'cashier123',
        firstName: 'Front',
        lastName: 'Cashier',
        phone: '+91-9876543213',
        roleId: cashierRole.id,
        branchId: defaultBranch.id,
        isActive: true,
        isDeleted: false
      }
    ];

    for (const user of users) {
      const hashedPassword = await bcrypt.hash(user.password, 12);
      
      await prisma.user.upsert({
        where: { email: user.email },
        update: {
          username: user.username,
          password: hashedPassword,
          firstName: user.firstName,
          lastName: user.lastName,
          phone: user.phone,
          roleId: user.roleId,
          branchId: user.branchId,
          isActive: true,
          isDeleted: false,
        },
        create: {
          ...user,
          password: hashedPassword,
        },
      });
    }

    console.log('✅ Production users seeded successfully');
    console.log('📊 Users created:');
    console.log('   - Super Admin: admin@mail.com (admin@1234)');
    console.log('   - Manager: manager@mail.com (manager123)');
    console.log('   - Operator: operator@mail.com (operator123)');
    console.log('   - Cashier: cashier@mail.com (cashier123)');

  } catch (error) {
    console.error('❌ Error seeding production users:', error);
    throw error;
  } finally {
    await prisma.$disconnect();
  }
}

// Run the seeding function
seedUsersProduction()
  .then(() => {
    console.log('🎉 Production users seeding completed');
    process.exit(0);
  })
  .catch((error) => {
    console.error('💥 Production users seeding failed:', error);
    process.exit(1);
  });
