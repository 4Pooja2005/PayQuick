
import { Loan, LoanApplication, LoanRepayment, Transaction } from '../types';
import { StorageService } from '../utils/storage';

export class LoanService {
  static async applyForLoan(
    userId: string, 
    application: LoanApplication, 
    userTransactions: Transaction[]
  ): Promise<Loan> {
    console.log('Processing loan application:', application);
    
    // Simulate processing delay
    await new Promise(resolve => setTimeout(resolve, 1000));

    // Auto-approval logic: approve if user has >= 3 successful payments
    const successfulPayments = userTransactions.filter(t => t.status === 'Success').length;
    const isApproved = successfulPayments >= 3;
    
    const interestRate = 12; // 12% annual interest rate
    const monthlyRate = interestRate / 100 / 12;
    const emiAmount = this.calculateEMI(application.amount, interestRate, application.termMonths);

    const loan: Loan = {
      id: `loan_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
      userId,
      amount: application.amount,
      status: isApproved ? 'Approved' : 'Rejected',
      interestRate,
      termMonths: application.termMonths,
      emiAmount,
      remainingBalance: isApproved ? application.amount : 0,
      appliedAt: new Date(),
      approvedAt: isApproved ? new Date() : undefined,
      repayments: [],
    };

    await StorageService.saveLoan(loan);
    console.log('Loan application processed:', loan.id, loan.status);
    
    return loan;
  }

  static async getUserLoans(userId: string): Promise<Loan[]> {
    console.log('Getting loans for user:', userId);
    return await StorageService.getUserLoans(userId);
  }

  static async getAllLoans(): Promise<Loan[]> {
    console.log('Getting all loans (admin)');
    return await StorageService.getLoans();
  }

  static async repayEMI(loanId: string): Promise<boolean> {
    try {
      console.log('Processing EMI repayment for loan:', loanId);
      
      const loans = await StorageService.getLoans();
      const loanIndex = loans.findIndex(l => l.id === loanId);
      
      if (loanIndex === -1) {
        console.error('Loan not found');
        return false;
      }

      const loan = loans[loanIndex];
      
      if (loan.status !== 'Approved' || loan.remainingBalance <= 0) {
        console.error('Loan not eligible for repayment');
        return false;
      }

      // Create repayment record
      const repayment: LoanRepayment = {
        id: `repay_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
        loanId,
        amount: loan.emiAmount,
        dueDate: new Date(),
        paidDate: new Date(),
        status: 'Paid',
      };

      // Update loan
      const updatedLoan: Loan = {
        ...loan,
        remainingBalance: Math.max(0, loan.remainingBalance - loan.emiAmount),
        repayments: [...loan.repayments, repayment],
      };

      loans[loanIndex] = updatedLoan;
      await StorageService.saveLoans(loans);
      
      console.log('EMI repayment successful');
      return true;
    } catch (error) {
      console.error('Error processing EMI repayment:', error);
      return false;
    }
  }

  static calculateEMI(principal: number, annualRate: number, months: number): number {
    const monthlyRate = annualRate / 100 / 12;
    const emi = (principal * monthlyRate * Math.pow(1 + monthlyRate, months)) / 
                (Math.pow(1 + monthlyRate, months) - 1);
    return Math.round(emi);
  }

  static async getLoanById(loanId: string): Promise<Loan | null> {
    try {
      const allLoans = await StorageService.getLoans();
      const loan = allLoans.find(l => l.id === loanId);
      console.log('Loan found:', !!loan);
      return loan || null;
    } catch (error) {
      console.error('Error getting loan by ID:', error);
      return null;
    }
  }
}
