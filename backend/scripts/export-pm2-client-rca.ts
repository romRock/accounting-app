/**
 * READ-ONLY mega Excel/CSV export for PM2 clients.
 * Enriched with center name, user names, update/delete flags.
 * Does NOT create/update/delete any business data.
 *
 * Usage (on VPS, in backend/):
 *   npx tsx scripts/export-pm2-client-rca.ts
 */
import fs from 'fs';
import path from 'path';
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

const TARGET_NAMES = ['RASMINBHAI PRIME AG', 'JITUBHAI PARMESHVAR'];
const OUT_DIR = path.join(process.cwd(), 'rca-exports');

function csvEscape(value: unknown): string {
  if (value === null || value === undefined) return '';
  const s = String(value);
  if (/[",\n\r]/.test(s)) return `"${s.replace(/"/g, '""')}"`;
  return s;
}

function toCsv(rows: Record<string, unknown>[]): string {
  if (rows.length === 0) return 'no_data\n';
  const headerSet = new Set<string>();
  rows.forEach((r) => Object.keys(r).forEach((k) => headerSet.add(k)));
  const headers = Array.from(headerSet);
  const lines = [
    headers.map(csvEscape).join(','),
    ...rows.map((row) => headers.map((h) => csvEscape(row[h])).join(',')),
  ];
  // BOM so Excel opens UTF-8 correctly
  return `\uFEFF${lines.join('\n')}`;
}

function writeCsv(fileName: string, rows: Record<string, unknown>[]) {
  fs.mkdirSync(OUT_DIR, { recursive: true });
  const filePath = path.join(OUT_DIR, fileName);
  fs.writeFileSync(filePath, toCsv(rows), 'utf8');
  console.log(`✅ Wrote ${rows.length} rows -> ${filePath}`);
}

function normalize(name: string): string {
  return name.trim().toLowerCase().replace(/\s+/g, ' ');
}

function nameMatch(a: string | null | undefined, targets: string[]): boolean {
  if (!a) return false;
  const n = normalize(a);
  return targets.some(
    (t) => n === normalize(t) || n.includes(normalize(t)) || normalize(t).includes(n)
  );
}

function istDate(d: Date | null | undefined): string {
  if (!d) return '';
  return new Intl.DateTimeFormat('en-CA', {
    timeZone: 'Asia/Kolkata',
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
  }).format(d);
}

function istTime(d: Date | null | undefined): string {
  if (!d) return '';
  return new Intl.DateTimeFormat('en-GB', {
    timeZone: 'Asia/Kolkata',
    hour: '2-digit',
    minute: '2-digit',
    second: '2-digit',
    hour12: false,
  }).format(d);
}

function istDateTime(d: Date | null | undefined): string {
  if (!d) return '';
  return `${istDate(d)} ${istTime(d)}`;
}

function wasUpdated(createdAt: Date, updatedAt: Date): boolean {
  return Math.abs(updatedAt.getTime() - createdAt.getTime()) > 2000;
}

async function main() {
  console.log('🔍 READ-ONLY MEGA export — no data will be modified');
  console.log('Targets:', TARGET_NAMES.join(' | '));

  const pm2 = await prisma.branch.findFirst({
    where: { code: 'PM2', isDeleted: false },
  });
  if (!pm2) throw new Error('PM2 branch not found');
  console.log(`Branch PM2 id=${pm2.id}`);

  const [users, cities] = await Promise.all([
    prisma.user.findMany({
      select: {
        id: true,
        email: true,
        username: true,
        firstName: true,
        lastName: true,
        isActive: true,
        isDeleted: true,
      },
    }),
    prisma.city.findMany({
      where: {
        OR: [{ branchId: pm2.id }, { branchId: null }],
      },
      select: {
        id: true,
        name: true,
        code: true,
        branchId: true,
        isActive: true,
        isDeleted: true,
      },
    }),
  ]);

  const userMap = new Map(
    users.map((u) => [
      u.id,
      {
        display: `${u.firstName || ''} ${u.lastName || ''}`.trim() || u.username || u.email,
        username: u.username,
        email: u.email,
      },
    ])
  );
  const centerMap = new Map(
    cities.map((c) => [
      c.id,
      {
        name: c.name,
        code: c.code,
        label: `${c.name}${c.code ? ` (${c.code})` : ''}`,
      },
    ])
  );

  const userLabel = (id: string | null | undefined) => {
    if (!id) return '';
    const u = userMap.get(id);
    if (!u) return id;
    return `${u.display} | ${u.username || u.email}`;
  };

  const centerLabel = (id: string | null | undefined) => {
    if (!id) return '';
    return centerMap.get(id)?.label || id;
  };
  const centerCode = (id: string | null | undefined) => {
    if (!id) return '';
    return centerMap.get(id)?.code || '';
  };
  const centerName = (id: string | null | undefined) => {
    if (!id) return '';
    return centerMap.get(id)?.name || '';
  };

  const parties = await prisma.party.findMany({
    where: {
      branchId: pm2.id,
      OR: TARGET_NAMES.flatMap((name) => [
        { name: { equals: name, mode: 'insensitive' as const } },
        { name: { contains: name.split(' ')[0], mode: 'insensitive' as const } },
      ]),
    },
    orderBy: { createdAt: 'asc' },
  });

  const matchedParties = parties.filter((p) => nameMatch(p.name, TARGET_NAMES));
  console.log(`Found ${matchedParties.length} party record(s) in PM2`);
  matchedParties.forEach((p) =>
    console.log(`  - ${p.name} | ${p.id} | phone=${p.phone || '-'}`)
  );

  const partyIds = matchedParties.map((p) => p.id);
  const partyNames = matchedParties.map((p) => p.name);
  const allNames = [...new Set([...TARGET_NAMES, ...partyNames])];
  const partyNameById = new Map(matchedParties.map((p) => [p.id, p.name]));

  const relatedPartyName = (id: string | null | undefined, fallbackName?: string | null) => {
    if (id && partyNameById.has(id)) return partyNameById.get(id)!;
    if (fallbackName && nameMatch(fallbackName, allNames)) return fallbackName;
    return fallbackName || '';
  };

  // -------- fetch all modules --------
  const txns = await prisma.transaction.findMany({
    where: {
      OR: [{ branchId: pm2.id }, { branchId: null }],
      AND: [
        {
          OR: [
            ...(partyIds.length
              ? [
                  { senderClientId: { in: partyIds } },
                  { receiverClientId: { in: partyIds } },
                ]
              : []),
            ...allNames.flatMap((name) => [
              { senderName: { equals: name, mode: 'insensitive' as const } },
              { receiverName: { equals: name, mode: 'insensitive' as const } },
              { senderName: { contains: name, mode: 'insensitive' as const } },
              { receiverName: { contains: name, mode: 'insensitive' as const } },
            ]),
          ],
        },
      ],
    },
    orderBy: [{ date: 'asc' }, { time: 'asc' }, { createdAt: 'asc' }],
  });

  const filteredTxns = txns.filter(
    (t) =>
      (t.branchId === pm2.id || !t.branchId) &&
      (partyIds.includes(t.senderClientId || '') ||
        partyIds.includes(t.receiverClientId || '') ||
        nameMatch(t.senderName, allNames) ||
        nameMatch(t.receiverName, allNames))
  );

  const accounts = await prisma.accountEntry.findMany({
    where: {
      OR: [{ branchId: pm2.id }, { branchId: null }],
      AND: [
        {
          OR: [
            ...(partyIds.length ? [{ partyId: { in: partyIds } }] : []),
            ...allNames.map((name) => ({
              party: { name: { equals: name, mode: 'insensitive' as const } },
            })),
          ],
        },
      ],
    },
    include: { party: true, category: true },
    orderBy: [{ date: 'asc' }, { createdAt: 'asc' }],
  });

  const filteredAccounts = accounts.filter(
    (e) =>
      (e.branchId === pm2.id || !e.branchId) &&
      (partyIds.includes(e.partyId || '') || nameMatch(e.party?.name, allNames))
  );

  const hawalas = await prisma.hawala.findMany({
    where: {
      OR: [{ branchId: pm2.id }, { branchId: null }],
      AND: [
        {
          OR: allNames.flatMap((name) => [
            { partyA: { equals: name, mode: 'insensitive' as const } },
            { partyB: { equals: name, mode: 'insensitive' as const } },
            { partyA: { contains: name, mode: 'insensitive' as const } },
            { partyB: { contains: name, mode: 'insensitive' as const } },
          ]),
        },
      ],
    },
    orderBy: [{ date: 'asc' }, { createdAt: 'asc' }],
  });

  const filteredHawala = hawalas.filter(
    (h) =>
      (h.branchId === pm2.id || !h.branchId) &&
      (nameMatch(h.partyA, allNames) || nameMatch(h.partyB, allNames))
  );

  const specials = await prisma.specialEntry.findMany({
    where: {
      OR: [{ branchId: pm2.id }, { branchId: null }],
      AND: [
        {
          OR: allNames.flatMap((name) => [
            { partyA: { equals: name, mode: 'insensitive' as const } },
            { partyB: { equals: name, mode: 'insensitive' as const } },
            { partyC: { equals: name, mode: 'insensitive' as const } },
            { partyA: { contains: name, mode: 'insensitive' as const } },
            { partyB: { contains: name, mode: 'insensitive' as const } },
            { partyC: { contains: name, mode: 'insensitive' as const } },
          ]),
        },
      ],
    },
    orderBy: [{ date: 'asc' }, { createdAt: 'asc' }],
  });

  const filteredSpecials = specials.filter(
    (s) =>
      (s.branchId === pm2.id || !s.branchId) &&
      (nameMatch(s.partyA, allNames) ||
        nameMatch(s.partyB, allNames) ||
        nameMatch(s.partyC, allNames))
  );

  // -------- audit logs --------
  const entityIds = [
    ...partyIds,
    ...filteredTxns.map((t) => t.id),
    ...filteredAccounts.map((e) => e.id),
    ...filteredHawala.map((h) => h.id),
    ...filteredSpecials.map((s) => s.id),
  ];

  let audits: Awaited<ReturnType<typeof prisma.auditLog.findMany>> = [];
  try {
    audits = await prisma.auditLog.findMany({
      where: { entityId: { in: entityIds } },
      orderBy: { createdAt: 'asc' },
      take: 10000,
    });
  } catch (err) {
    console.log('ℹ️ Audit logs skipped:', (err as Error).message);
  }

  const auditsByEntity = new Map<string, typeof audits>();
  for (const a of audits) {
    const list = auditsByEntity.get(a.entityId) || [];
    list.push(a);
    auditsByEntity.set(a.entityId, list);
  }

  const auditSummary = (id: string) => {
    const list = auditsByEntity.get(id) || [];
    if (list.length === 0) return { auditCount: 0, auditActions: '', lastAuditAt: '', lastAuditBy: '', auditTrail: '' };
    return {
      auditCount: list.length,
      auditActions: list.map((a) => a.action).join(' | '),
      lastAuditAt: istDateTime(list[list.length - 1].createdAt),
      lastAuditBy: userLabel(list[list.length - 1].createdBy),
      auditTrail: list
        .map(
          (a) =>
            `[${istDateTime(a.createdAt)}] ${a.action} by ${userLabel(a.createdBy)} old=${(a.oldValues || '').slice(0, 120)} new=${(a.newValues || '').slice(0, 120)}`
        )
        .join(' || '),
    };
  };

  type MegaRow = Record<string, unknown>;
  const mega: MegaRow[] = [];

  // Party master rows
  for (const p of matchedParties) {
    const a = auditSummary(p.id);
    mega.push({
      sheetHint: 'PARTY_MASTER',
      module: 'Party',
      targetClient: p.name,
      clientRole: 'MASTER',
      recordDate_IST: istDate(p.createdAt),
      recordTime_IST: istTime(p.createdAt),
      createdAt_IST: istDateTime(p.createdAt),
      updatedAt_IST: istDateTime(p.updatedAt),
      wasUpdated: wasUpdated(p.createdAt, p.updatedAt),
      isActive: p.isActive,
      isDeleted: p.isDeleted,
      deletedAt_IST: '',
      deletedBy: '',
      deletedByName: '',
      enteredByUserId: '',
      enteredByUserName: '',
      branchCode: 'PM2',
      branchId: p.branchId,
      centerId: '',
      centerCode: '',
      centerName: '',
      refNo: p.id,
      tokenNo: '',
      txnType: '',
      status: '',
      amount: '',
      commission: '',
      bookingCommission: '',
      centerCommission: '',
      amountA: '',
      amountB: '',
      amountC: '',
      partyA: '',
      partyB: '',
      partyC: '',
      senderName: '',
      senderClientId: '',
      receiverName: '',
      receiverClientId: '',
      senderNumber: '',
      receiverNumber: '',
      category: '',
      remark_description: `phone=${p.phone || ''} city=${p.city || ''}`,
      sourceId: p.id,
      ...a,
      raw_createdAt_UTC: p.createdAt.toISOString(),
      raw_updatedAt_UTC: p.updatedAt.toISOString(),
    });
  }

  for (const t of filteredTxns) {
    const isSender =
      partyIds.includes(t.senderClientId || '') || nameMatch(t.senderName, allNames);
    const isReceiver =
      partyIds.includes(t.receiverClientId || '') || nameMatch(t.receiverName, allNames);
    const target =
      relatedPartyName(t.senderClientId, t.senderName) ||
      relatedPartyName(t.receiverClientId, t.receiverName) ||
      (isSender ? t.senderName : t.receiverName);
    const a = auditSummary(t.id);
    mega.push({
      sheetHint: 'TRANSACTION',
      module: 'Transaction',
      targetClient: target,
      clientRole: isSender && isReceiver ? 'SENDER+RECEIVER' : isSender ? 'SENDER' : 'RECEIVER',
      recordDate_IST: istDate(t.date),
      recordTime_IST: istTime(t.time),
      createdAt_IST: istDateTime(t.createdAt),
      updatedAt_IST: istDateTime(t.updatedAt),
      wasUpdated: wasUpdated(t.createdAt, t.updatedAt),
      isActive: t.isActive,
      isDeleted: t.isDeleted,
      deletedAt_IST: istDateTime(t.deletedAt),
      deletedBy: t.deletedBy || '',
      deletedByName: userLabel(t.deletedBy),
      enteredByUserId: t.createdBy,
      enteredByUserName: userLabel(t.createdBy),
      branchCode: 'PM2',
      branchId: t.branchId,
      centerId: t.centerId,
      centerCode: centerCode(t.centerId),
      centerName: centerName(t.centerId),
      centerLabel: centerLabel(t.centerId),
      refNo: t.transactionId,
      tokenNo: t.tokenNo ?? '',
      txnType: t.type,
      amountType: t.amountType,
      status: t.status,
      statusTime_IST: istDateTime(t.statusTime),
      amount: t.amount,
      commission: t.commission,
      bookingCommission: t.bookingCommission,
      centerCommission: t.centerCommission,
      autoCommission: t.autoCommission,
      amountA: '',
      amountB: '',
      amountC: '',
      partyA: '',
      partyB: '',
      partyC: '',
      senderName: t.senderName,
      senderClientId: t.senderClientId || '',
      receiverName: t.receiverName,
      receiverClientId: t.receiverClientId || '',
      senderNumber: t.senderNumber || '',
      receiverNumber: t.receiverNumber || '',
      category: '',
      remark_description: t.remark || '',
      sourceId: t.id,
      ...a,
      raw_createdAt_UTC: t.createdAt.toISOString(),
      raw_updatedAt_UTC: t.updatedAt.toISOString(),
    });
  }

  for (const e of filteredAccounts) {
    const a = auditSummary(e.id);
    mega.push({
      sheetHint: 'ACCOUNTING',
      module: 'Accounting',
      targetClient: e.party?.name || relatedPartyName(e.partyId) || '',
      clientRole: 'PARTY',
      recordDate_IST: istDate(e.date),
      recordTime_IST: istTime(e.statusTime),
      createdAt_IST: istDateTime(e.createdAt),
      updatedAt_IST: istDateTime(e.updatedAt),
      wasUpdated: wasUpdated(e.createdAt, e.updatedAt),
      isActive: e.isActive,
      isDeleted: e.isDeleted,
      deletedAt_IST: istDateTime(e.deletedAt),
      deletedBy: e.deletedBy || '',
      deletedByName: userLabel(e.deletedBy),
      enteredByUserId: e.createdBy,
      enteredByUserName: userLabel(e.createdBy),
      branchCode: 'PM2',
      branchId: e.branchId,
      centerId: '',
      centerCode: '',
      centerName: '',
      centerLabel: '',
      refNo: e.entryId,
      tokenNo: '',
      txnType: e.type,
      amountType: e.type,
      status: '',
      statusTime_IST: istDateTime(e.statusTime),
      amount: e.amount,
      totalAmount: e.totalAmount,
      gstAmount: e.gstAmount,
      tdsAmount: e.tdsAmount,
      commission: '',
      bookingCommission: '',
      centerCommission: '',
      amountA: '',
      amountB: '',
      amountC: '',
      partyA: e.party?.name || '',
      partyB: '',
      partyC: '',
      senderName: '',
      senderClientId: '',
      receiverName: '',
      receiverClientId: '',
      senderNumber: '',
      receiverNumber: '',
      partyId: e.partyId || '',
      category: e.category?.name || '',
      paymentMethod: e.paymentMethod || '',
      referenceNo: e.referenceNo || '',
      remark_description: e.description || '',
      sourceId: e.id,
      ...a,
      raw_createdAt_UTC: e.createdAt.toISOString(),
      raw_updatedAt_UTC: e.updatedAt.toISOString(),
    });
  }

  for (const h of filteredHawala) {
    const role =
      nameMatch(h.partyA, allNames) && nameMatch(h.partyB, allNames)
        ? 'PARTY_A+B'
        : nameMatch(h.partyA, allNames)
          ? 'PARTY_A'
          : 'PARTY_B';
    const target = nameMatch(h.partyA, allNames) ? h.partyA : h.partyB;
    const a = auditSummary(h.id);
    mega.push({
      sheetHint: 'HAWALA',
      module: 'Hawala',
      targetClient: target,
      clientRole: role,
      recordDate_IST: istDate(h.date),
      recordTime_IST: istTime(h.time),
      createdAt_IST: istDateTime(h.createdAt),
      updatedAt_IST: istDateTime(h.updatedAt),
      wasUpdated: wasUpdated(h.createdAt, h.updatedAt),
      isActive: h.isActive,
      isDeleted: h.isDeleted,
      deletedAt_IST: istDateTime(h.deletedAt),
      deletedBy: h.deletedBy || '',
      deletedByName: userLabel(h.deletedBy),
      enteredByUserId: h.createdBy,
      enteredByUserName: userLabel(h.createdBy),
      branchCode: 'PM2',
      branchId: h.branchId,
      centerId: '',
      centerCode: '',
      centerName: '',
      centerLabel: '',
      refNo: h.transactionId,
      tokenNo: h.tokenNo ?? '',
      txnType: 'HAWALA',
      amountType: '',
      status: h.status,
      statusTime_IST: istDateTime(h.statusTime),
      amount: h.amount,
      commission: '',
      bookingCommission: '',
      centerCommission: '',
      amountA: '',
      amountB: '',
      amountC: '',
      partyA: h.partyA,
      partyB: h.partyB,
      partyC: '',
      senderName: '',
      senderClientId: '',
      receiverName: '',
      receiverClientId: '',
      senderNumber: '',
      receiverNumber: '',
      category: '',
      remark_description: h.remark || '',
      sourceId: h.id,
      ...a,
      raw_createdAt_UTC: h.createdAt.toISOString(),
      raw_updatedAt_UTC: h.updatedAt.toISOString(),
    });
  }

  for (const s of filteredSpecials) {
    const roles = [
      nameMatch(s.partyA, allNames) ? 'A' : '',
      nameMatch(s.partyB, allNames) ? 'B' : '',
      nameMatch(s.partyC, allNames) ? 'C' : '',
    ].filter(Boolean);
    const target = nameMatch(s.partyA, allNames)
      ? s.partyA
      : nameMatch(s.partyB, allNames)
        ? s.partyB
        : s.partyC || '';
    const a = auditSummary(s.id);
    mega.push({
      sheetHint: 'SPECIAL_ENTRY',
      module: 'Special Entry',
      targetClient: target,
      clientRole: roles.join('+'),
      recordDate_IST: istDate(s.date),
      recordTime_IST: istTime(s.time),
      createdAt_IST: istDateTime(s.createdAt),
      updatedAt_IST: istDateTime(s.updatedAt),
      wasUpdated: wasUpdated(s.createdAt, s.updatedAt),
      isActive: s.isActive,
      isDeleted: s.isDeleted,
      deletedAt_IST: istDateTime(s.deletedAt),
      deletedBy: s.deletedBy || '',
      deletedByName: userLabel(s.deletedBy),
      enteredByUserId: s.createdBy,
      enteredByUserName: userLabel(s.createdBy),
      branchCode: 'PM2',
      branchId: s.branchId,
      centerId: '',
      centerCode: '',
      centerName: '',
      centerLabel: '',
      refNo: s.transactionId,
      tokenNo: s.tokenNo ?? '',
      txnType: 'SPL',
      amountType: '',
      status: s.status,
      statusTime_IST: istDateTime(s.statusTime),
      amount: s.amountA || s.amountB || s.amountC || 0,
      commission: '',
      bookingCommission: '',
      centerCommission: '',
      amountA: s.amountA,
      amountB: s.amountB,
      amountC: s.amountC ?? '',
      partyA: s.partyA,
      partyB: s.partyB,
      partyC: s.partyC || '',
      senderName: '',
      senderClientId: '',
      receiverName: '',
      receiverClientId: '',
      senderNumber: '',
      receiverNumber: '',
      category: '',
      remark_description: s.remark || '',
      sourceId: s.id,
      ...a,
      raw_createdAt_UTC: s.createdAt.toISOString(),
      raw_updatedAt_UTC: s.updatedAt.toISOString(),
    });
  }

  // Full audit log rows (one row per audit event)
  for (const a of audits) {
    mega.push({
      sheetHint: 'AUDIT_EVENT',
      module: 'AuditLog',
      targetClient: '',
      clientRole: a.entity,
      recordDate_IST: istDate(a.createdAt),
      recordTime_IST: istTime(a.createdAt),
      createdAt_IST: istDateTime(a.createdAt),
      updatedAt_IST: '',
      wasUpdated: '',
      isActive: a.isActive,
      isDeleted: a.isDeleted,
      deletedAt_IST: '',
      deletedBy: '',
      deletedByName: '',
      enteredByUserId: a.createdBy,
      enteredByUserName: userLabel(a.createdBy),
      branchCode: 'PM2',
      branchId: '',
      centerId: '',
      centerCode: '',
      centerName: '',
      centerLabel: '',
      refNo: a.entityId,
      tokenNo: '',
      txnType: a.action,
      amountType: '',
      status: '',
      amount: '',
      commission: '',
      bookingCommission: '',
      centerCommission: '',
      amountA: '',
      amountB: '',
      amountC: '',
      partyA: '',
      partyB: '',
      partyC: '',
      senderName: '',
      senderClientId: '',
      receiverName: '',
      receiverClientId: '',
      senderNumber: '',
      receiverNumber: '',
      category: a.entity,
      remark_description: `OLD: ${a.oldValues || ''} | NEW: ${a.newValues || ''}`,
      sourceId: a.id,
      auditCount: 1,
      auditActions: a.action,
      lastAuditAt: istDateTime(a.createdAt),
      lastAuditBy: userLabel(a.createdBy),
      auditTrail: '',
      ipAddress: a.ipAddress || '',
      userAgent: a.userAgent || '',
      raw_createdAt_UTC: a.createdAt.toISOString(),
      raw_updatedAt_UTC: '',
    });
  }

  mega.sort((x, y) => {
    const d = String(x.recordDate_IST).localeCompare(String(y.recordDate_IST));
    if (d !== 0) return d;
    const t = String(x.recordTime_IST).localeCompare(String(y.recordTime_IST));
    if (t !== 0) return t;
    return String(x.createdAt_IST).localeCompare(String(y.createdAt_IST));
  });

  writeCsv('MEGA_ALL_DETAILS.csv', mega);

  // Also keep a clean entries-only mega (no raw audit event rows) for easier reading
  const entriesOnly = mega.filter((r) => r.module !== 'AuditLog');
  writeCsv('MEGA_ENTRIES_ONLY.csv', entriesOnly);

  // Per-client split
  for (const clientName of TARGET_NAMES) {
    const rows = entriesOnly.filter((r) =>
      nameMatch(String(r.targetClient || ''), [clientName])
    );
    const safe = clientName.replace(/\s+/g, '_');
    writeCsv(`MEGA_${safe}.csv`, rows);
  }

  console.log('\n📊 MEGA SUMMARY');
  console.log(`  Total mega rows (with audits): ${mega.length}`);
  console.log(`  Entries only: ${entriesOnly.length}`);
  console.log(`  Transactions: ${filteredTxns.length}`);
  console.log(`  Accounting: ${filteredAccounts.length}`);
  console.log(`  Hawala: ${filteredHawala.length}`);
  console.log(`  Special: ${filteredSpecials.length}`);
  console.log(`  Audit events: ${audits.length}`);
  console.log(`\n📁 Open in Excel: ${path.join(OUT_DIR, 'MEGA_ALL_DETAILS.csv')}`);
  console.log('No database data was changed.');
}

main()
  .catch((err) => {
    console.error('❌ Export failed:', err);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
