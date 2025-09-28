
import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, ScrollView, TextInput, Pressable, Alert } from 'react-native';
import { IconSymbol } from './IconSymbol';
import { Button } from './button';
import { colors, commonStyles } from '../styles/commonStyles';
import { useAuth } from '../contexts/AuthContext';
import { Transaction, PaymentRequest } from '../types';
import { PaymentService } from '../services/PaymentService';

interface PaymentsScreenProps {
  onTabChange: (tab: string) => void;
}

export const PaymentsScreen: React.FC<PaymentsScreenProps> = ({ onTabChange }) => {
  const { user } = useAuth();
  const [activeView, setActiveView] = useState<'make' | 'history'>('make');
  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  
  // Payment form state
  const [amount, setAmount] = useState('');
  const [description, setDescription] = useState('');
  const [merchantName, setMerchantName] = useState('');
  const [paymentType, setPaymentType] = useState<'UPI' | 'Card'>('UPI');

  useEffect(() => {
    loadTransactions();
  }, [user]);

  const loadTransactions = async () => {
    if (!user) return;
    
    try {
      const userTransactions = await PaymentService.getTransactionHistory(user.id);
      setTransactions(userTransactions.sort((a, b) => 
        new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
      ));
      console.log('Transactions loaded for payments screen');
    } catch (error) {
      console.error('Error loading transactions:', error);
    }
  };

  const handleMakePayment = async () => {
    if (!user) return;
    
    if (!amount || !description) {
      Alert.alert('Error', 'Please fill in all required fields');
      return;
    }

    const paymentAmount = parseFloat(amount);
    if (isNaN(paymentAmount) || paymentAmount <= 0) {
      Alert.alert('Error', 'Please enter a valid amount');
      return;
    }

    try {
      setIsLoading(true);
      
      const paymentRequest: PaymentRequest = {
        amount: paymentAmount,
        type: paymentType,
        description,
        merchantName: merchantName || undefined,
      };

      const transaction = await PaymentService.processPayment(user.id, paymentRequest);
      
      // Clear form
      setAmount('');
      setDescription('');
      setMerchantName('');
      
      // Reload transactions
      await loadTransactions();
      
      // Show result
      Alert.alert(
        'Payment Processed',
        `Your payment of ₹${paymentAmount.toLocaleString()} has been ${transaction.status.toLowerCase()}.`,
        [
          { text: 'OK', onPress: () => setActiveView('history') }
        ]
      );
      
    } catch (error) {
      console.error('Payment error:', error);
      Alert.alert('Error', 'Failed to process payment. Please try again.');
    } finally {
      setIsLoading(false);
    }
  };

  const handleDownloadInvoice = (transaction: Transaction) => {
    const invoiceData = PaymentService.generateInvoiceData(transaction);
    Alert.alert(
      'Invoice Generated',
      `Invoice data for transaction ${transaction.id.slice(-8).toUpperCase()}:\n\n${invoiceData}`,
      [{ text: 'OK' }]
    );
  };

  const renderMakePayment = () => (
    <ScrollView style={styles.content} showsVerticalScrollIndicator={false}>
      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Make Payment</Text>
        
        <View style={styles.paymentTypeContainer}>
          <Pressable
            style={[
              styles.paymentTypeButton,
              paymentType === 'UPI' && styles.paymentTypeButtonActive
            ]}
            onPress={() => setPaymentType('UPI')}
          >
            <IconSymbol name="qrcode" size={20} color={paymentType === 'UPI' ? colors.primary : colors.grey} />
            <Text style={[
              styles.paymentTypeText,
              paymentType === 'UPI' && styles.paymentTypeTextActive
            ]}>
              UPI
            </Text>
          </Pressable>
          
          <Pressable
            style={[
              styles.paymentTypeButton,
              paymentType === 'Card' && styles.paymentTypeButtonActive
            ]}
            onPress={() => setPaymentType('Card')}
          >
            <IconSymbol name="creditcard" size={20} color={paymentType === 'Card' ? colors.primary : colors.grey} />
            <Text style={[
              styles.paymentTypeText,
              paymentType === 'Card' && styles.paymentTypeTextActive
            ]}>
              Card
            </Text>
          </Pressable>
        </View>

        <View style={styles.form}>
          <Text style={styles.label}>Amount *</Text>
          <TextInput
            style={commonStyles.input}
            value={amount}
            onChangeText={setAmount}
            placeholder="Enter amount"
            keyboardType="numeric"
            placeholderTextColor={colors.grey}
          />

          <Text style={styles.label}>Description *</Text>
          <TextInput
            style={commonStyles.input}
            value={description}
            onChangeText={setDescription}
            placeholder="Payment description"
            placeholderTextColor={colors.grey}
          />

          <Text style={styles.label}>Merchant Name (Optional)</Text>
          <TextInput
            style={commonStyles.input}
            value={merchantName}
            onChangeText={setMerchantName}
            placeholder="Merchant or store name"
            placeholderTextColor={colors.grey}
          />

          <Button
            onPress={handleMakePayment}
            loading={isLoading}
            style={styles.payButton}
          >
            Pay ₹{amount || '0'}
          </Button>
        </View>
      </View>
    </ScrollView>
  );

  const renderTransactionHistory = () => (
    <ScrollView style={styles.content} showsVerticalScrollIndicator={false}>
      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Transaction History</Text>
        
        {transactions.length === 0 ? (
          <View style={styles.emptyState}>
            <IconSymbol name="tray" size={48} color={colors.grey} />
            <Text style={styles.emptyText}>No transactions yet</Text>
            <Text style={styles.emptySubtext}>Make your first payment to see it here</Text>
          </View>
        ) : (
          <View style={styles.transactionsList}>
            {transactions.map((transaction) => (
              <View key={transaction.id} style={styles.transactionCard}>
                <View style={styles.transactionHeader}>
                  <View style={styles.transactionIcon}>
                    <IconSymbol 
                      name={transaction.type === 'UPI' ? 'qrcode' : 'creditcard'} 
                      size={20} 
                      color={colors.primary} 
                    />
                  </View>
                  <View style={styles.transactionDetails}>
                    <Text style={styles.transactionTitle}>{transaction.description}</Text>
                    <Text style={styles.transactionSubtitle}>
                      {transaction.merchantName || 'PayLite+Loans'} • {transaction.type}
                    </Text>
                    <Text style={styles.transactionDate}>
                      {new Date(transaction.createdAt).toLocaleDateString()} at{' '}
                      {new Date(transaction.createdAt).toLocaleTimeString()}
                    </Text>
                  </View>
                  <View style={styles.transactionAmount}>
                    <Text style={styles.amountText}>
                      ₹{transaction.amount.toLocaleString()}
                    </Text>
                    <View style={[
                      styles.statusBadge,
                      { backgroundColor: 
                        transaction.status === 'Success' ? colors.success + '20' :
                        transaction.status === 'Failed' ? colors.error + '20' :
                        colors.warning + '20'
                      }
                    ]}>
                      <Text style={[
                        styles.statusText,
                        { color: 
                          transaction.status === 'Success' ? colors.success :
                          transaction.status === 'Failed' ? colors.error :
                          colors.warning
                        }
                      ]}>
                        {transaction.status}
                      </Text>
                    </View>
                  </View>
                </View>
                
                {transaction.status === 'Success' && (
                  <Pressable
                    style={styles.invoiceButton}
                    onPress={() => handleDownloadInvoice(transaction)}
                  >
                    <IconSymbol name="doc.text" size={16} color={colors.primary} />
                    <Text style={styles.invoiceButtonText}>Download Invoice</Text>
                  </Pressable>
                )}
              </View>
            ))}
          </View>
        )}
      </View>
    </ScrollView>
  );

  return (
    <View style={commonStyles.container}>
      <View style={styles.header}>
        <View style={styles.segmentedControl}>
          <Pressable
            style={[
              styles.segmentButton,
              activeView === 'make' && styles.segmentButtonActive
            ]}
            onPress={() => setActiveView('make')}
          >
            <Text style={[
              styles.segmentText,
              activeView === 'make' && styles.segmentTextActive
            ]}>
              Make Payment
            </Text>
          </Pressable>
          
          <Pressable
            style={[
              styles.segmentButton,
              activeView === 'history' && styles.segmentButtonActive
            ]}
            onPress={() => setActiveView('history')}
          >
            <Text style={[
              styles.segmentText,
              activeView === 'history' && styles.segmentTextActive
            ]}>
              History
            </Text>
          </Pressable>
        </View>
      </View>

      {activeView === 'make' ? renderMakePayment() : renderTransactionHistory()}
    </View>
  );
};

