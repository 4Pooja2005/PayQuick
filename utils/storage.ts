
import AsyncStorage from '@react-native-async-storage/async-storage';
import { User, Transaction, Loan, AuthState } from '../types';

const STORAGE_KEYS = {
  AUTH_STATE: 'auth_state',
  USERS: 'users',
  TRANSACTIONS: 'transactions',
  LOANS: 'loans',
};

export class StorageService {
  // Auth State
  static async saveAuthState(authState: AuthState): Promise<void> {
    try {
      await AsyncStorage.setItem(STORAGE_KEYS.AUTH_STATE, JSON.stringify(authState));
      console.log('Auth state saved');
    } catch (error) {
      console.error('Error saving auth state:', error);
      throw error;
    }
  }

  static async getAuthState(): Promise<AuthState | null> {
    try {
      const data = await AsyncStorage.getItem(STORAGE_KEYS.AUTH_STATE);
      if (data) {
        const authState = JSON.parse(data);
        // Convert date strings back to Date objects
        if (authState.user && authState.user.createdAt) {
          authState.user.createdAt = new Date(authState.user.createdAt);
        }
        return authState;
      }
      return null;
    } catch (error) {
      console.error('Error getting auth state:', error);
      return null;
    }
  }

  static async clearAuthState(): Promise<void> {
    try {
      await AsyncStorage.removeItem(STORAGE_KEYS.AUTH_STATE);
      console.log('Auth state cleared');
    } catch (error) {
      console.error('Error clearing auth state:', error);
      throw error;
    }
  }

  // Users
  static async saveUser(user: User): Promise<void> {
    try {
      const users = await this.getUsers();
      const existingIndex = users.findIndex(u => u.id === user.id);
      
      if (existingIndex >= 0) {
        users[existingIndex] = user;
      } else {
        users.push(user);
      }
      
      await AsyncStorage.setItem(STORAGE_KEYS.USERS, JSON.stringify(users));
      console.log('User saved:', user.email);
    } catch (error) {
      console.error('Error saving user:', error);
      throw error;
    }
  }

  static async getUsers(): Promise<User[]> {
    try {
      const data = await AsyncStorage.getItem(STORAGE_KEYS.USERS);
      if (data) {
        const users = JSON.parse(data);
        // Convert date strings back to Date objects
        return users.map((user: any) => ({
          ...user,
          createdAt: new Date(user.createdAt),
        }));
      }
      return [];
    } catch (error) {
      console.error('Error getting users:', error);
      return [];
    }
  }

  static async getAllUsers(): Promise<User[]> {
    return this.getUsers();
  }

  static async getUserByEmail(email: string): Promise<User | null> {
    try {
      const users = await this.getUsers();
      return users.find(u => u.email.toLowerCase() === email.toLowerCase()) || null;
    } catch (error) {
      console.error('Error getting user by email:', error);
      return null;
    }
  }

  static async getUserById(userId: string): Promise<User | null> {
    try {
      const users = await this.getUsers();
      return users.find(u => u.id === userId) || null;
    } catch (error) {
      console.error('Error getting user by ID:', error);
      return null;
    }
  }

  // Transactions
  static async saveTransaction(transaction: Transaction): Promise<void> {
    try {
      const transactions = await this.getTransactions();
      transactions.push(transaction);
      await AsyncStorage.setItem(STORAGE_KEYS.TRANSACTIONS, JSON.stringify(transactions));
      console.log('Transaction saved:', transaction.id);
    } catch (error) {
      console.error('Error saving transaction:', error);
      throw error;
    }
  }

  static async getTransactions(): Promise<Transaction[]> {
    try {
      const data = await AsyncStorage.getItem(STORAGE_KEYS.TRANSACTIONS);
      if (data) {
        const transactions = JSON.parse(data);
        // Convert date strings back to Date objects
        return transactions.map((transaction: any) => ({
          ...transaction,
          createdAt: new Date(transaction.createdAt),
        }));
      }
      return [];
    } catch (error) {
      console.error('Error getting transactions:', error);
      return [];
    }
  }

  static async getUserTransactions(userId: string): Promise<Transaction[]> {
    try {
      const transactions = await this.getTransactions();
      return transactions.filter(t => t.userId === userId);
    } catch (error) {
      console.error('Error getting user transactions:', error);
      return [];
    }
  }

  // Loans
  static async saveLoan(loan: Loan): Promise<void> {
    try {
      const loans = await this.getLoans();
      loans.push(loan);
      await AsyncStorage.setItem(STORAGE_KEYS.LOANS, JSON.stringify(loans));
      console.log('Loan saved:', loan.id);
    } catch (error) {
      console.error('Error saving loan:', error);
      throw error;
    }
  }

  static async saveLoans(loans: Loan[]): Promise<void> {
    try {
      await AsyncStorage.setItem(STORAGE_KEYS.LOANS, JSON.stringify(loans));
      console.log('Loans updated');
    } catch (error) {
      console.error('Error saving loans:', error);
      throw error;
    }
  }

  static async getLoans(): Promise<Loan[]> {
    try {
      const data = await AsyncStorage.getItem(STORAGE_KEYS.LOANS);
      if (data) {
        const loans = JSON.parse(data);
        // Convert date strings back to Date objects
        return loans.map((loan: any) => ({
          ...loan,
          appliedAt: new Date(loan.appliedAt),
          approvedAt: loan.approvedAt ? new Date(loan.approvedAt) : undefined,
          repayments: loan.repayments.map((repayment: any) => ({
            ...repayment,
            dueDate: new Date(repayment.dueDate),
            paidDate: repayment.paidDate ? new Date(repayment.paidDate) : undefined,
          })),
        }));
      }
      return [];
    } catch (error) {
      console.error('Error getting loans:', error);
      return [];
    }
  }

  static async getUserLoans(userId: string): Promise<Loan[]> {
    try {
      const loans = await this.getLoans();
      return loans.filter(l => l.userId === userId);
    } catch (error) {
      console.error('Error getting user loans:', error);
      return [];
    }
  }

  // Clear all data
  static async clearAllData(): Promise<void> {
    try {
      await AsyncStorage.multiRemove([
        STORAGE_KEYS.TRANSACTIONS,
        STORAGE_KEYS.LOANS,
      ]);
      console.log('All data cleared');
    } catch (error) {
      console.error('Error clearing all data:', error);
      throw error;
    }
  }
}
