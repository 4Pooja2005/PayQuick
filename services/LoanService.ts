
import { Loan, LoanApplication, LoanRepayment, Transaction } from '../types';
import { StorageService } from '../utils/storage';

export class LoanService {
  static readonly INTEREST_RATE = 12; // 12% annual interest rate
  static readonly MIN_SUCCESSFUL_PAYMENTS = 3;

  static async applyForLoan(userId: string, application: LoanApplication): Promise<Loan> {
    console.log('Processing loan application:', application);

    // Check user's payment history for auto-approval
    const userTransactions = await StorageService.getUserTransactions(userId);
    const successfulPayments = userTransactions.filter(t => t.status === 'Success');
    
    const isAutoApproved = successfulPayments.length >= this.MIN_SUCCESSFUL_PAYMENTS;
    console.log(`User has ${successfulPayments.length} successful payments. Auto-approved: ${isAutoApproved}`);

    // Calculate EMI
    const monthlyInterestRate = this.INTEREST_RATE / 100 / 12;
    const totalAmount = application.amount + (application.amount * this.INTEREST_RATE / 100 * application.termMonths / 12);
    const emiAmount = Math.round(totalAmount / application.termMonths);

    const loan: Loan = {
      id: `loan_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
      userId,
      amount: application.amount,
      status: isAutoApproved ? 'Approved' : 'Pending',
      interestRate: this.INTEREST_RATE,
      termMonths: application.termMonths,
      emiAmount,
      remainingBalance: isAutoApproved ? totalAmount : 0,
      appliedAt: new Date(),
      approvedAt: isAutoApproved ? new Date() : undefined,
      repayments: [],
    };

    // Generate repayment schedule if approved
    if (isAutoApproved) {
      loan.repayments = this.generateRepaymentSchedule(loan);
    }

    await StorageService.saveLoan(loan);
    console.log('Loan application processed:', loan.id, loan.status);
    
    return loan;
  }

  static generateRepaymentSchedule(loan: Loan): LoanRepayment[] {
    const repayments: LoanRepayment[] = [];
    const startDate = new Date(loan.approvedAt || loan.appliedAt);

    for (let i = 0; i < loan.termMonths; i++) {
      const dueDate = new Date(startDate);
      dueDate.setMonth(dueDate.getMonth() + i + 1);

      const repayment: LoanRepayment = {
        id: `repay_${loan.id}_${i + 1}`,
        loanId: loan.id,
        amount: loan.emiAmount,
        dueDate,
        status: 'Pending',
      };

      repayments.push(repayment);
    }

    console.log(`Generated ${repayments.length} repayments for loan:`, loan.id);
    return repayments;
  }

  static async repayEMI(loanId: string, repaymentId: string): Promise<boolean> {
    try {
      console.log('Processing EMI repayment:', repaymentId);
      
      const loans = await StorageService.getLoans();
      const loan = loans.find(l => l.id === loanId);
      
      if (!loan) {
        console.error('Loan not found:', loanId);
        return false;
      }

      const repayment = loan.repayments.find(r => r.id === repaymentId);
      if (!repayment || repayment.status === 'Paid') {
        console.error('Repayment not found or already paid:', repaymentId);
        return false;
      }

      // Update repayment status
      repayment.status = 'Paid';
      repayment.paidDate = new Date();

      // Update loan balance
      const updatedBalance = Math.max(0, loan.remainingBalance - repayment.amount);
      
      await StorageService.updateLoan(loanId, {
        remainingBalance: updatedBalance,
        repayments: loan.repayments,
      });

      console.log('EMI repayment successful. Remaining balance:', updatedBalance);
      return true;
    } catch (error) {
      console.error('Error processing EMI repayment:', error);
      return false;
    }
  }

  static async getUserLoans(userId: string): Promise<Loan[]> {
    console.log('Getting loans for user:', userId);
    return await StorageService.getUserLoans(userId);
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

  static calculateEMI(principal: number, termMonths: number, interestRate: number = this.INTEREST_RATE): number {
    const monthlyInterestRate = interestRate / 100 / 12;
    const totalAmount = principal + (principal * interestRate / 100 * termMonths / 12);
    return Math.round(totalAmount / termMonths);
  }
}
