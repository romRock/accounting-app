import API_BASE_URL from './api';
import { useAuthStore } from '@/store';

// Accounting Entry Types
export interface AccountingEntry {
  id: string;
  entryId?: string;
  transactionId?: string;
  date: string;
  time?: string;
  statusTime?: string;
  accountId?: string;
  accountType?: string;
  debitAmount?: number;
  creditAmount?: number;
  categoryId?: string;
  amount?: number;
  description?: string;
  partyId?: string;
  paymentMethod?: string;
  referenceNo?: string;
  gstAmount?: number;
  tdsAmount?: number;
  totalAmount?: number;
  type?: 'INCOME' | 'EXPENSE';
  status?: string;
  isActive?: boolean;
  isDeleted?: boolean;
  branchId?: string;
  createdBy?: string;
  createdAt?: string;
  updatedAt?: string;
  category?: {
    id: string;
    name: string;
    type: string;
    description: string;
    gstApplicable: boolean;
    tdsApplicable: boolean;
    isActive: boolean;
    isDeleted: boolean;
    createdAt: string;
    updatedAt: string;
  };
  party?: {
    id: string;
    name: string;
    mobileNumber?: string;
    isActive: boolean;
    isDeleted: boolean;
    createdAt: string;
    updatedAt: string;
  };
}

export interface AccountingEntryForm {
  entryId?: string;
  date: string;
  time: string;
  categoryId: string;
  amount: number;
  description: string;
  partyId?: string;
  paymentMethod?: string;
  referenceNo?: string;
  gstAmount?: number;
  tdsAmount?: number;
  totalAmount: number;
  type: 'INCOME' | 'EXPENSE';
  status: string;
}

// Get auth token
const getAuthToken = () => {
  const { accessToken } = useAuthStore.getState();
  return accessToken;
};

// Accounting Entry API
export const accountingApi = {
  // Get all accounting entries
  getAccountEntries: async (params?: {
    page?: number;
    limit?: number;
    categoryId?: string;
    type?: string;
    partyId?: string;
    dateFrom?: string;
    dateTo?: string;
    search?: string;
  }): Promise<{ entries: AccountingEntry[]; pagination: any }> => {
    const response = await fetch(`${API_BASE_URL}/api/accounting/entries?${new URLSearchParams(params as any).toString()}`, {
      headers: {
        'Authorization': `Bearer ${getAuthToken()}`,
        'Content-Type': 'application/json',
      },
    });

    if (!response.ok) {
      throw new Error('Failed to fetch accounting entries');
    }

    return response.json();
  },

  // Create accounting entry
  createAccountEntry: async (data: AccountingEntryForm): Promise<AccountingEntry> => {
    const response = await fetch(`${API_BASE_URL}/api/accounting/entries`, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${getAuthToken()}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(data),
    });

    if (!response.ok) {
      throw new Error('Failed to create accounting entry');
    }

    return response.json();
  },

  getNextTransactionId: async (): Promise<{ nextTransactionId: string }> => {
    const response = await fetch(`${API_BASE_URL}/api/accounting/entries/next-id`, {
      headers: {
        'Authorization': `Bearer ${getAuthToken()}`,
        'Content-Type': 'application/json',
      },
    });

    if (!response.ok) {
      throw new Error('Failed to fetch next transaction ID');
    }

    return response.json();
  },

  // Update accounting entry
  updateAccountEntry: async (id: string, data: Partial<AccountingEntryForm>): Promise<AccountingEntry> => {
    const response = await fetch(`${API_BASE_URL}/api/accounting/entries/${id}`, {
      method: 'PUT',
      headers: {
        'Authorization': `Bearer ${getAuthToken()}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(data),
    });

    if (!response.ok) {
      throw new Error('Failed to update accounting entry');
    }

    return response.json();
  },

  // Delete accounting entry
  deleteAccountEntry: async (id: string): Promise<void> => {
    const response = await fetch(`${API_BASE_URL}/api/accounting/entries/${id}`, {
      method: 'DELETE',
      headers: {
        'Authorization': `Bearer ${getAuthToken()}`,
        'Content-Type': 'application/json',
      },
    });

    if (!response.ok) {
      throw new Error('Failed to delete accounting entry');
    }
  },

  // Get accounting categories
  getAccountCategories: async (): Promise<any[]> => {
    const response = await fetch(`${API_BASE_URL}/api/accounting/categories`, {
      headers: {
        'Authorization': `Bearer ${getAuthToken()}`,
        'Content-Type': 'application/json',
      },
    });

    if (!response.ok) {
      throw new Error('Failed to fetch accounting categories');
    }

    const data = await response.json();
    return data.categories || [];
  },
};
