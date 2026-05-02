// Real transaction API service for backend
import API_BASE_URL from './api';
import { useAuthStore } from '../store/index';

export interface Transaction {
  id: string;
  token: string;
  tokenNo?: string;
  date: string;
  time: string;
  center: string;
  amount: number;
  type: string;
  amountType: string;
  commission: number;
  bookingCommission?: number;
  centerCommission?: number;
  autoCommission: boolean;
  receiverName: string;
  receiverNumber: string;
  senderName: string;
  senderNumber: string;
  remark?: string;
  status: boolean;
  statusTime: string;
  fromParty?: string;
  toParty?: string;
  description?: string;
  createdBy?: string;
  createdAt?: string;
  updatedAt?: string;
}

interface Client {
  id: string;
  name: string;
  mobileNumber: string;
  city: string;
  notes?: string;
  createdAt: string;
  updatedAt: string;
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
  } = {}): Promise<TransactionsResponse> {
    const queryParams = new URLSearchParams();
    
    if (params.page) queryParams.append('page', params.page.toString());
    if (params.limit) queryParams.append('limit', params.limit.toString());
    if (params.type) queryParams.append('type', params.type);
    if (params.status !== undefined) queryParams.append('status', params.status);
    if (params.search) queryParams.append('search', params.search);

    const response = await fetch(`${API_BASE_URL}/api/transactions?${queryParams}`, {
      headers: {
        'Authorization': `Bearer ${localStorage.getItem('accessToken')}`,
      },
    });

    if (!response.ok) {
      throw new Error('Failed to fetch transactions');
    }

    return await response.json();
  },

  async createTransaction(transactionData: Partial<Transaction>): Promise<Transaction> {
    const response = await fetch(`${API_BASE_URL}/api/transactions`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${localStorage.getItem('accessToken')}`,
      },
      body: JSON.stringify(transactionData),
    });

    if (!response.ok) {
      throw new Error('Failed to create transaction');
    }

    return await response.json();
  },

  async updateTransaction(id: string, transactionData: Partial<Transaction>): Promise<Transaction> {
    const response = await fetch(`${API_BASE_URL}/api/transactions/${id}`, {
      method: 'PUT',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${localStorage.getItem('accessToken')}`,
      },
      body: JSON.stringify(transactionData),
    });

    if (!response.ok) {
      throw new Error('Failed to update transaction');
    }

    return await response.json();
  },

  async deleteTransaction(id: string): Promise<void> {
    const response = await fetch(`${API_BASE_URL}/api/transactions/${id}`, {
      method: 'DELETE',
      headers: {
        'Authorization': `Bearer ${localStorage.getItem('accessToken')}`,
      },
    });

    if (!response.ok) {
      throw new Error('Failed to delete transaction');
    }
  },

  async getBranches(): Promise<Center[]> {
    const response = await fetch(`${API_BASE_URL}/api/branches`, {
      headers: {
        'Authorization': `Bearer ${localStorage.getItem('accessToken')}`,
      },
    });

    if (!response.ok) {
      throw new Error('Failed to fetch branches');
    }

    return await response.json();
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

    const response = await fetch(`${API_BASE_URL}/api/cities?${params}`, {
      method: 'GET',
      headers: {
        'Content-Type': 'application/json',
      },
    });

    if (!response.ok) {
      throw new Error('Failed to search cities');
    }

    const result = await response.json();
    return result.success ? result.data : [];
  },

  async addCity(name: string, code: string, state: string, number?: string): Promise<City> {
    const { accessToken } = useAuthStore.getState();
    console.log('=== ADD CITY API DEBUG ===');
    console.log('Token from auth store:', accessToken ? 'EXISTS' : 'MISSING');
    console.log('Token length:', accessToken?.length || 0);
    
    const headers: HeadersInit = {
      'Content-Type': 'application/json',
    };
    
    if (accessToken) {
      headers['Authorization'] = `Bearer ${accessToken}`;
      console.log('Authorization header set');
    } else {
      console.log('WARNING: No token found in auth store, proceeding without Authorization header');
    }
    
    const response = await fetch(`${API_BASE_URL}/api/cities/add`, {
      method: 'POST',
      headers: headers,
      body: JSON.stringify({ name, code, state, number }),
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
    console.log('=== UPDATE CITY API DEBUG ===');
    console.log('Token from auth store:', accessToken ? 'EXISTS' : 'MISSING');
    console.log('Token length:', accessToken?.length || 0);
    
    const headers: HeadersInit = {
      'Content-Type': 'application/json',
    };
    
    if (accessToken) {
      headers['Authorization'] = `Bearer ${accessToken}`;
      console.log('Authorization header set');
    } else {
      console.log('WARNING: No token found in auth store, proceeding without Authorization header');
    }
    
    const response = await fetch(`${API_BASE_URL}/api/cities/update`, {
      method: 'POST',
      headers: headers,
      body: JSON.stringify({ id, name, code, state, number }),
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
    console.log('=== DELETE CITY API DEBUG ===');
    console.log('Token from auth store:', accessToken ? 'EXISTS' : 'MISSING');
    console.log('Token length:', accessToken?.length || 0);
    
    const headers: HeadersInit = {
      'Content-Type': 'application/json',
    };
    
    if (accessToken) {
      headers['Authorization'] = `Bearer ${accessToken}`;
      console.log('Authorization header set');
    } else {
      console.log('WARNING: No token found in auth store, proceeding without Authorization header');
    }
    
    const response = await fetch(`${API_BASE_URL}/api/cities/delete`, {
      method: 'POST',
      headers: headers,
      body: JSON.stringify({ id }),
    });

    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.message || 'Failed to delete city');
    }
  },

  // Client CRUD operations
  async addClient(name: string, mobileNumber: string, city: string, notes?: string): Promise<Client> {
    const { accessToken } = useAuthStore.getState();
    console.log('=== ADD CLIENT API DEBUG ===');
    console.log('Token from auth store:', accessToken ? 'EXISTS' : 'MISSING');
    console.log('Token length:', accessToken?.length || 0);
    
    const headers: HeadersInit = {
      'Content-Type': 'application/json',
    };
    
    if (accessToken) {
      headers['Authorization'] = `Bearer ${accessToken}`;
      console.log('Authorization header set');
    } else {
      console.log('WARNING: No token found in auth store, proceeding without Authorization header');
    }
    
    const response = await fetch(`${API_BASE_URL}/api/clients/add`, {
      method: 'POST',
      headers: headers,
      body: JSON.stringify({ name, mobileNumber, city, notes }),
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
    console.log('=== UPDATE CLIENT API DEBUG ===');
    console.log('Token from auth store:', accessToken ? 'EXISTS' : 'MISSING');
    console.log('Token length:', accessToken?.length || 0);
    
    const headers: HeadersInit = {
      'Content-Type': 'application/json',
    };
    
    if (accessToken) {
      headers['Authorization'] = `Bearer ${accessToken}`;
      console.log('Authorization header set');
    } else {
      console.log('WARNING: No token found in auth store, proceeding without Authorization header');
    }
    
    const response = await fetch(`${API_BASE_URL}/api/clients/update`, {
      method: 'POST',
      headers: headers,
      body: JSON.stringify({ id, name, mobileNumber, city, notes }),
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
    console.log('=== DELETE CLIENT API DEBUG ===');
    console.log('Token from auth store:', accessToken ? 'EXISTS' : 'MISSING');
    console.log('Token length:', accessToken?.length || 0);
    
    const headers: HeadersInit = {
      'Content-Type': 'application/json',
    };
    
    if (accessToken) {
      headers['Authorization'] = `Bearer ${accessToken}`;
      console.log('Authorization header set');
    } else {
      console.log('WARNING: No token found in auth store, proceeding without Authorization header');
    }
    
    const response = await fetch(`${API_BASE_URL}/api/clients/delete`, {
      method: 'POST',
      headers: headers,
      body: JSON.stringify({ id }),
    });

    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.message || 'Failed to delete client');
    }
  },

  async getClients(): Promise<Client[]> {
    const { accessToken } = useAuthStore.getState();
    console.log('=== GET CLIENTS API DEBUG ===');
    console.log('Token from auth store:', accessToken ? 'EXISTS' : 'MISSING');
    console.log('Token length:', accessToken?.length || 0);
    
    const headers: HeadersInit = {
      'Content-Type': 'application/json',
    };
    
    if (accessToken) {
      headers['Authorization'] = `Bearer ${accessToken}`;
      console.log('Authorization header set');
    } else {
      console.log('WARNING: No token found in auth store, proceeding without Authorization header');
    }
    
    const response = await fetch(`${API_BASE_URL}/api/clients`, {
      method: 'GET',
      headers: headers,
    });

    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.message || 'Failed to fetch clients');
    }

    const result = await response.json();
    return result.data;
  },

  // Test function for debugging (no authentication required)
  async testCityAdd(name: string, code: string, state: string, number?: string): Promise<any> {
    const response = await fetch(`${API_BASE_URL}/api/cities/test`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ name, code, state, number }),
    });

    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.message || 'Test endpoint failed');
    }

    const result = await response.json();
    return result;
  },
};
