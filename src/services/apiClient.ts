import axios from 'axios';
import type { AxiosInstance, AxiosRequestHeaders, InternalAxiosRequestConfig } from 'axios';

const baseURL = import.meta.env.VITE_API_URL || 'http://localhost:5000/api';

const apiClient: AxiosInstance = axios.create({
  baseURL,
  withCredentials: true,
});

const getAuthToken = (): string | null => {
  try {
    const localToken = localStorage.getItem('firebaseAuthToken') || localStorage.getItem('authToken');
    if (localToken) return localToken;

    const sessionToken = sessionStorage.getItem('firebaseAuthToken') || sessionStorage.getItem('authToken');
    if (sessionToken) return sessionToken;
  } catch {
    // Ignore storage access errors in non-browser environments
  }

  return (window as any).__firebaseAuthToken ?? null;
};

apiClient.interceptors.request.use(
  (config: InternalAxiosRequestConfig) => {
    const token = getAuthToken();
    if (token) {
      if (!config.headers) {
        config.headers = {} as AxiosRequestHeaders;
      }
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error) => Promise.reject(error)
);

export default apiClient;
