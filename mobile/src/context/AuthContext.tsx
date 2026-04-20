import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { AppState, AppStateStatus } from 'react-native';
import * as SecureStore from 'expo-secure-store';
import { getAuthToken, removeAuthToken, setAuthToken as saveToken } from '../api/client';

interface User {
  id: string;
  email: string;
  name: string;
  role: 'customer' | 'vendor' | 'admin';
  phone?: string;
  avatar_url?: string;
}

interface AuthContextType {
  user: User | null;
  isLoading: boolean;
  signIn: (token: string, userData: User) => Promise<void>;
  signOut: () => Promise<void>;
}

const SESSION_TIMEOUT_MS = 60 * 60 * 1000; // 60 minutes auto-logout

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider = ({ children }: { children: ReactNode }) => {
  const [user, setUser] = useState<User | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  // Expose signOut early so it can be used in the storage load routine
  const signOut = async () => {
    await removeAuthToken();
    await SecureStore.deleteItemAsync('user_data');
    await SecureStore.deleteItemAsync('last_active_time');
    setUser(null);
  };

  useEffect(() => {
    // Load initial session
    const loadStorageData = async () => {
      try {
        const token = await getAuthToken();
        const userData = await SecureStore.getItemAsync('user_data');
        const lastActive = await SecureStore.getItemAsync('last_active_time');
        
        if (token && userData) {
          // Check if session expired during cold boot
          if (lastActive) {
            const timeElapsed = Date.now() - parseInt(lastActive, 10);
            if (timeElapsed > SESSION_TIMEOUT_MS) {
              await signOut(); // Clear expired session
              setIsLoading(false);
              return;
            }
          }
          
          // Token is valid and hasn't timed out
          setUser(JSON.parse(userData));
          // Update active time for fresh start
          await SecureStore.setItemAsync('last_active_time', Date.now().toString());
        }
      } catch (e) {
        console.error('Failed to load auth data', e);
      } finally {
        setIsLoading(false);
      }
    };

    loadStorageData();
  }, []);

  // Track app going to background and returning
  useEffect(() => {
    const handleAppStateChange = async (nextAppState: AppStateStatus) => {
      if (nextAppState === 'background' || nextAppState === 'inactive') {
        // App is closing/suspending -> mark time
        await SecureStore.setItemAsync('last_active_time', Date.now().toString());
      } else if (nextAppState === 'active') {
        // App woke up -> check elapsed time
        const lastActive = await SecureStore.getItemAsync('last_active_time');
        if (lastActive && user) {
          const timeElapsed = Date.now() - parseInt(lastActive, 10);
          if (timeElapsed > SESSION_TIMEOUT_MS) {
            await signOut(); // Auto logout
          } else {
            // Still active, refresh timestamp
            await SecureStore.setItemAsync('last_active_time', Date.now().toString());
          }
        }
      }
    };

    const subscription = AppState.addEventListener('change', handleAppStateChange);
    return () => {
      subscription.remove();
    };
  }, [user]); // Re-bind if user changes so 'signOut' correctly affects current state

  const signIn = async (token: string, userData: User) => {
    await saveToken(token);
    await SecureStore.setItemAsync('user_data', JSON.stringify(userData));
    await SecureStore.setItemAsync('last_active_time', Date.now().toString());
    setUser(userData);
  };

  return (
    <AuthContext.Provider value={{ user, isLoading, signIn, signOut }}>
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};
