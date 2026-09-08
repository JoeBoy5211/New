import axios from 'axios';
import * as SecureStore from 'expo-secure-store';
import { Platform } from 'react-native';
import Constants from 'expo-constants';

const TOKEN_KEY = 'caterconnect_token';

// Use dynamic IP for physical devices, 10.0.2.2 for Android emulator, and localhost for web
const getBaseUrl = () => {
  if (__DEV__) {
    // For physical devices using Expo Go
    const hostUri = Constants.expoConfig?.hostUri;
    const ip = hostUri ? hostUri.split(':')[0].split('/')[0] : null;
    
    if (Platform.OS === 'android') {
      // 10.0.2.2 is the special alias to your host loopback interface in Android Emulator
      return ip ? `http://${ip}:3000/api` : 'http://10.0.2.2:3000/api';
    }
    
    return ip ? `http://${ip}:3000/api` : 'http://localhost:3000/api';
  }
  return 'https://catering-backend-ynqk.onrender.com/api';
};

export const api = axios.create({
  baseURL: getBaseUrl(),
  timeout: 10000, // 10 seconds timeout to prevent infinite loading
  headers: {
    'Content-Type': 'application/json',
  },
});

// Request Interceptor for Auth
api.interceptors.request.use(async (config) => {
  const token = await SecureStore.getItemAsync(TOKEN_KEY);
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
}, (error) => {
  return Promise.reject(error);
});

// Response Interceptor for Auth Errors
api.interceptors.response.use(
  (response) => response,
  async (error) => {
    if (error.response?.status === 401) {
      await SecureStore.deleteItemAsync(TOKEN_KEY);
      // Optional: Trigger a logout event or state update
    }
    return Promise.reject(error);
  }
);

export const setAuthToken = async (token: string) => {
  await SecureStore.setItemAsync(TOKEN_KEY, token);
};

export const removeAuthToken = async () => {
  await SecureStore.deleteItemAsync(TOKEN_KEY);
};

export const getAuthToken = async () => {
  return await SecureStore.getItemAsync(TOKEN_KEY);
};
