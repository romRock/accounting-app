#!/usr/bin/env tsx

/**
 * Repair historical records after a client name was changed in master data.
 *
 * Usage:
 *   tsx scripts/repair-party-name-references.ts --all
 *   tsx scripts/repair-party-name-references.ts --party-id <id>
 *   tsx scripts/repair-party-name-references.ts --old-name "ssg" --new-name "ssj"
 */

import { PrismaClient } from '@prisma/client';
import {
  syncPartyNameByClientId,
  syncPartyNameReferences,
} from '../src/lib/party-name-sync';
import { backfillTransactionClientIdsForParty } from '../src/lib/resolve-party-client';

const prisma = new PrismaClient();

function getArg(flag: string): string | undefined {
  const index = process.argv.indexOf(flag);
  if (index === -1) return undefined;
  return process.argv[index + 1];
}

async function repairFromAudit(partyId: string) {
  const party = await prisma.party.findFirst({
    where: { id: partyId, isDeleted: false },
  });

  if (!party) {
    console.log(`Party not found: ${partyId}`);
    return;
  }

  const audits = await prisma.auditLog.findMany({
    where: { entity: 'Party', entityId: partyId, action: 'UPDATE' },
    orderBy: { createdAt: 'desc' },
    take: 20,
  });

  let total = 0;

  for (const audit of audits) {
    if (!audit.oldValues || !audit.newValues) continue;

    try {
      const oldParty = JSON.parse(audit.oldValues);
      const newParty = JSON.parse(audit.newValues);
      if (!oldParty.name || !newParty.name || oldParty.name === newParty.name) {
        continue;
      }

      const result = await syncPartyNameReferences(prisma, {
        partyId: party.id,
        oldName: oldParty.name,
        newName: newParty.name,
        branchId: party.branchId,
      });

      const changed = Object.values(result).reduce((sum, count) => sum + count, 0);
      if (changed > 0) {
        total += changed;
        console.log(
          `  ${oldParty.name} -> ${newParty.name}: ${JSON.stringify(result)}`,
        );
      }
    } catch (error) {
      console.error(`  Failed audit ${audit.id}:`, error);
    }
  }

  const idSync = await syncPartyNameByClientId(prisma, party.id, party.name);
  const idChanged = idSync.transactionsReceiver + idSync.transactionsSender;
  if (idChanged > 0) {
    total += idChanged;
    console.log(`  Client-id linked transactions synced: ${JSON.stringify(idSync)}`);
  }

  const backfill = await backfillTransactionClientIdsForParty(
    prisma,
    party.id,
    audits
      .map((audit) => {
        try {
          return JSON.parse(audit.oldValues || '{}').name as string;
        } catch {
          return '';
        }
      })
      .filter(Boolean)
      .concat(party.name),
    party.branchId,
  );
  const backfillChanged = backfill.receiverLinked + backfill.senderLinked;
  if (backfillChanged > 0) {
    total += backfillChanged;
    console.log(`  Backfilled missing client ids: ${JSON.stringify(backfill)}`);
  }

  console.log(`Repaired ${total} records for party ${party.name} (${party.id})`);
}

async function repairExplicit(oldName: string, newName: string) {
  const parties = await prisma.party.findMany({
    where: {
      isDeleted: false,
      name: { equals: newName, mode: 'insensitive' },
    },
  });

  if (parties.length === 0) {
    console.log(`No active party found with name "${newName}"`);
    return;
  }

  for (const party of parties) {
    const result = await syncPartyNameReferences(prisma, {
      partyId: party.id,
      oldName,
      newName: party.name,
      branchId: party.branchId,
    });
    const idSync = await syncPartyNameByClientId(prisma, party.id, party.name);
    const backfill = await backfillTransactionClientIdsForParty(
      prisma,
      party.id,
      [oldName, party.name],
      party.branchId,
    );
    console.log(
      `Party ${party.name}: ${JSON.stringify({ ...result, idSync, backfill })}`,
    );
  }
}

async function main() {
  const repairAll = process.argv.includes('--all');
  const partyId = getArg('--party-id');
  const oldName = getArg('--old-name');
  const newName = getArg('--new-name');

  if (oldName && newName) {
    await repairExplicit(oldName, newName);
    return;
  }

  if (partyId) {
    await repairFromAudit(partyId);
    return;
  }

  if (repairAll) {
    const parties = await prisma.party.findMany({
      where: { isDeleted: false, isActive: true },
      select: { id: true, name: true },
    });

    console.log(`Repairing ${parties.length} parties from audit history...`);
    for (const party of parties) {
      await repairFromAudit(party.id);
    }
    return;
  }

  console.log('Provide --all, --party-id <id>, or --old-name X --new-name Y');
  process.exit(1);
}

main()
  .catch((error) => {
    console.error(error);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
