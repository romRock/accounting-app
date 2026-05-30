/**
 * Seed PM2 branch clients from CSV (name + phone only).
 * Also assigns all cities with null branchId to PM2.
 *
 * Usage (from backend/):
 *   npx tsx scripts/seed-parties-pm2-from-csv.ts
 *   REPLACE_PM2_CLIENTS=1 npx tsx scripts/seed-parties-pm2-from-csv.ts
 *
 * REPLACE_PM2_CLIENTS=1 removes existing PM2 clients before import (recommended first run).
 */

import { PrismaClient } from '@prisma/client';
import * as fs from 'fs';
import * as path from 'path';

const prisma = new PrismaClient();
const CSV_PATH = path.join(__dirname, '..', 'data', 'parties_rows.csv');
const BATCH_SIZE = 50;
const REPLACE_PM2_CLIENTS =
  process.env.REPLACE_PM2_CLIENTS === '1' || process.argv.includes('--fresh');

interface CsvClientRow {
  name: string;
  phone: string | null;
}

function parseCsvRow(line: string): CsvClientRow | null {
  const trimmed = line.trim();
  if (!trimmed) return null;

  const parts = trimmed.split(',');
  if (parts.length < 3) return null;

  const name = parts[1]?.trim();
  if (!name) return null;

  const phoneRaw = parts[2]?.trim();
  const phone = phoneRaw && phoneRaw.length > 0 ? phoneRaw : null;

  return { name, phone };
}

function loadClientsFromCsv(filePath: string): CsvClientRow[] {
  if (!fs.existsSync(filePath)) {
    throw new Error(`CSV not found: ${filePath}`);
  }

  const lines = fs.readFileSync(filePath, 'utf-8').split(/\r?\n/);
  const rows: CsvClientRow[] = [];
  const seenNames = new Set<string>();

  for (let i = 1; i < lines.length; i++) {
    const row = parseCsvRow(lines[i]);
    if (!row) continue;

    const key = row.name.toLowerCase();
    if (seenNames.has(key)) continue;
    seenNames.add(key);
    rows.push(row);
  }

  return rows;
}

async function assignCitiesToPm2(pm2BranchId: string) {
  const result = await prisma.city.updateMany({
    where: { branchId: null, isDeleted: false },
    data: { branchId: pm2BranchId },
  });
  return result.count;
}

async function main() {
  console.log('==========================================');
  console.log('  PM2 clients seed from CSV (name+phone)  ');
  console.log('==========================================\n');

  const pm2Branch = await prisma.branch.findFirst({
    where: { code: 'PM2', isDeleted: false },
  });

  if (!pm2Branch) {
    throw new Error('PM2 branch not found. Run db:reset:fresh-users:production first.');
  }

  console.log(`PM2 branch: ${pm2Branch.name} (${pm2Branch.id})\n`);

  const citiesUpdated = await assignCitiesToPm2(pm2Branch.id);
  console.log(`Cities assigned to PM2 (was null branchId): ${citiesUpdated}`);

  const existingPm2Cities = await prisma.city.count({
    where: { branchId: pm2Branch.id, isDeleted: false, isActive: true },
  });
  console.log(`Total active cities on PM2 branch: ${existingPm2Cities}\n`);

  if (REPLACE_PM2_CLIENTS) {
    const deleted = await prisma.party.deleteMany({
      where: {
        OR: [{ branchId: pm2Branch.id }, { branchId: null }],
      },
    });
    console.log(`Removed existing PM2 / unassigned clients: ${deleted.count}`);
  }

  const clients = loadClientsFromCsv(CSV_PATH);
  console.log(`Rows to import from CSV: ${clients.length}\n`);

  let inserted = 0;
  let skipped = 0;
  let errors = 0;

  for (let i = 0; i < clients.length; i += BATCH_SIZE) {
    const batch = clients.slice(i, i + BATCH_SIZE);
    const batchNum = Math.floor(i / BATCH_SIZE) + 1;
    const totalBatches = Math.ceil(clients.length / BATCH_SIZE);
    console.log(`Batch ${batchNum}/${totalBatches}...`);

    for (const client of batch) {
      try {
        const existing = await prisma.party.findFirst({
          where: {
            branchId: pm2Branch.id,
            isDeleted: false,
            name: { equals: client.name, mode: 'insensitive' },
          },
        });

        if (existing) {
          if (client.phone && existing.phone !== client.phone) {
            await prisma.party.update({
              where: { id: existing.id },
              data: { phone: client.phone },
            });
          }
          skipped++;
          continue;
        }

        await prisma.party.create({
          data: {
            name: client.name,
            phone: client.phone,
            branchId: pm2Branch.id,
            isActive: true,
            isDeleted: false,
          },
        });
        inserted++;
      } catch (err) {
        errors++;
        console.error(`  Error for "${client.name}":`, err);
      }
    }
  }

  const pm2PartyCount = await prisma.party.count({
    where: { branchId: pm2Branch.id, isDeleted: false, isActive: true },
  });

  console.log('\n==========================================');
  console.log('Summary');
  console.log('==========================================');
  console.log(`Inserted: ${inserted}`);
  console.log(`Skipped (already existed): ${skipped}`);
  console.log(`Errors: ${errors}`);
  console.log(`PM2 active clients now: ${pm2PartyCount}`);
  console.log(`PM2 active cities now: ${existingPm2Cities}`);
  console.log('\nSuper admin (full_access) sees all branches.');
  console.log('PM2 user sees only PM2 branch cities + clients.');
}

main()
  .catch((e) => {
    console.error('Seed failed:', e);
    process.exit(1);
  })
  .finally(() => prisma.$disconnect());
