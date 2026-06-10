/**
 * Client balance calculation — same logic as Final Balance Sheet page.
 * Used by dashboard customer review only; balance sheet page is unchanged.
 */
import { transactionApi } from '@/lib/transactions';
import { fetchAllModuleHistoryData, ModuleHistoryData } from '@/lib/fetch-all-history';

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

export function calculateClientBalance(client: { name: string }, moduleData: ModuleDataCache) {
  let totalCredit = 0;
  let totalDebit = 0;
  const clientName = client.name.toLowerCase();

  moduleData.transactions.forEach((txn: any) => {
    const receiverName = txn.receiverName?.toLowerCase() || '';
    const senderName = txn.senderName?.toLowerCase() || '';

    if (receiverName === clientName || senderName === clientName) {
      if (txn.type === 'OUTWARD') {
        if (txn.amountType === 'CREDIT' && senderName === clientName) {
          totalDebit += (txn.amount || 0) + (txn.commission || 0);
        } else {
          totalCredit += (txn.amount || 0) + (txn.centerCommission || 0);
        }
      } else if (txn.type === 'INWARD') {
        if (txn.amountType === 'CREDIT' && receiverName === clientName) {
          totalCredit += txn.amount || 0;
        } else {
          totalDebit += txn.amount || 0;
        }
      }
    }
  });

  moduleData.accounting.forEach((entry: any) => {
    const partyName = entry.party?.name?.toLowerCase() || '';
    if (partyName === clientName) {
      if (entry.type === 'INCOME') {
        totalCredit += entry.creditAmount || entry.amount || 0;
      } else if (entry.type === 'EXPENSE') {
        totalDebit += entry.debitAmount || entry.amount || 0;
      }
    }
  });

  moduleData.hawala.forEach((entry: any) => {
    const partyA = entry.partyA?.toLowerCase() || '';
    const partyB = entry.partyB?.toLowerCase() || '';

    if (partyA === clientName) {
      totalCredit += entry.amount || 0;
    }
    if (partyB === clientName) {
      totalDebit += entry.amount || 0;
    }
  });

  moduleData.specialEntry.forEach((entry: any) => {
    const partyA = entry.partyA?.toLowerCase() || '';
    const partyB = entry.partyB?.toLowerCase() || '';
    const partyC = entry.partyC?.toLowerCase() || '';

    if (partyA === clientName) {
      totalDebit += entry.amountA || 0;
    }
    if (partyB === clientName) {
      totalCredit += entry.amountB || 0;
    }
    if (partyC === clientName) {
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
