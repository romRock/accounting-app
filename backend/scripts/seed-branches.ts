import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function seedBranches() {
  console.log('🏢 Seeding branches...');

  const branches = [
    {
      name: 'Head Office',
      code: 'HQ',
      address: '123 Main Street, Mumbai',
      phone: '+91-22-12345678',
      email: 'headoffice@accounting.com',
    },
    {
      name: 'North Branch',
      code: 'NORTH',
      address: '456 North Avenue, Delhi',
      phone: '+91-11-23456789',
      email: 'north@accounting.com',
    },
    {
      name: 'South Branch',
      code: 'SOUTH',
      address: '789 South Road, Bangalore',
      phone: '+91-80-34567890',
      email: 'south@accounting.com',
    },
    {
      name: 'East Branch',
      code: 'EAST',
      address: '321 East Street, Kolkata',
      phone: '+91-33-45678901',
      email: 'east@accounting.com',
    },
    {
      name: 'West Branch',
      code: 'WEST',
      address: '654 West Lane, Ahmedabad',
      phone: '+91-79-56789012',
      email: 'west@accounting.com',
    },
  ];

  for (const branch of branches) {
    await prisma.branch.upsert({
      where: { code: branch.code },
      update: {
        name: branch.name,
        address: branch.address,
        phone: branch.phone,
        email: branch.email,
        isActive: true,
      },
      create: {
        ...branch,
        isActive: true,
      },
    });
  }

  console.log('✅ Branches seeded successfully');
  await prisma.$disconnect();
}

seedBranches()
  .catch((error) => {
    console.error(error);
    process.exit(1);
  });
