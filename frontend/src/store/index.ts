import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import { authApi, isSessionRevokedError } from '@/lib/auth';

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

interface AuthState {
  user: User | null;
  accessToken: string | null;
  refreshToken: string | null;
  isAuthenticated: boolean;
  isLoading: boolean;
  login: (email: string, password: string) => Promise<void>;
  logout: () => Promise<void>;
  refreshAccessToken: () => Promise<void>;
  verifySession: () => Promise<boolean>;
  setTokens: (accessToken: string, refreshToken: string) => void;
}

export const useAuthStore = create<AuthState>()(
  persist(
    (set, get) => ({
      user: null,
      accessToken: null,
      refreshToken: null,
      isAuthenticated: false,
      isLoading: false,

      login: async (email: string, password: string) => {
        set({ isLoading: true });
        try {
          const data = await authApi.login(email, password);
          
          // Debug: Log the user data to identify the issue
          console.log('STORE LOGIN - User data from API:', data.user);
          console.log('STORE LOGIN - User role:', data.user?.role);
          console.log('STORE LOGIN - User role type:', typeof data.user?.role);
          
          // Update state and ensure persistence
          set({
            user: data.user,
            accessToken: data.accessToken,
            refreshToken: data.refreshToken,
            isAuthenticated: true,
            isLoading: false,
          });
          
          // Force a small delay to ensure persistence completes
          await new Promise(resolve => setTimeout(resolve, 10));
          
        } catch (error) {
          set({ isLoading: false });
          throw error;
        }
      },

      logout: async () => {
        const { refreshToken, accessToken } = get();
        
        // Call logout API if refresh token exists
        if (refreshToken) {
          try {
            await authApi.logout(refreshToken, accessToken);
          } catch (error) {
            console.error('Logout error:', error);
          }
        }
        
        // Clear state
        set({
          user: null,
          accessToken: null,
          refreshToken: null,
          isAuthenticated: false,
          isLoading: false,
        });
      },

      refreshAccessToken: async () => {
        const { refreshToken } = get();
        
        if (!refreshToken) {
          get().logout();
          return;
        }

        try {
          const data = await authApi.refreshToken(refreshToken);
          
          set({
            user: data.user,
            accessToken: data.accessToken,
            refreshToken: data.refreshToken,
            isAuthenticated: true,
          });
        } catch (error) {
          // If refresh fails, logout user
          await get().logout();
          throw error;
        }
      },

      verifySession: async () => {
        const { accessToken, refreshAccessToken, logout, isAuthenticated } = get();

        if (!isAuthenticated || !accessToken) {
          return false;
        }

        try {
          await authApi.getProfile(accessToken);
          return true;
        } catch (error) {
          const message = error instanceof Error ? error.message : '';

          if (message.includes('Token expired')) {
            try {
              await refreshAccessToken();
              const newToken = get().accessToken;
              if (newToken) {
                await authApi.getProfile(newToken);
                return true;
              }
            } catch {
              await logout();
              return false;
            }
          }

          if (isSessionRevokedError(message)) {
            await logout();
            return false;
          }

          await logout();
          return false;
        }
      },

      setTokens: (accessToken: string, refreshToken: string) => {
        set({ accessToken, refreshToken, isAuthenticated: true });
      },
    }),
    {
      name: 'auth-storage',
      partialize: (state) => ({
        user: state.user,
        accessToken: state.accessToken,
        refreshToken: state.refreshToken,
        isAuthenticated: state.isAuthenticated,
      }),
      onRehydrateStorage: () => (state) => {
        console.log('STORE HYDRATION - Rehydrated state:', state);
        console.log('STORE HYDRATION - User from storage:', state?.user);
        console.log('STORE HYDRATION - Role from storage:', state?.user?.role);
        console.log('STORE HYDRATION - Role type:', typeof state?.user?.role);
        
        // Aggressive: Clear any malformed user data that could cause React errors
        if (state?.user?.role) {
          const role = state.user.role;
          
          // If role permissions is an object instead of string, fix it
          if (role.permissions && typeof role.permissions === 'object') {
            console.log('STORE HYDRATION - Converting object permissions to string');
            role.permissions = JSON.stringify(role.permissions);
          }
          
          // If entire role is malformed, clear it
          if (typeof role !== 'object' || role === null) {
            console.log('STORE HYDRATION - Malformed role detected, clearing user data');
            state.user = null;
            state.isAuthenticated = false;
            state.accessToken = null;
            state.refreshToken = null;
          }
        }
        
        return state;
      },
    }
  )
);

// API helper function
export const apiCall = async (url: string, options: RequestInit = {}) => {
  const { accessToken, refreshAccessToken } = useAuthStore.getState();
  
  let token = accessToken;
  
  const makeRequest = async (token: string | null) => {
    const headers = {
      'Content-Type': 'application/json',
      ...(token && { Authorization: `Bearer ${token}` }),
      ...options.headers,
    };

    const response = await fetch(`${process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001'}${url}`, {
      ...options,
      headers,
    });

    if (response.status === 401 && token) {
      const errorBody = await response.clone().json().catch(() => ({}));
      const errorMessage = (errorBody as { error?: string }).error || '';

      if (isSessionRevokedError(errorMessage)) {
        await useAuthStore.getState().logout();
        return response;
      }

      // Token expired, try to refresh once
      try {
        await refreshAccessToken();
      } catch {
        return response;
      }

      const newToken = useAuthStore.getState().accessToken;

      if (newToken) {
        return fetch(`${process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001'}${url}`, {
          ...options,
          headers: {
            ...headers,
            Authorization: `Bearer ${newToken}`,
          },
        });
      }
    }

    return response;
  };

  return makeRequest(token);
};
