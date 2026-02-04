import React, { createContext, useContext, useEffect, useState, ReactNode } from 'react';
import authService from '../services/auth';

interface User {
  id: string;
  email: string;
  name: string;
  isEmailVerified: boolean;
  timezone: string;
  notificationPreferences: {
    enabled: boolean;
    sound: boolean;
    vibration: boolean;
    dailySummaryTime: string;
  };
}

interface AuthContextType {
  user: User | null;
  isAuthenticated: boolean;
  isLoading: boolean;
  login: (email: string, password: string) => Promise<{ success: boolean; message: string; user?: User }>;
  register: (userData: { email: string; password: string; name: string; timezone: string }) => Promise<{ success: boolean; message: string; user?: User }>;
  logout: () => Promise<{ success: boolean; message: string }>;
  forgotPassword: (email: string) => Promise<{ success: boolean; message: string }>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

interface AuthProviderProps { children: ReactNode }

export const AuthProvider: React.FC<AuthProviderProps> = ({ children }) => {
  const [user, setUser] = useState<User | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    initializeAuth();
  }, []);

  const initializeAuth = async () => {
    try {
      setIsLoading(true);
      const isAuthenticated = await authService.initialize();
      if (isAuthenticated) {
        const currentUser = authService.getCurrentUser();
        setUser(currentUser);
      }
    } finally {
      setIsLoading(false);
    }
  };

  const login: AuthContextType['login'] = async (email, password) => {
    const result = await authService.login(email, password);
    if (result.success && result.user) setUser(result.user as User);
    return result;
  };

  const register: AuthContextType['register'] = async (userData) => {
    return await authService.register(userData);
  };

  const logout: AuthContextType['logout'] = async () => {
    const result = await authService.logout();
    if (result.success) setUser(null);
    return result;
  };

  const forgotPassword: AuthContextType['forgotPassword'] = async (email) => {
    return await authService.forgotPassword(email);
  };

  const value: AuthContextType = {
    user,
    isAuthenticated: !!user,
    isLoading,
    login,
    register,
    logout,
    forgotPassword,
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
};

export const useAuth = (): AuthContextType => {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};

export default AuthContext;
