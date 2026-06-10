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
} from '@/lib/fetch-all-history';

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
  transactionType?: 'OUTWARD' | 'INWARD';
  createdAt?: string;
  updatedAt?: string;
}

export interface ClientLedgerClient {
  id: string;
  name: string;
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

/** Fetch ledger entries for a client from all modules (same logic as Customer Report). */
export async function fetchClientLedgerEntries(client: ClientLedgerClient): Promise<ClientLedgerEntry[]> {
  const ledgerEntries: ClientLedgerEntry[] = [];
  const clientName = client.name.toLowerCase();

  const { transactions: allTxns, accounting: accEntries, hawala: hawalaEntries, specialEntry: splEntries } =
    await fetchAllModuleHistoryData();

  allTxns.forEach((txn) => {
    const receiverName = txn.receiverName?.toLowerCase() || '';
    const senderName = txn.senderName?.toLowerCase() || '';

    if (receiverName === clientName || senderName === clientName) {
      let debitAmount = 0;
      let creditAmount = 0;

      if (txn.type === 'OUTWARD') {
        if (txn.amountType === 'CREDIT' && senderName === clientName) {
          debitAmount = (txn.amount || 0) + (txn.commission || 0);
          creditAmount = 0;
        } else {
          debitAmount = 0;
          creditAmount = (txn.amount || 0) + (txn.centerCommission || 0);
        }
      } else if (txn.type === 'INWARD') {
        if (txn.amountType === 'CREDIT' && receiverName === clientName) {
          debitAmount = 0;
          creditAmount = txn.amount || 0;
        } else {
          debitAmount = txn.amount || 0;
          creditAmount = 0;
        }
      }

      const otherParty = receiverName === clientName ? txn.senderName : txn.receiverName;
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
        transactionType: txn.type as 'OUTWARD' | 'INWARD',
        createdAt: txn.createdAt,
        updatedAt: txn.updatedAt,
      });
    }
  });

  accEntries.forEach((entry) => {
    const partyName = entry.party?.name?.toLowerCase() || '';

    if (partyName === clientName) {
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
        createdAt: entry.createdAt,
        updatedAt: entry.updatedAt,
      });
    }
  });

  hawalaEntries.forEach((entry) => {
    const partyA = entry.partyA?.toLowerCase() || '';
    const partyB = entry.partyB?.toLowerCase() || '';

    if (partyA === clientName || partyB === clientName) {
      const isCredit = partyA === clientName;
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
        createdAt: entry.createdAt,
        updatedAt: entry.updatedAt,
      });
    }
  });

  splEntries.forEach((entry) => {
    const partyA = entry.partyA?.toLowerCase() || '';
    const partyB = entry.partyB?.toLowerCase() || '';
    const partyC = entry.partyC?.toLowerCase() || '';

    if (partyA === clientName || partyB === clientName || partyC === clientName) {
      let isCredit = false;
      let amount = 0;
      let descParts: string[] = [];

      if (partyA === clientName) {
        isCredit = false;
        amount = entry.amountA || 0;
        descParts = ['SPL', `Expense to ${entry.partyB}`, `Amount A: ${amount}`];
      } else if (partyB === clientName) {
        isCredit = true;
        amount = entry.amountB || 0;
        descParts = ['SPL', `Income from ${entry.partyA}`, `Amount B: ${amount}`];
      } else if (partyC === clientName) {
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
