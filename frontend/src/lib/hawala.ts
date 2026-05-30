// Real hawala API service for backend
import API_BASE_URL from './api';
import { useAuthStore } from '../store/index';

const API_URL = API_BASE_URL;

export interface HawalaEntry {
  id: string;
  transactionId: string;
  tokenNo: number | null;
  date: string;
  time: string;
  partyA: string;
  partyB: string;
  amount: number;
  remark: string | null;
  status: boolean;
  statusTime: string;
  isActive: boolean;
  isDeleted: boolean;
  branchId: string | null;
  createdBy: string;
  createdAt: string;
  updatedAt: string;
}

export interface HawalaResponse {
  success: boolean;
  message: string;
  data?: HawalaEntry;
  error?: string;
}

export interface HawalaListResponse {
  success: boolean;
  message: string;
  data?: HawalaEntry[];
  pagination?: {
    page: number;
    limit: number;
    total: number;
    pages: number;
  };
  error?: string;
}

export interface CreateHawalaData {
  transactionId: string;
  tokenNo?: number;
  date: string;
  time: string;
  partyA: string;
  partyB: string;
  amount: number;
  remark?: string;
  createdBy: string;
}

export interface UpdateHawalaData {
  date?: string;
  time?: string;
  partyA?: string;
  partyB?: string;
  amount?: number;
  remark?: string;
  createdBy: string;
}

export interface HawalaFilters {
  page?: number;
  limit?: number;
  search?: string;
  dateFrom?: string;
  dateTo?: string;
  partyA?: string;
  partyB?: string;
}

// Get auth token from store
const getAuthToken = () => {
  const { accessToken } = useAuthStore.getState();
  return accessToken;
};

// Create hawala entry
export const createHawala = async (data: CreateHawalaData): Promise<HawalaResponse> => {
  try {
    const token = getAuthToken();
    
    const headers: HeadersInit = {
      'Content-Type': 'application/json',
    };
    
    if (token) {
      headers['Authorization'] = `Bearer ${token}`;
    } else {
    }
    
    const response = await fetch(`${API_URL}/api/hawala`, {
      method: 'POST',
      headers,
      body: JSON.stringify(data),
    });

    const result = await response.json();

    if (!response.ok) {
      throw new Error(result.error || 'Failed to create hawala entry');
    }

    return result;
  } catch (error) {
    throw error;
  }
};

// Get hawala entries
export const getHawalaEntries = async (filters: HawalaFilters = {}): Promise<HawalaListResponse> => {
  try {
    const token = getAuthToken();
    const queryParams = new URLSearchParams();
    
    if (filters.page) queryParams.append('page', filters.page.toString());
    if (filters.limit) queryParams.append('limit', filters.limit.toString());
    if (filters.search) queryParams.append('search', filters.search);
    if (filters.dateFrom) queryParams.append('dateFrom', filters.dateFrom);
    if (filters.dateTo) queryParams.append('dateTo', filters.dateTo);
    if (filters.partyA) queryParams.append('partyA', filters.partyA);
    if (filters.partyB) queryParams.append('partyB', filters.partyB);

    const response = await fetch(`${API_URL}/api/hawala?${queryParams}`, {
      method: 'GET',
      headers: {
        'Authorization': `Bearer ${token}`,
      },
    });

    const result = await response.json();

    if (!response.ok) {
      throw new Error(result.error || 'Failed to fetch hawala entries');
    }

    return result;
  } catch (error) {
    throw error;
  }
};

// Get single hawala entry
export const getHawalaById = async (id: string): Promise<HawalaResponse> => {
  try {
    const token = getAuthToken();
    const response = await fetch(`${API_URL}/api/hawala/${id}`, {
      method: 'GET',
      headers: {
        'Authorization': `Bearer ${token}`,
      },
    });

    const result = await response.json();

    if (!response.ok) {
      throw new Error(result.error || 'Failed to fetch hawala entry');
    }

    return result;
  } catch (error) {
    throw error;
  }
};

// Update hawala entry
export const updateHawala = async (id: string, data: UpdateHawalaData): Promise<HawalaResponse> => {
  try {
    const token = getAuthToken();
    const response = await fetch(`${API_URL}/api/hawala/${id}`, {
      method: 'PUT',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${token}`,
      },
      body: JSON.stringify(data),
    });

    const result = await response.json();

    if (!response.ok) {
      throw new Error(result.error || 'Failed to update hawala entry');
    }

    return result;
  } catch (error) {
    throw error;
  }
};

// Delete hawala entry
export const deleteHawala = async (id: string, createdBy: string): Promise<HawalaResponse> => {
  try {
    const token = getAuthToken();
    const response = await fetch(`${API_URL}/api/hawala/${id}`, {
      method: 'DELETE',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${token}`,
      },
      body: JSON.stringify({ createdBy }),
    });

    const result = await response.json();

    if (!response.ok) {
      throw new Error(result.error || 'Failed to delete hawala entry');
    }

    return result;
  } catch (error) {
    throw error;
  }
};
