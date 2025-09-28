
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

// Simple password hashing simulation (in production, use bcrypt on backend)
const hashPassword = (password: string): string => {
  // This is a simple hash simulation - in production, use proper bcrypt
  let hash = 0;
  for (let i = 0; i < password.length; i++) {
    const char = password.charCodeAt(i);
    hash = ((hash << 5) - hash) + char;
    hash = hash & hash; // Convert to 32-bit integer
  }
  return Math.abs(hash).toString(36);
};

// JWT-like token generation
const generateToken = (userId: string): string => {
  const header = btoa(JSON.stringify({ alg: 'HS256', typ: 'JWT' }));
  const payload = btoa(JSON.stringify({ 
    userId, 
    iat: Math.floor(Date.now() / 1000),
    exp: Math.floor(Date.now() / 1000) + (24 * 60 * 60) // 24 hours
  }));
  const signature = btoa(`${header}.${payload}.secret`);
  return `${header}.${payload}.${signature}`;
};

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
      if (authState && authState.user && authState.token) {
        // In production, verify JWT token here
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

      // In production, verify password hash against stored hash
      // For demo, we'll accept any password for existing users
      const hashedPassword = hashPassword(password);
      console.log('Password hash:', hashedPassword);

      // Generate JWT-like token
      const token = generateToken(existingUser.id);

      const authState: AuthState = {
        user: existingUser,
        isAuthenticated: true,
        token,
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

      // Hash password (in production, do this on backend with bcrypt)
      const hashedPassword = hashPassword(password);
      console.log('Password hashed for registration');

      // Determine role (first user is admin, rest are users)
      const allUsers = await StorageService.getAllUsers();
      const role = allUsers.length === 0 ? 'admin' : 'user';

      // Create new user
      const newUser: User = {
        id: `user_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
        email: email.toLowerCase().trim(),
        name: name.trim(),
        role,
        createdAt: new Date(),
      };

      await StorageService.saveUser(newUser);

      // Generate JWT-like token
      const token = generateToken(newUser.id);

      const authState: AuthState = {
        user: newUser,
        isAuthenticated: true,
        token,
      };

      await StorageService.saveAuthState(authState);
      setUser(newUser);
      setIsAuthenticated(true);
      
      console.log('Registration successful for:', email, 'Role:', role);
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
