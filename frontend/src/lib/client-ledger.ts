import { Transaction } from '@/lib/transactions';
import { AccountingEntry } from '@/lib/accounting';
import { HawalaEntry } from '@/lib/hawala';
import { SpecialEntry } from '@/lib/specialEntry';
import {
  fetchAllAccountEntries,
  fetchAllHawalaEntries,
  fetchAllModuleHistoryData,
  fetchAllSpecialEntries,
  fetchAllTransactions,
  ModuleHistoryData,
} from '@/lib/fetch-all-history';
import { useBranchStore } from '@/store/branch-store';
import {
  accountingEntryInvolvesClient,
  isPartyNameMatch,
  isTransactionReceiver,
  isTransactionSender,
  transactionInvolvesClient,
  type ClientMatchOptions,
} from '@/lib/client-match';
import { formatCurrency, formatDate, matchesTableSearch } from '@/lib/utils';
import { useAuthStore } from '@/store';

export type ClientLedgerModule = 'Transaction' | 'Accounting' | 'Hawala' | 'Special Entry';


export interface ClientLedgerEntry {
  date: string;
  time: string;
  module: ClientLedgerModule;
  description: string;
  debit: number;
  credit: number;
  balance: number;
  reference: string;
  sourceId: string;
  branchCode?: string;
  transactionType?: 'OUTWARD' | 'INWARD';
  createdAt?: string;
  updatedAt?: string;
}

export interface ClientLedgerClient {
  id: string;
  name: string;
  knownNames?: string[];
  branchId?: string;
  createdAt?: string;
  mobileNumber?: string;
}

export type ClientLedgerSourceRecord =
  | Transaction
  | AccountingEntry
  | HawalaEntry
  | SpecialEntry;

function formatTxnTime(time?: string): string {
  if (!time) return '';
  try {
    return new Date(time).toTimeString().slice(0, 5);
  } catch {
    return time.slice(0, 5);
  }
}

function getBranchCodeLookup(): Map<string, string> {
  const branches = useBranchStore.getState().assignedBranches;
  return new Map(branches.map((branch) => [branch.id, branch.code]));
}

function resolveBranchCode(
  branchId: string | null | undefined,
  lookup: Map<string, string>
): string | undefined {
  if (!branchId) return undefined;
  return lookup.get(branchId);
}

/** Load the underlying module record for a ledger row (uses existing list APIs). */
export async function fetchSourceRecordForLedgerEntry(
  entry: ClientLedgerEntry,
): Promise<ClientLedgerSourceRecord | null> {
  switch (entry.module) {
    case 'Transaction': {
      const [outwardTxns, inwardTxns] = await Promise.all([
        fetchAllTransactions('OUTWARD'),
        fetchAllTransactions('INWARD'),
      ]);
      const allTxns = [...outwardTxns, ...inwardTxns];
      return allTxns.find((txn) => txn.id === entry.sourceId) || null;
    }
    case 'Accounting': {
      const accEntries = await fetchAllAccountEntries();
      return accEntries.find((row) => row.id === entry.sourceId) || null;
    }
    case 'Hawala': {
      const hawalaEntries = await fetchAllHawalaEntries();
      return hawalaEntries.find((row) => row.id === entry.sourceId) || null;
    }
    case 'Special Entry': {
      const splEntries = await fetchAllSpecialEntries();
      return splEntries.find((row) => row.id === entry.sourceId) || null;
    }
    default:
      return null;
  }
}

function isClientLedgerCreditTransaction(txn: { amountType?: string | null }): boolean {
  const amountType = (txn.amountType || '').toUpperCase();
  return amountType === 'CREDIT' || amountType === 'ACCOUNT / CREDIT';
}

function isCurrentUserSuperAdmin(): boolean {
  try {
    const user = useAuthStore.getState().user;
    const raw = user?.role?.permissions;
    const permissions =
      typeof raw === 'string' ? JSON.parse(raw) : raw;
    return permissions?.masterData === 'full_access';
  } catch {
    return false;
  }
}

/**
 * Branch users fetch history already scoped to the client branch — allow null-branchId
 * name matches so SA-created legacy rows appear. Super Admin list APIs ignore the
 * branch header (unscoped), so keep null name-match off for them.
 */
export function getLedgerMatchOptions(clientBranchId?: string | null): ClientMatchOptions {
  if (!clientBranchId || isCurrentUserSuperAdmin()) return {};
  return { treatNullEntryBranchAsMatch: true };
}

