import { PrismaClient } from '@prisma/client';
import bcrypt from 'bcryptjs';

const prisma = new PrismaClient();

async function main() {
  console.log('🌱 Starting database seeding...');

  // Create default admin role
  const adminRole = await prisma.role.upsert({
    where: { name: 'Admin' },
    update: {},
    create: {
      name: 'Admin',
      description: 'Full system administrator',
      permissions: {
        users: { read: true, write: true, delete: true },
        roles: { read: true, write: true, delete: true },
        cities: { read: true, write: true, delete: true },
        parties: { read: true, write: true, delete: true },
        branches: { read: true, write: true, delete: true },
        transactions: { read: true, write: true, delete: true },
        accounting: { read: true, write: true, delete: true },
        reports: { read: true, write: true },
        dashboard: { read: true },
      },
      isActive: true,
    },
  });

  // Create default operator role
  const operatorRole = await prisma.role.upsert({
    where: { name: 'Operator' },
    update: {},
    create: {
      name: 'Operator',
      description: 'Day-to-day operations user',
      permissions: {
        users: { read: true },
        roles: { read: true },
        cities: { read: true },
        parties: { read: true, write: true, delete: true },
        branches: { read: true },
        transactions: { read: true, write: true, delete: true },
        accounting: { read: true, write: true },
        reports: { read: true },
        dashboard: { read: true },
      },
      isActive: true,
    },
  });

  // Create default viewer role
  const viewerRole = await prisma.role.upsert({
    where: { name: 'Viewer' },
    update: {},
    create: {
      name: 'Viewer',
      description: 'Read-only access',
      permissions: {
        users: { read: true },
        roles: { read: true },
        cities: { read: true },
        parties: { read: true },
        branches: { read: true },
        transactions: { read: true },
        accounting: { read: true },
        reports: { read: true },
        dashboard: { read: true },
      },
      isActive: true,
    },
  });

  // Create some sample cities first
  const mumbaiCity = await prisma.city.upsert({
    where: { code: 'MUM' },
    update: {},
    create: {
      name: 'Mumbai',
      code: 'MUM',
      state: 'Maharashtra',
      isActive: true,
    },
  });

  const delhiCity = await prisma.city.upsert({
    where: { code: 'DEL' },
    update: {},
    create: {
      name: 'Delhi',
      code: 'DEL',
      state: 'Delhi',
      isActive: true,
    },
  });

  const ahmedabadCity = await prisma.city.upsert({
    where: { code: 'AMD' },
    update: {},
    create: {
      name: 'Ahmedabad',
      code: 'AMD',
      state: 'Gujarat',
      isActive: true,
    },
  });

  const suratCity = await prisma.city.upsert({
    where: { code: 'SUR' },
    update: {},
    create: {
      name: 'Surat',
      code: 'SUR',
      state: 'Gujarat',
      isActive: true,
    },
  });

  const jaipurCity = await prisma.city.upsert({
    where: { code: 'JAI' },
    update: {},
    create: {
      name: 'Jaipur',
      code: 'JAI',
      state: 'Rajasthan',
      isActive: true,
    },
  });

  // Create default branch
  const defaultBranch = await prisma.branch.upsert({
    where: { code: 'HQ' },
    update: {},
    create: {
      name: 'Head Office',
      code: 'HQ',
      address: '123 Main Street, Mumbai',
      phone: '+91-22-12345678',
      email: 'headoffice@accounting.com',
      isActive: true,
    },
  });

  // Create default admin user
  const hashedPassword = await bcrypt.hash('admin123', 12);
  const adminUser = await prisma.user.upsert({
    where: { email: 'admin@accounting.com' },
    update: {},
    create: {
      email: 'admin@accounting.com',
      username: 'admin',
      password: hashedPassword,
      firstName: 'System',
      lastName: 'Administrator',
      phone: '+91-9876543210',
      roleId: adminRole.id,
      branchId: defaultBranch.id,
      isActive: true,
    },
  });

  // Create demo operator user
  const operatorPassword = await bcrypt.hash('operator123', 12);
  const operatorUser = await prisma.user.upsert({
    where: { email: 'operator@accounting.com' },
    update: {},
    create: {
      email: 'operator@accounting.com',
      username: 'operator',
      password: operatorPassword,
      firstName: 'Demo',
      lastName: 'Operator',
      phone: '+91-9876543211',
      roleId: operatorRole.id,
      branchId: defaultBranch.id,
      isActive: true,
    },
  });

  // Create some sample commission rates (using create instead of upsert since no unique constraint)
  await prisma.commissionRate.create({
    data: {
      fromCityId: mumbaiCity.id,
      toCityId: delhiCity.id,
      rateType: 'PERCENTAGE',
      rate: 0.5,
      isActive: true,
    },
  });

  await prisma.commissionRate.create({
    data: {
      fromCityId: mumbaiCity.id,
      toCityId: ahmedabadCity.id,
      rateType: 'PERCENTAGE',
      rate: 0.3,
      isActive: true,
    },
  });

  await prisma.commissionRate.create({
    data: {
      fromCityId: suratCity.id,
      toCityId: delhiCity.id,
      rateType: 'PERCENTAGE',
      rate: 0.4,
      isActive: true,
    },
  });

  await prisma.commissionRate.create({
    data: {
      fromCityId: ahmedabadCity.id,
      toCityId: jaipurCity.id,
      rateType: 'PERCENTAGE',
      rate: 0.35,
      isActive: true,
    },
  });

  console.log('✅ Database seeding completed successfully!');
  console.log('\n📋 Default Login Credentials:');
  console.log('🔑 Admin: admin@accounting.com / admin123');
  console.log('🔑 Operator: operator@accounting.com / operator123');
}

main()
  .catch((e) => {
    console.error('❌ Seeding failed:', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
