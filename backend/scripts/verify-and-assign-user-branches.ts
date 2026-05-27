import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function verifyAndAssignUserBranches() {
  try {
    console.log('🔄 Verifying and assigning user branches...');

    // Find branches
    const pm2Branch = await prisma.branch.findFirst({
      where: { code: 'PM2' }
    });

    const vpBranch = await prisma.branch.findFirst({
      where: { code: 'VP' }
    });

    if (!pm2Branch) {
      console.error('❌ PM2 branch not found');
      return;
    }

    console.log(`✅ PM2 Branch: ${pm2Branch.name} (ID: ${pm2Branch.id})`);
    if (vpBranch) {
      console.log(`✅ VP Branch: ${vpBranch.name} (ID: ${vpBranch.id})`);
    } else {
      console.log('⚠️ VP Branch not found, will create one');
    }

    // Find PM2 user (by email)
    const pm2User = await prisma.user.findFirst({
      where: { email: 'pm2@mail.com' },
      include: { branch: true }
    });

    if (pm2User) {
      console.log(`\n👤 PM2 User found: ${pm2User.username} (${pm2User.email})`);
      console.log(`   Current branch: ${pm2User.branch?.name || 'None'}`);
      
      if (pm2User.branchId !== pm2Branch.id) {
        await prisma.user.update({
          where: { id: pm2User.id },
          data: { branchId: pm2Branch.id }
        });
        console.log(`   ✅ Updated to PM2 branch`);
      } else {
        console.log(`   ✅ Already has correct branch`);
      }
    } else {
      console.log('⚠️ PM2 user not found');
    }

    // Find VPATEL user (by email)
    const vpUser = await prisma.user.findFirst({
      where: { email: 'vpatel@mail.com' },
      include: { branch: true }
    });

    if (vpUser) {
      console.log(`\n👤 VPATEL User found: ${vpUser.username}`);
      console.log(`   Current branch: ${vpUser.branch?.name || 'None'}`);
      
      if (!vpBranch) {
        // Create VP branch
        const newVpBranch = await prisma.branch.create({
          data: {
            name: 'VP Branch',
            code: 'VP',
            address: 'VP Address',
            phone: 'VP Phone'
          }
        });
        console.log(`   ✅ Created VP branch: ${newVpBranch.name} (ID: ${newVpBranch.id})`);
        
        await prisma.user.update({
          where: { id: vpUser.id },
          data: { branchId: newVpBranch.id }
        });
        console.log(`   ✅ Updated to VP branch`);
      } else if (vpUser.branchId !== vpBranch.id) {
        await prisma.user.update({
          where: { id: vpUser.id },
          data: { branchId: vpBranch.id }
        });
        console.log(`   ✅ Updated to VP branch`);
      } else {
        console.log(`   ✅ Already has correct branch`);
      }
    } else {
      console.log('⚠️ VPATEL user not found');
    }

    // Find Super Admin
    const superAdmin = await prisma.user.findFirst({
      where: { username: 'admin' },
      include: { branch: true, role: true }
    });

    if (superAdmin) {
      console.log(`\n👤 Super Admin found: ${superAdmin.username}`);
      console.log(`   Role: ${superAdmin.role?.name}`);
      console.log(`   Branch: ${superAdmin.branch?.name || 'None (expected for Super Admin)'}`);
      console.log(`   ✅ Super Admin should see all data regardless of branch`);
    }

    console.log('\n🎉 User branch verification completed!');

  } catch (error) {
    console.error('❌ Verification failed:', error);
    throw error;
  } finally {
    await prisma.$disconnect();
  }
}

verifyAndAssignUserBranches();