/** Build ledger rows for a client from pre-fetched module data (shared by ledger view + customer report). */
export function buildClientLedgerEntries(
  client: ClientLedgerClient,
  data: ModuleHistoryData,
  matchOptions?: ClientMatchOptions,
): ClientLedgerEntry[] {
  const ledgerEntries: ClientLedgerEntry[] = [];
  const clientRef = {
    id: client.id,
    name: client.name,
    knownNames: client.knownNames || [client.name],
    branchId: client.branchId,
  };
  const matchOpts = matchOptions ?? getLedgerMatchOptions(client.branchId);
  const branchLookup = getBranchCodeLookup();

  const { transactions: allTxns, accounting: accEntries, hawala: hawalaEntries, specialEntry: splEntries } = data;

  allTxns.forEach((txn) => {
    if (!transactionInvolvesClient(txn, clientRef, matchOpts)) return;
    // CASH bookings/cuttings do not affect client ledger — only CREDIT entries do
    if (!isClientLedgerCreditTransaction(txn)) return;

    let debitAmount = 0;
    let creditAmount = 0;

    if (txn.type === 'OUTWARD') {
      if (!isTransactionSender(txn, clientRef, matchOpts)) return;
      debitAmount = (txn.amount || 0) + (txn.commission || 0);
    } else if (txn.type === 'INWARD') {
      if (!isTransactionReceiver(txn, clientRef, matchOpts)) return;
      creditAmount = txn.amount || 0;
    } else {
      return;
    }

    const otherParty = isTransactionReceiver(txn, clientRef, matchOpts)
      ? txn.senderName
      : txn.receiverName;
    const descParts = [txn.type, otherParty];
    if (txn.center?.name) descParts.push(`Center: ${txn.center.name}`);
    else if (txn.centerId) descParts.push(`Center: ${txn.centerId}`);
    if (txn.amountType) descParts.push(txn.amountType);
    if (txn.remark) descParts.push(`Remark: ${txn.remark}`);
    ledgerEntries.push({
      date: txn.date,
      time: formatTxnTime(txn.time),
      module: 'Transaction',
      description: descParts.join(' - '),
      debit: debitAmount,
      credit: creditAmount,
      balance: 0,
      reference: txn.transactionId || txn.id,
      sourceId: txn.id,
      branchCode: resolveBranchCode(txn.branchId, branchLookup),
      transactionType: txn.type as 'OUTWARD' | 'INWARD',
      createdAt: txn.createdAt,
      updatedAt: txn.updatedAt,
    });
  });

  accEntries.forEach((entry) => {
    if (!accountingEntryInvolvesClient(entry, clientRef, matchOpts)) return;

    const isCredit = entry.type === 'INCOME';
    const descParts: string[] = entry.type ? [entry.type] : [];
    const categoryName =
      typeof entry.category === 'string' ? entry.category : entry.category?.name;
    if (categoryName) descParts.push(categoryName);
    if (entry.description?.trim()) descParts.push(`Remark: ${entry.description.trim()}`);

    const timeSource = entry.statusTime || entry.time || entry.createdAt;
    const accountingTime = timeSource
      ? new Date(timeSource).toTimeString().slice(0, 5)
      : '';

    ledgerEntries.push({
      date: entry.date,
      time: accountingTime,
      module: 'Accounting',
      description: descParts.join(' - '),
      debit: isCredit ? 0 : (entry.debitAmount || entry.amount || 0),
      credit: isCredit ? (entry.creditAmount || entry.amount || 0) : 0,
      balance: 0,
      reference: entry.entryId || entry.transactionId || entry.id,
      sourceId: entry.id,
      branchCode: resolveBranchCode(entry.branchId, branchLookup),
      createdAt: entry.createdAt,
      updatedAt: entry.updatedAt,
    });
  });

  hawalaEntries.forEach((entry) => {
    const isPartyA = isPartyNameMatch(entry.partyA, clientRef, entry.branchId, matchOpts);
    const isPartyB = isPartyNameMatch(entry.partyB, clientRef, entry.branchId, matchOpts);

    if (isPartyA || isPartyB) {
      const isCredit = isPartyA;
      const descParts = [entry.partyA, 'from', entry.partyB];
      if (entry.remark) descParts.push(`Remark: ${entry.remark}`);
      ledgerEntries.push({
        date: entry.date,
        time: formatTxnTime(entry.time),
        module: 'Hawala',
        description: descParts.join(' - '),
        debit: isCredit ? 0 : (entry.amount || 0),
        credit: isCredit ? (entry.amount || 0) : 0,
        balance: 0,
        reference: entry.transactionId || entry.id,
        sourceId: entry.id,
        branchCode: resolveBranchCode(entry.branchId, branchLookup),
        createdAt: entry.createdAt,
        updatedAt: entry.updatedAt,
      });
    }
  });

  splEntries.forEach((entry) => {
    const isPartyA = isPartyNameMatch(entry.partyA, clientRef, entry.branchId, matchOpts);
    const isPartyB = isPartyNameMatch(entry.partyB, clientRef, entry.branchId, matchOpts);
    const isPartyC = isPartyNameMatch(entry.partyC, clientRef, entry.branchId, matchOpts);

    if (isPartyA || isPartyB || isPartyC) {
      let isCredit = false;
      let amount = 0;
      let descParts: string[] = [];

      if (isPartyA) {
        isCredit = false;
        amount = entry.amountA || 0;
        descParts = ['SPL', `Expense to ${entry.partyB}`, `Amount A: ${amount}`];
      } else if (isPartyB) {
        isCredit = true;
        amount = entry.amountB || 0;
        descParts = ['SPL', `Income from ${entry.partyA}`, `Amount B: ${amount}`];
      } else if (isPartyC) {
        const amountC = entry.amountC || 0;
        isCredit = amountC > 0;
        amount = Math.abs(amountC);
        descParts = ['SPL', `${isCredit ? 'Income' : 'Expense'} (Remaining A-B)`, `Amount C: ${amountC}`];
      }

      if (entry.remark) descParts.push(`Remark: ${entry.remark}`);
      ledgerEntries.push({
        date: entry.date,
        time: formatTxnTime(entry.time),
        module: 'Special Entry',
        description: descParts.join(' - '),
        debit: isCredit ? 0 : amount,
        credit: isCredit ? amount : 0,
        balance: 0,
        reference: entry.transactionId || entry.id,
        sourceId: entry.id,
        branchCode: resolveBranchCode(entry.branchId, branchLookup),
        createdAt: entry.createdAt,
        updatedAt: entry.updatedAt,
      });
    }
  });

  ledgerEntries.sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime());
  let runningBalance = 0;
  ledgerEntries.forEach((entry) => {
    runningBalance += (entry.credit || 0) - (entry.debit || 0);
    entry.balance = runningBalance;
  });

  return ledgerEntries;
}