const styles = StyleSheet.create({
  content: {
    flex: 1,
    backgroundColor: colors.background,
  },
  header: {
    backgroundColor: colors.card,
    paddingHorizontal: 20,
    paddingTop: 40,
    paddingBottom: 16,
    borderBottomWidth: 1,
    borderBottomColor: colors.border,
  },
  segmentedControl: {
    flexDirection: 'row',
    backgroundColor: colors.backgroundAlt,
    borderRadius: 8,
    padding: 4,
  },
  segmentButton: {
    flex: 1,
    paddingVertical: 8,
    alignItems: 'center',
    borderRadius: 6,
  },
  segmentButtonActive: {
    backgroundColor: colors.card,
  },
  segmentText: {
    fontSize: 16,
    fontWeight: '500',
    color: colors.grey,
  },
  segmentTextActive: {
    color: colors.primary,
  },
  section: {
    padding: 20,
  },
  sectionTitle: {
    fontSize: 24,
    fontWeight: '700',
    color: colors.text,
    marginBottom: 20,
  },
  paymentTypeContainer: {
    flexDirection: 'row',
    marginBottom: 24,
    gap: 12,
  },
  paymentTypeButton: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    padding: 16,
    borderRadius: 12,
    borderWidth: 2,
    borderColor: colors.border,
    backgroundColor: colors.card,
  },
  paymentTypeButtonActive: {
    borderColor: colors.primary,
    backgroundColor: colors.primary + '10',
  },
  paymentTypeText: {
    fontSize: 16,
    fontWeight: '500',
    color: colors.grey,
    marginLeft: 8,
  },
  paymentTypeTextActive: {
    color: colors.primary,
  },
  form: {
    gap: 16,
  },
  label: {
    fontSize: 16,
    fontWeight: '500',
    color: colors.text,
    marginBottom: 8,
  },
  payButton: {
    marginTop: 16,
  },
  transactionsList: {
    gap: 12,
  },
  transactionCard: {
    backgroundColor: colors.card,
    borderRadius: 12,
    padding: 16,
    borderWidth: 1,
    borderColor: colors.border,
  },
  transactionHeader: {
    flexDirection: 'row',
    alignItems: 'flex-start',
  },
  transactionIcon: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: colors.backgroundAlt,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 12,
  },
  transactionDetails: {
    flex: 1,
  },
  transactionTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: colors.text,
    marginBottom: 4,
  },
  transactionSubtitle: {
    fontSize: 14,
    color: colors.grey,
    marginBottom: 2,
  },
  transactionDate: {
    fontSize: 12,
    color: colors.grey,
  },
  transactionAmount: {
    alignItems: 'flex-end',
  },
  amountText: {
    fontSize: 18,
    fontWeight: '700',
    color: colors.text,
    marginBottom: 8,
  },
  statusBadge: {
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 12,
  },
  statusText: {
    fontSize: 12,
    fontWeight: '600',
  },
  invoiceButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: 12,
    paddingVertical: 8,
    paddingHorizontal: 16,
    backgroundColor: colors.primary + '10',
    borderRadius: 8,
  },
  invoiceButtonText: {
    fontSize: 14,
    fontWeight: '500',
    color: colors.primary,
    marginLeft: 6,
  },
  emptyState: {
    alignItems: 'center',
    paddingVertical: 60,
  },
  emptyText: {
    fontSize: 18,
    fontWeight: '600',
    color: colors.text,
    marginTop: 16,
    marginBottom: 8,
  },
  emptySubtext: {
    fontSize: 14,
    color: colors.grey,
    textAlign: 'center',
  },
});
