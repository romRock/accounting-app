/**
 * Production-only: archive all existing users and create 3 fresh login accounts.
 * Does NOT delete transactions, cities, clients, or other business data.
 *
 * Run on VPS:
 *   cd /var/www/accounting-app/backend && npx tsx scripts/reset-fresh-users-production.ts
 */
import { PrismaClient } from '@prisma/client';
import bcrypt from 'bcryptjs';

const prisma = new PrismaClient();

const USERS = {
  superAdmin: {
    email: 'romil-superduper@mail.rom',
    username: 'romil.superadmin',
    password: 'R0m!l#Sup3r_2026$K9xQ7mZp2Ln',
    firstName: 'Romil',
    lastName: 'Super Admin',
    phone: '+91-9000000001',
    roleName: 'Super Admin',
    branchCode: null as string | null,
  },
  pm2: {
    email: 'nishit@pm2.com',
    username: 'nishit.pm2',
    password: 'nishit1212@',
    firstName: 'Nishit',
    lastName: 'PM2',
    phone: '+91-9000000002',
    roleName: 'PM2',
    branchCode: 'PM2',
  },
  vpatel: {
    email: 'parinbhai@mail.com',
    username: 'parinbhai.vp',
    password: 'parin@0007',
    firstName: 'Parin',
    lastName: 'Vpatel',
    phone: '+91-9000000003',
    roleName: 'Vpatel',
    branchCode: 'VP',
  },
};

const BRANCH_USER_PERMISSIONS = {
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
    report_7: true,
  },
  balanceSheet: 'all',
  masterData: 'role_based_access',
  master: {
    users: 'none',
    roles: 'none',
    cities: 'all',
    clients: 'all',
    branches: 'none',
  },
};

const SUPER_ADMIN_PERMISSIONS = {
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
    report_7: true,
  },
  balanceSheet: 'all',
  masterData: 'full_access',
  master: {
    users: 'all',
    roles: 'all',
    cities: 'all',
    clients: 'all',
    branches: 'all',
  },
};

async function ensureBranch(code: string, name: string) {
  return prisma.branch.upsert({
    where: { code },
    update: { name, isActive: true, isDeleted: false },
    create: {
      code,
      name,
      isActive: true,
      isDeleted: false,
    },
  });
}

async function ensureRole(name: string, permissions: object) {
  return prisma.role.upsert({
    where: { name },
    update: {
      permissions,
      isActive: true,
      isDeleted: false,
      description: `${name} role`,
    },
    create: {
      name,
      permissions,
      isActive: true,
      isDeleted: false,
      description: `${name} role`,
    },
  });
}

async function archiveAllUsers() {
  const users = await prisma.user.findMany();
  console.log(`📦 Archiving ${users.length} existing user(s)...`);

  for (const user of users) {
    await prisma.user.update({
      where: { id: user.id },
      data: {
        isActive: false,
        isDeleted: true,
        email: `archived.${user.id}@deleted.local`,
        username: `archived_${user.id}`,
      },
    });
  }

  const sessions = await prisma.userSession.deleteMany({});
  console.log(`🔐 Cleared ${sessions.count} user session(s)`);
}

async function createUser(
  spec: (typeof USERS)['superAdmin'],
  roleId: string,
  branchId: string | null
) {
  const hashedPassword = await bcrypt.hash(spec.password, 12);

  const existing = await prisma.user.findFirst({
    where: {
      OR: [{ email: spec.email }, { username: spec.username }],
      isDeleted: false,
    },
  });

  if (existing) {
    return prisma.user.update({
      where: { id: existing.id },
      data: {
        email: spec.email,
        username: spec.username,
        password: hashedPassword,
        firstName: spec.firstName,
        lastName: spec.lastName,
        phone: spec.phone,
        roleId,
        branchId,
        isActive: true,
        isDeleted: false,
      },
    });
  }

  return prisma.user.create({
    data: {
      email: spec.email,
      username: spec.username,
      password: hashedPassword,
      firstName: spec.firstName,
      lastName: spec.lastName,
      phone: spec.phone,
      roleId,
      branchId,
      isActive: true,
      isDeleted: false,
    },
  });
}

async function main() {
  console.log('🔄 Reset fresh production users (archive old + create 3 new)...\n');

  await archiveAllUsers();

  const pm2Branch = await ensureBranch('PM2', 'PM2 Branch');
  const vpBranch = await ensureBranch('VP', 'VPATEL Branch');
  console.log(`✅ Branches: PM2 (${pm2Branch.id}), VP (${vpBranch.id})`);

  const superAdminRole = await ensureRole('Super Admin', SUPER_ADMIN_PERMISSIONS);
  const pm2Role = await ensureRole('PM2', BRANCH_USER_PERMISSIONS);
  const vpatelRole = await ensureRole('Vpatel', BRANCH_USER_PERMISSIONS);
  console.log('✅ Roles ready: Super Admin, PM2, Vpatel');

  const superAdmin = await createUser(USERS.superAdmin, superAdminRole.id, null);
  const pm2User = await createUser(USERS.pm2, pm2Role.id, pm2Branch.id);
  const vpatelUser = await createUser(USERS.vpatel, vpatelRole.id, vpBranch.id);

  console.log('\n🎉 Fresh users created successfully!\n');
  console.log('═'.repeat(60));
  console.log('1) SUPER ADMIN');
  console.log(`   Email:    ${USERS.superAdmin.email}`);
  console.log(`   Username: ${USERS.superAdmin.username}`);
  console.log(`   Password: ${USERS.superAdmin.password}`);
  console.log(`   Branch:   (none – sees all branches)`);
  console.log('');
  console.log('2) PM2 BRANCH USER');
  console.log(`   Email:    ${USERS.pm2.email}`);
  console.log(`   Username: ${USERS.pm2.username}`);
  console.log(`   Password: ${USERS.pm2.password}`);
  console.log(`   Branch:   ${pm2Branch.name} (${pm2Branch.code})`);
  console.log('');
  console.log('3) VPATEL BRANCH USER');
  console.log(`   Email:    ${USERS.vpatel.email}`);
  console.log(`   Username: ${USERS.vpatel.username}`);
  console.log(`   Password: ${USERS.vpatel.password}`);
  console.log(`   Branch:   ${vpBranch.name} (${vpBranch.code})`);
  console.log('═'.repeat(60));
  console.log('\nUser IDs:', {
    superAdmin: superAdmin.id,
    pm2: pm2User.id,
    vpatel: vpatelUser.id,
  });
  console.log('\n⚠️  Save these passwords securely. Old users are archived (cannot login).');
}

main()
  .catch((err) => {
    console.error('❌ Failed:', err);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
