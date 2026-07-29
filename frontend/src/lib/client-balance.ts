/**
 * Client balance calculation — same ledger builder as customer report + client ledger.
 * Used by dashboard customer review; balance sheet page uses the builder directly.
 */
import { transactionApi } from '@/lib/transactions';
import { fetchAllModuleHistoryData, ModuleHistoryData } from '@/lib/fetch-all-history';
import type { ClientMatchOptions } from '@/lib/client-match';
import {
  buildClientLedgerEntries,
  getClientBalanceFromLedgerEntries,
  getLedgerMatchOptions,
} from '@/lib/client-ledger';

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
  client: { id?: string; name: string; knownNames?: string[]; branchId?: string },
  moduleData: ModuleDataCache,
  matchOptions?: ClientMatchOptions,
) {
  const matchOpts = matchOptions ?? getLedgerMatchOptions(client.branchId, {
    historyIsBranchScoped: false,
  });
  const entries = buildClientLedgerEntries(
    {
      id: client.id || '',
      name: client.name,
      knownNames: client.knownNames || [client.name],
      branchId: client.branchId,
    },
    moduleData,
    matchOpts,
  );
  return getClientBalanceFromLedgerEntries(entries);
}

const sortByAmountDesc = (rows: ClientBalanceRow[]) =>
  [...rows].sort((a, b) => b.amount - a.amount);

/** Dashboard customer review: top N clients by highest collection (income) or payout (expense) first. */
export async function getDashboardCustomerReview(
  limit = 10,
  branchId?: string | null,
): Promise<{
  incomeClients: ClientBalanceRow[];
  expenseClients: ClientBalanceRow[];
}> {
  const branchOpts = branchId ? { branchId } : undefined;
  const moduleData = await fetchAllModuleHistoryData(branchOpts);
  const allClients = await transactionApi.getClients(
    branchOpts ?? { useDefaultBranchHeader: true },
  );

  const incomeClients: ClientBalanceRow[] = [];
  const expenseClients: ClientBalanceRow[] = [];

  for (const client of allClients) {
    const clientBranchId = client.branchId || branchId || undefined;
    const { balance } = calculateClientBalance(
      { ...client, branchId: clientBranchId },
      moduleData,
      getLedgerMatchOptions(clientBranchId, {
        historyIsBranchScoped: Boolean(branchId),
      }),
    );

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
