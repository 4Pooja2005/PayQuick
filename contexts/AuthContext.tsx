
import React, { createContext, useContext, useEffect, useState, ReactNode } from 'react';
import { User, AuthState } from '../types';
import { StorageService } from '../utils/storage';

interface AuthContextType {
  user: User | null;
  isAuthenticated: boolean;
  isLoading: boolean;
  login: (email: string, password: string) => Promise<boolean>;
  register: (email: string, password: string, name: string) => Promise<boolean>;
  logout: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};

interface AuthProviderProps {
  children: ReactNode;
}

export const AuthProvider: React.FC<AuthProviderProps> = ({ children }) => {
  const [user, setUser] = useState<User | null>(null);
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    loadAuthState();
  }, []);

  const loadAuthState = async () => {
    try {
      const authState = await StorageService.getAuthState();
      if (authState && authState.user) {
        setUser(authState.user);
        setIsAuthenticated(true);
        console.log('User loaded from storage:', authState.user.email);
      }
    } catch (error) {
      console.error('Error loading auth state:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const login = async (email: string, password: string): Promise<boolean> => {
    try {
      console.log('Attempting login for:', email);
      
      // Check if user exists
      const existingUser = await StorageService.getUserByEmail(email);
      if (!existingUser) {
        console.log('User not found');
        return false;
      }

      // In a real app, you would verify the password hash here
      // For demo purposes, we'll accept any password
      const authState: AuthState = {
        user: existingUser,
        isAuthenticated: true,
        token: `token_${existingUser.id}_${Date.now()}`,
      };

      await StorageService.saveAuthState(authState);
      setUser(existingUser);
      setIsAuthenticated(true);
      
      console.log('Login successful for:', email);
      return true;
    } catch (error) {
      console.error('Login error:', error);
      return false;
    }
  };

  const register = async (email: string, password: string, name: string): Promise<boolean> => {
    try {
      console.log('Attempting registration for:', email);
      
      // Check if user already exists
      const existingUser = await StorageService.getUserByEmail(email);
      if (existingUser) {
        console.log('User already exists');
        return false;
      }

      // Create new user
      const newUser: User = {
        id: `user_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
        email,
        name,
        role: 'user',
        createdAt: new Date(),
      };

      await StorageService.saveUser(newUser);

      const authState: AuthState = {
        user: newUser,
        isAuthenticated: true,
        token: `token_${newUser.id}_${Date.now()}`,
      };

      await StorageService.saveAuthState(authState);
      setUser(newUser);
      setIsAuthenticated(true);
      
      console.log('Registration successful for:', email);
      return true;
    } catch (error) {
      console.error('Registration error:', error);
      return false;
    }
  };

  const logout = async (): Promise<void> => {
    try {
      await StorageService.clearAuthState();
      setUser(null);
      setIsAuthenticated(false);
      console.log('User logged out');
    } catch (error) {
      console.error('Logout error:', error);
    }
  };

  const value: AuthContextType = {
    user,
    isAuthenticated,
    isLoading,
    login,
    register,
    logout,
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
};
