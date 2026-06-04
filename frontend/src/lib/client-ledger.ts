import { transactionApi } from '@/lib/transactions';
import { accountingApi } from '@/lib/accounting';
import { getHawalaEntries } from '@/lib/hawala';
import { getSpecialEntries } from '@/lib/specialEntry';

export const CLIENT_HISTORY_PARAMS = { page: 1, limit: 1000, allDates: true as const };

export interface ClientLedgerEntry {
  date: string;
  time: string;
  module: string;
  description: string;
  debit: number;
  credit: number;
  balance: number;
  reference: string;
}

export interface ClientLedgerClient {
  id: string;
  name: string;
  createdAt?: string;
  mobileNumber?: string;
}

/** Fetch ledger entries for a client from all modules (same logic as Customer Report). */
export async function fetchClientLedgerEntries(client: ClientLedgerClient): Promise<ClientLedgerEntry[]> {
  const ledgerEntries: ClientLedgerEntry[] = [];
  const clientName = client.name.toLowerCase();

  const [outwardTxns, inwardTxns] = await Promise.all([
    transactionApi.getTransactions({ type: 'OUTWARD', ...CLIENT_HISTORY_PARAMS }),
    transactionApi.getTransactions({ type: 'INWARD', ...CLIENT_HISTORY_PARAMS }),
  ]);

  const allTxns = [...(outwardTxns.transactions || []), ...(inwardTxns.transactions || [])];

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

      const otherParty = receiverName === clientName ? senderName : receiverName;
      const descParts = [txn.type, otherParty];
      if (txn.center?.name) descParts.push(`Center: ${txn.center.name}`);
      else if (txn.centerId) descParts.push(`Center: ${txn.centerId}`);
      if (txn.amountType) descParts.push(txn.amountType);
      if (txn.remark) descParts.push(`Remark: ${txn.remark}`);
      ledgerEntries.push({
        date: txn.date,
        time: txn.time ? new Date(txn.time).toTimeString().slice(0, 5) : '',
        module: 'Transaction',
        description: descParts.join(' - '),
        debit: debitAmount,
        credit: creditAmount,
        balance: 0,
        reference: txn.transactionId || txn.id,
      });
    }
  });

  const accEntries = await accountingApi.getAccountEntries(CLIENT_HISTORY_PARAMS);
  (accEntries.entries || []).forEach((entry) => {
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
        reference: entry.id,
      });
    }
  });

  const hawalaEntries = await getHawalaEntries(CLIENT_HISTORY_PARAMS);
  (hawalaEntries.data || []).forEach((entry) => {
    const partyA = entry.partyA?.toLowerCase() || '';
    const partyB = entry.partyB?.toLowerCase() || '';

    if (partyA === clientName || partyB === clientName) {
      const isCredit = partyA === clientName;
      const descParts = [entry.partyA, 'from', entry.partyB];
      if (entry.remark) descParts.push(`Remark: ${entry.remark}`);
      ledgerEntries.push({
        date: entry.date,
        time: entry.time ? new Date(entry.time).toTimeString().slice(0, 5) : '',
        module: 'Hawala',
        description: descParts.join(' - '),
        debit: isCredit ? 0 : (entry.amount || 0),
        credit: isCredit ? (entry.amount || 0) : 0,
        balance: 0,
        reference: entry.id,
      });
    }
  });

  const splEntries = await getSpecialEntries(CLIENT_HISTORY_PARAMS);
  (splEntries.data || []).forEach((entry) => {
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
        time: entry.time ? new Date(entry.time).toTimeString().slice(0, 5) : '',
        module: 'Special Entry',
        description: descParts.join(' - '),
        debit: isCredit ? 0 : amount,
        credit: isCredit ? amount : 0,
        balance: 0,
        reference: entry.id,
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
