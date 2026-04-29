// Real authentication service for backend API

interface LoginResponse {
  success: boolean;
  token: string;
  user: {
    id: string;
    email: string;
    role: string;
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
    permissions: Record<string, any>;
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
    const response = await fetch(`${process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001'}/api/auth/login`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ email, password }),
    });

    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.message || 'Login failed');
    }

    const data: LoginResponse = await response.json();
    
    // Transform the response to match the expected User interface
    const user: User = {
      id: data.user.id,
      email: data.user.email,
      username: data.user.email.split('@')[0], // Generate username from email
      firstName: 'Admin',
      lastName: 'User',
      phone: undefined,
      isActive: true,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
      role: {
        id: 'admin_role',
        name: data.user.role,
        description: 'System administrator',
        permissions: {
          users: { read: true, write: true, delete: true },
          roles: { read: true, write: true, delete: true },
          cities: { read: true, write: true, delete: true },
          parties: { read: true, write: true, delete: true },
          branches: { read: true, write: true, delete: true },
          transactions: { read: true, write: true, delete: true },
          accounting: { read: true, write: true, delete: true },
          reports: { read: true, write: true },
          dashboard: { read: true },
        },
      },
      branch: null,
    };

    return {
      user,
      accessToken: data.accessToken,
      refreshToken: data.refreshToken,
    };
  },

  async logout(refreshToken: string): Promise<void> {
    const response = await fetch(`${process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001'}/api/auth/logout`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ refreshToken }),
    });

    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.message || 'Logout failed');
    }
  },

  async refreshToken(refreshToken: string): Promise<AuthResponse> {
    const response = await fetch(`${process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001'}/api/auth/refresh`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ refreshToken }),
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
    const response = await fetch(`${process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001'}/api/auth/profile`, {
      headers: {
        'Authorization': `Bearer ${accessToken}`,
      },
    });

    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.message || 'Failed to get profile');
    }

    return await response.json();
  },
};
