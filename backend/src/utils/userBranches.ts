import { PrismaClient } from '@prisma/client';

export interface BranchSummary {
  id: string;
  name: string;
  code: string;
}

export async function getUserAssignedBranchIds(
  prisma: PrismaClient,
  userId: string
): Promise<string[]> {
  const rows = await prisma.userBranch.findMany({
    where: { userId },
    select: { branchId: true },
    orderBy: { createdAt: 'asc' },
  });

  if (rows.length > 0) {
    return rows.map((row) => row.branchId);
  }

  const user = await prisma.user.findUnique({
    where: { id: userId },
    select: { branchId: true },
  });

  return user?.branchId ? [user.branchId] : [];
}

export async function getUserBranchesWithDetails(
  prisma: PrismaClient,
  userId: string
): Promise<BranchSummary[]> {
  const branchIds = await getUserAssignedBranchIds(prisma, userId);
  if (branchIds.length === 0) return [];

  const branches = await prisma.branch.findMany({
    where: {
      id: { in: branchIds },
      isActive: true,
      isDeleted: false,
    },
    select: { id: true, name: true, code: true },
  });

  const branchById = new Map(branches.map((branch) => [branch.id, branch]));
  return branchIds
    .map((id) => branchById.get(id))
    .filter((branch): branch is BranchSummary => Boolean(branch));
}

export function normalizeBranchIds(
  branchIds?: string[] | null,
  branchId?: string | null
): string[] {
  const fromArray = Array.isArray(branchIds)
    ? branchIds.filter((id): id is string => typeof id === 'string' && id.length > 0)
    : [];
  const unique = [...new Set(fromArray)];

  if (unique.length > 0) return unique;
  if (branchId) return [branchId];
  return [];
}

export async function syncUserBranches(
  prisma: PrismaClient,
  userId: string,
  branchIds: string[]
): Promise<void> {
  const uniqueIds = [...new Set(branchIds.filter(Boolean))];

  if (uniqueIds.length > 0) {
    const validBranches = await prisma.branch.findMany({
      where: {
        id: { in: uniqueIds },
        isActive: true,
        isDeleted: false,
      },
      select: { id: true },
    });

    if (validBranches.length !== uniqueIds.length) {
      throw new Error('One or more selected branches are invalid');
    }
  }

  await prisma.$transaction(async (tx) => {
    await tx.userBranch.deleteMany({ where: { userId } });

    if (uniqueIds.length > 0) {
      await tx.userBranch.createMany({
        data: uniqueIds.map((branchId) => ({ userId, branchId })),
      });

      await tx.user.update({
        where: { id: userId },
        data: { branchId: uniqueIds[0] },
      });
      return;
    }

    await tx.user.update({
      where: { id: userId },
      data: { branchId: null },
    });
  });
}
