import { PrismaClient } from '@prisma/client';

function normalizeName(name: string): string {
  return name.trim().toLowerCase();
}

function addName(set: Set<string>, name?: string | null) {
  if (!name?.trim()) return;
  set.add(name.trim());
}

/** Collect every display name ever used for a party (current, audit history, linked transactions). */
export async function getPartyKnownNames(
  prisma: PrismaClient,
  partyId: string,
): Promise<string[]> {
  const names = new Set<string>();

  const party = await prisma.party.findFirst({
    where: { id: partyId, isDeleted: false },
    select: { name: true },
  });
  addName(names, party?.name);

  const audits = await prisma.auditLog.findMany({
    where: { entity: 'Party', entityId: partyId, action: 'UPDATE' },
    select: { oldValues: true, newValues: true },
  });

  for (const audit of audits) {
    try {
      const oldParty = JSON.parse(audit.oldValues || '{}');
      const newParty = JSON.parse(audit.newValues || '{}');
      addName(names, oldParty.name);
      addName(names, newParty.name);
    } catch {
      // ignore malformed audit rows
    }
  }

  const transactions = await prisma.transaction.findMany({
    where: {
      isDeleted: false,
      OR: [{ receiverClientId: partyId }, { senderClientId: partyId }],
    },
    select: {
      receiverClientId: true,
      senderClientId: true,
      receiverName: true,
      senderName: true,
    },
  });

  for (const txn of transactions) {
    if (txn.receiverClientId === partyId) addName(names, txn.receiverName);
    if (txn.senderClientId === partyId) addName(names, txn.senderName);
  }

  // Include hawala / special-entry spellings that reference this party
  const aliasList = [...names];
  if (aliasList.length > 0) {
    const hawalaEntries = await prisma.hawala.findMany({
      where: {
        isDeleted: false,
        OR: aliasList.flatMap((alias) => [
          { partyA: { equals: alias, mode: 'insensitive' as const } },
          { partyB: { equals: alias, mode: 'insensitive' as const } },
        ]),
      },
      select: { partyA: true, partyB: true },
    });
    for (const entry of hawalaEntries) {
      addName(names, entry.partyA);
      addName(names, entry.partyB);
    }

    const splEntries = await prisma.specialEntry.findMany({
      where: {
        isDeleted: false,
        OR: aliasList.flatMap((alias) => [
          { partyA: { equals: alias, mode: 'insensitive' as const } },
          { partyB: { equals: alias, mode: 'insensitive' as const } },
          { partyC: { equals: alias, mode: 'insensitive' as const } },
        ]),
      },
      select: { partyA: true, partyB: true, partyC: true },
    });
    for (const entry of splEntries) {
      addName(names, entry.partyA);
      addName(names, entry.partyB);
      addName(names, entry.partyC);
    }
  }

  return [...names];
}

