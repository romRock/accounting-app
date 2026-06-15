import { useBranchStore } from '@/store/branch-store';

export function getTransactionBranchHeaders(): Record<string, string> {
  return useBranchStore.getState().getActiveBranchHeaders();
}

export function getBranchHeadersForId(branchId?: string | null): Record<string, string> {
  if (!branchId) return {};
  return { 'X-Active-Branch-Id': branchId };
}
