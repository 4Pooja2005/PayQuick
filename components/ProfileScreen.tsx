
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
        { text: 'Logout', style: 'destructive', onPress: logout },
      ]
    );
  };

  const handleClearData = () => {
    Alert.alert(
      'Clear All Data',
      'This will delete all your transactions, loans, and other data. This action cannot be undone.',
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
        },
      ]
    );
  };

  const handleAbout = () => {
    Alert.alert(
      'About PayLite+Loans',
      'PayLite+Loans is a developer-friendly mini payment gateway and micro-loans platform.\n\nVersion: 1.0.0\nBuilt with React Native & Expo\n\nFeatures:\n• Mock payment simulation\n• Micro-loan management\n• Transaction history\n• EMI calculator\n• Credit evaluation system',
      [{ text: 'OK' }]
    );
  };

  if (!user) {
    return (
      <View style={[commonStyles.container, { justifyContent: 'center', alignItems: 'center' }]}>
        <Text style={commonStyles.text}>Loading...</Text>
      </View>
    );
  }

  return (
    <View style={commonStyles.container}>
      <ScrollView style={styles.content} showsVerticalScrollIndicator={false}>
        <View style={styles.header}>
          <View style={styles.profileIcon}>
            <IconSymbol name="person.fill" size={40} color={colors.primary} />
          </View>
          <Text style={styles.userName}>{user.name}</Text>
          <Text style={styles.userEmail}>{user.email}</Text>
          <View style={styles.roleBadge}>
            <Text style={styles.roleText}>{user.role.toUpperCase()}</Text>
          </View>
        </View>

        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Account</Text>
          
          <Pressable style={styles.menuItem}>
            <View style={styles.menuItemLeft}>
              <IconSymbol name="person.circle" size={20} color={colors.grey} />
              <Text style={styles.menuItemText}>Personal Information</Text>
            </View>
            <IconSymbol name="chevron.right" size={16} color={colors.grey} />
          </Pressable>

          <Pressable style={styles.menuItem}>
            <View style={styles.menuItemLeft}>
              <IconSymbol name="lock" size={20} color={colors.grey} />
              <Text style={styles.menuItemText}>Security & Privacy</Text>
            </View>
            <IconSymbol name="chevron.right" size={16} color={colors.grey} />
          </Pressable>

          <Pressable style={styles.menuItem}>
            <View style={styles.menuItemLeft}>
              <IconSymbol name="bell" size={20} color={colors.grey} />
              <Text style={styles.menuItemText}>Notifications</Text>
            </View>
            <IconSymbol name="chevron.right" size={16} color={colors.grey} />
          </Pressable>
        </View>

        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Support</Text>
          
          <Pressable style={styles.menuItem}>
            <View style={styles.menuItemLeft}>
              <IconSymbol name="questionmark.circle" size={20} color={colors.grey} />
              <Text style={styles.menuItemText}>Help & FAQ</Text>
            </View>
            <IconSymbol name="chevron.right" size={16} color={colors.grey} />
          </Pressable>

          <Pressable style={styles.menuItem}>
            <View style={styles.menuItemLeft}>
              <IconSymbol name="envelope" size={20} color={colors.grey} />
              <Text style={styles.menuItemText}>Contact Support</Text>
            </View>
            <IconSymbol name="chevron.right" size={16} color={colors.grey} />
          </Pressable>

          <Pressable style={styles.menuItem} onPress={handleAbout}>
            <View style={styles.menuItemLeft}>
              <IconSymbol name="info.circle" size={20} color={colors.grey} />
              <Text style={styles.menuItemText}>About</Text>
            </View>
            <IconSymbol name="chevron.right" size={16} color={colors.grey} />
          </Pressable>
        </View>

        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Developer Tools</Text>
          
          <Pressable style={styles.menuItem}>
            <View style={styles.menuItemLeft}>
              <IconSymbol name="doc.text" size={20} color={colors.grey} />
              <Text style={styles.menuItemText}>API Documentation</Text>
            </View>
            <IconSymbol name="chevron.right" size={16} color={colors.grey} />
          </Pressable>

          <Pressable style={styles.menuItem}>
            <View style={styles.menuItemLeft}>
              <IconSymbol name="key" size={20} color={colors.grey} />
              <Text style={styles.menuItemText}>API Keys</Text>
            </View>
            <IconSymbol name="chevron.right" size={16} color={colors.grey} />
          </Pressable>

          <Pressable style={styles.menuItem}>
            <View style={styles.menuItemLeft}>
              <IconSymbol name="chart.bar" size={20} color={colors.grey} />
              <Text style={styles.menuItemText}>Usage Analytics</Text>
            </View>
            <IconSymbol name="chevron.right" size={16} color={colors.grey} />
          </Pressable>
        </View>

        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Data Management</Text>
          
          <Pressable style={styles.menuItem}>
            <View style={styles.menuItemLeft}>
              <IconSymbol name="square.and.arrow.down" size={20} color={colors.grey} />
              <Text style={styles.menuItemText}>Export Data</Text>
            </View>
            <IconSymbol name="chevron.right" size={16} color={colors.grey} />
          </Pressable>

          <Pressable style={styles.menuItem} onPress={handleClearData}>
            <View style={styles.menuItemLeft}>
              <IconSymbol name="trash" size={20} color={colors.error} />
              <Text style={[styles.menuItemText, { color: colors.error }]}>Clear All Data</Text>
            </View>
            <IconSymbol name="chevron.right" size={16} color={colors.grey} />
          </Pressable>
        </View>

        <View style={styles.logoutSection}>
          <Button
            variant="outline"
            onPress={handleLogout}
            style={styles.logoutButton}
          >
            Logout
          </Button>
        </View>

        <View style={styles.footer}>
          <Text style={styles.footerText}>PayLite+Loans v1.0.0</Text>
          <Text style={styles.footerText}>Built with React Native & Expo</Text>
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
    alignItems: 'center',
    padding: 20,
    paddingTop: 40,
    backgroundColor: colors.card,
    borderBottomWidth: 1,
    borderBottomColor: colors.border,
  },
  profileIcon: {
    width: 80,
    height: 80,
    borderRadius: 40,
    backgroundColor: colors.backgroundAlt,
    justifyContent: 'center',
    alignItems: 'center',
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
    paddingVertical: 4,
    borderRadius: 12,
  },
  roleText: {
    fontSize: 12,
    fontWeight: '600',
    color: colors.primary,
  },
  section: {
    padding: 20,
    paddingBottom: 0,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: colors.text,
    marginBottom: 16,
  },
  menuItem: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: colors.card,
    borderRadius: 12,
    padding: 16,
    marginBottom: 8,
    borderWidth: 1,
    borderColor: colors.border,
  },
  menuItemLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
  },
  menuItemText: {
    fontSize: 16,
    fontWeight: '500',
    color: colors.text,
    marginLeft: 12,
  },
  logoutSection: {
    padding: 20,
    paddingTop: 30,
  },
  logoutButton: {
    borderColor: colors.error,
  },
  footer: {
    alignItems: 'center',
    padding: 20,
    paddingBottom: 100,
  },
  footerText: {
    fontSize: 12,
    color: colors.grey,
    marginBottom: 4,
  },
});