/** Summary totals from ledger rows — matches the client ledger top balance. */
export function getClientBalanceFromLedgerEntries(entries: ClientLedgerEntry[]): {
  balance: number;
  credit: number;
  debit: number;
} {
  if (entries.length === 0) {
    return { balance: 0, credit: 0, debit: 0 };
  }

  const credit = entries.reduce((sum, entry) => sum + (entry.credit || 0), 0);
  const debit = entries.reduce((sum, entry) => sum + (entry.debit || 0), 0);
  return {
    balance: entries[entries.length - 1].balance,
    credit,
    debit,
  };
}

/** Fetch ledger entries for a client from all modules (scoped to the client's branch). */
export async function fetchClientLedgerEntries(client: ClientLedgerClient): Promise<ClientLedgerEntry[]> {
  const data = await fetchAllModuleHistoryData(
    client.branchId
      ? { branchId: client.branchId }
      : { useDefaultBranchHeader: false }
  );
  return buildClientLedgerEntries(client, data, getLedgerMatchOptions(client.branchId));
}

/** Match ledger row against any visible/searchable value (name, number, amount, date, etc.). */
export function clientLedgerEntryMatchesSearch(
  entry: ClientLedgerEntry,
  client: ClientLedgerClient,
  searchTerm: string,
): boolean {
  const trimmed = searchTerm.trim();
  if (!trimmed) return true;

  const amountValues = [entry.debit, entry.credit, entry.balance].flatMap((amount) => [
    amount,
    formatCurrency(amount),
    formatCurrency(amount).replace(/[₹,\s]/g, ''),
  ]);

  const searchableValues = [
    client.name,
    client.mobileNumber,
    ...(client.knownNames || []),
    formatDate(entry.date),
    entry.date,
    entry.time,
    entry.module,
    entry.description,
    entry.reference,
    entry.sourceId,
    entry.branchCode,
    entry.transactionType,
    entry.createdAt,
    entry.updatedAt,
    ...amountValues,
  ];

  const searchVariants = [trimmed];
  const normalized = trimmed.replace(/[,₹\s]/g, '');
  if (normalized && normalized !== trimmed) {
    searchVariants.push(normalized);
  }

  return searchVariants.some((term) => matchesTableSearch(term, ...searchableValues));
}
