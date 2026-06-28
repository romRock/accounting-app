// Real transaction API service for backend
import API_BASE_URL, { safeJsonStringify } from './api';
import { getBranchHeadersForId, getTransactionBranchHeaders } from './branch-headers';
import { useAuthStore } from '../store/index';

export interface Transaction {
  id: string;
  transactionId: string;
  tokenNo: number;
  date: string;
  time: string;
  centerId: string;
  amount: number;
  type: string;
  amountType: string;
  commission: number;
  bookingCommission: number;
  centerCommission: number;
  cuttingCommission?: number; // For inward transactions
  autoCommission: boolean;
  receiverName: string;
  receiverNumber?: string;
  senderName: string;
  senderNumber?: string;
  receiverClientId?: string;
  senderClientId?: string;
  remark?: string;
  status: boolean;
  statusTime: string;
  center?: {
    id: string;
    name: string;
    code: string;
  };
  receiverClient?: {
    id: string;
    name: string;
    phone: string;
    city: string;
  };
  senderClient?: {
    id: string;
    name: string;
    phone: string;
    city: string;
  };
  createdBy?: string;
  branchId?: string;
  createdAt?: string;
  updatedAt?: string;
}

interface Client {
  id: string;
  name: string;
  knownNames?: string[];
  mobileNumber: string;
  city: string;
  notes?: string;
  createdAt?: string;
  updatedAt?: string;
}

interface Center {
  id: string;
  name: string;
  code: string;
}

export interface City {
  id: string;
  name: string;
  code: string;
  state: string;
  address?: string;
  number?: string;
}

interface TransactionsResponse {
  transactions: Transaction[];
  pagination: {
    page: number;
    limit: number;
    total: number;
    totalPages: number;
  };
}

