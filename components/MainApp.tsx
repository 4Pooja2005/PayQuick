
import React, { useState } from 'react';
import { View, StyleSheet } from 'react-native';
import { Dashboard } from './Dashboard';
import { PaymentsScreen } from './PaymentsScreen';
import { LoansScreen } from './LoansScreen';
import { ProfileScreen } from './ProfileScreen';
import { colors, commonStyles } from '../styles/commonStyles';

export const MainApp: React.FC = () => {
  const [activeTab, setActiveTab] = useState('dashboard');

  const renderActiveScreen = () => {
    switch (activeTab) {
      case 'dashboard':
        return <Dashboard activeTab={activeTab} onTabChange={setActiveTab} />;
      case 'payments':
        return <PaymentsScreen onTabChange={setActiveTab} />;
      case 'loans':
        return <LoansScreen onTabChange={setActiveTab} />;
      case 'profile':
        return <ProfileScreen onTabChange={setActiveTab} />;
      default:
        return <Dashboard activeTab={activeTab} onTabChange={setActiveTab} />;
    }
  };

  return (
    <View style={commonStyles.container}>
      {renderActiveScreen()}
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.background,
  },
});
