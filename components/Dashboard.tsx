
import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, ScrollView, Pressable, Alert } from 'react-native';
import { IconSymbol } from './IconSymbol';
import { colors, commonStyles } from '../styles/commonStyles';
import { useAuth } from '../contexts/AuthContext';
import { Transaction, Loan } from '../types';
import { PaymentService } from '../services/PaymentService';
import { LoanService } from '../services/LoanService';

interface DashboardProps {
  activeTab: string;
  onTabChange: (tab: string) => void;
}

export const Dashboard: React.FC<DashboardProps> = ({ activeTab, onTabChange }) => {
  const { user } = useAuth();
  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [loans, setLoans] = useState<Loan[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    loadDashboardData();
  }, [user]);

  const loadDashboardData = async () => {
    if (!user) return;
    
    try {
      setIsLoading(true);
      const [userTransactions, userLoans] = await Promise.all([
        PaymentService.getTransactionHistory(user.id),
        LoanService.getUserLoans(user.id)
      ]);
      
      setTransactions(userTransactions.sort((a, b) => 
        new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
      ));
      setLoans(userLoans.sort((a, b) => 
        new Date(b.appliedAt).getTime() - new Date(a.appliedAt).getTime()
      ));
      
      console.log('Dashboard data loaded');
    } catch (error) {
      console.error('Error loading dashboard data:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const calculateStats = () => {
    const totalTransactions = transactions.length;
    const successfulTransactions = transactions.filter(t => t.status === 'Success').length;
    const totalSpent = transactions
      .filter(t => t.status === 'Success')
      .reduce((sum, t) => sum + t.amount, 0);
    
    const totalLoans = loans.length;
    const approvedLoans = loans.filter(l => l.status === 'Approved').length;
    const totalLoanAmount = loans
      .filter(l => l.status === 'Approved')
      .reduce((sum, l) => sum + l.amount, 0);
    const totalOutstanding = loans
      .filter(l => l.status === 'Approved')
      .reduce((sum, l) => sum + l.remainingBalance, 0);

    return {
      totalTransactions,
      successfulTransactions,
      totalSpent,
      totalLoans,
      approvedLoans,
      totalLoanAmount,
      totalOutstanding,
    };
  };

  const stats = calculateStats();

  const renderQuickActions = () => (
    <View style={styles.section}>
      <Text style={styles.sectionTitle}>Quick Actions</Text>
      <View style={styles.quickActionsGrid}>
        <Pressable
          style={styles.quickActionCard}
          onPress={() => onTabChange('payments')}
        >
          <View style={styles.quickActionIcon}>
            <IconSymbol name="creditcard" size={24} color={colors.primary} />
          </View>
          <Text style={styles.quickActionTitle}>Make Payment</Text>
          <Text style={styles.quickActionSubtitle}>UPI or Card</Text>
        </Pressable>

        <Pressable
          style={styles.quickActionCard}
          onPress={() => onTabChange('loans')}
        >
          <View style={styles.quickActionIcon}>
            <IconSymbol name="banknote" size={24} color={colors.primary} />
          </View>
          <Text style={styles.quickActionTitle}>Apply Loan</Text>
          <Text style={styles.quickActionSubtitle}>₹10K - ₹50K</Text>
        </Pressable>

        <Pressable
          style={styles.quickActionCard}
          onPress={() => onTabChange('payments')}
        >
          <View style={styles.quickActionIcon}>
            <IconSymbol name="doc.text" size={24} color={colors.primary} />
          </View>
          <Text style={styles.quickActionTitle}>View History</Text>
          <Text style={styles.quickActionSubtitle}>Transactions</Text>
        </Pressable>

        <Pressable
          style={styles.quickActionCard}
          onPress={() => onTabChange('profile')}
        >
          <View style={styles.quickActionIcon}>
            <IconSymbol name="person" size={24} color={colors.primary} />
          </View>
          <Text style={styles.quickActionTitle}>Profile</Text>
          <Text style={styles.quickActionSubtitle}>Settings</Text>
        </Pressable>
      </View>
    </View>
  );

  const renderStats = () => (
    <View style={styles.section}>
      <Text style={styles.sectionTitle}>Overview</Text>
      <View style={styles.statsGrid}>
        <View style={styles.statCard}>
          <IconSymbol name="creditcard" size={20} color={colors.primary} />
          <Text style={styles.statValue}>{stats.successfulTransactions}</Text>
          <Text style={styles.statLabel}>Successful Payments</Text>
        </View>

        <View style={styles.statCard}>
          <IconSymbol name="indianrupeesign" size={20} color={colors.success} />
          <Text style={styles.statValue}>₹{stats.totalSpent.toLocaleString()}</Text>
          <Text style={styles.statLabel}>Total Spent</Text>
        </View>

        <View style={styles.statCard}>
          <IconSymbol name="banknote" size={20} color={colors.warning} />
          <Text style={styles.statValue}>{stats.approvedLoans}</Text>
          <Text style={styles.statLabel}>Active Loans</Text>
        </View>

        <View style={styles.statCard}>
          <IconSymbol name="exclamationmark.triangle" size={20} color={colors.error} />
          <Text style={styles.statValue}>₹{stats.totalOutstanding.toLocaleString()}</Text>
          <Text style={styles.statLabel}>Outstanding</Text>
        </View>
      </View>
    </View>
  );

  const renderRecentTransactions = () => (
    <View style={styles.section}>
      <View style={styles.sectionHeader}>
        <Text style={styles.sectionTitle}>Recent Transactions</Text>
        <Pressable onPress={() => onTabChange('payments')}>
          <Text style={styles.sectionLink}>View All</Text>
        </Pressable>
      </View>

      {transactions.length === 0 ? (
        <View style={styles.emptyState}>
          <IconSymbol name="tray" size={32} color={colors.grey} />
          <Text style={styles.emptyText}>No transactions yet</Text>
          <Text style={styles.emptySubtext}>Make your first payment to get started</Text>
        </View>
      ) : (
        <View style={styles.transactionsList}>
          {transactions.slice(0, 3).map((transaction) => (
            <View key={transaction.id} style={styles.transactionItem}>
              <View style={styles.transactionIcon}>
                <IconSymbol 
                  name={transaction.type === 'UPI' ? 'qrcode' : 'creditcard'} 
                  size={16} 
                  color={colors.primary} 
                />
              </View>
              <View style={styles.transactionDetails}>
                <Text style={styles.transactionTitle}>{transaction.description}</Text>
                <Text style={styles.transactionDate}>
                  {new Date(transaction.createdAt).toLocaleDateString()}
                </Text>
              </View>
              <View style={styles.transactionAmount}>
                <Text style={styles.amountText}>
                  ₹{transaction.amount.toLocaleString()}
                </Text>
                <View style={[
                  styles.statusDot,
                  { backgroundColor: 
                    transaction.status === 'Success' ? colors.success :
                    transaction.status === 'Failed' ? colors.error :
                    colors.warning
                  }
                ]} />
              </View>
            </View>
          ))}
        </View>
      )}
    </View>
  );

  const renderActiveLoans = () => (
    <View style={styles.section}>
      <View style={styles.sectionHeader}>
        <Text style={styles.sectionTitle}>Active Loans</Text>
        <Pressable onPress={() => onTabChange('loans')}>
          <Text style={styles.sectionLink}>View All</Text>
        </Pressable>
      </View>

      {loans.filter(l => l.status === 'Approved' && l.remainingBalance > 0).length === 0 ? (
        <View style={styles.emptyState}>
          <IconSymbol name="banknote" size={32} color={colors.grey} />
          <Text style={styles.emptyText}>No active loans</Text>
          <Text style={styles.emptySubtext}>Apply for a loan to get started</Text>
        </View>
      ) : (
        <View style={styles.loansList}>
          {loans
            .filter(l => l.status === 'Approved' && l.remainingBalance > 0)
            .slice(0, 2)
            .map((loan) => (
              <View key={loan.id} style={styles.loanItem}>
                <View style={styles.loanIcon}>
                  <IconSymbol name="banknote" size={16} color={colors.warning} />
                </View>
                <View style={styles.loanDetails}>
                  <Text style={styles.loanTitle}>
                    ₹{loan.amount.toLocaleString()} Loan
                  </Text>
                  <Text style={styles.loanSubtitle}>
                    EMI: ₹{loan.emiAmount.toLocaleString()} • {loan.termMonths} months
                  </Text>
                </View>
                <View style={styles.loanAmount}>
                  <Text style={styles.remainingText}>
                    ₹{loan.remainingBalance.toLocaleString()}
                  </Text>
                  <Text style={styles.remainingLabel}>remaining</Text>
                </View>
              </View>
            ))}
        </View>
      )}
    </View>
  );

  if (!user) return null;

  return (
    <View style={commonStyles.container}>
      <View style={styles.header}>
        <View style={styles.welcomeSection}>
          <Text style={styles.welcomeText}>Welcome back,</Text>
          <Text style={styles.userName}>{user.name}</Text>
        </View>
        {user.role === 'admin' && (
          <Pressable
            style={styles.adminBadge}
            onPress={() => onTabChange('admin')}
          >
            <IconSymbol name="crown" size={16} color={colors.warning} />
            <Text style={styles.adminText}>Admin</Text>
          </Pressable>
        )}
      </View>

      <ScrollView style={styles.content} showsVerticalScrollIndicator={false}>
        {renderQuickActions()}
        {renderStats()}
        {renderRecentTransactions()}
        {renderActiveLoans()}
      </ScrollView>
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
    paddingBottom: 20,
    borderBottomWidth: 1,
    borderBottomColor: colors.border,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  welcomeSection: {
    flex: 1,
  },
  welcomeText: {
    fontSize: 16,
    color: colors.grey,
    marginBottom: 4,
  },
  userName: {
    fontSize: 24,
    fontWeight: '700',
    color: colors.text,
  },
  adminBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.warning + '20',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 16,
  },
  adminText: {
    fontSize: 12,
    fontWeight: '600',
    color: colors.warning,
    marginLeft: 4,
  },
  section: {
    padding: 20,
  },
  sectionHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 16,
  },
  sectionTitle: {
    fontSize: 20,
    fontWeight: '700',
    color: colors.text,
  },
  sectionLink: {
    fontSize: 14,
    fontWeight: '500',
    color: colors.primary,
  },
  quickActionsGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 12,
  },
  quickActionCard: {
    flex: 1,
    minWidth: '45%',
    backgroundColor: colors.card,
    borderRadius: 12,
    padding: 16,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: colors.border,
  },
  quickActionIcon: {
    width: 48,
    height: 48,
    borderRadius: 24,
    backgroundColor: colors.backgroundAlt,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 12,
  },
  quickActionTitle: {
    fontSize: 14,
    fontWeight: '600',
    color: colors.text,
    marginBottom: 4,
    textAlign: 'center',
  },
  quickActionSubtitle: {
    fontSize: 12,
    color: colors.grey,
    textAlign: 'center',
  },
  statsGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 12,
  },
  statCard: {
    flex: 1,
    minWidth: '45%',
    backgroundColor: colors.card,
    borderRadius: 12,
    padding: 16,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: colors.border,
  },
  statValue: {
    fontSize: 18,
    fontWeight: '700',
    color: colors.text,
    marginTop: 8,
    marginBottom: 4,
  },
  statLabel: {
    fontSize: 12,
    color: colors.grey,
    textAlign: 'center',
  },
  transactionsList: {
    gap: 12,
  },
  transactionItem: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.card,
    borderRadius: 12,
    padding: 16,
    borderWidth: 1,
    borderColor: colors.border,
  },
  transactionIcon: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: colors.backgroundAlt,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 12,
  },
  transactionDetails: {
    flex: 1,
  },
  transactionTitle: {
    fontSize: 14,
    fontWeight: '600',
    color: colors.text,
    marginBottom: 2,
  },
  transactionDate: {
    fontSize: 12,
    color: colors.grey,
  },
  transactionAmount: {
    alignItems: 'flex-end',
    flexDirection: 'row',
    alignItems: 'center',
  },
  amountText: {
    fontSize: 14,
    fontWeight: '600',
    color: colors.text,
    marginRight: 8,
  },
  statusDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
  },
  loansList: {
    gap: 12,
  },
  loanItem: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.card,
    borderRadius: 12,
    padding: 16,
    borderWidth: 1,
    borderColor: colors.border,
  },
  loanIcon: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: colors.warning + '20',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 12,
  },
  loanDetails: {
    flex: 1,
  },
  loanTitle: {
    fontSize: 14,
    fontWeight: '600',
    color: colors.text,
    marginBottom: 2,
  },
  loanSubtitle: {
    fontSize: 12,
    color: colors.grey,
  },
  loanAmount: {
    alignItems: 'flex-end',
  },
  remainingText: {
    fontSize: 14,
    fontWeight: '600',
    color: colors.warning,
  },
  remainingLabel: {
    fontSize: 10,
    color: colors.grey,
  },
  emptyState: {
    alignItems: 'center',
    paddingVertical: 40,
  },
  emptyText: {
    fontSize: 16,
    fontWeight: '600',
    color: colors.text,
    marginTop: 12,
    marginBottom: 4,
  },
  emptySubtext: {
    fontSize: 14,
    color: colors.grey,
    textAlign: 'center',
  },
});
