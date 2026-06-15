import { useBranchStore } from '@/store/branch-store';

export function getTransactionBranchHeaders(): Record<string, string> {
  return useBranchStore.getState().getActiveBranchHeaders();
}
