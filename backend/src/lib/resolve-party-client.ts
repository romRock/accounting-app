import { PrismaClient } from '@prisma/client';

import { findPartyIdByAnyKnownName } from './party-name-aliases';

/** Resolve a master client/party id from a display name. */
export async function findPartyIdByName(
  prisma: PrismaClient,
  name: string | null | undefined,
  branchId?: string | null,
): Promise<string | null> {
  return findPartyIdByAnyKnownName(prisma, name, branchId);
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
      },
      data: { receiverClientId: partyId },
    });

    const senderResult = await prisma.transaction.updateMany({
      where: {
        isDeleted: false,
        senderClientId: null,
        senderName: { equals: name, mode: 'insensitive' },
      },
      data: { senderClientId: partyId },
    });

    receiverLinked += receiverResult.count;
    senderLinked += senderResult.count;
  }

  return { receiverLinked, senderLinked };
}
