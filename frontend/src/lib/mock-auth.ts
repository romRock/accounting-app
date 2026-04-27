// Mock authentication service for frontend development
// This simulates a backend API without requiring actual server calls

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

// Mock user database (stored in localStorage for persistence)
const getUsers = (): User[] => {
  if (typeof window === 'undefined') return [];
  const users = localStorage.getItem('mock_users');
  return users ? JSON.parse(users) : [];
};

const saveUsers = (users: User[]): void => {
  if (typeof window === 'undefined') return;
  localStorage.setItem('mock_users', JSON.stringify(users));
};

// Generate simple tokens (in production, use proper JWT)
const generateTokens = (user: User) => {
  const accessToken = btoa(JSON.stringify({ 
    userId: user.id, 
    email: user.email, 
    username: user.username,
    exp: Date.now() + 15 * 60 * 1000 // 15 minutes
  }));
  
  const refreshToken = btoa(JSON.stringify({ 
    userId: user.id, 
    email: user.email, 
    username: user.username,
    exp: Date.now() + 7 * 24 * 60 * 60 * 1000 // 7 days
  }));
  
  return { accessToken, refreshToken };
};

// Create admin role permissions
const createAdminRole = () => ({
  id: 'admin_role',
  name: 'Admin',
  description: 'Full system administrator',
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
});

// Mock API functions
export const mockAuth = {
  async register(data: {
    firstName: string;
    lastName: string;
    email: string;
    username: string;
    password: string;
  }): Promise<AuthResponse> {
    // Simulate API delay
    await new Promise(resolve => setTimeout(resolve, 500));
    
    const users = getUsers();
    
    // Check if user already exists
    const existingUser = users.find(u => u.email === data.email || u.username === data.username);
    if (existingUser) {
      throw new Error('User with this email or username already exists');
    }
    
    // Create new user
    const newUser: User = {
      id: 'user_' + Date.now(),
      email: data.email,
      username: data.username,
      firstName: data.firstName,
      lastName: data.lastName,
      phone: undefined,
      isActive: true,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
      role: createAdminRole(),
      branch: undefined,
    };
    
    users.push(newUser);
    saveUsers(users);
    
    const tokens = generateTokens(newUser);
    
    return {
      user: newUser,
      ...tokens
    };
  },
  
  async login(email: string, password: string): Promise<AuthResponse> {
    // Simulate API delay
    await new Promise(resolve => setTimeout(resolve, 300));
    
    const users = getUsers();
    
    // For demo purposes, accept any email/password if user exists
    // In production, verify password properly
    let user = users.find(u => u.email === email);
    
    // If no user found, create a default admin user for demo
    if (!user && email === 'admin@angadiya.com') {
      user = {
        id: 'admin_default',
        email: 'admin@angadiya.com',
        username: 'admin',
        firstName: 'Admin',
        lastName: 'User',
        phone: undefined,
        isActive: true,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
        role: createAdminRole(),
        branch: undefined,
      };
      users.push(user);
      saveUsers(users);
    }
    
    if (!user) {
      throw new Error('Invalid email or password');
    }
    
    const tokens = generateTokens(user!);
    
    return {
      user,
      ...tokens
    };
  },
  
  async refreshToken(refreshToken: string): Promise<AuthResponse> {
    // Simulate API delay
    await new Promise(resolve => setTimeout(resolve, 200));
    
    try {
      const decoded = JSON.parse(atob(refreshToken));
      
      // Check if token is expired
      if (decoded.exp < Date.now()) {
        throw new Error('Refresh token expired');
      }
      
      const users = getUsers();
      const user = users.find(u => u.id === decoded.userId);
      
      if (!user) {
        throw new Error('User not found');
      }
      
      const tokens = generateTokens(user);
      
      return {
        user,
        ...tokens
      };
    } catch (error) {
      throw new Error('Invalid refresh token');
    }
  },
  
  async logout(refreshToken: string): Promise<void> {
    // Simulate API delay
    await new Promise(resolve => setTimeout(resolve, 100));
    
    // In a real backend, you'd invalidate the refresh token
    // For mock, we don't need to do anything
    console.log('User logged out');
  },
  
  async getProfile(userId: string): Promise<User> {
    // Simulate API delay
    await new Promise(resolve => setTimeout(resolve, 100));
    
    const users = getUsers();
    const user = users.find(u => u.id === userId);
    
    if (!user) {
      throw new Error('User not found');
    }
    
    return user;
  }
};
