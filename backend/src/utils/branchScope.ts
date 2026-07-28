import { Request } from 'express';
import { PrismaClient } from '@prisma/client';
import { createError } from '../middlewares/errorHandler';
import { getUserAssignedBranchIds } from './userBranches';

export const EMPTY_BRANCH_SCOPE = 'non-existent-branch-id-to-return-empty';
export const ACTIVE_BRANCH_HEADER = 'x-active-branch-id';

export function isSuperAdminUser(permissions: unknown): boolean {
  return (permissions as { masterData?: string })?.masterData === 'full_access';
}

/**
 * Users whose null-branchId legacy rows should appear inside a branch scope:
 * - anyone assigned via UserBranch
 * - anyone with primary user.branchId (active or inactive — historical creators)
 * - Super Admin users (they often create without stamping branchId)
 */
async function getBranchCreatorIdsForLegacyNull(
  prisma: PrismaClient,
  branchId: string
): Promise<string[]> {
  const [fromAssignments, fromPrimary, usersWithRoles] = await Promise.all([
    prisma.userBranch.findMany({
      where: { branchId },
      select: { userId: true },
    }),
    prisma.user.findMany({
      where: { branchId },
      select: { id: true },
    }),
    prisma.user.findMany({
      where: { isDeleted: false },
      select: {
        id: true,
        role: { select: { permissions: true } },
      },
    }),
  ]);

  const ids = new Set<string>();
  fromAssignments.forEach((row) => ids.add(row.userId));
  fromPrimary.forEach((user) => ids.add(user.id));
  usersWithRoles.forEach((user) => {
    if (isSuperAdminUser(user.role?.permissions)) {
      ids.add(user.id);
    }
  });

  return [...ids];
}

async function getBranchUserIdsForBranches(
  prisma: PrismaClient,
  branchIds: string[]
): Promise<string[]> {
  if (branchIds.length === 0) return [];

  const nested = await Promise.all(
    branchIds.map((id) => getBranchCreatorIdsForLegacyNull(prisma, id))
  );
  return [...new Set(nested.flat())];
}

function buildSingleBranchEntryFilter(
  branchId: string,
  branchUserIds: string[]
): Record<string, unknown> {
  return {
    OR: [
      { branchId },
      ...(branchUserIds.length > 0
        ? [{ branchId: null, createdBy: { in: branchUserIds } }]
        : []),
    ],
  };
}

/** Master data scoped strictly by branch (cities, clients/parties). */
export function getMasterBranchFilter(
  userBranchId: string | undefined,
  isSuperAdmin: boolean,
  assignedBranchIds?: string[]
): Record<string, unknown> {
  if (isSuperAdmin) return {};

  const branchIds =
    assignedBranchIds && assignedBranchIds.length > 0
      ? assignedBranchIds
      : userBranchId
        ? [userBranchId]
        : [];

  if (branchIds.length === 0) return { branchId: EMPTY_BRANCH_SCOPE };
  if (branchIds.length === 1) return { branchId: branchIds[0] };
  return { branchId: { in: branchIds } };
}

/**
 * Transactional entries: same-branch users share all records stamped with that branchId.
 * Also includes legacy null-branchId rows created by branch users or Super Admin.
 * Super Admin with no active branch → unscoped (sees everything).
 */
