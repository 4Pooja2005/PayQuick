
import React from 'react';
import { AuthProvider } from '../../contexts/AuthContext';
import { AuthScreen } from '../../components/AuthScreen';
import { MainApp } from '../../components/MainApp';
import { useAuth } from '../../contexts/AuthContext';

const AppContent: React.FC = () => {
  const { isAuthenticated, isLoading } = useAuth();

  if (isLoading) {
    return null; // You could add a loading screen here
  }

  return isAuthenticated ? <MainApp /> : <AuthScreen />;
};

export default function Index() {
  return (
    <AuthProvider>
      <AppContent />
    </AuthProvider>
  );
}
