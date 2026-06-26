import { Prisma, PrismaClient } from '@prisma/client';

export interface PartyNameSyncResult {
  transactionsReceiver: number;
  transactionsSender: number;
  hawalaPartyA: number;
  hawalaPartyB: number;
  specialEntryPartyA: number;
  specialEntryPartyB: number;
  specialEntryPartyC: number;
}

function namesEqual(a: string, b: string): boolean {
  return a.trim().toLowerCase() === b.trim().toLowerCase();
}

function branchScope(branchId?: string | null): Prisma.TransactionWhereInput {
  if (!branchId) return {};
  return { OR: [{ branchId }, { branchId: null }] };
}

/**
 * When a party/client name changes in master data, update denormalized name
 * fields on historical records so reports and hisab keep matching.
 */
export async function syncPartyNameReferences(
  prisma: PrismaClient,
  params: {
    partyId: string;
    oldName: string;
    newName: string;
    branchId?: string | null;
  },
): Promise<PartyNameSyncResult> {
  const { partyId, oldName, newName, branchId } = params;

  if (!oldName?.trim() || !newName?.trim() || namesEqual(oldName, newName)) {
    return {
      transactionsReceiver: 0,
      transactionsSender: 0,
      hawalaPartyA: 0,
      hawalaPartyB: 0,
      specialEntryPartyA: 0,
      specialEntryPartyB: 0,
      specialEntryPartyC: 0,
    };
  }

  const scopedBranch = branchScope(branchId);

  const receiverResult = await prisma.transaction.updateMany({
    where: {
      isDeleted: false,
      OR: [
        { receiverClientId: partyId },
        {
          receiverName: { equals: oldName, mode: 'insensitive' },
          ...scopedBranch,
        },
      ],
    },
    data: { receiverName: newName },
  });

  const senderResult = await prisma.transaction.updateMany({
    where: {
      isDeleted: false,
      OR: [
        { senderClientId: partyId },
        {
          senderName: { equals: oldName, mode: 'insensitive' },
          ...scopedBranch,
        },
      ],
    },
    data: { senderName: newName },
  });

  const hawalaPartyAResult = await prisma.hawala.updateMany({
    where: {
      isDeleted: false,
      partyA: { equals: oldName, mode: 'insensitive' },
      ...scopedBranch,
    },
    data: { partyA: newName },
  });

  const hawalaPartyBResult = await prisma.hawala.updateMany({
    where: {
      isDeleted: false,
      partyB: { equals: oldName, mode: 'insensitive' },
      ...scopedBranch,
    },
    data: { partyB: newName },
  });

  const specialPartyAResult = await prisma.specialEntry.updateMany({
    where: {
      isDeleted: false,
      partyA: { equals: oldName, mode: 'insensitive' },
      ...scopedBranch,
    },
    data: { partyA: newName },
  });

  const specialPartyBResult = await prisma.specialEntry.updateMany({
    where: {
      isDeleted: false,
      partyB: { equals: oldName, mode: 'insensitive' },
      ...scopedBranch,
    },
    data: { partyB: newName },
  });

  const specialPartyCResult = await prisma.specialEntry.updateMany({
    where: {
      isDeleted: false,
      partyC: { equals: oldName, mode: 'insensitive' },
      ...scopedBranch,
    },
    data: { partyC: newName },
  });

  return {
    transactionsReceiver: receiverResult.count,
    transactionsSender: senderResult.count,
    hawalaPartyA: hawalaPartyAResult.count,
    hawalaPartyB: hawalaPartyBResult.count,
    specialEntryPartyA: specialPartyAResult.count,
    specialEntryPartyB: specialPartyBResult.count,
    specialEntryPartyC: specialPartyCResult.count,
  };
}

/** Fix records linked by party id that still carry a stale display name. */
export async function syncPartyNameByClientId(
  prisma: PrismaClient,
  partyId: string,
  currentName: string,
): Promise<{ transactionsReceiver: number; transactionsSender: number }> {
  const receiverResult = await prisma.transaction.updateMany({
    where: {
      isDeleted: false,
      receiverClientId: partyId,
      NOT: { receiverName: { equals: currentName, mode: 'insensitive' } },
    },
    data: { receiverName: currentName },
  });

  const senderResult = await prisma.transaction.updateMany({
    where: {
      isDeleted: false,
      senderClientId: partyId,
      NOT: { senderName: { equals: currentName, mode: 'insensitive' } },
    },
    data: { senderName: currentName },
  });

  return {
    transactionsReceiver: receiverResult.count,
    transactionsSender: senderResult.count,
  };
}
