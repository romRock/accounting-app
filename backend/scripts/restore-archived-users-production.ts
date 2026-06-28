/**
 * Restore users archived by reset-fresh-users-production.ts (or soft-delete).
 *
 * Safe: only updates the users table (email, username, isActive, isDeleted).
 * Does NOT touch transactions, clients, cities, or any other business data.
 * User IDs and password hashes are preserved from archive time.
 *
 * Original email/username must come from one of:
 *   1) --backup-sql path/to/dump.sql  (pg_dump / local-fresh-for-vps.sql COPY block)
 *   2) audit_logs rows (entity=User, action=DELETE) with oldValues JSON
 *
 * Usage on VPS:
 *   cd /var/www/accounting-app/backend
 *
 *   # Preview only (no writes):
 *   npx tsx scripts/restore-archived-users-production.ts --dry-run
 *
 *   # Restore using a backup dump:
 *   npx tsx scripts/restore-archived-users-production.ts --backup-sql /path/to/backup.sql
 *
 *   # Apply (after reviewing dry-run output):
 *   npx tsx scripts/restore-archived-users-production.ts --backup-sql /path/to/backup.sql --apply
 */
import fs from 'fs';
import path from 'path';
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

type UserSnapshot = {
  id: string;
  email: string;
  username: string;
};

const ARCHIVED_EMAIL_RE = /^archived\.([^@]+)@deleted\.local$/i;
const ARCHIVED_USERNAME_RE = /^archived_([^_]+(?:_[^_]+)*)$/;

function parseArgs() {
  const args = process.argv.slice(2);
  const dryRun = args.includes('--dry-run') || !args.includes('--apply');
  const backupIdx = args.indexOf('--backup-sql');
  const backupSql =
    backupIdx >= 0 && args[backupIdx + 1] ? path.resolve(args[backupIdx + 1]) : null;

  return { dryRun, backupSql };
}

function isArchivedUser(user: { email: string; username: string; isDeleted: boolean }) {
  return (
    user.isDeleted ||
    ARCHIVED_EMAIL_RE.test(user.email) ||
    ARCHIVED_USERNAME_RE.test(user.username)
  );
}

/** Parse users COPY block from pg_dump SQL (tab-separated). */
function parseUsersFromSqlDump(sql: string): Map<string, UserSnapshot> {
  const map = new Map<string, UserSnapshot>();
  const copyMarker = 'COPY public.users';
  let inCopy = false;

  for (const line of sql.split('\n')) {
    if (!inCopy && line.startsWith(copyMarker)) {
      inCopy = true;
      continue;
    }
    if (inCopy) {
      if (line.trim() === '\\.' || line.trim() === '\\\\.') {
        break;
      }
      if (!line.trim()) continue;

      const cols = line.split('\t');
      if (cols.length < 3) continue;

      const [id, email, username] = cols;
      if (!id || !email || !username) continue;
      if (ARCHIVED_EMAIL_RE.test(email)) continue;

      map.set(id, { id, email, username });
    }
  }

  return map;
}

/** Fallback: audit_logs from admin soft-delete (has full user JSON in oldValues). */
async function loadSnapshotsFromAuditLogs(): Promise<Map<string, UserSnapshot>> {
  const map = new Map<string, UserSnapshot>();

  const logs = await prisma.auditLog.findMany({
    where: { entity: 'User', action: 'DELETE' },
    orderBy: { createdAt: 'desc' },
  });

  for (const log of logs) {
    if (!log.oldValues || map.has(log.entityId)) continue;
    try {
      const parsed = JSON.parse(log.oldValues) as {
        id?: string;
        email?: string;
        username?: string;
      };
      if (parsed.id && parsed.email && parsed.username && !ARCHIVED_EMAIL_RE.test(parsed.email)) {
        map.set(parsed.id, {
          id: parsed.id,
          email: parsed.email,
          username: parsed.username,
        });
      }
    } catch {
      // skip malformed
    }
  }

  return map;
}

