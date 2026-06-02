import { PrismaClient } from '@prisma/client';

export const EMPTY_BRANCH_SCOPE = 'non-existent-branch-id-to-return-empty';

export function isSuperAdminUser(permissions: unknown): boolean {
  return (permissions as { masterData?: string })?.masterData === 'full_access';
}

async function getBranchUserIds(
  prisma: PrismaClient,
  branchId: string
): Promise<string[]> {
  const users = await prisma.user.findMany({
    where: { branchId, isActive: true, isDeleted: false },
    select: { id: true },
  });
  return users.map((user) => user.id);
}

/** Master data scoped strictly by branch (cities, clients/parties). */
export function getMasterBranchFilter(
  userBranchId: string | undefined,
  isSuperAdmin: boolean
): Record<string, unknown> {
  if (isSuperAdmin) return {};
  if (!userBranchId) return { branchId: EMPTY_BRANCH_SCOPE };
  return { branchId: userBranchId };
}

/**
 * Transactional entries: same-branch users share all records.
 * Also includes legacy rows with null branchId created by branch users.
 */
export async function getEntryBranchFilter(
  prisma: PrismaClient,
  userBranchId: string | undefined,
  isSuperAdmin: boolean
): Promise<Record<string, unknown>> {
  if (isSuperAdmin) return {};
  if (!userBranchId) return { branchId: EMPTY_BRANCH_SCOPE };

  const branchUserIds = await getBranchUserIds(prisma, userBranchId);

  return {
    OR: [
      { branchId: userBranchId },
      ...(branchUserIds.length > 0
        ? [{ branchId: null, createdBy: { in: branchUserIds } }]
        : []),
    ],
  };
}

/** Apply entry branch scope without clobbering existing top-level OR (e.g. search). */
export async function applyEntryBranchScope(
  where: Record<string, unknown>,
  prisma: PrismaClient,
  userBranchId: string | undefined,
  isSuperAdmin: boolean
): Promise<void> {
  const filter = await getEntryBranchFilter(prisma, userBranchId, isSuperAdmin);

  if (filter.OR) {
    const andConditions = Array.isArray(where.AND) ? where.AND : [];
    where.AND = [...andConditions, filter];
    return;
  }

  Object.assign(where, filter);
}

export async function resolveUserBranchId(
  prisma: PrismaClient,
  userId: string,
  branchIdFromRequest?: string | null
): Promise<string | null> {
  if (branchIdFromRequest) return branchIdFromRequest;

  const user = await prisma.user.findUnique({
    where: { id: userId },
    select: { branchId: true },
  });

  return user?.branchId ?? null;
}
