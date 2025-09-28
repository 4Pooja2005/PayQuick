
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
  const { user, logout } = useAuth();
  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [loans, setLoans] = useState<Loan[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    loadUserData();
  }, [user]);

  const loadUserData = async () => {
    if (!user) return;
    
    try {
      setIsLoading(true);
      const [userTransactions, userLoans] = await Promise.all([
        PaymentService.getTransactionHistory(user.id),
        LoanService.getUserLoans(user.id),
      ]);
      
      setTransactions(userTransactions);
      setLoans(userLoans);
      console.log('Dashboard data loaded');
    } catch (error) {
      console.error('Error loading dashboard data:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const handleLogout = () => {
    Alert.alert(
      'Logout',
      'Are you sure you want to logout?',
      [
        { text: 'Cancel', style: 'cancel' },
        { text: 'Logout', style: 'destructive', onPress: logout },
      ]
    );
  };

  const getSuccessfulTransactionsCount = () => {
    return transactions.filter(t => t.status === 'Success').length;
  };

  const getTotalTransactionAmount = () => {
    return transactions
      .filter(t => t.status === 'Success')
      .reduce((sum, t) => sum + t.amount, 0);
  };

  const getActiveLoanBalance = () => {
    return loans
      .filter(l => l.status === 'Approved' && l.remainingBalance > 0)
      .reduce((sum, l) => sum + l.remainingBalance, 0);
  };

  const renderOverview = () => (
    <ScrollView style={styles.content} showsVerticalScrollIndicator={false}>
      <View style={styles.header}>
        <Text style={styles.welcomeText}>Welcome back,</Text>
        <Text style={styles.userName}>{user?.name}</Text>
      </View>

      <View style={styles.statsContainer}>
        <View style={styles.statCard}>
          <IconSymbol name="creditcard" size={24} color={colors.primary} />
          <Text style={styles.statValue}>₹{getTotalTransactionAmount().toLocaleString()}</Text>
          <Text style={styles.statLabel}>Total Payments</Text>
        </View>

        <View style={styles.statCard}>
          <IconSymbol name="checkmark.circle" size={24} color={colors.success} />
          <Text style={styles.statValue}>{getSuccessfulTransactionsCount()}</Text>
          <Text style={styles.statLabel}>Successful Txns</Text>
        </View>

        <View style={styles.statCard}>
          <IconSymbol name="banknote" size={24} color={colors.warning} />
          <Text style={styles.statValue}>₹{getActiveLoanBalance().toLocaleString()}</Text>
          <Text style={styles.statLabel}>Active Loans</Text>
        </View>
      </View>

      <View style={styles.quickActions}>
        <Text style={styles.sectionTitle}>Quick Actions</Text>
        
        <Pressable 
          style={styles.actionButton}
          onPress={() => onTabChange('payments')}
        >
          <IconSymbol name="plus.circle.fill" size={20} color={colors.primary} />
          <Text style={styles.actionText}>Make Payment</Text>
          <IconSymbol name="chevron.right" size={16} color={colors.grey} />
        </Pressable>

        <Pressable 
          style={styles.actionButton}
          onPress={() => onTabChange('loans')}
        >
          <IconSymbol name="doc.text.fill" size={20} color={colors.secondary} />
          <Text style={styles.actionText}>Apply for Loan</Text>
          <IconSymbol name="chevron.right" size={16} color={colors.grey} />
        </Pressable>
      </View>

      <View style={styles.recentActivity}>
        <Text style={styles.sectionTitle}>Recent Activity</Text>
        
        {transactions.slice(0, 3).map((transaction) => (
          <View key={transaction.id} style={styles.activityItem}>
            <View style={styles.activityIcon}>
              <IconSymbol 
                name={transaction.type === 'UPI' ? 'qrcode' : 'creditcard'} 
                size={16} 
                color={colors.primary} 
              />
            </View>
            <View style={styles.activityDetails}>
              <Text style={styles.activityTitle}>{transaction.description}</Text>
              <Text style={styles.activitySubtitle}>
                {transaction.type} • {new Date(transaction.createdAt).toLocaleDateString()}
              </Text>
            </View>
            <View style={styles.activityAmount}>
              <Text style={[
                styles.amountText,
                { color: transaction.status === 'Success' ? colors.success : 
                         transaction.status === 'Failed' ? colors.error : colors.warning }
              ]}>
                ₹{transaction.amount.toLocaleString()}
              </Text>
              <Text style={styles.statusText}>{transaction.status}</Text>
            </View>
          </View>
        ))}

        {transactions.length === 0 && (
          <View style={styles.emptyState}>
            <IconSymbol name="tray" size={48} color={colors.grey} />
            <Text style={styles.emptyText}>No transactions yet</Text>
            <Text style={styles.emptySubtext}>Start by making your first payment</Text>
          </View>
        )}
      </View>
    </ScrollView>
  );

  const renderTabBar = () => (
    <View style={commonStyles.tabBar}>
      <Pressable 
        style={commonStyles.tabItem}
        onPress={() => onTabChange('dashboard')}
      >
        <IconSymbol 
          name="house.fill" 
          size={24} 
          color={activeTab === 'dashboard' ? colors.primary : colors.text} 
        />
        <Text style={[
          commonStyles.tabText,
          { color: activeTab === 'dashboard' ? colors.primary : colors.text }
        ]}>
          Dashboard
        </Text>
      </Pressable>

      <Pressable 
        style={commonStyles.tabItem}
        onPress={() => onTabChange('payments')}
      >
        <IconSymbol 
          name="creditcard.fill" 
          size={24} 
          color={activeTab === 'payments' ? colors.primary : colors.text} 
        />
        <Text style={[
          commonStyles.tabText,
          { color: activeTab === 'payments' ? colors.primary : colors.text }
        ]}>
          Payments
        </Text>
      </Pressable>

      <Pressable 
        style={commonStyles.tabItem}
        onPress={() => onTabChange('loans')}
      >
        <IconSymbol 
          name="banknote.fill" 
          size={24} 
          color={activeTab === 'loans' ? colors.primary : colors.text} 
        />
        <Text style={[
          commonStyles.tabText,
          { color: activeTab === 'loans' ? colors.primary : colors.text }
        ]}>
          Loans
        </Text>
      </Pressable>

      <Pressable 
        style={commonStyles.tabItem}
        onPress={() => onTabChange('profile')}
      >
        <IconSymbol 
          name="person.fill" 
          size={24} 
          color={activeTab === 'profile' ? colors.primary : colors.text} 
        />
        <Text style={[
          commonStyles.tabText,
          { color: activeTab === 'profile' ? colors.primary : colors.text }
        ]}>
          Profile
        </Text>
      </Pressable>
    </View>
  );

  if (isLoading) {
    return (
      <View style={[commonStyles.container, { justifyContent: 'center', alignItems: 'center' }]}>
        <Text style={commonStyles.text}>Loading...</Text>
      </View>
    );
  }

  return (
    <View style={commonStyles.container}>
      {activeTab === 'dashboard' && renderOverview()}
      {renderTabBar()}
    </View>
  );
};

const styles = StyleSheet.create({
  content: {
    flex: 1,
    backgroundColor: colors.background,
  },
  header: {
    padding: 20,
    paddingTop: 40,
  },
  welcomeText: {
    fontSize: 16,
    color: colors.grey,
    marginBottom: 4,
  },
  userName: {
    fontSize: 28,
    fontWeight: '700',
    color: colors.text,
  },
  statsContainer: {
    flexDirection: 'row',
    paddingHorizontal: 20,
    marginBottom: 30,
    gap: 12,
  },
  statCard: {
    flex: 1,
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
  quickActions: {
    paddingHorizontal: 20,
    marginBottom: 30,
  },
  sectionTitle: {
    fontSize: 20,
    fontWeight: '600',
    color: colors.text,
    marginBottom: 16,
  },
  actionButton: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.card,
    borderRadius: 12,
    padding: 16,
    marginBottom: 12,
    borderWidth: 1,
    borderColor: colors.border,
  },
  actionText: {
    flex: 1,
    fontSize: 16,
    fontWeight: '500',
    color: colors.text,
    marginLeft: 12,
  },
  recentActivity: {
    paddingHorizontal: 20,
    paddingBottom: 100,
  },
  activityItem: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.card,
    borderRadius: 12,
    padding: 16,
    marginBottom: 12,
    borderWidth: 1,
    borderColor: colors.border,
  },
  activityIcon: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: colors.backgroundAlt,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 12,
  },
  activityDetails: {
    flex: 1,
  },
  activityTitle: {
    fontSize: 16,
    fontWeight: '500',
    color: colors.text,
    marginBottom: 4,
  },
  activitySubtitle: {
    fontSize: 14,
    color: colors.grey,
  },
  activityAmount: {
    alignItems: 'flex-end',
  },
  amountText: {
    fontSize: 16,
    fontWeight: '600',
    marginBottom: 2,
  },
  statusText: {
    fontSize: 12,
    color: colors.grey,
  },
  emptyState: {
    alignItems: 'center',
    paddingVertical: 40,
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
