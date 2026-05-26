import { PrismaClient } from '@prisma/client';
import bcrypt from 'bcryptjs';

const prisma = new PrismaClient();

async function seedSuperAdmin() {
  console.log('👤 Seeding Super Admin user...');

  try {
    // Get Super Admin role
    const superAdminRole = await prisma.role.findUnique({
      where: { name: 'Super Admin' }
    });

    if (!superAdminRole) {
      throw new Error('Super Admin role not found. Please seed roles first.');
    }

    // Get default branch
    const defaultBranch = await prisma.branch.findUnique({
      where: { code: 'HQ' }
    });

    if (!defaultBranch) {
      throw new Error('Default branch (HQ) not found. Please seed branches first.');
    }

    // Check if super admin already exists
    const existingUser = await prisma.user.findUnique({
      where: { email: 'superadmin@accounting.com' }
    });

    if (existingUser) {
      console.log('ℹ️  Super Admin user already exists. Skipping...');
      console.log('Email: superadmin@accounting.com');
      console.log('Password: SuperAdmin@123');
      return;
    }

    // Create Super Admin user
    const hashedPassword = await bcrypt.hash('SuperAdmin@123', 12);

    const superAdmin = await prisma.user.create({
      data: {
        email: 'superadmin@accounting.com',
        username: 'superadmin',
        password: hashedPassword,
        firstName: 'Super',
        lastName: 'Admin',
        phone: '+1-555-010-0000',
        roleId: superAdminRole.id,
        branchId: defaultBranch.id,
        isActive: true,
      },
    });

    console.log('✅ Super Admin user created successfully!');
    console.log('Email: superadmin@accounting.com');
    console.log('Password: SuperAdmin@123');
    console.log('Username: superadmin');
  } catch (error) {
    console.error('❌ Error seeding Super Admin:', error);
    throw error;
  } finally {
    await prisma.$disconnect();
  }
}

seedSuperAdmin()
  .catch((error) => {
    console.error(error);
    process.exit(1);
  });