async function main() {
  const { dryRun, backupSql } = parseArgs();

  console.log(dryRun ? '🔍 DRY RUN (pass --apply to write changes)\n' : '🚀 APPLYING user restore\n');

  const snapshots = new Map<string, UserSnapshot>();

  if (backupSql) {
    if (!fs.existsSync(backupSql)) {
      console.error(`❌ Backup file not found: ${backupSql}`);
      process.exit(1);
    }
    console.log(`📂 Reading user snapshots from: ${backupSql}`);
    const sql = fs.readFileSync(backupSql, 'utf8');
    for (const [id, row] of parseUsersFromSqlDump(sql)) {
      snapshots.set(id, row);
    }
    console.log(`   Found ${snapshots.size} user row(s) in backup\n`);
  }

  const auditSnapshots = await loadSnapshotsFromAuditLogs();
  for (const [id, row] of auditSnapshots) {
    if (!snapshots.has(id)) snapshots.set(id, row);
  }
  if (auditSnapshots.size > 0) {
    console.log(`📋 Added ${auditSnapshots.size} snapshot(s) from audit_logs\n`);
  }

  const allUsers = await prisma.user.findMany({
    orderBy: { createdAt: 'asc' },
  });

  const archived = allUsers.filter(isArchivedUser);
  const active = allUsers.filter((u) => !isArchivedUser(u));

  console.log(`👥 Total users: ${allUsers.length}`);
  console.log(`   Archived/inactive: ${archived.length}`);
  console.log(`   Active: ${active.length}\n`);

  if (archived.length === 0) {
    console.log('✅ No archived users found. Nothing to restore.');
    return;
  }

  const activeEmails = new Set(active.map((u) => u.email.toLowerCase()));
  const activeUsernames = new Set(active.map((u) => u.username.toLowerCase()));

  let restored = 0;
  let skipped = 0;
  const skippedReasons: string[] = [];

  for (const user of archived) {
    const snapshot = snapshots.get(user.id);

    if (!snapshot) {
      skipped++;
      skippedReasons.push(
        `  - ${user.id}: no backup snapshot (email now: ${user.email}) — need pg_dump from before archive`
      );
      continue;
    }

    const emailTaken =
      activeEmails.has(snapshot.email.toLowerCase()) &&
      active.find((u) => u.email.toLowerCase() === snapshot.email.toLowerCase())?.id !== user.id;
    const usernameTaken =
      activeUsernames.has(snapshot.username.toLowerCase()) &&
      active.find((u) => u.username.toLowerCase() === snapshot.username.toLowerCase())?.id !==
        user.id;

    if (emailTaken || usernameTaken) {
      skipped++;
      skippedReasons.push(
        `  - ${user.id}: conflict — ${snapshot.email} / ${snapshot.username} already used by another active user`
      );
      continue;
    }

    console.log(`✅ Restore: ${user.id}`);
    console.log(`     email:    ${user.email} → ${snapshot.email}`);
    console.log(`     username: ${user.username} → ${snapshot.username}`);
    console.log(`     flags:    isActive=true, isDeleted=false`);
    console.log(`     password: unchanged (same hash as before archive)\n`);

    if (!dryRun) {
      await prisma.user.update({
        where: { id: user.id },
        data: {
          email: snapshot.email,
          username: snapshot.username,
          isActive: true,
          isDeleted: false,
        },
      });
    }

    restored++;
    activeEmails.add(snapshot.email.toLowerCase());
    activeUsernames.add(snapshot.username.toLowerCase());
  }

  console.log('═'.repeat(60));
  console.log(dryRun ? 'DRY RUN SUMMARY' : 'RESTORE SUMMARY');
  console.log(`  Would restore / restored: ${restored}`);
  console.log(`  Skipped:                  ${skipped}`);

  if (skippedReasons.length > 0) {
    console.log('\nSkipped details:');
    skippedReasons.forEach((line) => console.log(line));
  }

  if (skipped > 0 && !backupSql) {
    console.log('\n💡 Tip: export a pre-archive backup from Hostinger snapshot, then:');
    console.log('   pg_dump -t users ... > /tmp/users-backup.sql');
    console.log('   npx tsx scripts/restore-archived-users-production.ts --backup-sql /tmp/users-backup.sql --apply');
  }

  if (!dryRun && restored > 0) {
    console.log('\n🔐 Cleared stale sessions so users can log in fresh.');
    await prisma.userSession.deleteMany({
      where: { userId: { in: archived.map((u) => u.id) } },
    });
    console.log('🎉 Done. Users can log in with their original email and password.');
  } else if (dryRun && restored > 0) {
    console.log('\n👉 Re-run with --apply when output looks correct.');
  }
}

main()
  .catch((err) => {
    console.error('❌ Failed:', err);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
