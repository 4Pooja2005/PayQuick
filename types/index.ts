
export interface User {
  id: string;
  email: string;
  name: string;
  role: 'user' | 'admin';
  createdAt: Date;
}

export interface Transaction {
  id: string;
  userId: string;
  amount: number;
  type: 'UPI' | 'Card';
  status: 'Success' | 'Failed' | 'Pending';
  description: string;
  createdAt: Date;
  merchantName?: string;
}

export interface Loan {
  id: string;
  userId: string;
  amount: number;
  status: 'Pending' | 'Approved' | 'Rejected';
  interestRate: number;
  termMonths: number;
  emiAmount: number;
  remainingBalance: number;
  appliedAt: Date;
  approvedAt?: Date;
  repayments: LoanRepayment[];
}

export interface LoanRepayment {
  id: string;
  loanId: string;
  amount: number;
  dueDate: Date;
  paidDate?: Date;
  status: 'Pending' | 'Paid' | 'Overdue';
}

export interface AuthState {
  user: User | null;
  isAuthenticated: boolean;
  token: string | null;
}

export interface PaymentRequest {
  amount: number;
  type: 'UPI' | 'Card';
  description: string;
  merchantName?: string;
}

export interface LoanApplication {
  amount: number;
  termMonths: number;
  purpose: string;
}
