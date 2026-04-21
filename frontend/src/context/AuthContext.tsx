
import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { api } from '@/lib/api';

// Define types based on our backend response
export interface User {
  id: string;
  email: string;
  name: string;
  role: 'customer' | 'vendor' | 'admin';
  phone?: string;
  avatar_url?: string;
  is_approved?: boolean;
  createdAt?: string;
}

interface AuthContextType {
  user: User | null;
  isLoading: boolean;
  login: (email: string, password: string) => Promise<{ success: boolean; message: string; user?: User }>;
  register: (data: RegisterData) => Promise<{ success: boolean; message: string; user?: User }>;
  logout: () => void;
  isAuthenticated: boolean;
  userRole: User['role'] | 'guest';
}

interface RegisterData {
  name: string;
  email: string;
  password: string;
  code: string;
  phone?: string;
  role: 'customer' | 'vendor';
  businessName?: string;
  location?: string;
  cuisineType?: string;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);
const AUTH_STORAGE_KEY = 'caterconnect_auth';
const TOKEN_KEY = 'caterconnect_token';

/**
 * Decodes the JWT payload and checks if `exp` is in the past.
 * Returns true (treat as expired) if the token cannot be decoded.
 */
function isTokenExpired(token: string): boolean {
  try {
    const payload = JSON.parse(atob(token.split('.')[1]));
    return typeof payload.exp === 'number' && payload.exp * 1000 < Date.now();
  } catch {
    return true;
  }
}

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  // Load user from localStorage on mount — clear session if JWT is expired
  useEffect(() => {
    const storedAuth = localStorage.getItem(AUTH_STORAGE_KEY);
    const token = localStorage.getItem(TOKEN_KEY);

    if (storedAuth && token) {
      if (isTokenExpired(token)) {
        // Token has expired — wipe stored session
        localStorage.removeItem(AUTH_STORAGE_KEY);
        localStorage.removeItem(TOKEN_KEY);
      } else {
        try {
          const parsed = JSON.parse(storedAuth);
          setUser(parsed);
        } catch {
          localStorage.removeItem(AUTH_STORAGE_KEY);
          localStorage.removeItem(TOKEN_KEY);
        }
      }
    }
    setIsLoading(false);
  }, []);

  const login = async (email: string, password: string): Promise<{ success: boolean; message: string; user?: User }> => {
    try {
      const response = await api.post('/auth/login', { email, password });

      if (response.success && response.token) {
        const userData = response.user;
        setUser(userData);
        localStorage.setItem(AUTH_STORAGE_KEY, JSON.stringify(userData));
        localStorage.setItem(TOKEN_KEY, response.token);
        return { success: true, message: 'Login successful', user: userData };
      }
      return { success: false, message: response.message || 'Login failed' };
    } catch (error: any) {
      return { success: false, message: error.message || 'An error occurred' };
    }
  };

  const register = async (data: RegisterData): Promise<{ success: boolean; message: string; user?: User }> => {
    try {
      const response = await api.post('/auth/register', data);

      if (response.success && response.token) {
        const userData = response.user;
        setUser(userData);
        localStorage.setItem(AUTH_STORAGE_KEY, JSON.stringify(userData));
        localStorage.setItem(TOKEN_KEY, response.token);
        return { success: true, message: 'Registration successful!', user: userData };
      }
      return { success: false, message: response.message || 'Registration failed' };
    } catch (error: any) {
      return { success: false, message: error.message || 'An error occurred' };
    }
  };

  const logout = () => {
    setUser(null);
    localStorage.removeItem(AUTH_STORAGE_KEY);
    localStorage.removeItem(TOKEN_KEY);
  };

  const value: AuthContextType = {
    user,
    isLoading,
    login,
    register,
    logout,
    isAuthenticated: !!user,
    userRole: user?.role || 'guest',
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
}
