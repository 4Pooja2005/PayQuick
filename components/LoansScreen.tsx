
import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, ScrollView, TextInput, Pressable, Alert } from 'react-native';
import { IconSymbol } from './IconSymbol';
import { Button } from './button';
import { colors, commonStyles } from '../styles/commonStyles';
import { useAuth } from '../contexts/AuthContext';
import { Loan, LoanApplication, Transaction } from '../types';
import { LoanService } from '../services/LoanService';
import { PaymentService } from '../services/PaymentService';

interface LoansScreenProps {
  onTabChange: (tab: string) => void;
}

export const LoansScreen: React.FC<LoansScreenProps> = ({ onTabChange }) => {
  const { user } = useAuth();
  const [activeView, setActiveView] = useState<'apply' | 'history'>('apply');
  const [loans, setLoans] = useState<Loan[]>([]);
  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  
  // Loan application form state
  const [amount, setAmount] = useState('');
  const [termMonths, setTermMonths] = useState('12');
  const [purpose, setPurpose] = useState('');

  useEffect(() => {
    loadData();
  }, [user]);

  const loadData = async () => {
    if (!user) return;
    
    try {
      const [userLoans, userTransactions] = await Promise.all([
        LoanService.getUserLoans(user.id),
        PaymentService.getTransactionHistory(user.id)
      ]);
      
      setLoans(userLoans.sort((a, b) => 
        new Date(b.appliedAt).getTime() - new Date(a.appliedAt).getTime()
      ));
      setTransactions(userTransactions);
      console.log('Loans and transactions loaded');
    } catch (error) {
      console.error('Error loading data:', error);
    }
  };

  const handleApplyLoan = async () => {
    if (!user) return;
    
    if (!amount || !purpose) {
      Alert.alert('Error', 'Please fill in all required fields');
      return;
    }

    const loanAmount = parseFloat(amount);
    if (isNaN(loanAmount) || loanAmount < 10000 || loanAmount > 50000) {
      Alert.alert('Error', 'Loan amount must be between ₹10,000 and ₹50,000');
      return;
    }

    const months = parseInt(termMonths);
    if (isNaN(months) || months < 6 || months > 24) {
      Alert.alert('Error', 'Loan term must be between 6 and 24 months');
      return;
    }

    try {
      setIsLoading(true);
      
      const loanApplication: LoanApplication = {
        amount: loanAmount,
        termMonths: months,
        purpose,
      };

      const loan = await LoanService.applyForLoan(user.id, loanApplication, transactions);
      
      // Clear form
      setAmount('');
      setPurpose('');
      setTermMonths('12');
      
      // Reload loans
      await loadData();
      
      // Show result
      Alert.alert(
        'Loan Application Submitted',
        `Your loan application for ₹${loanAmount.toLocaleString()} has been ${loan.status.toLowerCase()}.`,
        [
          { text: 'OK', onPress: () => setActiveView('history') }
        ]
      );
      
    } catch (error) {
      console.error('Loan application error:', error);
      Alert.alert('Error', 'Failed to submit loan application. Please try again.');
    } finally {
      setIsLoading(false);
    }
  };

  const handleRepayEMI = async (loanId: string) => {
    try {
      const success = await LoanService.repayEMI(loanId);
      if (success) {
        await loadData();
        Alert.alert('Success', 'EMI payment successful!');
      } else {
        Alert.alert('Error', 'Failed to process EMI payment');
      }
    } catch (error) {
      console.error('EMI repayment error:', error);
      Alert.alert('Error', 'Failed to process EMI payment');
    }
  };

  const calculateEMI = (principal: number, rate: number, months: number): number => {
    const monthlyRate = rate / 100 / 12;
    const emi = (principal * monthlyRate * Math.pow(1 + monthlyRate, months)) / 
                (Math.pow(1 + monthlyRate, months) - 1);
    return Math.round(emi);
  };

  const handleBackToDashboard = () => {
    onTabChange('dashboard');
  };

  const renderApplyLoan = () => {
    const loanAmount = parseFloat(amount) || 0;
    const months = parseInt(termMonths) || 12;
    const interestRate = 12; // 12% annual interest rate
    const emiAmount = loanAmount > 0 ? calculateEMI(loanAmount, interestRate, months) : 0;

    return (
      <ScrollView style={styles.content} showsVerticalScrollIndicator={false}>
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Apply for Loan</Text>
          <Text style={styles.sectionSubtitle}>
            Get instant micro-loans from ₹10,000 to ₹50,000
          </Text>
          
          <View style={styles.form}>
            <Text style={styles.label}>Loan Amount *</Text>
            <TextInput
              style={commonStyles.input}
              value={amount}
              onChangeText={setAmount}
              placeholder="Enter amount (₹10,000 - ₹50,000)"
              keyboardType="numeric"
              placeholderTextColor={colors.grey}
            />

            <Text style={styles.label}>Loan Term *</Text>
            <View style={styles.termContainer}>
              {['6', '12', '18', '24'].map((term) => (
                <Pressable
                  key={term}
                  style={[
                    styles.termButton,
                    termMonths === term && styles.termButtonActive
                  ]}
                  onPress={() => setTermMonths(term)}
                >
                  <Text style={[
                    styles.termText,
                    termMonths === term && styles.termTextActive
                  ]}>
                    {term} months
                  </Text>
                </Pressable>
              ))}
            </View>

            <Text style={styles.label}>Purpose *</Text>
            <TextInput
              style={[commonStyles.input, styles.textArea]}
              value={purpose}
              onChangeText={setPurpose}
              placeholder="What will you use this loan for?"
              placeholderTextColor={colors.grey}
              multiline
              numberOfLines={3}
            />

            {loanAmount > 0 && (
              <View style={styles.calculatorCard}>
                <Text style={styles.calculatorTitle}>Loan Summary</Text>
                <View style={styles.calculatorRow}>
                  <Text style={styles.calculatorLabel}>Principal Amount:</Text>
                  <Text style={styles.calculatorValue}>₹{loanAmount.toLocaleString()}</Text>
                </View>
                <View style={styles.calculatorRow}>
                  <Text style={styles.calculatorLabel}>Interest Rate:</Text>
                  <Text style={styles.calculatorValue}>{interestRate}% per annum</Text>
                </View>
                <View style={styles.calculatorRow}>
                  <Text style={styles.calculatorLabel}>Loan Term:</Text>
                  <Text style={styles.calculatorValue}>{months} months</Text>
                </View>
                <View style={[styles.calculatorRow, styles.calculatorRowHighlight]}>
                  <Text style={styles.calculatorLabelHighlight}>Monthly EMI:</Text>
                  <Text style={styles.calculatorValueHighlight}>₹{emiAmount.toLocaleString()}</Text>
                </View>
                <View style={styles.calculatorRow}>
                  <Text style={styles.calculatorLabel}>Total Amount:</Text>
                  <Text style={styles.calculatorValue}>₹{(emiAmount * months).toLocaleString()}</Text>
                </View>
              </View>
            )}

            <Button
              onPress={handleApplyLoan}
              loading={isLoading}
              style={styles.applyButton}
            >
              Apply for Loan
            </Button>
          </View>
        </View>
      </ScrollView>
    );
  };

  const renderLoanHistory = () => (
    <ScrollView style={styles.content} showsVerticalScrollIndicator={false}>
      <View style={styles.section}>
        <Text style={styles.sectionTitle}>My Loans</Text>
        
        {loans.length === 0 ? (
          <View style={styles.emptyState}>
            <IconSymbol name="banknote" size={48} color={colors.grey} />
            <Text style={styles.emptyText}>No loans yet</Text>
            <Text style={styles.emptySubtext}>Apply for your first loan to see it here</Text>
          </View>
        ) : (
          <View style={styles.loansList}>
            {loans.map((loan) => (
              <View key={loan.id} style={styles.loanCard}>
                <View style={styles.loanHeader}>
                  <View style={styles.loanIcon}>
                    <IconSymbol name="banknote" size={20} color={colors.primary} />
                  </View>
                  <View style={styles.loanDetails}>
                    <Text style={styles.loanTitle}>
                      ₹{loan.amount.toLocaleString()} Loan
                    </Text>
                    <Text style={styles.loanSubtitle}>
                      {loan.termMonths} months • {loan.interestRate}% interest
                    </Text>
                    <Text style={styles.loanDate}>
                      Applied on {new Date(loan.appliedAt).toLocaleDateString()}
                    </Text>
                  </View>
                  <View style={styles.loanStatus}>
                    <View style={[
                      styles.statusBadge,
                      { backgroundColor: 
                        loan.status === 'Approved' ? colors.success + '20' :
                        loan.status === 'Rejected' ? colors.error + '20' :
                        colors.warning + '20'
                      }
                    ]}>
                      <Text style={[
                        styles.statusText,
                        { color: 
                          loan.status === 'Approved' ? colors.success :
                          loan.status === 'Rejected' ? colors.error :
                          colors.warning
                        }
                      ]}>
                        {loan.status}
                      </Text>
                    </View>
                  </View>
                </View>
                
                {loan.status === 'Approved' && (
                  <View style={styles.loanProgress}>
                    <View style={styles.progressRow}>
                      <Text style={styles.progressLabel}>Remaining Balance:</Text>
                      <Text style={styles.progressValue}>
                        ₹{loan.remainingBalance.toLocaleString()}
                      </Text>
                    </View>
                    <View style={styles.progressRow}>
                      <Text style={styles.progressLabel}>Monthly EMI:</Text>
                      <Text style={styles.progressValue}>
                        ₹{loan.emiAmount.toLocaleString()}
                      </Text>
                    </View>
                    
                    {loan.remainingBalance > 0 && (
                      <Button
                        variant="outline"
                        onPress={() => handleRepayEMI(loan.id)}
                        style={styles.repayButton}
                      >
                        Pay EMI (₹{loan.emiAmount.toLocaleString()})
                      </Button>
                    )}
                    
                    {loan.remainingBalance === 0 && (
                      <View style={styles.completedBadge}>
                        <IconSymbol name="checkmark.circle.fill" size={16} color={colors.success} />
                        <Text style={styles.completedText}>Loan Completed</Text>
                      </View>
                    )}
                  </View>
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
        <Pressable style={styles.backButton} onPress={handleBackToDashboard}>
          <IconSymbol name="chevron.left" size={24} color={colors.text} />
          <Text style={styles.backButtonText}>Dashboard</Text>
        </Pressable>
        
        <View style={styles.segmentedControl}>
          <Pressable
            style={[
              styles.segmentButton,
              activeView === 'apply' && styles.segmentButtonActive
            ]}
            onPress={() => setActiveView('apply')}
          >
            <Text style={[
              styles.segmentText,
              activeView === 'apply' && styles.segmentTextActive
            ]}>
              Apply Loan
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
              My Loans
            </Text>
          </Pressable>
        </View>
      </View>

      {activeView === 'apply' ? renderApplyLoan() : renderLoanHistory()}
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
  backButton: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 16,
    paddingVertical: 8,
  },
  backButtonText: {
    fontSize: 16,
    fontWeight: '500',
    color: colors.text,
    marginLeft: 8,
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
    marginBottom: 8,
  },
  sectionSubtitle: {
    fontSize: 16,
    color: colors.grey,
    marginBottom: 24,
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
  termContainer: {
    flexDirection: 'row',
    gap: 8,
  },
  termButton: {
    flex: 1,
    paddingVertical: 12,
    paddingHorizontal: 16,
    borderRadius: 8,
    borderWidth: 2,
    borderColor: colors.border,
    backgroundColor: colors.card,
    alignItems: 'center',
  },
  termButtonActive: {
    borderColor: colors.primary,
    backgroundColor: colors.primary + '10',
  },
  termText: {
    fontSize: 14,
    fontWeight: '500',
    color: colors.grey,
  },
  termTextActive: {
    color: colors.primary,
  },
  textArea: {
    height: 80,
    textAlignVertical: 'top',
  },
  calculatorCard: {
    backgroundColor: colors.card,
    borderRadius: 12,
    padding: 16,
    borderWidth: 1,
    borderColor: colors.border,
    marginTop: 8,
  },
  calculatorTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: colors.text,
    marginBottom: 12,
  },
  calculatorRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 6,
  },
  calculatorRowHighlight: {
    backgroundColor: colors.primary + '10',
    marginHorizontal: -8,
    paddingHorizontal: 8,
    borderRadius: 6,
    marginVertical: 4,
  },
  calculatorLabel: {
    fontSize: 14,
    color: colors.grey,
  },
  calculatorValue: {
    fontSize: 14,
    fontWeight: '500',
    color: colors.text,
  },
  calculatorLabelHighlight: {
    fontSize: 16,
    fontWeight: '600',
    color: colors.primary,
  },
  calculatorValueHighlight: {
    fontSize: 16,
    fontWeight: '700',
    color: colors.primary,
  },
  applyButton: {
    marginTop: 16,
  },
  loansList: {
    gap: 12,
  },
  loanCard: {
    backgroundColor: colors.card,
    borderRadius: 12,
    padding: 16,
    borderWidth: 1,
    borderColor: colors.border,
  },
  loanHeader: {
    flexDirection: 'row',
    alignItems: 'flex-start',
  },
  loanIcon: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: colors.backgroundAlt,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 12,
  },
  loanDetails: {
    flex: 1,
  },
  loanTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: colors.text,
    marginBottom: 4,
  },
  loanSubtitle: {
    fontSize: 14,
    color: colors.grey,
    marginBottom: 2,
  },
  loanDate: {
    fontSize: 12,
    color: colors.grey,
  },
  loanStatus: {
    alignItems: 'flex-end',
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
  loanProgress: {
    marginTop: 16,
    paddingTop: 16,
    borderTopWidth: 1,
    borderTopColor: colors.border,
  },
  progressRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 8,
  },
  progressLabel: {
    fontSize: 14,
    color: colors.grey,
  },
  progressValue: {
    fontSize: 14,
    fontWeight: '600',
    color: colors.text,
  },
  repayButton: {
    marginTop: 12,
  },
  completedBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: 12,
    paddingVertical: 8,
    paddingHorizontal: 16,
    backgroundColor: colors.success + '10',
    borderRadius: 8,
  },
  completedText: {
    fontSize: 14,
    fontWeight: '500',
    color: colors.success,
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
