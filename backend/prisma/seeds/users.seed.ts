import { PrismaClient } from '@prisma/client';
import bcrypt from 'bcryptjs';

export async function seedUsers(prisma: PrismaClient) {
  console.log('👤 Seeding users...');

  // Get roles and branches first
  const superAdminRole = await prisma.role.findUnique({ where: { name: 'Super Admin' } });
  const adminRole = await prisma.role.findUnique({ where: { name: 'Admin' } });
  const operatorRole = await prisma.role.findUnique({ where: { name: 'Operator' } });
  const defaultBranch = await prisma.branch.findUnique({ where: { code: 'HQ' } });

  if (!superAdminRole || !adminRole || !operatorRole || !defaultBranch) {
    throw new Error('Required roles or branch not found. Please seed roles and branches first.');
  }

  const users = [
    {
      email: 'superadmin@accounting.com',
      username: 'superadmin',
      password: 'SuperAdmin@123',
      firstName: 'Super',
      lastName: 'Admin',
      phone: '+1-555-010-0000',
      roleId: superAdminRole.id,
      branchId: defaultBranch.id,
    },
    {
      email: 'admin@mail.com',
      username: 'admin',
      password: 'admin@1234',
      firstName: 'System',
      lastName: 'Administrator',
      phone: '+91-9876543210',
      roleId: adminRole.id,
      branchId: defaultBranch.id,
    },
    {
      email: 'operator@accounting.com',
      username: 'operator',
      password: 'operator123',
      firstName: 'Demo',
      lastName: 'Operator',
      phone: '+91-9876543211',
      roleId: operatorRole.id,
      branchId: defaultBranch.id,
    },
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
      },
      create: {
        ...user,
        password: hashedPassword,
        isActive: true,
      },
    });
  }

  console.log('✅ Users seeded successfully');
}