export async function getEntryBranchFilter(
  prisma: PrismaClient,
  userBranchId: string | undefined,
  isSuperAdmin: boolean,
  assignedBranchIds?: string[],
  activeBranchId?: string | null
): Promise<Record<string, unknown>> {
  // Super Admin unrestricted only when not explicitly scoped to a branch
  if (isSuperAdmin && !activeBranchId) return {};

  if (activeBranchId) {
    const branchUserIds = await getBranchCreatorIdsForLegacyNull(prisma, activeBranchId);
    return buildSingleBranchEntryFilter(activeBranchId, branchUserIds);
  }

  const branchIds =
    assignedBranchIds && assignedBranchIds.length > 0
      ? assignedBranchIds
      : userBranchId
        ? [userBranchId]
        : [];

  if (branchIds.length === 0) return { branchId: EMPTY_BRANCH_SCOPE };

  if (branchIds.length === 1) {
    const branchUserIds = await getBranchCreatorIdsForLegacyNull(prisma, branchIds[0]);
    return buildSingleBranchEntryFilter(branchIds[0], branchUserIds);
  }

  const branchUserIds = await getBranchUserIdsForBranches(prisma, branchIds);
  return {
    OR: [
      { branchId: { in: branchIds } },
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
  isSuperAdmin: boolean,
  assignedBranchIds?: string[],
  activeBranchId?: string | null
): Promise<void> {
  const filter = await getEntryBranchFilter(
    prisma,
    userBranchId,
    isSuperAdmin,
    assignedBranchIds,
    activeBranchId
  );

  if (filter.OR) {
    const andConditions = Array.isArray(where.AND) ? where.AND : [];
    where.AND = [...andConditions, filter];
    return;
  }

  Object.assign(where, filter);
}

export async function resolveActiveTransactionBranchId(
  req: Request,
  prisma: PrismaClient
): Promise<string | null> {
  const userId = req.user?.id;
  if (!userId) return null;

  const permissions = req.user?.role?.permissions;
  const isSuperAdmin = isSuperAdminUser(permissions);

  const assignedBranchIds =
    req.user?.assignedBranchIds ??
    (await getUserAssignedBranchIds(prisma, userId));

  const headerValue = req.headers[ACTIVE_BRANCH_HEADER];
  const headerBranchId = Array.isArray(headerValue)
    ? headerValue[0]
    : headerValue;

  if (headerBranchId) {
    // Super Admin may act on any branch; others only on assigned
    if (!isSuperAdmin && !assignedBranchIds.includes(headerBranchId)) {
      throw createError('Branch not assigned to user', 403);
    }
    return headerBranchId;
  }

  return assignedBranchIds[0] ?? req.user?.branchId ?? null;
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

/** Read X-Active-Branch-Id without falling back to first assigned. */
export function getActiveBranchHeaderFromRequest(req: Request): string | null {
  const headerValue = req.headers[ACTIVE_BRANCH_HEADER];
  const headerBranchId = Array.isArray(headerValue)
    ? headerValue[0]
    : headerValue;
  return headerBranchId || null;
}

/**
 * Master list scope: active header → that branch;
 * else all assigned branches; super admin optional query branchId.
 */
export function applyMasterBranchListFilter(
  where: Record<string, unknown>,
  req: Request,
  options?: { branchIdQuery?: string | null; permissions?: unknown }
): void {
  const permissions = options?.permissions ?? req.user?.role?.permissions;
  const assigned = req.user?.assignedBranchIds ?? [];

  if (options?.branchIdQuery) {
    if (!isSuperAdminUser(permissions)) {
      if (assigned.length > 0 && !assigned.includes(options.branchIdQuery)) {
        throw createError('Branch not assigned to user', 403);
      }
    }
    where.branchId = options.branchIdQuery;
    return;
  }

  if (isSuperAdminUser(permissions)) {
    return;
  }

  const headerBranchId = getActiveBranchHeaderFromRequest(req);

  if (headerBranchId) {
    if (assigned.length > 0 && !assigned.includes(headerBranchId)) {
      throw createError('Branch not assigned to user', 403);
    }
    where.branchId = headerBranchId;
    return;
  }

  if (assigned.length === 1) {
    where.branchId = assigned[0];
  } else if (assigned.length > 1) {
    where.branchId = { in: assigned };
  } else if (req.user?.branchId) {
    where.branchId = req.user.branchId;
  } else {
    where.branchId = EMPTY_BRANCH_SCOPE;
  }
}

/** Whether the user may modify a record belonging to recordBranchId. */
export function canModifyBranchRecord(
  req: Request,
  recordBranchId: string | null | undefined,
  permissions?: unknown
): boolean {
  if (isSuperAdminUser(permissions ?? req.user?.role?.permissions)) return true;

  const assigned = req.user?.assignedBranchIds ?? [];
  if (recordBranchId && assigned.includes(recordBranchId)) return true;
  if (recordBranchId && recordBranchId === req.user?.branchId) return true;
  return false;
}
