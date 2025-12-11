import { createContext, useState, useEffect, useCallback, ReactNode } from 'react';
import * as Sentry from '@sentry/react';
import { AuthContextType, AuthState, LoginCredentials, User } from '../types/auth';
import { apiUrl } from '../utils/api';

const initialState: AuthState = {
  user: null,
  token: null,
  isAuthenticated: false,
  isLoading: true,
};

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export { AuthContext };

const TOKEN_KEY = 'synapse_auth_token';
const USER_KEY = 'synapse_auth_user';

export function AuthProvider({ children }: { children: ReactNode }) {
  const [state, setState] = useState<AuthState>(initialState);

  // Check if token is expired (token format: <randomHex>.<userId>.<timestamp>.<expirationTimestamp>)
  const isTokenExpired = (token: string): boolean => {
    try {
      const parts = token.split('.');
      if (parts.length !== 4) return true;
      
      const expirationTimestamp = parseInt(parts[3], 10);
      return Date.now() > expirationTimestamp;
    } catch {
      return true;
    }
  };

  // Restore session from localStorage on mount
  useEffect(() => {
    const storedToken = localStorage.getItem(TOKEN_KEY);
    const storedUser = localStorage.getItem(USER_KEY);

    if (storedToken && storedUser) {
      try {
        // Check if token is expired
        if (isTokenExpired(storedToken)) {
          console.log('Stored token expired, clearing session');
          localStorage.removeItem(TOKEN_KEY);
          localStorage.removeItem(USER_KEY);
          Sentry.setUser(null);
          setState({ ...initialState, isLoading: false });
          return;
        }

        const user = JSON.parse(storedUser) as User;
        
        // Set Sentry user context for restored session
        Sentry.setUser({
          id: user.id,
          email: user.email,
          username: user.email,
          role: user.role,
        });
        
        // eslint-disable-next-line react-hooks/set-state-in-effect
        setState({
          user,
          token: storedToken,
          isAuthenticated: true,
          isLoading: false,
        });
      } catch {
        // Invalid stored data, clear it
        localStorage.removeItem(TOKEN_KEY);
        localStorage.removeItem(USER_KEY);
        Sentry.setUser(null);
        setState({ ...initialState, isLoading: false });
      }
    } else {
      setState({ ...initialState, isLoading: false });
    }
  }, []);

  const login = useCallback(async (credentials: LoginCredentials): Promise<boolean> => {
    setState(prev => ({ ...prev, isLoading: true }));

    try {
      const response = await fetch(apiUrl('/api/auth/login'), {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(credentials),
      });

      const data = await response.json();

      if (response.ok && data.success) {
        const { user, token } = data;
        
        // Set Sentry user context
        Sentry.setUser({
          id: user.id,
          email: user.email,
          username: user.email,
          role: user.role,
        });
        
        // Persist to localStorage
        localStorage.setItem(TOKEN_KEY, token);
        localStorage.setItem(USER_KEY, JSON.stringify(user));

        setState({
          user,
          token,
          isAuthenticated: true,
          isLoading: false,
        });
        return true;
      } else {
        setState({ ...initialState, isLoading: false });
        return false;
      }
    } catch (error) {
      console.error('Login error:', error);
      setState({ ...initialState, isLoading: false });
      return false;
    }
  }, []);

  const logout = useCallback(() => {
    localStorage.removeItem(TOKEN_KEY);
    localStorage.removeItem(USER_KEY);
    Sentry.setUser(null);
    setState({ ...initialState, isLoading: false });
  }, []);

  return (
    <AuthContext.Provider value={{ ...state, login, logout }}>
      {children}
    </AuthContext.Provider>
  );
}