export const transactionApi = {
  async getTransactions(params: {
    page?: number;
    limit?: number;
    type?: string;
    status?: string;
    search?: string;
    dateFrom?: string;
    dateTo?: string;
    allDates?: boolean;
  } = {}, options?: { branchId?: string | null; useDefaultBranchHeader?: boolean }): Promise<TransactionsResponse> {
    const { accessToken } = useAuthStore.getState();
    const queryParams = new URLSearchParams();
    
    if (params.page) queryParams.append('page', params.page.toString());
    if (params.limit) queryParams.append('limit', params.limit.toString());
    if (params.type) queryParams.append('type', params.type);
    if (params.status !== undefined) queryParams.append('status', params.status);
    if (params.search) queryParams.append('search', params.search);
    if (params.dateFrom) queryParams.append('dateFrom', params.dateFrom);
    if (params.dateTo) queryParams.append('dateTo', params.dateTo);
    if (params.allDates) queryParams.append('allDates', 'true');

    const branchHeaders =
      options?.branchId != null && options.branchId !== ''
        ? getBranchHeadersForId(options.branchId)
        : options?.useDefaultBranchHeader === false
          ? {}
          : getTransactionBranchHeaders();

    const response = await fetch(`${API_BASE_URL}/api/transactions?${queryParams}`, {
      headers: {
        'Authorization': `Bearer ${accessToken}`,
        ...branchHeaders,
      },
    });

    if (!response.ok) {
      throw new Error('Failed to fetch transactions');
    }

    return await response.json();
  },

  async createTransaction(transactionData: Partial<Transaction>): Promise<Transaction> {
    const { accessToken } = useAuthStore.getState();
    
    const response = await fetch(`${API_BASE_URL}/api/transactions`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${accessToken}`,
        ...getTransactionBranchHeaders(),
      },
      body: safeJsonStringify(transactionData),
    });

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}));
      throw new Error(errorData.message || 'Failed to create transaction');
    }

    return await response.json();
  },

  async updateTransaction(id: string, transactionData: Partial<Transaction>): Promise<Transaction> {
    const { accessToken } = useAuthStore.getState();
    const response = await fetch(`${API_BASE_URL}/api/transactions/${id}`, {
      method: 'PUT',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${accessToken}`,
      },
      body: safeJsonStringify(transactionData),
    });

    if (!response.ok) {
      throw new Error('Failed to update transaction');
    }

    return await response.json();
  },

  async deleteTransaction(id: string): Promise<void> {
    const { accessToken } = useAuthStore.getState();
    const response = await fetch(`${API_BASE_URL}/api/transactions/${id}`, {
      method: 'DELETE',
      headers: {
        'Authorization': `Bearer ${accessToken}`,
      },
    });

    if (!response.ok) {
      throw new Error('Failed to delete transaction');
    }
  },

  
  async searchCities(search?: string, limit?: number): Promise<City[]> {
    const params = new URLSearchParams();
    if (search && search.trim()) {
      params.append('search', search.trim());
    }
    // Only add limit if explicitly provided
    if (limit !== undefined) {
      params.append('limit', limit.toString());
    }

    const { accessToken } = useAuthStore.getState();
    const headers: HeadersInit = {
      'Content-Type': 'application/json',
    };

    if (accessToken) {
      headers['Authorization'] = `Bearer ${accessToken}`;
    }

    const response = await fetch(`${API_BASE_URL}/api/cities?${params}`, {
      method: 'GET',
      headers: headers,
    });

    if (!response.ok) {
      throw new Error('Failed to search cities');
    }

    const result = await response.json();
    return result.success ? result.data : [];
  },

  async addCity(name: string, code: string, state: string, number?: string): Promise<City> {
    const { accessToken } = useAuthStore.getState();
    
    const headers: HeadersInit = {
      'Content-Type': 'application/json',
    };
    
    if (accessToken) {
      headers['Authorization'] = `Bearer ${accessToken}`;
      } else {
    }
    
    const response = await fetch(`${API_BASE_URL}/api/cities/add`, {
      method: 'POST',
      headers: headers,
      body: safeJsonStringify({ name, code, state, number }),
    });

    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.message || 'Failed to add city');
    }

    const result = await response.json();
    return result.data;
  },

  async updateCity(id: string, name: string, code: string, state: string, number?: string): Promise<City> {
    const { accessToken } = useAuthStore.getState();
    
    const headers: HeadersInit = {
      'Content-Type': 'application/json',
    };
    
    if (accessToken) {
      headers['Authorization'] = `Bearer ${accessToken}`;
      } else {
    }
    
    const response = await fetch(`${API_BASE_URL}/api/cities/update`, {
      method: 'POST',
      headers: headers,
      body: safeJsonStringify({ id, name, code, state, number }),
    });

    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.message || 'Failed to update city');
    }

    const result = await response.json();
    return result.data;
  },

  async deleteCity(id: string): Promise<void> {
    const { accessToken } = useAuthStore.getState();
    
    const headers: HeadersInit = {
      'Content-Type': 'application/json',
    };
    
    if (accessToken) {
      headers['Authorization'] = `Bearer ${accessToken}`;
      } else {
    }
    
    const response = await fetch(`${API_BASE_URL}/api/cities/delete`, {
      method: 'POST',
      headers: headers,
      body: safeJsonStringify({ id }),
    });

    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.message || 'Failed to delete city');
    }
  },

  // Client CRUD operations
  async addClient(name: string, mobileNumber: string, city: string, notes?: string): Promise<Client> {
    const { accessToken } = useAuthStore.getState();

    const headers: HeadersInit = {
      'Content-Type': 'application/json',
    };
    
    if (accessToken) {
      headers['Authorization'] = `Bearer ${accessToken}`;
      } else {
    }
    
    const response = await fetch(`${API_BASE_URL}/api/clients/add`, {
      method: 'POST',
      headers: headers,
      body: safeJsonStringify({ name, mobileNumber, city, notes }),
    });

    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.message || 'Failed to add client');
    }

    const result = await response.json();
    return result.data;
  },

  async updateClient(id: string, name: string, mobileNumber: string, city: string, notes?: string): Promise<Client> {
    const { accessToken } = useAuthStore.getState();
    
    const headers: HeadersInit = {
      'Content-Type': 'application/json',
    };
    
    if (accessToken) {
      headers['Authorization'] = `Bearer ${accessToken}`;
      } else {
    }
    
    const response = await fetch(`${API_BASE_URL}/api/clients/update`, {
      method: 'POST',
      headers: headers,
      body: safeJsonStringify({ id, name, mobileNumber, city, notes }),
    });

    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.message || 'Failed to update client');
    }

    const result = await response.json();
    return result.data;
  },

  async deleteClient(id: string): Promise<void> {
    const { accessToken } = useAuthStore.getState();

    const headers: HeadersInit = {
      'Content-Type': 'application/json',
    };
    
    if (accessToken) {
      headers['Authorization'] = `Bearer ${accessToken}`;
      } else {
    }
    
    const response = await fetch(`${API_BASE_URL}/api/clients/delete`, {
      method: 'POST',
      headers: headers,
      body: safeJsonStringify({ id }),
    });

    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.message || 'Failed to delete client');
    }
  },

  async getClients(): Promise<Client[]> {
    const { accessToken } = useAuthStore.getState();
    const headers: HeadersInit = {
      'Content-Type': 'application/json',
    };

    if (accessToken) {
      headers['Authorization'] = `Bearer ${accessToken}`;
    }

    const response = await fetch(`${API_BASE_URL}/api/parties`, {
      method: 'GET',
      headers: headers,
    });

    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.message || 'Failed to fetch clients');
    }

    const result = await response.json();
    const parties = result.success ? result.data : [];
    return parties.map((party: {
      id: string;
      name: string;
      phone?: string;
      city?: string;
      knownNames?: string[];
      createdAt?: string | Date;
      updatedAt?: string | Date;
    }) => ({
      id: party.id,
      name: party.name,
      knownNames: party.knownNames || [party.name],
      mobileNumber: party.phone || '',
      city: party.city || '',
      createdAt:
        party.createdAt instanceof Date
          ? party.createdAt.toISOString()
          : party.createdAt,
      updatedAt:
        party.updatedAt instanceof Date
          ? party.updatedAt.toISOString()
          : party.updatedAt,
    }));
  },

  // Roles API functions
  async getRoles(): Promise<any[]> {
    const { accessToken } = useAuthStore.getState();

    const headers: HeadersInit = {
      'Content-Type': 'application/json',
    };

    if (accessToken) {
      headers['Authorization'] = `Bearer ${accessToken}`;
    }

    const response = await fetch(`${API_BASE_URL}/api/roles`, {
      method: 'GET',
      headers,
    });

    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.message || 'Failed to fetch roles');
    }

    const result = await response.json();
    return result.data;
  },

  async addRole(name: string, permissions: any): Promise<any> {
    const { accessToken } = useAuthStore.getState();
    
    const headers: HeadersInit = {
      'Content-Type': 'application/json',
    };
    
    if (accessToken) {
      headers['Authorization'] = `Bearer ${accessToken}`;
    }
    
    const response = await fetch(`${API_BASE_URL}/api/roles/add`, {
      method: 'POST',
      headers: headers,
      body: safeJsonStringify({ name, permissions }),
    });

    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.message || 'Failed to add role');
    }

    return await response.json();
  },

  async updateRole(id: string, name: string, permissions: any): Promise<any> {
    const { accessToken } = useAuthStore.getState();
    
    const headers: HeadersInit = {
      'Content-Type': 'application/json',
    };
    
    if (accessToken) {
      headers['Authorization'] = `Bearer ${accessToken}`;
    }
    
    const response = await fetch(`${API_BASE_URL}/api/roles/update`, {
      method: 'POST',
      headers: headers,
      body: safeJsonStringify({ id, name, permissions }),
    });

    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.message || 'Failed to update role');
    }

    return await response.json();
  },

  async deleteRole(id: string): Promise<void> {
    const { accessToken } = useAuthStore.getState();

    const headers: HeadersInit = {
      'Content-Type': 'application/json',
    };
    
    if (accessToken) {
      headers['Authorization'] = `Bearer ${accessToken}`;
    }
    
    const response = await fetch(`${API_BASE_URL}/api/roles/delete`, {
      method: 'POST',
      headers: headers,
      body: safeJsonStringify({ id }),
    });

    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.message || 'Failed to delete role');
    }
  },

  async getUsers(): Promise<any[]> {
    const { accessToken } = useAuthStore.getState();
    
    const headers: HeadersInit = {
      'Content-Type': 'application/json',
    };
    
    if (accessToken) {
      headers['Authorization'] = `Bearer ${accessToken}`;
    }
    
    const response = await fetch(`${API_BASE_URL}/api/users`, {
      method: 'GET',
      headers: headers,
    });

    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.message || 'Failed to fetch users');
    }

    const result = await response.json();
    return result.data;
  },

  async addUser(fullName: string, mobileNumber: string, email: string, password: string, roleId: string, branchId?: string, branchIds?: string[]): Promise<any> {
    const { accessToken } = useAuthStore.getState();

    const headers: HeadersInit = {
      'Content-Type': 'application/json',
    };

    if (accessToken) {
      headers['Authorization'] = `Bearer ${accessToken}`;
    }

    const response = await fetch(`${API_BASE_URL}/api/users/add`, {
      method: 'POST',
      headers: headers,
      body: safeJsonStringify({ fullName, mobileNumber, email, password, roleId, branchId, branchIds }),
    });

    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.message || 'Failed to add user');
    }

    return await response.json();
  },

  async updateUser(id: string, fullName: string, mobileNumber: string, email: string, password: string, roleId: string, branchId?: string, branchIds?: string[]): Promise<any> {
    const { accessToken } = useAuthStore.getState();

    const headers: HeadersInit = {
      'Content-Type': 'application/json',
    };

    if (accessToken) {
      headers['Authorization'] = `Bearer ${accessToken}`;
    }

    const response = await fetch(`${API_BASE_URL}/api/users/update`, {
      method: 'POST',
      headers: headers,
      body: safeJsonStringify({ id, fullName, mobileNumber, email, password, roleId, branchId, branchIds }),
    });

    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.message || 'Failed to update user');
    }

    return await response.json();
  },

  async deleteUser(id: string): Promise<void> {
    const { accessToken } = useAuthStore.getState();

    const headers: HeadersInit = {
      'Content-Type': 'application/json',
    };
    
    if (accessToken) {
      headers['Authorization'] = `Bearer ${accessToken}`;
    }
    
    const response = await fetch(`${API_BASE_URL}/api/users/delete`, {
      method: 'POST',
      headers: headers,
      body: safeJsonStringify({ id }),
    });

    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.message || 'Failed to delete user');
    }
  },

  // Transaction Refund Report API
  async getTransactionRefundReport(date?: string): Promise<any> {
    const { accessToken } = useAuthStore.getState();
    
    const headers: HeadersInit = {
      'Content-Type': 'application/json',
    };
    
    if (accessToken) {
      headers['Authorization'] = `Bearer ${accessToken}`;
    }
    
    const url = new URL(`${API_BASE_URL}/api/reports/transaction-refund`);
    if (date) {
      url.searchParams.append('date', date);
    }
    
    const response = await fetch(url.toString(), {
      method: 'GET',
      headers: headers,
    });

    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.message || 'Failed to fetch transaction refund report');
    }

    return await response.json();
  },

  // Test function for debugging (no authentication required)
  async testCityAdd(name: string, code: string, state: string, number?: string): Promise<any> {
    const response = await fetch(`${API_BASE_URL}/api/cities/test`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: safeJsonStringify({ name, code, state, number }),
    });

    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.message || 'Test endpoint failed');
    }

    const result = await response.json();
    return result;
  },
};
