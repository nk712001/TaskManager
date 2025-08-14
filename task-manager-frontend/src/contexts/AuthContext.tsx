import { createContext, useContext, useState, useEffect, useCallback } from 'react';
import type { ReactNode } from 'react';
import api from '../api/axios';

// Types for Auth State and Context
export interface AuthUser {
  id: string;
  email: string;
  name: string;
  role: 'admin' | 'user';
}

interface AuthTokens {
  accessToken: string;
  refreshToken: string;
}

interface AuthContextType {
  user: AuthUser | null;
  tokens: AuthTokens | null;
  setUser: (user: AuthUser | null) => void;
  setTokens: (tokens: AuthTokens | null) => void;
  login: (email: string, _password: string, remember: boolean) => Promise<void>;
  logout: () => void;
  isLoading: boolean;
  error: string | null;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

const AUTH_STORAGE_KEY = 'taskmanager_auth';

interface AuthProviderProps {
  children: ReactNode;
}

export const AuthProvider = ({ children }: AuthProviderProps) => {
  const [user, setUser] = useState<AuthUser | null>(null);
  const [tokens, setTokens] = useState<AuthTokens | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [sessionTimeout, setSessionTimeout] = useState<NodeJS.Timeout | null>(null);

  // Load from storage on mount
  useEffect(() => {
    const loadAuthState = () => {
      // First try localStorage (remember me)
      let saved = localStorage.getItem(AUTH_STORAGE_KEY);
      
      // If not found in localStorage, try sessionStorage
      if (!saved) {
        saved = sessionStorage.getItem(AUTH_STORAGE_KEY);
      }
      
      if (saved) {
        try {
          const parsed = JSON.parse(saved);
          console.log('Loaded auth state from storage:', { user: parsed.user });
          setUser(parsed.user);
          setTokens(parsed.tokens);
        } catch (error) {
          console.error('Failed to parse auth state:', error);
          // Clear invalid storage
          localStorage.removeItem(AUTH_STORAGE_KEY);
          sessionStorage.removeItem(AUTH_STORAGE_KEY);
        }
      }
    };
    
    loadAuthState();
  }, []);

  // Save to storage when user/tokens change
  useEffect(() => {
    if (user && tokens) {
      localStorage.setItem(AUTH_STORAGE_KEY, JSON.stringify({ user, tokens }));
    } else {
      localStorage.removeItem(AUTH_STORAGE_KEY);
    }
  }, [user, tokens]);

  // Session timeout logic (example: 30 min)
  useEffect(() => {
    if (tokens) {
      if (sessionTimeout) clearTimeout(sessionTimeout);
      const timeout = setTimeout(() => {
        logout();
      }, 30 * 60 * 1000); // 30 min
      setSessionTimeout(timeout);
      return () => clearTimeout(timeout);
    }
  }, [tokens]);

  // Real API login
  const login = useCallback(async (username: string, password: string, remember: boolean) => {
    setIsLoading(true);
    setError(null);
    try {
      console.log('Attempting login', { username });
      const response = await api.post('/auth/login', {
        username,
        password,
      });
      
      console.log('Login response:', response.data);
      
      // The token is the direct response
      const token = response.data;
      
      if (!token) {
        throw new Error('No token received from server');
      }
      
      // Create a minimal user object
      const userObj: AuthUser = {
        id: 'temp-id',  // You might want to decode the token to get user info
        email: username,
        name: username.split('@')[0],
        role: 'user'  // Default role
      };
      
      const tokensObj: AuthTokens = { 
        accessToken: token,
        refreshToken: ''  // If refresh token is not provided
      };
      
      // Prepare auth data for storage
      const authData = { 
        user: userObj, 
        tokens: tokensObj 
      };
      
      // Update state first
      setUser(userObj);
      setTokens(tokensObj);
      
      // Then update storage
      try {
        const storage = remember ? localStorage : sessionStorage;
        storage.setItem(AUTH_STORAGE_KEY, JSON.stringify(authData));
        console.log('Auth data stored in', remember ? 'localStorage' : 'sessionStorage');
      } catch (storageError) {
        console.error('Error storing auth data:', storageError);
        // Don't fail login if storage fails, but log it
      }
      
      console.log('Auth state updated and stored');
    } catch (err: any) {
      console.error('Login error', err);
      setError(err.response?.data?.message || 'Invalid credentials');
    } finally {
      setIsLoading(false);
    }
  }, []);

  const logout = useCallback(() => {
    console.log('Logging out...');
    // Clear all auth storage
    localStorage.removeItem(AUTH_STORAGE_KEY);
    sessionStorage.removeItem(AUTH_STORAGE_KEY);
    
    // Clear state
    setUser(null);
    setTokens(null);
    
    // Clear any pending timeouts
    if (sessionTimeout) {
      clearTimeout(sessionTimeout);
      setSessionTimeout(null);
    }
    
    // Force a reload to clear any cached data
    window.location.href = '/login';
  }, [sessionTimeout]);

  return (
    <AuthContext.Provider
      value={{
        user,
        tokens,
        setUser,
        setTokens,
        login,
        logout,
        isLoading,
        error,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
};

// useAuth hook
export function useAuth() {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
}