export async function buildPartyAliasMap(
  prisma: PrismaClient,
  partyIds: string[],
): Promise<Map<string, string[]>> {
  const aliasMap = new Map<string, Set<string>>();

  for (const partyId of partyIds) {
    aliasMap.set(partyId, new Set<string>());
  }

  if (partyIds.length === 0) {
    return new Map();
  }

  const parties = await prisma.party.findMany({
    where: { id: { in: partyIds }, isDeleted: false },
    select: { id: true, name: true },
  });

  for (const party of parties) {
    addName(aliasMap.get(party.id)!, party.name);
  }

  const audits = await prisma.auditLog.findMany({
    where: {
      entity: 'Party',
      entityId: { in: partyIds },
      action: 'UPDATE',
    },
    select: { entityId: true, oldValues: true, newValues: true },
  });

  for (const audit of audits) {
    const set = aliasMap.get(audit.entityId);
    if (!set) continue;
    try {
      const oldParty = JSON.parse(audit.oldValues || '{}');
      const newParty = JSON.parse(audit.newValues || '{}');
      addName(set, oldParty.name);
      addName(set, newParty.name);
    } catch {
      // ignore malformed audit rows
    }
  }

  const transactions = await prisma.transaction.findMany({
    where: {
      isDeleted: false,
      OR: [
        { receiverClientId: { in: partyIds } },
        { senderClientId: { in: partyIds } },
      ],
    },
    select: {
      receiverClientId: true,
      senderClientId: true,
      receiverName: true,
      senderName: true,
    },
  });

  for (const txn of transactions) {
    if (txn.receiverClientId && aliasMap.has(txn.receiverClientId)) {
      addName(aliasMap.get(txn.receiverClientId)!, txn.receiverName);
    }
    if (txn.senderClientId && aliasMap.has(txn.senderClientId)) {
      addName(aliasMap.get(txn.senderClientId)!, txn.senderName);
    }
  }

  const allAliases = new Set<string>();
  for (const set of aliasMap.values()) {
    for (const name of set) allAliases.add(name);
  }
  if (allAliases.size > 0) {
    const aliasList = [...allAliases];
    const hawalaEntries = await prisma.hawala.findMany({
      where: {
        isDeleted: false,
        OR: aliasList.flatMap((alias) => [
          { partyA: { equals: alias, mode: 'insensitive' as const } },
          { partyB: { equals: alias, mode: 'insensitive' as const } },
        ]),
      },
      select: { partyA: true, partyB: true },
    });
    const splEntries = await prisma.specialEntry.findMany({
      where: {
        isDeleted: false,
        OR: aliasList.flatMap((alias) => [
          { partyA: { equals: alias, mode: 'insensitive' as const } },
          { partyB: { equals: alias, mode: 'insensitive' as const } },
          { partyC: { equals: alias, mode: 'insensitive' as const } },
        ]),
      },
      select: { partyA: true, partyB: true, partyC: true },
    });

    for (const entry of hawalaEntries) {
      for (const [partyId, set] of aliasMap) {
        const partyAliases = new Set([...set].map(normalizeName));
        if (
          partyAliases.has(normalizeName(entry.partyA)) ||
          partyAliases.has(normalizeName(entry.partyB))
        ) {
          addName(set, entry.partyA);
          addName(set, entry.partyB);
        }
      }
    }
    for (const entry of splEntries) {
      for (const [partyId, set] of aliasMap) {
        const partyAliases = new Set([...set].map(normalizeName));
        if (
          partyAliases.has(normalizeName(entry.partyA)) ||
          partyAliases.has(normalizeName(entry.partyB)) ||
          (entry.partyC && partyAliases.has(normalizeName(entry.partyC)))
        ) {
          addName(set, entry.partyA);
          addName(set, entry.partyB);
          addName(set, entry.partyC);
        }
      }
    }
  }

  const result = new Map<string, string[]>();
  for (const [partyId, set] of aliasMap) {
    result.set(partyId, [...set]);
  }
  return result;
}

export function nameMatchesPartyAliases(
  name: string | null | undefined,
  currentName: string,
  knownNames?: string[],
): boolean {
  const normalized = normalizeName(name || '');
  if (!normalized) return false;

  const aliases = new Set<string>([
    normalizeName(currentName),
    ...(knownNames || []).map(normalizeName),
  ]);

  return aliases.has(normalized);
}

/** Resolve party id when entry still uses an older display name from audit history. */
export async function findPartyIdByAnyKnownName(
  prisma: PrismaClient,
  name: string | null | undefined,
  branchId?: string | null,
): Promise<string | null> {
  if (!name?.trim()) return null;

  const branchFilter = branchId
    ? { OR: [{ branchId }, { branchId: null }] }
    : {};

  const direct = await prisma.party.findFirst({
    where: {
      isActive: true,
      isDeleted: false,
      name: { equals: name.trim(), mode: 'insensitive' },
      ...branchFilter,
    },
    select: { id: true },
    orderBy: { createdAt: 'asc' },
  });
  if (direct) return direct.id;

  const audits = await prisma.auditLog.findMany({
    where: { entity: 'Party', action: 'UPDATE' },
    select: { entityId: true, oldValues: true, newValues: true },
    orderBy: { createdAt: 'desc' },
    take: 5000,
  });

  const target = normalizeName(name);
  for (const audit of audits) {
    try {
      const oldParty = JSON.parse(audit.oldValues || '{}');
      const newParty = JSON.parse(audit.newValues || '{}');
      const oldMatch = normalizeName(oldParty.name || '') === target;
      const newMatch = normalizeName(newParty.name || '') === target;
      if (!oldMatch && !newMatch) continue;

      const party = await prisma.party.findFirst({
        where: {
          id: audit.entityId,
          isActive: true,
          isDeleted: false,
          ...branchFilter,
        },
        select: { id: true },
      });
      if (party) return party.id;
    } catch {
      // ignore malformed audit rows
    }
  }

  return null;
}
