
import AsyncStorage from '@react-native-async-storage/async-storage';
import { User, Transaction, Loan, AuthState } from '../types';

const STORAGE_KEYS = {
  AUTH: 'auth_state',
  TRANSACTIONS: 'transactions',
  LOANS: 'loans',
  USERS: 'users',
};

export const StorageService = {
  // Auth methods
  async saveAuthState(authState: AuthState): Promise<void> {
    try {
      await AsyncStorage.setItem(STORAGE_KEYS.AUTH, JSON.stringify(authState));
      console.log('Auth state saved successfully');
    } catch (error) {
      console.error('Error saving auth state:', error);
    }
  },

  async getAuthState(): Promise<AuthState | null> {
    try {
      const authData = await AsyncStorage.getItem(STORAGE_KEYS.AUTH);
      if (authData) {
        const parsed = JSON.parse(authData);
        console.log('Auth state retrieved:', parsed.user?.email);
        return parsed;
      }
      return null;
    } catch (error) {
      console.error('Error getting auth state:', error);
      return null;
    }
  },

  async clearAuthState(): Promise<void> {
    try {
      await AsyncStorage.removeItem(STORAGE_KEYS.AUTH);
      console.log('Auth state cleared');
    } catch (error) {
      console.error('Error clearing auth state:', error);
    }
  },

  // Transaction methods
  async saveTransaction(transaction: Transaction): Promise<void> {
    try {
      const existingTransactions = await this.getTransactions();
      const updatedTransactions = [...existingTransactions, transaction];
      await AsyncStorage.setItem(STORAGE_KEYS.TRANSACTIONS, JSON.stringify(updatedTransactions));
      console.log('Transaction saved:', transaction.id);
    } catch (error) {
      console.error('Error saving transaction:', error);
    }
  },

  async getTransactions(): Promise<Transaction[]> {
    try {
      const transactionsData = await AsyncStorage.getItem(STORAGE_KEYS.TRANSACTIONS);
      if (transactionsData) {
        const transactions = JSON.parse(transactionsData);
        console.log('Retrieved transactions count:', transactions.length);
        return transactions;
      }
      return [];
    } catch (error) {
      console.error('Error getting transactions:', error);
      return [];
    }
  },

  async getUserTransactions(userId: string): Promise<Transaction[]> {
    try {
      const allTransactions = await this.getTransactions();
      const userTransactions = allTransactions.filter(t => t.userId === userId);
      console.log('User transactions count:', userTransactions.length);
      return userTransactions;
    } catch (error) {
      console.error('Error getting user transactions:', error);
      return [];
    }
  },

  // Loan methods
  async saveLoan(loan: Loan): Promise<void> {
    try {
      const existingLoans = await this.getLoans();
      const updatedLoans = [...existingLoans, loan];
      await AsyncStorage.setItem(STORAGE_KEYS.LOANS, JSON.stringify(updatedLoans));
      console.log('Loan saved:', loan.id);
    } catch (error) {
      console.error('Error saving loan:', error);
    }
  },

  async updateLoan(loanId: string, updates: Partial<Loan>): Promise<void> {
    try {
      const existingLoans = await this.getLoans();
      const updatedLoans = existingLoans.map(loan => 
        loan.id === loanId ? { ...loan, ...updates } : loan
      );
      await AsyncStorage.setItem(STORAGE_KEYS.LOANS, JSON.stringify(updatedLoans));
      console.log('Loan updated:', loanId);
    } catch (error) {
      console.error('Error updating loan:', error);
    }
  },

  async getLoans(): Promise<Loan[]> {
    try {
      const loansData = await AsyncStorage.getItem(STORAGE_KEYS.LOANS);
      if (loansData) {
        const loans = JSON.parse(loansData);
        console.log('Retrieved loans count:', loans.length);
        return loans;
      }
      return [];
    } catch (error) {
      console.error('Error getting loans:', error);
      return [];
    }
  },

  async getUserLoans(userId: string): Promise<Loan[]> {
    try {
      const allLoans = await this.getLoans();
      const userLoans = allLoans.filter(l => l.userId === userId);
      console.log('User loans count:', userLoans.length);
      return userLoans;
    } catch (error) {
      console.error('Error getting user loans:', error);
      return [];
    }
  },

  // User methods
  async saveUser(user: User): Promise<void> {
    try {
      const existingUsers = await this.getUsers();
      const updatedUsers = [...existingUsers.filter(u => u.id !== user.id), user];
      await AsyncStorage.setItem(STORAGE_KEYS.USERS, JSON.stringify(updatedUsers));
      console.log('User saved:', user.email);
    } catch (error) {
      console.error('Error saving user:', error);
    }
  },

  async getUsers(): Promise<User[]> {
    try {
      const usersData = await AsyncStorage.getItem(STORAGE_KEYS.USERS);
      if (usersData) {
        const users = JSON.parse(usersData);
        console.log('Retrieved users count:', users.length);
        return users;
      }
      return [];
    } catch (error) {
      console.error('Error getting users:', error);
      return [];
    }
  },

  async getUserByEmail(email: string): Promise<User | null> {
    try {
      const users = await this.getUsers();
      const user = users.find(u => u.email === email);
      console.log('User found by email:', !!user);
      return user || null;
    } catch (error) {
      console.error('Error getting user by email:', error);
      return null;
    }
  },

  // Clear all data
  async clearAllData(): Promise<void> {
    try {
      await AsyncStorage.multiRemove([
        STORAGE_KEYS.AUTH,
        STORAGE_KEYS.TRANSACTIONS,
        STORAGE_KEYS.LOANS,
        STORAGE_KEYS.USERS,
      ]);
      console.log('All data cleared');
    } catch (error) {
      console.error('Error clearing all data:', error);
    }
  },
};
