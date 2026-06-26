import { PrismaClient } from '@prisma/client';

function branchScope(branchId?: string | null) {
  if (!branchId) return {};
  return { OR: [{ branchId }, { branchId: null }] };
}

/** Resolve a master client/party id from a display name. */
export async function findPartyIdByName(
  prisma: PrismaClient,
  name: string | null | undefined,
  branchId?: string | null,
): Promise<string | null> {
  if (!name?.trim()) return null;

  const party = await prisma.party.findFirst({
    where: {
      isActive: true,
      isDeleted: false,
      name: { equals: name.trim(), mode: 'insensitive' },
      ...branchScope(branchId),
    },
    select: { id: true },
    orderBy: { createdAt: 'asc' },
  });

  return party?.id ?? null;
}

/** Fill missing transaction client ids from matching master client names. */
export async function resolveTransactionClientIds(
  prisma: PrismaClient,
  params: {
    receiverName?: string | null;
    senderName?: string | null;
    receiverClientId?: string | null;
    senderClientId?: string | null;
    branchId?: string | null;
  },
): Promise<{ receiverClientId: string | null; senderClientId: string | null }> {
  const receiverClientId =
    params.receiverClientId ||
    (await findPartyIdByName(prisma, params.receiverName, params.branchId));
  const senderClientId =
    params.senderClientId ||
    (await findPartyIdByName(prisma, params.senderName, params.branchId));

  return {
    receiverClientId: receiverClientId || null,
    senderClientId: senderClientId || null,
  };
}

/** Link historical transactions that only have a name string to the party id. */
export async function backfillTransactionClientIdsForParty(
  prisma: PrismaClient,
  partyId: string,
  names: string[],
  branchId?: string | null,
): Promise<{ receiverLinked: number; senderLinked: number }> {
  const uniqueNames = [...new Set(names.map((n) => n.trim()).filter(Boolean))];
  let receiverLinked = 0;
  let senderLinked = 0;

  for (const name of uniqueNames) {
    const receiverResult = await prisma.transaction.updateMany({
      where: {
        isDeleted: false,
        receiverClientId: null,
        receiverName: { equals: name, mode: 'insensitive' },
        ...branchScope(branchId),
      },
      data: { receiverClientId: partyId },
    });

    const senderResult = await prisma.transaction.updateMany({
      where: {
        isDeleted: false,
        senderClientId: null,
        senderName: { equals: name, mode: 'insensitive' },
        ...branchScope(branchId),
      },
      data: { senderClientId: partyId },
    });

    receiverLinked += receiverResult.count;
    senderLinked += senderResult.count;
  }

  return { receiverLinked, senderLinked };
}
