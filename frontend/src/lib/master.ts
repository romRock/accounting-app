import API_BASE_URL, { safeJsonStringify } from './api';
import { useAuthStore } from '@/store';

export interface MasterCity {
  id: string;
  name: string;
  code: string;
  state: string;
  address?: string | null;
  number?: string | null;
  branchId?: string | null;
  createdAt?: string;
  updatedAt?: string;
}

export interface MasterParty {
  id: string;
  name: string;
  phone?: string | null;
  email?: string | null;
  address?: string | null;
  city?: string | null;
  branchId?: string | null;
  createdAt?: string;
  updatedAt?: string;
}

const authHeaders = (): HeadersInit => {
  const { accessToken } = useAuthStore.getState();
  return {
    'Content-Type': 'application/json',
    ...(accessToken ? { Authorization: `Bearer ${accessToken}` } : {}),
  };
};

export const masterApi = {
  async getCities(params?: { search?: string; state?: string; branchId?: string }): Promise<MasterCity[]> {
    const qs = new URLSearchParams();
    if (params?.search) qs.set('search', params.search);
    if (params?.state) qs.set('state', params.state);
    if (params?.branchId) qs.set('branchId', params.branchId);

    const response = await fetch(`${API_BASE_URL}/api/master/cities?${qs.toString()}`, {
      method: 'GET',
      headers: authHeaders(),
    });

    if (!response.ok) {
      const error = await response.json().catch(() => ({}));
      throw new Error(error.message || 'Failed to load cities');
    }

    const data = await response.json();
    return data.cities || [];
  },

  async createCity(payload: { name: string; code: string; state: string; branchId?: string }): Promise<MasterCity> {
    const response = await fetch(`${API_BASE_URL}/api/master/cities`, {
      method: 'POST',
      headers: authHeaders(),
      body: safeJsonStringify(payload),
    });

    if (!response.ok) {
      const error = await response.json().catch(() => ({}));
      throw new Error(error.message || 'Failed to create city');
    }

    const data = await response.json();
    return data.city;
  },

  async updateCity(
    id: string,
    payload: { name?: string; code?: string; state?: string; branchId?: string }
  ): Promise<MasterCity> {
    const response = await fetch(`${API_BASE_URL}/api/master/cities/${id}`, {
      method: 'PUT',
      headers: authHeaders(),
      body: safeJsonStringify(payload),
    });

    if (!response.ok) {
      const error = await response.json().catch(() => ({}));
      throw new Error(error.message || 'Failed to update city');
    }

    const data = await response.json();
    return data.city;
  },

  async deleteCity(id: string): Promise<void> {
    const response = await fetch(`${API_BASE_URL}/api/master/cities/${id}`, {
      method: 'DELETE',
      headers: authHeaders(),
    });

    if (!response.ok) {
      const error = await response.json().catch(() => ({}));
      throw new Error(error.message || 'Failed to delete city');
    }
  },

  async getParties(params?: { search?: string; branchId?: string }): Promise<MasterParty[]> {
    const qs = new URLSearchParams();
    if (params?.search) qs.set('search', params.search);
    if (params?.branchId) qs.set('branchId', params.branchId);

    const response = await fetch(`${API_BASE_URL}/api/master/parties?${qs.toString()}`, {
      method: 'GET',
      headers: authHeaders(),
    });

    if (!response.ok) {
      const error = await response.json().catch(() => ({}));
      throw new Error(error.message || 'Failed to load parties');
    }

    const data = await response.json();
    return data.parties || [];
  },

  async createParty(payload: {
    name: string;
    phone?: string;
    email?: string;
    address?: string;
    city?: string;
    branchId?: string;
  }): Promise<MasterParty> {
    const response = await fetch(`${API_BASE_URL}/api/master/parties`, {
      method: 'POST',
      headers: authHeaders(),
      body: safeJsonStringify(payload),
    });

    if (!response.ok) {
      const error = await response.json().catch(() => ({}));
      throw new Error(error.message || 'Failed to create client');
    }

    const data = await response.json();
    return data.party;
  },

  async updateParty(
    id: string,
    payload: { name?: string; phone?: string; email?: string; address?: string; city?: string; branchId?: string }
  ): Promise<MasterParty> {
    const response = await fetch(`${API_BASE_URL}/api/master/parties/${id}`, {
      method: 'PUT',
      headers: authHeaders(),
      body: safeJsonStringify(payload),
    });

    if (!response.ok) {
      const error = await response.json().catch(() => ({}));
      throw new Error(error.message || 'Failed to update client');
    }

    const data = await response.json();
    return data.party;
  },

  async deleteParty(id: string): Promise<void> {
    const response = await fetch(`${API_BASE_URL}/api/master/parties/${id}`, {
      method: 'DELETE',
      headers: authHeaders(),
    });

    if (!response.ok) {
      const error = await response.json().catch(() => ({}));
      throw new Error(error.message || 'Failed to delete client');
    }
  },
};

