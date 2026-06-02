// Real authentication service for backend API
import API_BASE_URL, { safeJsonStringify } from './api';

export const SESSION_REVOKED_MESSAGE =
  'Session expired or logged in on another device';

export function isSessionRevokedError(message: string): boolean {
  return message.includes('another device') || message.includes('Session expired');
}

interface LoginResponse {
  user: {
    id: string;
    email: string;
    username: string;
    firstName: string;
    lastName: string;
    phone?: string;
    isActive: boolean;
    isDeleted: boolean;
    createdAt: string;
    updatedAt: string;
    roleId: string;
    branchId?: string;
    role: {
      id: string;
      name: string;
      description: string;
      permissions: string; // JSON string
      isActive: boolean;
      isDeleted: boolean;
      createdAt: string;
      updatedAt: string;
    };
    branch?: {
      id: string;
      name: string;
      code: string;
      address?: string;
      phone?: string;
      email?: string;
      isActive: boolean;
      isDeleted: boolean;
      createdAt: string;
      updatedAt: string;
    };
  };
  accessToken: string;
  refreshToken: string;
}

interface User {
  id: string;
  email: string;
  username: string;
  firstName: string;
  lastName: string;
  phone?: string;
  isActive: boolean;
  createdAt: string;
  updatedAt: string;
  role: {
    id: string;
    name: string;
    description: string;
    permissions: string; // JSON string from backend
  };
  branch?: {
    id: string;
    name: string;
    code: string;
  } | null;
}

interface AuthResponse {
  user: User;
  accessToken: string;
  refreshToken: string;
}

export const authApi = {
  async login(email: string, password: string): Promise<AuthResponse> {
    const response = await fetch(`${API_BASE_URL}/api/auth/login`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: safeJsonStringify({ email, password }),
    });

    if (!response.ok) {
      const error = await response.json().catch(() => ({}));
      throw new Error(error.message || 'Login failed');
    }

    const data: LoginResponse = await response.json();
    
    return {
      user: data.user,
      accessToken: data.accessToken,
      refreshToken: data.refreshToken,
    };
  },

  async logout(refreshToken: string, accessToken?: string | null): Promise<void> {
    const headers: Record<string, string> = {
      'Content-Type': 'application/json',
    };
    if (accessToken) {
      headers.Authorization = `Bearer ${accessToken}`;
    }

    const response = await fetch(`${API_BASE_URL}/api/auth/logout`, {
      method: 'POST',
      headers,
      body: safeJsonStringify({ refreshToken }),
    });

    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.message || 'Logout failed');
    }
  },

  async refreshToken(refreshToken: string): Promise<AuthResponse> {
    const response = await fetch(`${API_BASE_URL}/api/auth/refresh`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: safeJsonStringify({ refreshToken }),
    });

    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.message || 'Token refresh failed');
    }

    const data = await response.json();
    
    // Transform the response to match the expected User interface
    const user: User = {
      id: data.user.id,
      email: data.user.email,
      username: data.user.username,
      firstName: data.user.firstName,
      lastName: data.user.lastName,
      phone: data.user.phone || undefined,
      isActive: data.user.isActive,
      createdAt: data.user.createdAt,
      updatedAt: data.user.updatedAt,
      role: data.user.role,
      branch: data.user.branch,
    };

    return {
      user,
      accessToken: data.accessToken,
      refreshToken: data.refreshToken,
    };
  },

  async getProfile(accessToken: string): Promise<User> {
    const response = await fetch(`${API_BASE_URL}/api/auth/profile`, {
      headers: {
        'Authorization': `Bearer ${accessToken}`,
      },
    });

    if (!response.ok) {
      const error = await response.json().catch(() => ({}));
      throw new Error(error.error || error.message || 'Failed to get profile');
    }

    return await response.json();
  },
};
