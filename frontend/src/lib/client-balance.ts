/**
 * Client balance calculation — same logic as Final Balance Sheet page.
 * Used by dashboard customer review only; balance sheet page is unchanged.
 */
import { transactionApi } from '@/lib/transactions';
import { fetchAllModuleHistoryData, ModuleHistoryData } from '@/lib/fetch-all-history';
import {
  accountingEntryInvolvesClient,
  ClientRef,
  isPartyNameMatch,
  isTransactionReceiver,
  isTransactionSender,
  transactionInvolvesClient,
} from '@/lib/client-match';

export interface ClientBalanceRow {
  name: string;
  amount: number;
}

export type ModuleDataCache = ModuleHistoryData;

/** Debit/credit effect for one transaction row — matches backend balance summary rules. */
export function getTransactionBalanceEffect(
  txn: {
    type?: string;
    amountType?: string | null;
    amount?: number | null;
    commission?: number | null;
    centerCommission?: number | null;
    receiverName?: string | null;
    senderName?: string | null;
    receiverClientId?: string | null;
    senderClientId?: string | null;
  },
  client: ClientRef,
): { debit: number; credit: number } {
  if (!transactionInvolvesClient(txn, client)) {
    return { debit: 0, credit: 0 };
  }

  if (txn.type === 'OUTWARD') {
    if (txn.amountType === 'CREDIT' && isTransactionSender(txn, client)) {
      return {
        debit: (txn.amount || 0) + (txn.commission || 0),
        credit: 0,
      };
    }
    if (isTransactionReceiver(txn, client)) {
      return {
        debit: 0,
        credit: (txn.amount || 0) + (txn.centerCommission || 0),
      };
    }
    return { debit: 0, credit: 0 };
  }

  if (txn.type === 'INWARD') {
    if (txn.amountType === 'CREDIT' && isTransactionReceiver(txn, client)) {
      return { debit: 0, credit: txn.amount || 0 };
    }
    return { debit: txn.amount || 0, credit: 0 };
  }

  return { debit: 0, credit: 0 };
}

export function accumulateModuleBalances(
  client: { id?: string; name: string; knownNames?: string[] },
  moduleData: ModuleDataCache,
) {
  let totalCredit = 0;
  let totalDebit = 0;
  const clientRef = {
    id: client.id || '',
    name: client.name,
    knownNames: client.knownNames || [client.name],
  };

  moduleData.transactions.forEach((txn: any) => {
    const { debit, credit } = getTransactionBalanceEffect(txn, clientRef);
    totalDebit += debit;
    totalCredit += credit;
  });

  moduleData.accounting.forEach((entry: any) => {
    if (!accountingEntryInvolvesClient(entry, clientRef)) return;

    if (entry.type === 'INCOME') {
      totalCredit += entry.creditAmount || entry.amount || 0;
    } else if (entry.type === 'EXPENSE') {
      totalDebit += entry.debitAmount || entry.amount || 0;
    }
  });

  moduleData.hawala.forEach((entry: any) => {
    if (isPartyNameMatch(entry.partyA, clientRef)) {
      totalCredit += entry.amount || 0;
    }
    if (isPartyNameMatch(entry.partyB, clientRef)) {
      totalDebit += entry.amount || 0;
    }
  });

  moduleData.specialEntry.forEach((entry: any) => {
    if (isPartyNameMatch(entry.partyA, clientRef)) {
      totalDebit += entry.amountA || 0;
    }
    if (isPartyNameMatch(entry.partyB, clientRef)) {
      totalCredit += entry.amountB || 0;
    }
    if (isPartyNameMatch(entry.partyC, clientRef)) {
      const amountC = entry.amountC || 0;
      if (amountC > 0) {
        totalCredit += amountC;
      } else {
        totalDebit += Math.abs(amountC);
      }
    }
  });

  return { totalCredit, totalDebit };
}

export async function fetchAllModuleData(): Promise<ModuleDataCache> {
  try {
    return await fetchAllModuleHistoryData();
  } catch (error) {
    console.error('Error fetching module data:', error);
    return {
      transactions: [],
      accounting: [],
      hawala: [],
      specialEntry: [],
    };
  }
}

export function calculateClientBalance(
  client: { id?: string; name: string; knownNames?: string[] },
  moduleData: ModuleDataCache,
) {
  const { totalCredit, totalDebit } = accumulateModuleBalances(client, moduleData);
  const balance = totalCredit - totalDebit;
  return { balance, credit: totalCredit, debit: totalDebit };
}

const sortByAmountDesc = (rows: ClientBalanceRow[]) =>
  [...rows].sort((a, b) => b.amount - a.amount);

/** Dashboard customer review: top N clients by highest collection (income) or payout (expense) first. */
export async function getDashboardCustomerReview(limit = 10): Promise<{
  incomeClients: ClientBalanceRow[];
  expenseClients: ClientBalanceRow[];
}> {
  const moduleData = await fetchAllModuleData();
  const allClients = await transactionApi.getClients();

  const incomeClients: ClientBalanceRow[] = [];
  const expenseClients: ClientBalanceRow[] = [];

  for (const client of allClients) {
    const { balance } = calculateClientBalance(client, moduleData);

    if (balance < 0) {
      incomeClients.push({ name: client.name, amount: Math.abs(balance) });
    } else if (balance > 0) {
      expenseClients.push({ name: client.name, amount: balance });
    }
  }

  return {
    incomeClients: sortByAmountDesc(incomeClients).slice(0, limit),
    expenseClients: sortByAmountDesc(expenseClients).slice(0, limit),
  };
}
