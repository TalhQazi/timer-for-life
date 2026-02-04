import { useAuth } from '@/src/contexts/AuthContext';
import { COLORS } from '@/src/utils/constants';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { router } from 'expo-router';
import React, { useEffect } from 'react';
import { ActivityIndicator, StatusBar, StyleSheet, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

export default function Splash() {
  const { isAuthenticated, isLoading } = useAuth();

  useEffect(() => {
    const timer = setTimeout(() => {
      if (!isLoading) {
        if (isAuthenticated) {
          router.replace('/home');
        } else {
          router.replace('/login');
        }
      }
    }, 2000);

    return () => clearTimeout(timer);
  }, [isAuthenticated, isLoading]);

  return (
    <SafeAreaView style={styles.container}>
      <StatusBar barStyle="light-content" backgroundColor={COLORS.background} />

      <MaterialCommunityIcons name="timer-sand-full" size={80} color={COLORS.primary} style={styles.logo} />

      <Text style={styles.title}>Timers for Life</Text>
      <Text style={styles.subtitle}>Counting down your moments...</Text>

      {isLoading && (
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color={COLORS.primary} />
          <Text style={styles.loadingText}>Initializing...</Text>
        </View>
      )}
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: COLORS.background,
    paddingHorizontal: 20,
  },
  logo: {
    marginBottom: 30,
    textShadowColor: 'rgba(0, 0, 0, 0.2)',
    textShadowOffset: { width: 1, height: 1 },
    textShadowRadius: 3,
  },
  title: {
    fontSize: 36,
    fontWeight: '800',
    color: COLORS.text,
    textAlign: 'center',
    marginBottom: 8,
    letterSpacing: 1,
  },
  subtitle: {
    fontSize: 16,
    color: COLORS.text,
    opacity: 0.7,
    textAlign: 'center',
    marginBottom: 40,
  },
  loadingContainer: {
    alignItems: 'center',
    marginTop: 20,
  },
  loadingText: {
    color: COLORS.textSecondary,
    fontSize: 14,
    marginTop: 10,
  },
});
