import { createContext, useContext, useState, useEffect, useCallback } from 'react';
import type { ReactNode } from 'react';

// Types for Auth State and Context
export interface AuthUser {
  id: string;
  email: string;
  role: 'admin' | 'user';
}

interface AuthTokens {
  accessToken: string;
  refreshToken: string;
}

interface AuthContextType {
  user: AuthUser | null;
  tokens: AuthTokens | null;
  login: (email: string, password: string, remember: boolean) => Promise<void>;
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
    const saved = localStorage.getItem(AUTH_STORAGE_KEY);
    if (saved) {
      try {
        const parsed = JSON.parse(saved);
        setUser(parsed.user);
        setTokens(parsed.tokens);
      } catch {
        // ignore
      }
    }
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

  // Mock API login (Replace with real API call)
  const login = useCallback(async (email: string, password: string, remember: boolean) => {
    setIsLoading(true);
    setError(null);
    try {
      // TODO: Replace with real API call
      await new Promise((resolve) => setTimeout(resolve, 500));
      // Example user and tokens
      const mockUser: AuthUser = { id: '1', email, role: 'user' };
      const mockTokens: AuthTokens = {
        accessToken: 'mock-access-token',
        refreshToken: 'mock-refresh-token',
      };
      setUser(mockUser);
      setTokens(mockTokens);
      if (remember) {
        localStorage.setItem(AUTH_STORAGE_KEY, JSON.stringify({ user: mockUser, tokens: mockTokens }));
      }
    } catch (err) {
      setError('Invalid credentials');
    } finally {
      setIsLoading(false);
    }
  }, []);

  const logout = useCallback(() => {
    setUser(null);
    setTokens(null);
    localStorage.removeItem(AUTH_STORAGE_KEY);
    if (sessionTimeout) clearTimeout(sessionTimeout);
  }, [sessionTimeout]);

  const value: AuthContextType = {
    user,
    tokens,
    login,
    logout,
    isLoading,
    error,
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
};

// useAuth hook
export function useAuth() {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
}
