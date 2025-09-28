
import { Transaction, PaymentRequest } from '../types';
import { StorageService } from '../utils/storage';
import * as Print from 'expo-print';
import * as Sharing from 'expo-sharing';
import * as FileSystem from 'expo-file-system';

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
      upiId: paymentRequest.upiId,
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

  static async getAllTransactions(): Promise<Transaction[]> {
    console.log('Getting all transactions (admin)');
    return await StorageService.getTransactions();
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

  static generateInvoiceHTML(transaction: Transaction): string {
    const invoiceNumber = `INV-${transaction.id.slice(-8).toUpperCase()}`;
    const date = new Date(transaction.createdAt).toLocaleDateString();
    const time = new Date(transaction.createdAt).toLocaleTimeString();

    return `
      <!DOCTYPE html>
      <html>
        <head>
          <meta charset="utf-8">
          <title>Invoice ${invoiceNumber}</title>
          <style>
            body {
              font-family: 'Helvetica Neue', Arial, sans-serif;
              margin: 0;
              padding: 40px;
              background-color: #f8f9fa;
            }
            .invoice-container {
              max-width: 600px;
              margin: 0 auto;
              background: white;
              border-radius: 12px;
              box-shadow: 0 4px 6px rgba(0, 0, 0, 0.1);
              overflow: hidden;
            }
            .header {
              background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
              color: white;
              padding: 30px;
              text-align: center;
            }
            .header h1 {
              margin: 0;
              font-size: 28px;
              font-weight: 700;
            }
            .header p {
              margin: 8px 0 0 0;
              opacity: 0.9;
              font-size: 16px;
            }
            .content {
              padding: 30px;
            }
            .invoice-details {
              display: flex;
              justify-content: space-between;
              margin-bottom: 30px;
              padding-bottom: 20px;
              border-bottom: 2px solid #e9ecef;
            }
            .invoice-info h3 {
              margin: 0 0 10px 0;
              color: #495057;
              font-size: 14px;
              text-transform: uppercase;
              letter-spacing: 1px;
            }
            .invoice-info p {
              margin: 0;
              color: #212529;
              font-size: 16px;
              font-weight: 600;
            }
            .transaction-details {
              background: #f8f9fa;
              border-radius: 8px;
              padding: 20px;
              margin-bottom: 30px;
            }
            .detail-row {
              display: flex;
              justify-content: space-between;
              align-items: center;
              padding: 12px 0;
              border-bottom: 1px solid #dee2e6;
            }
            .detail-row:last-child {
              border-bottom: none;
            }
            .detail-label {
              color: #6c757d;
              font-size: 14px;
            }
            .detail-value {
              color: #212529;
              font-weight: 600;
              font-size: 14px;
            }
            .amount-section {
              background: #e3f2fd;
              border-radius: 8px;
              padding: 20px;
              text-align: center;
              margin-bottom: 30px;
            }
            .amount-label {
              color: #1976d2;
              font-size: 14px;
              margin-bottom: 8px;
              text-transform: uppercase;
              letter-spacing: 1px;
            }
            .amount-value {
              color: #1976d2;
              font-size: 32px;
              font-weight: 700;
              margin: 0;
            }
            .status-badge {
              display: inline-block;
              padding: 6px 12px;
              border-radius: 20px;
              font-size: 12px;
              font-weight: 600;
              text-transform: uppercase;
              letter-spacing: 0.5px;
            }
            .status-success {
              background: #d4edda;
              color: #155724;
            }
            .status-failed {
              background: #f8d7da;
              color: #721c24;
            }
            .status-pending {
              background: #fff3cd;
              color: #856404;
            }
            .footer {
              text-align: center;
              color: #6c757d;
              font-size: 12px;
              line-height: 1.5;
            }
            .footer p {
              margin: 4px 0;
            }
          </style>
        </head>
        <body>
          <div class="invoice-container">
            <div class="header">
              <h1>PayLite+Loans</h1>
              <p>Payment Invoice</p>
            </div>
            
            <div class="content">
              <div class="invoice-details">
                <div class="invoice-info">
                  <h3>Invoice Number</h3>
                  <p>${invoiceNumber}</p>
                </div>
                <div class="invoice-info">
                  <h3>Date & Time</h3>
                  <p>${date}</p>
                  <p>${time}</p>
                </div>
              </div>
              
              <div class="amount-section">
                <div class="amount-label">Transaction Amount</div>
                <h2 class="amount-value">₹${transaction.amount.toLocaleString()}</h2>
              </div>
              
              <div class="transaction-details">
                <div class="detail-row">
                  <span class="detail-label">Transaction ID</span>
                  <span class="detail-value">${transaction.id}</span>
                </div>
                <div class="detail-row">
                  <span class="detail-label">Payment Method</span>
                  <span class="detail-value">${transaction.type}</span>
                </div>
                <div class="detail-row">
                  <span class="detail-label">Description</span>
                  <span class="detail-value">${transaction.description}</span>
                </div>
                ${transaction.upiId ? `
                <div class="detail-row">
                  <span class="detail-label">UPI ID</span>
                  <span class="detail-value">${transaction.upiId}</span>
                </div>
                ` : ''}
                <div class="detail-row">
                  <span class="detail-label">Status</span>
                  <span class="detail-value">
                    <span class="status-badge status-${transaction.status.toLowerCase()}">
                      ${transaction.status}
                    </span>
                  </span>
                </div>
              </div>
              
              <div class="footer">
                <p><strong>PayLite+Loans</strong></p>
                <p>A secure fintech platform for payments and micro-loans</p>
                <p>This is a computer-generated invoice and does not require a signature.</p>
                <p>For support, contact us at support@payliteloans.com</p>
              </div>
            </div>
          </div>
        </body>
      </html>
    `;
  }

  static async downloadInvoice(transaction: Transaction): Promise<boolean> {
    try {
      console.log('Generating invoice for transaction:', transaction.id);
      
      const html = this.generateInvoiceHTML(transaction);
      const invoiceNumber = `INV-${transaction.id.slice(-8).toUpperCase()}`;
      
      // Generate PDF
      const { uri } = await Print.printToFileAsync({
        html,
        base64: false,
      });

      console.log('PDF generated at:', uri);

      // Check if sharing is available
      const isAvailable = await Sharing.isAvailableAsync();
      if (isAvailable) {
        // Share the PDF
        await Sharing.shareAsync(uri, {
          mimeType: 'application/pdf',
          dialogTitle: `Invoice ${invoiceNumber}`,
          UTI: 'com.adobe.pdf',
        });
        console.log('Invoice shared successfully');
        return true;
      } else {
        console.log('Sharing not available, PDF saved to:', uri);
        return true;
      }
    } catch (error) {
      console.error('Error generating/sharing invoice:', error);
      return false;
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
      upiId: transaction.upiId,
    };

    console.log('Invoice data generated for transaction:', transaction.id);
    return JSON.stringify(invoiceData, null, 2);
  }
}
