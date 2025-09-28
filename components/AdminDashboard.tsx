
import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, ScrollView, Pressable, Alert } from 'react-native';
import { IconSymbol } from './IconSymbol';
import { colors, commonStyles } from '../styles/commonStyles';
import { useAuth } from '../contexts/AuthContext';
import { Transaction, Loan, User } from '../types';
import { PaymentService } from '../services/PaymentService';
import { LoanService } from '../services/LoanService';
import { StorageService } from '../utils/storage';

interface AdminDashboardProps {
  onTabChange: (tab: string) => void;
}

export const AdminDashboard: React.FC<AdminDashboardProps> = ({ onTabChange }) => {
  const { user } = useAuth();
  const [activeView, setActiveView] = useState<'overview' | 'transactions' | 'loans' | 'users'>('overview');
  const [allTransactions, setAllTransactions] = useState<Transaction[]>([]);
  const [allLoans, setAllLoans] = useState<Loan[]>([]);
  const [allUsers, setAllUsers] = useState<User[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    if (user?.role === 'admin') {
      loadAdminData();
    }
  }, [user]);

  const loadAdminData = async () => {
    try {
      setIsLoading(true);
      const [transactions, loans, users] = await Promise.all([
        PaymentService.getAllTransactions(),
        LoanService.getAllLoans(),
        StorageService.getAllUsers()
      ]);
      
      setAllTransactions(transactions.sort((a, b) => 
        new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
      ));
      setAllLoans(loans.sort((a, b) => 
        new Date(b.appliedAt).getTime() - new Date(a.appliedAt).getTime()
      ));
      setAllUsers(users.sort((a, b) => 
        new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
      ));
      
      console.log('Admin data loaded');
    } catch (error) {
      console.error('Error loading admin data:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const handleBackToDashboard = () => {
    onTabChange('dashboard');
  };

  const calculateOverviewStats = () => {
    const totalUsers = allUsers.length;
    const totalTransactions = allTransactions.length;
    const successfulTransactions = allTransactions.filter(t => t.status === 'Success').length;
    const totalRevenue = allTransactions
      .filter(t => t.status === 'Success')
      .reduce((sum, t) => sum + t.amount, 0);
    
    const totalLoans = allLoans.length;
    const approvedLoans = allLoans.filter(l => l.status === 'Approved').length;
    const totalLoanAmount = allLoans
      .filter(l => l.status === 'Approved')
      .reduce((sum, l) => sum + l.amount, 0);
    const totalOutstanding = allLoans
      .filter(l => l.status === 'Approved')
      .reduce((sum, l) => sum + l.remainingBalance, 0);

    return {
      totalUsers,
      totalTransactions,
      successfulTransactions,
      totalRevenue,
      totalLoans,
      approvedLoans,
      totalLoanAmount,
      totalOutstanding,
    };
  };

  const getUserName = (userId: string): string => {
    const user = allUsers.find(u => u.id === userId);
    return user ? user.name : 'Unknown User';
  };

  const renderOverview = () => {
    const stats = calculateOverviewStats();

    return (
      <ScrollView style={styles.content} showsVerticalScrollIndicator={false}>
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Platform Overview</Text>
          
          <View style={styles.statsGrid}>
            <View style={styles.statCard}>
              <IconSymbol name="person.2" size={24} color={colors.primary} />
              <Text style={styles.statValue}>{stats.totalUsers}</Text>
              <Text style={styles.statLabel}>Total Users</Text>
            </View>

            <View style={styles.statCard}>
              <IconSymbol name="creditcard" size={24} color={colors.success} />
              <Text style={styles.statValue}>{stats.successfulTransactions}</Text>
              <Text style={styles.statLabel}>Successful Payments</Text>
            </View>

            <View style={styles.statCard}>
              <IconSymbol name="indianrupeesign" size={24} color={colors.success} />
              <Text style={styles.statValue}>₹{stats.totalRevenue.toLocaleString()}</Text>
              <Text style={styles.statLabel}>Total Revenue</Text>
            </View>

            <View style={styles.statCard}>
              <IconSymbol name="banknote" size={24} color={colors.warning} />
              <Text style={styles.statValue}>{stats.approvedLoans}</Text>
              <Text style={styles.statLabel}>Active Loans</Text>
            </View>

            <View style={styles.statCard}>
              <IconSymbol name="chart.line.uptrend.xyaxis" size={24} color={colors.warning} />
              <Text style={styles.statValue}>₹{stats.totalLoanAmount.toLocaleString()}</Text>
              <Text style={styles.statLabel}>Loans Disbursed</Text>
            </View>

            <View style={styles.statCard}>
              <IconSymbol name="exclamationmark.triangle" size={24} color={colors.error} />
              <Text style={styles.statValue}>₹{stats.totalOutstanding.toLocaleString()}</Text>
              <Text style={styles.statLabel}>Outstanding</Text>
            </View>
          </View>
        </View>

        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Recent Activity</Text>
          
          <View style={styles.activityList}>
            {allTransactions.slice(0, 5).map((transaction) => (
              <View key={transaction.id} style={styles.activityItem}>
                <View style={styles.activityIcon}>
                  <IconSymbol 
                    name={transaction.type === 'UPI' ? 'qrcode' : 'creditcard'} 
                    size={16} 
                    color={colors.primary} 
                  />
                </View>
                <View style={styles.activityDetails}>
                  <Text style={styles.activityTitle}>
                    {getUserName(transaction.userId)} made a payment
                  </Text>
                  <Text style={styles.activitySubtitle}>
                    ₹{transaction.amount.toLocaleString()} • {transaction.description}
                  </Text>
                  <Text style={styles.activityDate}>
                    {new Date(transaction.createdAt).toLocaleDateString()}
                  </Text>
                </View>
                <View style={[
                  styles.statusDot,
                  { backgroundColor: 
                    transaction.status === 'Success' ? colors.success :
                    transaction.status === 'Failed' ? colors.error :
                    colors.warning
                  }
                ]} />
              </View>
            ))}
          </View>
        </View>
      </ScrollView>
    );
  };

  const renderTransactions = () => (
    <ScrollView style={styles.content} showsVerticalScrollIndicator={false}>
      <View style={styles.section}>
        <Text style={styles.sectionTitle}>All Transactions</Text>
        <Text style={styles.sectionSubtitle}>
          {allTransactions.length} total transactions
        </Text>
        
        <View style={styles.transactionsList}>
          {allTransactions.map((transaction) => (
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
                  <Text style={styles.transactionTitle}>
                    {getUserName(transaction.userId)}
                  </Text>
                  <Text style={styles.transactionSubtitle}>
                    {transaction.description} • {transaction.type}
                  </Text>
                  <Text style={styles.transactionDate}>
                    {new Date(transaction.createdAt).toLocaleDateString()} at{' '}
                    {new Date(transaction.createdAt).toLocaleTimeString()}
                  </Text>
                  {transaction.upiId && (
                    <Text style={styles.transactionUpi}>UPI: {transaction.upiId}</Text>
                  )}
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
            </View>
          ))}
        </View>
      </View>
    </ScrollView>
  );

  const renderLoans = () => (
    <ScrollView style={styles.content} showsVerticalScrollIndicator={false}>
      <View style={styles.section}>
        <Text style={styles.sectionTitle}>All Loans</Text>
        <Text style={styles.sectionSubtitle}>
          {allLoans.length} total loan applications
        </Text>
        
        <View style={styles.loansList}>
          {allLoans.map((loan) => (
            <View key={loan.id} style={styles.loanCard}>
              <View style={styles.loanHeader}>
                <View style={styles.loanIcon}>
                  <IconSymbol name="banknote" size={20} color={colors.warning} />
                </View>
                <View style={styles.loanDetails}>
                  <Text style={styles.loanTitle}>
                    {getUserName(loan.userId)}
                  </Text>
                  <Text style={styles.loanSubtitle}>
                    ₹{loan.amount.toLocaleString()} • {loan.termMonths} months • {loan.interestRate}%
                  </Text>
                  <Text style={styles.loanDate}>
                    Applied on {new Date(loan.appliedAt).toLocaleDateString()}
                  </Text>
                  {loan.status === 'Approved' && (
                    <Text style={styles.loanBalance}>
                      Remaining: ₹{loan.remainingBalance.toLocaleString()}
                    </Text>
                  )}
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
            </View>
          ))}
        </View>
      </View>
    </ScrollView>
  );

  const renderUsers = () => (
    <ScrollView style={styles.content} showsVerticalScrollIndicator={false}>
      <View style={styles.section}>
        <Text style={styles.sectionTitle}>All Users</Text>
        <Text style={styles.sectionSubtitle}>
          {allUsers.length} registered users
        </Text>
        
        <View style={styles.usersList}>
          {allUsers.map((user) => {
            const userTransactions = allTransactions.filter(t => t.userId === user.id);
            const userLoans = allLoans.filter(l => l.userId === user.id);
            const successfulPayments = userTransactions.filter(t => t.status === 'Success').length;
            
            return (
              <View key={user.id} style={styles.userCard}>
                <View style={styles.userHeader}>
                  <View style={styles.userIcon}>
                    <IconSymbol 
                      name={user.role === 'admin' ? 'crown' : 'person'} 
                      size={20} 
                      color={user.role === 'admin' ? colors.warning : colors.primary} 
                    />
                  </View>
                  <View style={styles.userDetails}>
                    <Text style={styles.userTitle}>{user.name}</Text>
                    <Text style={styles.userSubtitle}>{user.email}</Text>
                    <Text style={styles.userDate}>
                      Joined {new Date(user.createdAt).toLocaleDateString()}
                    </Text>
                  </View>
                  <View style={styles.userStats}>
                    <Text style={styles.userStatValue}>{successfulPayments}</Text>
                    <Text style={styles.userStatLabel}>Payments</Text>
                    <Text style={styles.userStatValue}>{userLoans.length}</Text>
                    <Text style={styles.userStatLabel}>Loans</Text>
                  </View>
                </View>
              </View>
            );
          })}
        </View>
      </View>
    </ScrollView>
  );

  if (!user || user.role !== 'admin') {
    return (
      <View style={commonStyles.container}>
        <View style={styles.header}>
          <Pressable style={styles.backButton} onPress={handleBackToDashboard}>
            <IconSymbol name="chevron.left" size={24} color={colors.text} />
            <Text style={styles.backButtonText}>Dashboard</Text>
          </Pressable>
        </View>
        <View style={styles.accessDenied}>
          <IconSymbol name="exclamationmark.triangle" size={48} color={colors.error} />
          <Text style={styles.accessDeniedTitle}>Access Denied</Text>
          <Text style={styles.accessDeniedText}>
            You need administrator privileges to access this page.
          </Text>
        </View>
      </View>
    );
  }

  return (
    <View style={commonStyles.container}>
      <View style={styles.header}>
        <Pressable style={styles.backButton} onPress={handleBackToDashboard}>
          <IconSymbol name="chevron.left" size={24} color={colors.text} />
          <Text style={styles.backButtonText}>Dashboard</Text>
        </Pressable>
        
        <View style={styles.adminBadge}>
          <IconSymbol name="crown" size={16} color={colors.warning} />
          <Text style={styles.adminText}>Admin Panel</Text>
        </View>
      </View>

      <View style={styles.tabBar}>
        <ScrollView horizontal showsHorizontalScrollIndicator={false}>
          <View style={styles.tabContainer}>
            {[
              { key: 'overview', label: 'Overview', icon: 'chart.bar' },
              { key: 'transactions', label: 'Transactions', icon: 'creditcard' },
              { key: 'loans', label: 'Loans', icon: 'banknote' },
              { key: 'users', label: 'Users', icon: 'person.2' },
            ].map((tab) => (
              <Pressable
                key={tab.key}
                style={[
                  styles.tabButton,
                  activeView === tab.key && styles.tabButtonActive
                ]}
                onPress={() => setActiveView(tab.key as any)}
              >
                <IconSymbol 
                  name={tab.icon as any} 
                  size={16} 
                  color={activeView === tab.key ? colors.primary : colors.grey} 
                />
                <Text style={[
                  styles.tabText,
                  activeView === tab.key && styles.tabTextActive
                ]}>
                  {tab.label}
                </Text>
              </Pressable>
            ))}
          </View>
        </ScrollView>
      </View>

      {activeView === 'overview' && renderOverview()}
      {activeView === 'transactions' && renderTransactions()}
      {activeView === 'loans' && renderLoans()}
      {activeView === 'users' && renderUsers()}
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
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  backButton: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 8,
  },
  backButtonText: {
    fontSize: 16,
    fontWeight: '500',
    color: colors.text,
    marginLeft: 8,
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
  tabBar: {
    backgroundColor: colors.card,
    borderBottomWidth: 1,
    borderBottomColor: colors.border,
  },
  tabContainer: {
    flexDirection: 'row',
    paddingHorizontal: 20,
  },
  tabButton: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 12,
    marginRight: 8,
    borderRadius: 8,
  },
  tabButtonActive: {
    backgroundColor: colors.primary + '10',
  },
  tabText: {
    fontSize: 14,
    fontWeight: '500',
    color: colors.grey,
    marginLeft: 6,
  },
  tabTextActive: {
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
    marginBottom: 20,
  },
  statsGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 12,
  },
  statCard: {
    flex: 1,
    minWidth: '30%',
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
  activityList: {
    gap: 12,
  },
  activityItem: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.card,
    borderRadius: 12,
    padding: 16,
    borderWidth: 1,
    borderColor: colors.border,
  },
  activityIcon: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: colors.backgroundAlt,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 12,
  },
  activityDetails: {
    flex: 1,
  },
  activityTitle: {
    fontSize: 14,
    fontWeight: '600',
    color: colors.text,
    marginBottom: 2,
  },
  activitySubtitle: {
    fontSize: 12,
    color: colors.grey,
    marginBottom: 2,
  },
  activityDate: {
    fontSize: 12,
    color: colors.grey,
  },
  statusDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
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
    marginBottom: 2,
  },
  transactionUpi: {
    fontSize: 12,
    color: colors.primary,
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
    backgroundColor: colors.warning + '20',
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
    marginBottom: 2,
  },
  loanBalance: {
    fontSize: 12,
    color: colors.warning,
    fontWeight: '500',
  },
  loanStatus: {
    alignItems: 'flex-end',
  },
  usersList: {
    gap: 12,
  },
  userCard: {
    backgroundColor: colors.card,
    borderRadius: 12,
    padding: 16,
    borderWidth: 1,
    borderColor: colors.border,
  },
  userHeader: {
    flexDirection: 'row',
    alignItems: 'flex-start',
  },
  userIcon: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: colors.backgroundAlt,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 12,
  },
  userDetails: {
    flex: 1,
  },
  userTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: colors.text,
    marginBottom: 4,
  },
  userSubtitle: {
    fontSize: 14,
    color: colors.grey,
    marginBottom: 2,
  },
  userDate: {
    fontSize: 12,
    color: colors.grey,
  },
  userStats: {
    alignItems: 'flex-end',
  },
  userStatValue: {
    fontSize: 16,
    fontWeight: '600',
    color: colors.text,
  },
  userStatLabel: {
    fontSize: 10,
    color: colors.grey,
    marginBottom: 4,
  },
  accessDenied: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 40,
  },
  accessDeniedTitle: {
    fontSize: 24,
    fontWeight: '700',
    color: colors.text,
    marginTop: 16,
    marginBottom: 8,
  },
  accessDeniedText: {
    fontSize: 16,
    color: colors.grey,
    textAlign: 'center',
    lineHeight: 24,
  },
});
