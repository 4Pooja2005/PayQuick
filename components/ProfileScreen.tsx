
import React from 'react';
import { View, Text, StyleSheet, ScrollView, Pressable, Alert } from 'react-native';
import { IconSymbol } from './IconSymbol';
import { Button } from './button';
import { colors, commonStyles } from '../styles/commonStyles';
import { useAuth } from '../contexts/AuthContext';
import { StorageService } from '../utils/storage';

interface ProfileScreenProps {
  onTabChange: (tab: string) => void;
}

export const ProfileScreen: React.FC<ProfileScreenProps> = ({ onTabChange }) => {
  const { user, logout } = useAuth();

  const handleLogout = () => {
    Alert.alert(
      'Logout',
      'Are you sure you want to logout?',
      [
        { text: 'Cancel', style: 'cancel' },
        { text: 'Logout', style: 'destructive', onPress: logout }
      ]
    );
  };

  const handleClearData = () => {
    Alert.alert(
      'Clear All Data',
      'This will delete all your transactions and loans. This action cannot be undone.',
      [
        { text: 'Cancel', style: 'cancel' },
        { 
          text: 'Clear Data', 
          style: 'destructive', 
          onPress: async () => {
            try {
              await StorageService.clearAllData();
              Alert.alert('Success', 'All data has been cleared');
            } catch (error) {
              console.error('Error clearing data:', error);
              Alert.alert('Error', 'Failed to clear data');
            }
          }
        }
      ]
    );
  };

  const handleBackToDashboard = () => {
    onTabChange('dashboard');
  };

  if (!user) return null;

  return (
    <View style={commonStyles.container}>
      <View style={styles.header}>
        <Pressable style={styles.backButton} onPress={handleBackToDashboard}>
          <IconSymbol name="chevron.left" size={24} color={colors.text} />
          <Text style={styles.backButtonText}>Dashboard</Text>
        </Pressable>
        <Text style={styles.headerTitle}>Profile</Text>
      </View>

      <ScrollView style={styles.content} showsVerticalScrollIndicator={false}>
        <View style={styles.section}>
          <View style={styles.profileCard}>
            <View style={styles.avatarContainer}>
              <IconSymbol name="person.circle.fill" size={64} color={colors.primary} />
            </View>
            <Text style={styles.userName}>{user.name}</Text>
            <Text style={styles.userEmail}>{user.email}</Text>
            <View style={styles.roleBadge}>
              <Text style={styles.roleText}>
                {user.role === 'admin' ? 'Administrator' : 'User'}
              </Text>
            </View>
          </View>
        </View>

        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Account Information</Text>
          
          <View style={styles.infoCard}>
            <View style={styles.infoRow}>
              <IconSymbol name="envelope" size={20} color={colors.grey} />
              <View style={styles.infoContent}>
                <Text style={styles.infoLabel}>Email</Text>
                <Text style={styles.infoValue}>{user.email}</Text>
              </View>
            </View>
            
            <View style={styles.infoRow}>
              <IconSymbol name="person" size={20} color={colors.grey} />
              <View style={styles.infoContent}>
                <Text style={styles.infoLabel}>Full Name</Text>
                <Text style={styles.infoValue}>{user.name}</Text>
              </View>
            </View>
            
            <View style={styles.infoRow}>
              <IconSymbol name="shield" size={20} color={colors.grey} />
              <View style={styles.infoContent}>
                <Text style={styles.infoLabel}>Account Type</Text>
                <Text style={styles.infoValue}>
                  {user.role === 'admin' ? 'Administrator' : 'Standard User'}
                </Text>
              </View>
            </View>
            
            <View style={styles.infoRow}>
              <IconSymbol name="calendar" size={20} color={colors.grey} />
              <View style={styles.infoContent}>
                <Text style={styles.infoLabel}>Member Since</Text>
                <Text style={styles.infoValue}>
                  {new Date(user.createdAt).toLocaleDateString()}
                </Text>
              </View>
            </View>
          </View>
        </View>

        {user.role === 'admin' && (
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Admin Features</Text>
            
            <View style={styles.adminCard}>
              <IconSymbol name="crown" size={24} color={colors.warning} />
              <Text style={styles.adminTitle}>Administrator Access</Text>
              <Text style={styles.adminSubtitle}>
                You have access to view all users&apos; transactions and loans
              </Text>
              
              <Button
                variant="outline"
                onPress={() => onTabChange('admin')}
                style={styles.adminButton}
              >
                <IconSymbol name="chart.bar" size={16} color={colors.primary} />
                <Text style={styles.adminButtonText}>Admin Dashboard</Text>
              </Button>
            </View>
          </View>
        )}

        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Settings</Text>
          
          <View style={styles.settingsCard}>
            <Pressable style={styles.settingRow}>
              <IconSymbol name="bell" size={20} color={colors.grey} />
              <Text style={styles.settingText}>Notifications</Text>
              <IconSymbol name="chevron.right" size={16} color={colors.grey} />
            </Pressable>
            
            <Pressable style={styles.settingRow}>
              <IconSymbol name="lock" size={20} color={colors.grey} />
              <Text style={styles.settingText}>Privacy & Security</Text>
              <IconSymbol name="chevron.right" size={16} color={colors.grey} />
            </Pressable>
            
            <Pressable style={styles.settingRow}>
              <IconSymbol name="questionmark.circle" size={20} color={colors.grey} />
              <Text style={styles.settingText}>Help & Support</Text>
              <IconSymbol name="chevron.right" size={16} color={colors.grey} />
            </Pressable>
          </View>
        </View>

        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Data Management</Text>
          
          <Button
            variant="outline"
            onPress={handleClearData}
            style={styles.clearButton}
          >
            <IconSymbol name="trash" size={16} color={colors.error} />
            <Text style={[styles.clearButtonText, { color: colors.error }]}>
              Clear All Data
            </Text>
          </Button>
        </View>

        <View style={styles.section}>
          <Button
            variant="outline"
            onPress={handleLogout}
            style={styles.logoutButton}
          >
            <IconSymbol name="arrow.right.square" size={16} color={colors.error} />
            <Text style={[styles.logoutButtonText, { color: colors.error }]}>
              Logout
            </Text>
          </Button>
        </View>

        <View style={styles.footer}>
          <Text style={styles.footerText}>PayLite+Loans v1.0.0</Text>
          <Text style={styles.footerSubtext}>
            A secure fintech platform for payments and micro-loans
          </Text>
        </View>
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
  headerTitle: {
    fontSize: 24,
    fontWeight: '700',
    color: colors.text,
  },
  section: {
    padding: 20,
  },
  profileCard: {
    backgroundColor: colors.card,
    borderRadius: 16,
    padding: 24,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: colors.border,
  },
  avatarContainer: {
    marginBottom: 16,
  },
  userName: {
    fontSize: 24,
    fontWeight: '700',
    color: colors.text,
    marginBottom: 4,
  },
  userEmail: {
    fontSize: 16,
    color: colors.grey,
    marginBottom: 12,
  },
  roleBadge: {
    backgroundColor: colors.primary + '20',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 16,
  },
  roleText: {
    fontSize: 12,
    fontWeight: '600',
    color: colors.primary,
  },
  sectionTitle: {
    fontSize: 20,
    fontWeight: '700',
    color: colors.text,
    marginBottom: 16,
  },
  infoCard: {
    backgroundColor: colors.card,
    borderRadius: 12,
    padding: 16,
    borderWidth: 1,
    borderColor: colors.border,
  },
  infoRow: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: colors.border,
  },
  infoContent: {
    flex: 1,
    marginLeft: 12,
  },
  infoLabel: {
    fontSize: 12,
    color: colors.grey,
    marginBottom: 2,
  },
  infoValue: {
    fontSize: 16,
    fontWeight: '500',
    color: colors.text,
  },
  adminCard: {
    backgroundColor: colors.warning + '10',
    borderRadius: 12,
    padding: 20,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: colors.warning + '30',
  },
  adminTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: colors.text,
    marginTop: 8,
    marginBottom: 4,
  },
  adminSubtitle: {
    fontSize: 14,
    color: colors.grey,
    textAlign: 'center',
    marginBottom: 16,
  },
  adminButton: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  adminButtonText: {
    fontSize: 16,
    fontWeight: '500',
    color: colors.primary,
    marginLeft: 8,
  },
  settingsCard: {
    backgroundColor: colors.card,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: colors.border,
  },
  settingRow: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 16,
    borderBottomWidth: 1,
    borderBottomColor: colors.border,
  },
  settingText: {
    flex: 1,
    fontSize: 16,
    fontWeight: '500',
    color: colors.text,
    marginLeft: 12,
  },
  clearButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    borderColor: colors.error,
  },
  clearButtonText: {
    fontSize: 16,
    fontWeight: '500',
    marginLeft: 8,
  },
  logoutButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    borderColor: colors.error,
  },
  logoutButtonText: {
    fontSize: 16,
    fontWeight: '500',
    marginLeft: 8,
  },
  footer: {
    alignItems: 'center',
    paddingVertical: 20,
  },
  footerText: {
    fontSize: 14,
    fontWeight: '600',
    color: colors.text,
    marginBottom: 4,
  },
  footerSubtext: {
    fontSize: 12,
    color: colors.grey,
    textAlign: 'center',
  },
});
