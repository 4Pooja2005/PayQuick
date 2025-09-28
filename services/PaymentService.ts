
import { Transaction, PaymentRequest } from '../types';
import { StorageService } from '../utils/storage';

export class PaymentService {
  static async processPayment(userId: string, paymentRequest: PaymentRequest): Promise<Transaction> {
    console.log('Processing payment:', paymentRequest);
    
    // Simulate payment processing delay
    await new Promise(resolve => setTimeout(resolve, 1000));

    // Generate random status with weighted probabilities
    const statuses: Array<{ status: Transaction['status'], weight: number }> = [
      { status: 'Success', weight: 70 },
      { status: 'Failed', weight: 20 },
      { status: 'Pending', weight: 10 },
    ];

    const totalWeight = statuses.reduce((sum, item) => sum + item.weight, 0);
    const random = Math.random() * totalWeight;
    let currentWeight = 0;
    let selectedStatus: Transaction['status'] = 'Success';

    for (const item of statuses) {
      currentWeight += item.weight;
      if (random <= currentWeight) {
        selectedStatus = item.status;
        break;
      }
    }

    const transaction: Transaction = {
      id: `txn_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
      userId,
      amount: paymentRequest.amount,
      type: paymentRequest.type,
      status: selectedStatus,
      description: paymentRequest.description,
      merchantName: paymentRequest.merchantName,
      createdAt: new Date(),
    };

    await StorageService.saveTransaction(transaction);
    console.log('Payment processed:', transaction.id, transaction.status);
    
    return transaction;
  }

  static async getTransactionHistory(userId: string): Promise<Transaction[]> {
    console.log('Getting transaction history for user:', userId);
    return await StorageService.getUserTransactions(userId);
  }

  static async getTransactionById(transactionId: string): Promise<Transaction | null> {
    try {
      const allTransactions = await StorageService.getTransactions();
      const transaction = allTransactions.find(t => t.id === transactionId);
      console.log('Transaction found:', !!transaction);
      return transaction || null;
    } catch (error) {
      console.error('Error getting transaction by ID:', error);
      return null;
    }
  }

  static generateInvoiceData(transaction: Transaction): string {
    const invoiceData = {
      invoiceNumber: `INV-${transaction.id.slice(-8).toUpperCase()}`,
      date: transaction.createdAt.toLocaleDateString(),
      amount: transaction.amount,
      status: transaction.status,
      type: transaction.type,
      description: transaction.description,
      merchantName: transaction.merchantName || 'PayLite+Loans',
    };

    console.log('Invoice data generated for transaction:', transaction.id);
    return JSON.stringify(invoiceData, null, 2);
  }
}
