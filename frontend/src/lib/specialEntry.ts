// Special Entry API service
import API_BASE_URL from './api';
import { useAuthStore } from '../store/index';

export interface SpecialEntry {
  id: string;
  transactionId: string;
  tokenNo: number | null;
  date: string;
  time: string;
  partyA: string;
  amountA: number;
  partyB: string;
  amountB: number;
  partyC: string;
  amountC: number;
  remark?: string;
  statusTime: string;
  isActive: boolean;
  isDeleted: boolean;
  branchId?: string;
  createdBy: string;
  createdAt: string;
  updatedAt: string;
}

export interface SpecialEntryResponse {
  success: boolean;
  message: string;
  data?: SpecialEntry[];
  pagination?: {
    page: number;
    limit: number;
    total: number;
    pages: number;
  };
}

export interface SpecialEntryCreateRequest {
  transactionId: string;
  tokenNo?: number;
  date: string;
  time: string;
  partyA: string;
  amountA: number;
  partyB: string;
  amountB: number;
  partyC?: string;
  amountC?: number;
  remark?: string;
}

// Get all special entries
export const getSpecialEntries = async (params?: {
  page?: number;
  limit?: number;
  search?: string;
  dateFrom?: string;
  dateTo?: string;
  partyA?: string;
  partyB?: string;
  status?: 'all' | 'pending' | 'completed';
}): Promise<SpecialEntryResponse> => {
  try {
    const queryParams = new URLSearchParams();
    
    if (params?.page) queryParams.set('page', params.page.toString());
    if (params?.limit) queryParams.set('limit', params.limit.toString());
    if (params?.search) queryParams.set('search', params.search);
    if (params?.dateFrom) queryParams.set('dateFrom', params.dateFrom);
    if (params?.dateTo) queryParams.set('dateTo', params.dateTo);
    if (params?.partyA) queryParams.set('partyA', params.partyA);
    if (params?.partyB) queryParams.set('partyB', params.partyB);
    if (params?.status) queryParams.set('status', params.status);

    const { accessToken } = useAuthStore.getState();
    const headers: HeadersInit = {
      'Content-Type': 'application/json',
    };
    
    if (accessToken) {
      headers['Authorization'] = `Bearer ${accessToken}`;
    }
    
    const response = await fetch(`${API_BASE_URL}/api/specialEntry?${queryParams.toString()}`, {
      method: 'GET',
      headers: headers,
    });

    if (!response.ok) {
      const errorData = await response.json();
      throw new Error(errorData.message || 'Failed to fetch special entries');
    }

    return await response.json();
  } catch (error) {
    console.error('Error fetching special entries:', error);
    throw error;
  }
};

// Get single special entry
export const getSpecialEntryById = async (id: string): Promise<SpecialEntry> => {
  try {
    const { accessToken } = useAuthStore.getState();
    const headers: HeadersInit = {
      'Content-Type': 'application/json',
    };
    
    if (accessToken) {
      headers['Authorization'] = `Bearer ${accessToken}`;
    }
    
    const response = await fetch(`${API_BASE_URL}/api/specialEntry/${id}`, {
      method: 'GET',
      headers: headers,
    });

    if (!response.ok) {
      const errorData = await response.json();
      throw new Error(errorData.message || 'Failed to fetch special entry');
    }

    const responseData = await response.json();
    return responseData.data;
  } catch (error) {
    console.error('Error fetching special entry:', error);
    throw error;
  }
};

// Create new special entry
export const createSpecialEntry = async (data: SpecialEntryCreateRequest): Promise<SpecialEntry> => {
  try {
    const { accessToken } = useAuthStore.getState();
    const headers: HeadersInit = {
      'Content-Type': 'application/json',
    };
    
    if (accessToken) {
      headers['Authorization'] = `Bearer ${accessToken}`;
    }
    
    const response = await fetch(`${API_BASE_URL}/api/specialEntry`, {
      method: 'POST',
      headers: headers,
      body: JSON.stringify(data),
    });

    if (!response.ok) {
      const errorData = await response.json();
      throw new Error(errorData.message || 'Failed to create special entry');
    }

    const responseData = await response.json();
    return responseData.data;
  } catch (error) {
    console.error('Error creating special entry:', error);
    throw error;
  }
};

// Update special entry
export const updateSpecialEntry = async (id: string, data: Partial<SpecialEntryCreateRequest>): Promise<SpecialEntry> => {
  try {
    const { accessToken } = useAuthStore.getState();
    const headers: HeadersInit = {
      'Content-Type': 'application/json',
    };
    
    if (accessToken) {
      headers['Authorization'] = `Bearer ${accessToken}`;
    }
    
    const response = await fetch(`${API_BASE_URL}/api/specialEntry/${id}`, {
      method: 'PUT',
      headers: headers,
      body: JSON.stringify(data),
    });

    if (!response.ok) {
      const errorData = await response.json();
      throw new Error(errorData.message || 'Failed to update special entry');
    }

    const responseData = await response.json();
    return responseData.data;
  } catch (error) {
    console.error('Error updating special entry:', error);
    throw error;
  }
};

// Delete special entry
export const deleteSpecialEntry = async (id: string): Promise<void> => {
  try {
    const { accessToken } = useAuthStore.getState();
    const headers: HeadersInit = {
      'Content-Type': 'application/json',
    };
    
    if (accessToken) {
      headers['Authorization'] = `Bearer ${accessToken}`;
    }
    
    const response = await fetch(`${API_BASE_URL}/api/specialEntry/${id}`, {
      method: 'DELETE',
      headers: headers,
    });

    if (!response.ok) {
      const errorData = await response.json();
      throw new Error(errorData.message || 'Failed to delete special entry');
    }

    return;
  } catch (error) {
    console.error('Error deleting special entry:', error);
    throw error;
  }
};
