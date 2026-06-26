/**
 * Client balance calculation — same logic as Final Balance Sheet page.
 * Used by dashboard customer review only; balance sheet page is unchanged.
 */
import { transactionApi } from '@/lib/transactions';
import { fetchAllModuleHistoryData, ModuleHistoryData } from '@/lib/fetch-all-history';
import {
  accountingEntryInvolvesClient,
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
  client: { id?: string; name: string },
  moduleData: ModuleDataCache,
) {
  let totalCredit = 0;
  let totalDebit = 0;
  const clientRef = { id: client.id || '', name: client.name };

  moduleData.transactions.forEach((txn: any) => {
    if (!transactionInvolvesClient(txn, clientRef)) return;

    if (txn.type === 'OUTWARD') {
      if (txn.amountType === 'CREDIT' && isTransactionSender(txn, clientRef)) {
        totalDebit += (txn.amount || 0) + (txn.commission || 0);
      } else {
        totalCredit += (txn.amount || 0) + (txn.centerCommission || 0);
      }
    } else if (txn.type === 'INWARD') {
      if (txn.amountType === 'CREDIT' && isTransactionReceiver(txn, clientRef)) {
        totalCredit += txn.amount || 0;
      } else {
        totalDebit += txn.amount || 0;
      }
    }
  });

  moduleData.accounting.forEach((entry: any) => {
    if (accountingEntryInvolvesClient(entry, clientRef)) {
      if (entry.type === 'INCOME') {
        totalCredit += entry.creditAmount || entry.amount || 0;
      } else if (entry.type === 'EXPENSE') {
        totalDebit += entry.debitAmount || entry.amount || 0;
      }
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
