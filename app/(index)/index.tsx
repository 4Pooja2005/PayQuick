
import React from 'react';
import { View, StyleSheet } from 'react-native';
import { Stack } from 'expo-router';
import { AuthProvider, useAuth } from '../../contexts/AuthContext';
import { AuthScreen } from '../../components/AuthScreen';
import { MainApp } from '../../components/MainApp';
import { colors } from '../../styles/commonStyles';

const AppContent: React.FC = () => {
  const { isAuthenticated, isLoading } = useAuth();

  if (isLoading) {
    return <View style={styles.container} />;
  }

  return isAuthenticated ? <MainApp /> : <AuthScreen />;
};

export default function HomeScreen() {
  return (
    <>
      <Stack.Screen
        options={{
          title: "PayLite+Loans",
          headerShown: false,
        }}
      />
      <AuthProvider>
        <AppContent />
      </AuthProvider>
    </>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.background,
  },
});
