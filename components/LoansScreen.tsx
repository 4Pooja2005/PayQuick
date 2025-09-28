
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
  const [activeView, setActiveView] = useState<'apply' | 'manage'>('apply');
  const [loans, setLoans] = useState<Loan[]>([]);
  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  
  // Loan application form state
  const [amount, setAmount] = useState('');
  const [termMonths, setTermMonths] = useState('12');
  const [purpose, setPurpose] = useState('');

  useEffect(() => {
    loadUserData();
  }, [user]);

  const loadUserData = async () => {
    if (!user) return;
    
    try {
      const [userLoans, userTransactions] = await Promise.all([
        LoanService.getUserLoans(user.id),
        PaymentService.getTransactionHistory(user.id),
      ]);
      
      setLoans(userLoans.sort((a, b) => 
        new Date(b.appliedAt).getTime() - new Date(a.appliedAt).getTime()
      ));
      setTransactions(userTransactions);
      console.log('Loans data loaded');
    } catch (error) {
      console.error('Error loading loans data:', error);
    }
  };

  const getSuccessfulPaymentsCount = () => {
    return transactions.filter(t => t.status === 'Success').length;
  };

  const isEligibleForLoan = () => {
    return getSuccessfulPaymentsCount() >= LoanService.MIN_SUCCESSFUL_PAYMENTS;
  };

  const calculateEMI = () => {
    const loanAmount = parseFloat(amount);
    const months = parseInt(termMonths);
    
    if (isNaN(loanAmount) || isNaN(months) || loanAmount <= 0 || months <= 0) {
      return 0;
    }
    
    return LoanService.calculateEMI(loanAmount, months);
  };

  const handleApplyForLoan = async () => {
    if (!user) return;
    
    if (!amount || !purpose) {
      Alert.alert('Error', 'Please fill in all required fields');
      return;
    }

    const loanAmount = parseFloat(amount);
    const months = parseInt(termMonths);

    if (isNaN(loanAmount) || loanAmount < 10000 || loanAmount > 50000) {
      Alert.alert('Error', 'Loan amount must be between ₹10,000 and ₹50,000');
      return;
    }

    if (isNaN(months) || months < 6 || months > 60) {
      Alert.alert('Error', 'Loan term must be between 6 and 60 months');
      return;
    }

    try {
      setIsLoading(true);
      
      const loanApplication: LoanApplication = {
        amount: loanAmount,
        termMonths: months,
        purpose,
      };

      const loan = await LoanService.applyForLoan(user.id, loanApplication);
      
      // Clear form
      setAmount('');
      setPurpose('');
      setTermMonths('12');
      
      // Reload loans
      await loadUserData();
      
      // Show result
      Alert.alert(
        'Loan Application Submitted',
        loan.status === 'Approved' 
          ? `Congratulations! Your loan of ₹${loanAmount.toLocaleString()} has been approved instantly. EMI: ₹${loan.emiAmount.toLocaleString()}/month`
          : `Your loan application for ₹${loanAmount.toLocaleString()} is under review. You'll be notified once it's processed.`,
        [
          { text: 'OK', onPress: () => setActiveView('manage') }
        ]
      );
      
    } catch (error) {
      console.error('Loan application error:', error);
      Alert.alert('Error', 'Failed to submit loan application. Please try again.');
    } finally {
      setIsLoading(false);
    }
  };

  const handleRepayEMI = async (loan: Loan, repaymentId: string) => {
    Alert.alert(
      'Confirm Repayment',
      `Are you sure you want to pay EMI of ₹${loan.emiAmount.toLocaleString()}?`,
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Pay',
          onPress: async () => {
            const success = await LoanService.repayEMI(loan.id, repaymentId);
            if (success) {
              Alert.alert('Success', 'EMI payment successful!');
              await loadUserData();
            } else {
              Alert.alert('Error', 'Failed to process EMI payment');
            }
          }
        }
      ]
    );
  };

  const renderApplyForLoan = () => (
    <ScrollView style={styles.content} showsVerticalScrollIndicator={false}>
      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Apply for Loan</Text>
        
        <View style={styles.eligibilityCard}>
          <View style={styles.eligibilityHeader}>
            <IconSymbol 
              name={isEligibleForLoan() ? 'checkmark.circle.fill' : 'exclamationmark.circle.fill'} 
              size={24} 
              color={isEligibleForLoan() ? colors.success : colors.warning} 
            />
            <Text style={styles.eligibilityTitle}>
              {isEligibleForLoan() ? 'You are eligible!' : 'Eligibility Check'}
            </Text>
          </View>
          <Text style={styles.eligibilityText}>
            {isEligibleForLoan() 
              ? `You have ${getSuccessfulPaymentsCount()} successful payments. Your loan will be auto-approved!`
              : `You need at least ${LoanService.MIN_SUCCESSFUL_PAYMENTS} successful payments. You currently have ${getSuccessfulPaymentsCount()}.`
            }
          </Text>
          {!isEligibleForLoan() && (
            <Pressable
              style={styles.makePaymentButton}
              onPress={() => onTabChange('payments')}
            >
              <Text style={styles.makePaymentText}>Make a Payment</Text>
              <IconSymbol name="chevron.right" size={16} color={colors.primary} />
            </Pressable>
          )}
        </View>

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
          <View style={styles.termSelector}>
            {['6', '12', '18', '24', '36'].map((months) => (
              <Pressable
                key={months}
                style={[
                  styles.termButton,
                  termMonths === months && styles.termButtonActive
                ]}
                onPress={() => setTermMonths(months)}
              >
                <Text style={[
                  styles.termButtonText,
                  termMonths === months && styles.termButtonTextActive
                ]}>
                  {months} months
                </Text>
              </Pressable>
            ))}
          </View>

          <Text style={styles.label}>Purpose *</Text>
          <TextInput
            style={commonStyles.input}
            value={purpose}
            onChangeText={setPurpose}
            placeholder="Loan purpose (e.g., Business, Personal, Education)"
            placeholderTextColor={colors.grey}
          />

          {amount && termMonths && (
            <View style={styles.emiCard}>
              <Text style={styles.emiLabel}>Estimated EMI</Text>
              <Text style={styles.emiAmount}>₹{calculateEMI().toLocaleString()}/month</Text>
              <Text style={styles.emiDetails}>
                Interest Rate: {LoanService.INTEREST_RATE}% per annum
              </Text>
            </View>
          )}

          <Button
            onPress={handleApplyForLoan}
            loading={isLoading}
            disabled={!isEligibleForLoan()}
            style={styles.applyButton}
          >
            Apply for Loan
          </Button>
        </View>
      </View>
    </ScrollView>
  );

  const renderManageLoans = () => (
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
                  <View style={styles.loanInfo}>
                    <Text style={styles.loanAmount}>₹{loan.amount.toLocaleString()}</Text>
                    <Text style={styles.loanTerm}>{loan.termMonths} months • {loan.interestRate}% interest</Text>
                    <Text style={styles.loanDate}>
                      Applied on {new Date(loan.appliedAt).toLocaleDateString()}
                    </Text>
                  </View>
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

                {loan.status === 'Approved' && (
                  <View style={styles.loanDetails}>
                    <View style={styles.loanStat}>
                      <Text style={styles.statLabel}>EMI Amount</Text>
                      <Text style={styles.statValue}>₹{loan.emiAmount.toLocaleString()}</Text>
                    </View>
                    <View style={styles.loanStat}>
                      <Text style={styles.statLabel}>Remaining Balance</Text>
                      <Text style={styles.statValue}>₹{loan.remainingBalance.toLocaleString()}</Text>
                    </View>
                    <View style={styles.loanStat}>
                      <Text style={styles.statLabel}>Paid EMIs</Text>
                      <Text style={styles.statValue}>
                        {loan.repayments.filter(r => r.status === 'Paid').length}/{loan.repayments.length}
                      </Text>
                    </View>

                    {loan.remainingBalance > 0 && (
                      <View style={styles.repaymentSection}>
                        <Text style={styles.repaymentTitle}>Next EMI</Text>
                        {loan.repayments
                          .filter(r => r.status === 'Pending')
                          .slice(0, 1)
                          .map((repayment) => (
                            <View key={repayment.id} style={styles.repaymentItem}>
                              <View style={styles.repaymentInfo}>
                                <Text style={styles.repaymentAmount}>
                                  ₹{repayment.amount.toLocaleString()}
                                </Text>
                                <Text style={styles.repaymentDate}>
                                  Due: {new Date(repayment.dueDate).toLocaleDateString()}
                                </Text>
                              </View>
                              <Button
                                size="sm"
                                onPress={() => handleRepayEMI(loan, repayment.id)}
                              >
                                Pay Now
                              </Button>
                            </View>
                          ))
                        }
                      </View>
                    )}

                    {loan.remainingBalance === 0 && (
                      <View style={styles.completedBadge}>
                        <IconSymbol name="checkmark.circle.fill" size={20} color={colors.success} />
                        <Text style={styles.completedText}>Loan Fully Repaid</Text>
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
              Apply
            </Text>
          </Pressable>
          
          <Pressable
            style={[
              styles.segmentButton,
              activeView === 'manage' && styles.segmentButtonActive
            ]}
            onPress={() => setActiveView('manage')}
          >
            <Text style={[
              styles.segmentText,
              activeView === 'manage' && styles.segmentTextActive
            ]}>
              My Loans
            </Text>
          </Pressable>
        </View>
      </View>

      {activeView === 'apply' ? renderApplyForLoan() : renderManageLoans()}
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
  eligibilityCard: {
    backgroundColor: colors.card,
    borderRadius: 12,
    padding: 16,
    marginBottom: 24,
    borderWidth: 1,
    borderColor: colors.border,
  },
  eligibilityHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 8,
  },
  eligibilityTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: colors.text,
    marginLeft: 8,
  },
  eligibilityText: {
    fontSize: 14,
    color: colors.grey,
    lineHeight: 20,
    marginBottom: 12,
  },
  makePaymentButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: colors.primary + '10',
    borderRadius: 8,
    padding: 12,
  },
  makePaymentText: {
    fontSize: 16,
    fontWeight: '500',
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
  termSelector: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
    marginBottom: 16,
  },
  termButton: {
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 20,
    borderWidth: 1,
    borderColor: colors.border,
    backgroundColor: colors.card,
  },
  termButtonActive: {
    borderColor: colors.primary,
    backgroundColor: colors.primary + '10',
  },
  termButtonText: {
    fontSize: 14,
    fontWeight: '500',
    color: colors.grey,
  },
  termButtonTextActive: {
    color: colors.primary,
  },
  emiCard: {
    backgroundColor: colors.backgroundAlt,
    borderRadius: 12,
    padding: 16,
    alignItems: 'center',
    marginBottom: 16,
  },
  emiLabel: {
    fontSize: 14,
    color: colors.grey,
    marginBottom: 4,
  },
  emiAmount: {
    fontSize: 24,
    fontWeight: '700',
    color: colors.primary,
    marginBottom: 4,
  },
  emiDetails: {
    fontSize: 12,
    color: colors.grey,
  },
  applyButton: {
    marginTop: 16,
  },
  loansList: {
    gap: 16,
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
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: 16,
  },
  loanInfo: {
    flex: 1,
  },
  loanAmount: {
    fontSize: 24,
    fontWeight: '700',
    color: colors.text,
    marginBottom: 4,
  },
  loanTerm: {
    fontSize: 14,
    color: colors.grey,
    marginBottom: 2,
  },
  loanDate: {
    fontSize: 12,
    color: colors.grey,
  },
  statusBadge: {
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 16,
  },
  statusText: {
    fontSize: 12,
    fontWeight: '600',
  },
  loanDetails: {
    borderTopWidth: 1,
    borderTopColor: colors.border,
    paddingTop: 16,
  },
  loanStat: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 8,
  },
  statLabel: {
    fontSize: 14,
    color: colors.grey,
  },
  statValue: {
    fontSize: 16,
    fontWeight: '600',
    color: colors.text,
  },
  repaymentSection: {
    marginTop: 16,
    padding: 16,
    backgroundColor: colors.backgroundAlt,
    borderRadius: 8,
  },
  repaymentTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: colors.text,
    marginBottom: 12,
  },
  repaymentItem: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  repaymentInfo: {
    flex: 1,
  },
  repaymentAmount: {
    fontSize: 18,
    fontWeight: '600',
    color: colors.text,
    marginBottom: 2,
  },
  repaymentDate: {
    fontSize: 12,
    color: colors.grey,
  },
  completedBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: 16,
    padding: 12,
    backgroundColor: colors.success + '10',
    borderRadius: 8,
  },
  completedText: {
    fontSize: 16,
    fontWeight: '600',
    color: colors.success,
    marginLeft: 8,
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
