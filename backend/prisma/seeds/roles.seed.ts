import { PrismaClient } from '@prisma/client';

export async function seedRoles(prisma: PrismaClient) {
  console.log('🔑 Seeding roles...');

  const roles = [
    {
      name: 'Admin',
      description: 'Full system administrator',
      permissions: JSON.stringify({
        users: { read: true, write: true, delete: true },
        roles: { read: true, write: true, delete: true },
        cities: { read: true, write: true, delete: true },
        parties: { read: true, write: true, delete: true },
        branches: { read: true, write: true, delete: true },
        transactions: { read: true, write: true, delete: true },
        accounting: { read: true, write: true, delete: true },
        reports: { read: true, write: true },
        dashboard: { read: true },
      }),
      isActive: true,
    },
    {
      name: 'Operator',
      description: 'Day-to-day operations user',
      permissions: JSON.stringify({
        users: { read: true },
        roles: { read: true },
        cities: { read: true },
        parties: { read: true, write: true, delete: true },
        branches: { read: true },
        transactions: { read: true, write: true, delete: true },
        accounting: { read: true, write: true },
        reports: { read: true },
        dashboard: { read: true },
      }),
      isActive: true,
    },
    {
      name: 'Viewer',
      description: 'Read-only access',
      permissions: JSON.stringify({
        users: { read: true },
        roles: { read: true },
        cities: { read: true },
        parties: { read: true },
        branches: { read: true },
        transactions: { read: true },
        accounting: { read: true },
        reports: { read: true },
        dashboard: { read: true },
      }),
      isActive: true,
    },
  ];

  for (const role of roles) {
    await prisma.role.upsert({
      where: { name: role.name },
      update: {
        description: role.description,
        permissions: role.permissions,
        isActive: role.isActive,
      },
      create: role,
    });
  }

  console.log('✅ Roles seeded successfully');
}
