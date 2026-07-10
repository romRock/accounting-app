import { useBranchStore } from '@/store/branch-store';

/** Active branch headers from the shared branch store (all entry modules). */
export function getTransactionBranchHeaders(): Record<string, string> {
  return useBranchStore.getState().getActiveBranchHeaders();
}

/** Alias for modules other than transactions — same active-branch header. */
export function getActiveBranchHeaders(): Record<string, string> {
  return getTransactionBranchHeaders();
}

export function getBranchHeadersForId(branchId?: string | null): Record<string, string> {
  if (!branchId || branchId === 'all') return {};
  return { 'X-Active-Branch-Id': branchId };
}

export type BranchRequestOptions = {
  branchId?: string | null;
  /** When false, omit active-branch header (all assigned branches). Default true. */
  useDefaultBranchHeader?: boolean;
};

/** Resolve which branch headers to send for a list/create request. */
export function resolveBranchRequestHeaders(
  options?: BranchRequestOptions
): Record<string, string> {
  if (options?.branchId != null && options.branchId !== '') {
    return getBranchHeadersForId(options.branchId);
  }
  if (options?.useDefaultBranchHeader === false) {
    return {};
  }
  return getActiveBranchHeaders();
}
