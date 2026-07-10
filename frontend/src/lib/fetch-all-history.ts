/**
 * Fetches complete history from all entry modules by paging through list APIs.
 * Used by client ledger, customer report, and balance sheet — no record cap.
 */
import { transactionApi, Transaction } from '@/lib/transactions';
import { accountingApi, AccountingEntry } from '@/lib/accounting';
import { getHawalaEntries, HawalaEntry } from '@/lib/hawala';
import { getSpecialEntries, SpecialEntry } from '@/lib/specialEntry';
import { BranchRequestOptions } from '@/lib/branch-headers';

const HISTORY_PAGE_SIZE = 1000;
const ALL_DATES = true as const;

export interface ModuleHistoryData {
  transactions: Transaction[];
  accounting: AccountingEntry[];
  hawala: HawalaEntry[];
  specialEntry: SpecialEntry[];
}

type PaginationMeta = {
  pages?: number;
  totalPages?: number;
  total?: number;
  limit?: number;
};

function resolveTotalPages(
  pagination: PaginationMeta | undefined,
  pageSize: number,
  itemCount: number,
): number {
  if (pagination?.pages) return pagination.pages;
  if (pagination?.totalPages) return pagination.totalPages;
  if (pagination?.total != null) {
    const limit = pagination.limit || pageSize;
    return Math.max(1, Math.ceil(pagination.total / limit));
  }
  return itemCount < pageSize ? 1 : 2;
}

/** History fetches: specific branchId, or all assigned when branchId is 'all'/null with useDefaultBranchHeader false. */
function historyBranchOptions(options?: BranchRequestOptions): BranchRequestOptions {
  if (options?.branchId && options.branchId !== 'all') {
    return { branchId: options.branchId };
  }
  // All branches / combined: omit active header so backend returns all assigned
  return { useDefaultBranchHeader: false };
}

export async function fetchAllTransactions(
  type: 'OUTWARD' | 'INWARD',
  options?: BranchRequestOptions
): Promise<Transaction[]> {
  const all: Transaction[] = [];
  let page = 1;
  let totalPages = 1;
  const branchOpts = historyBranchOptions(options);

  do {
    const response = await transactionApi.getTransactions({
      type,
      page,
      limit: HISTORY_PAGE_SIZE,
      allDates: ALL_DATES,
    }, branchOpts);
    const batch = response.transactions || [];
    all.push(...batch);
    totalPages = resolveTotalPages(response.pagination, HISTORY_PAGE_SIZE, batch.length);
    page++;
  } while (page <= totalPages);

  return all;
}

export async function fetchAllAccountEntries(
  options?: BranchRequestOptions
): Promise<AccountingEntry[]> {
  const all: AccountingEntry[] = [];
  let page = 1;
  let totalPages = 1;
  const branchOpts = historyBranchOptions(options);

  do {
    const response = await accountingApi.getAccountEntries({
      page,
      limit: HISTORY_PAGE_SIZE,
      allDates: ALL_DATES,
    }, branchOpts);
    const batch = response.entries || [];
    all.push(...batch);
    totalPages = resolveTotalPages(response.pagination, HISTORY_PAGE_SIZE, batch.length);
    page++;
  } while (page <= totalPages);

  return all;
}

export async function fetchAllHawalaEntries(
  options?: BranchRequestOptions
): Promise<HawalaEntry[]> {
  const all: HawalaEntry[] = [];
  let page = 1;
  let totalPages = 1;
  const branchOpts = historyBranchOptions(options);

  do {
    const response = await getHawalaEntries({
      page,
      limit: HISTORY_PAGE_SIZE,
      allDates: ALL_DATES,
    }, branchOpts);
    const batch = response.data || [];
    all.push(...batch);
    totalPages = resolveTotalPages(response.pagination, HISTORY_PAGE_SIZE, batch.length);
    page++;
  } while (page <= totalPages);

  return all;
}

export async function fetchAllSpecialEntries(
  options?: BranchRequestOptions
): Promise<SpecialEntry[]> {
  const all: SpecialEntry[] = [];
  let page = 1;
  let totalPages = 1;
  const branchOpts = historyBranchOptions(options);

  do {
    const response = await getSpecialEntries({
      page,
      limit: HISTORY_PAGE_SIZE,
      allDates: ALL_DATES,
    }, branchOpts);
    const batch = response.data || [];
    all.push(...batch);
    totalPages = resolveTotalPages(response.pagination, HISTORY_PAGE_SIZE, batch.length);
    page++;
  } while (page <= totalPages);

  return all;
}

/** Load every active entry from all four modules (paginated under the hood). */
export async function fetchAllModuleHistoryData(
  options?: BranchRequestOptions
): Promise<ModuleHistoryData> {
  const [outwardTxns, inwardTxns, accounting, hawala, specialEntry] = await Promise.all([
    fetchAllTransactions('OUTWARD', options),
    fetchAllTransactions('INWARD', options),
    fetchAllAccountEntries(options),
    fetchAllHawalaEntries(options),
    fetchAllSpecialEntries(options),
  ]);

  return {
    transactions: [...outwardTxns, ...inwardTxns],
    accounting,
    hawala,
    specialEntry,
  };
}
