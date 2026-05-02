import { PrismaClient } from '@prisma/client';

export async function seedRBACRoles(prisma: PrismaClient) {
  console.log('🔑 Seeding RBAC roles...');

  const roles = [
    {
      name: 'Super Admin',
      description: 'Full system access with all permissions',
      permissions: JSON.stringify({
        dashboard: { view: true },
        transactions: { outward: true, inward: true },
        accounting: 'all',
        hawala: 'all',
        specialEntry: 'all',
        reports: {
          report_1: true,
          report_2: true,
          report_3: true,
          report_4: true,
          report_5: true,
          report_6: true,
          report_7: true
        },
        balanceSheet: 'all',
        masterData: 'full_access'
      }),
      isActive: true,
    },
    {
      name: 'Admin',
      description: 'Administrative access with most permissions',
      permissions: JSON.stringify({
        dashboard: { view: true },
        transactions: { outward: true, inward: true },
        accounting: 'all',
        hawala: 'all',
        specialEntry: 'all',
        reports: {
          report_1: true,
          report_2: true,
          report_3: true,
          report_4: true,
          report_5: true,
          report_6: true,
          report_7: true
        },
        balanceSheet: 'all',
        masterData: 'full_access'
      }),
      isActive: true,
    },
    {
      name: 'Accountant',
      description: 'Accounting and transaction management',
      permissions: JSON.stringify({
        dashboard: { view: true },
        transactions: { outward: true, inward: false },
        accounting: 'all',
        hawala: 'none',
        specialEntry: 'all',
        reports: {
          report_1: true,
          report_2: true,
          report_3: true,
          report_4: false,
          report_5: false,
          report_6: false,
          report_7: false
        },
        balanceSheet: 'all',
        masterData: 'role_based_access'
      }),
      isActive: true,
    },
    {
      name: 'Operator',
      description: 'Day-to-day operations',
      permissions: JSON.stringify({
        dashboard: { view: true },
        transactions: { outward: true, inward: false },
        accounting: 'none',
        hawala: 'none',
        specialEntry: 'none',
        reports: {
          report_1: true,
          report_2: false,
          report_3: false,
          report_4: false,
          report_5: false,
          report_6: false,
          report_7: false
        },
        balanceSheet: 'none',
        masterData: 'role_based_access'
      }),
      isActive: true,
    },
    {
      name: 'Viewer',
      description: 'Read-only access',
      permissions: JSON.stringify({
        dashboard: { view: true },
        transactions: { outward: false, inward: false },
        accounting: 'none',
        hawala: 'none',
        specialEntry: 'none',
        reports: {
          report_1: false,
          report_2: false,
          report_3: false,
          report_4: false,
          report_5: false,
          report_6: false,
          report_7: false
        },
        balanceSheet: 'none',
        masterData: 'role_based_access'
      }),
      isActive: true,
    }
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

  console.log('✅ RBAC roles seeded successfully');
}
