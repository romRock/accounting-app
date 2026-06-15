import { create } from 'zustand';
import { persist } from 'zustand/middleware';

export interface BranchInfo {
  id: string;
  name: string;
  code: string;
}

interface BranchState {
  assignedBranches: BranchInfo[];
  activeTransactionBranchId: string | null;
  setAssignedBranches: (branches: BranchInfo[]) => void;
  setActiveTransactionBranchId: (branchId: string) => void;
  getActiveTransactionBranchId: () => string | null;
  getActiveBranchHeaders: () => Record<string, string>;
  resetBranches: () => void;
}

export const useBranchStore = create<BranchState>()(
  persist(
    (set, get) => ({
      assignedBranches: [],
      activeTransactionBranchId: null,

      setAssignedBranches: (branches) => {
        const currentActive = get().activeTransactionBranchId;
        const nextActive =
          currentActive && branches.some((branch) => branch.id === currentActive)
            ? currentActive
            : branches[0]?.id ?? null;

        set({
          assignedBranches: branches,
          activeTransactionBranchId: nextActive,
        });
      },

      setActiveTransactionBranchId: (branchId) => {
        set({ activeTransactionBranchId: branchId });
      },

      getActiveTransactionBranchId: () => {
        const { assignedBranches, activeTransactionBranchId } = get();
        if (
          activeTransactionBranchId &&
          assignedBranches.some((branch) => branch.id === activeTransactionBranchId)
        ) {
          return activeTransactionBranchId;
        }
        return assignedBranches[0]?.id ?? null;
      },

      getActiveBranchHeaders: (): Record<string, string> => {
        const branchId = get().getActiveTransactionBranchId();
        if (!branchId) return {};
        return { 'X-Active-Branch-Id': branchId };
      },

      resetBranches: () => {
        set({ assignedBranches: [], activeTransactionBranchId: null });
      },
    }),
    {
      name: 'branch-storage',
      partialize: (state) => ({
        assignedBranches: state.assignedBranches,
        activeTransactionBranchId: state.activeTransactionBranchId,
      }),
    }
  )
);
