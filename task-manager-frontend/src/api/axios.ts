import axios from 'axios';
import { useAuth } from '../contexts/AuthContext';

const api = axios.create({
  baseURL: '/api', // Base URL includes /api which will be proxied to the backend
  headers: {
    'Content-Type': 'application/json',
  },
});

// Add a request interceptor to add the auth token to requests
api.interceptors.request.use(
  (config) => {
    // Skip adding token for login/register endpoints
    if (config.url?.includes('/auth/')) {
      return config;
    }

    // Try to get token from localStorage first, then sessionStorage
    const authData = localStorage.getItem('taskmanager_auth') || sessionStorage.getItem('taskmanager_auth');
    
    if (!authData) {
      return config;
    }

    try {
      const parsedAuth = JSON.parse(authData);
      const token = parsedAuth?.tokens?.accessToken;
      
      if (token) {
        config.headers.Authorization = `Bearer ${token}`;
      }
    } catch (error) {
      console.error('Error parsing auth data:', error);
      // Clear invalid auth data
      localStorage.removeItem('taskmanager_auth');
      sessionStorage.removeItem('taskmanager_auth');
    }
    
    return config;
  },
  (error) => {
    return Promise.reject(error);
  }
);

// Add a response interceptor to handle 401 Unauthorized responses
api.interceptors.response.use(
  (response) => response,
  async (error) => {
    const originalRequest = error.config;
    
    // If the error status is 401 and we haven't already tried to refresh the token
    if (error.response?.status === 401 && !originalRequest._retry) {
      originalRequest._retry = true;
      
      try {
        const authTokens = JSON.parse(localStorage.getItem('taskmanager_auth') || '{}');
        const refreshToken = authTokens?.tokens?.refreshToken;
        
        if (refreshToken) {
          // Try to refresh the token
          const response = await axios.post('/api/auth/refresh-token', {
            refreshToken,
          });
          
          const { accessToken } = response.data;
          
          // Update the stored tokens
          const updatedTokens = {
            ...authTokens.tokens,
            accessToken,
          };
          
          localStorage.setItem('taskmanager_auth', JSON.stringify({
            ...authTokens,
            tokens: updatedTokens,
          }));
          
          // Update the Authorization header and retry the original request
          originalRequest.headers.Authorization = `Bearer ${accessToken}`;
          return api(originalRequest);
        }
      } catch (error) {
        // If refresh token fails, log the user out
        const { logout } = useAuth();
        logout();
        window.location.href = '/login';
        return Promise.reject(error);
      }
    }
    
    return Promise.reject(error);
  }
);

export default api;
