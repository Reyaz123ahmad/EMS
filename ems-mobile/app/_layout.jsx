import React, { useEffect } from 'react';
import { Stack, useRouter, useSegments } from 'expo-router';
import { View, ActivityIndicator, StyleSheet, Text, StatusBar, Platform } from 'react-native';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import { AuthProvider, useAuth } from '../hooks/useAuth.js';
import { DrawerProvider } from '../context/DrawerContext.js';
import AppDrawer from '../components/AppDrawer.jsx';
import { API_BASE_URL } from '../services/api.js';

const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      retry: 2,
      retryDelay: 2000,
      staleTime: 1000 * 60 * 5, // 5 mins
      gcTime: 1000 * 60 * 30, // 30 mins cached retention
      refetchOnWindowFocus: false,
    },
  },
});

function RootLayoutNav() {
  const { user, isLoading } = useAuth();
  const segments = useSegments();
  const router = useRouter();

  useEffect(() => {
    if (isLoading) return;

    const inAuthGroup = segments[0] === '(auth)';

    if (!user && !inAuthGroup) {
      console.log('[NAV] Unauthenticated user -> redirecting to /(auth)/login');
      router.replace('/(auth)/login');
    } else if (user && inAuthGroup) {
      console.log('[NAV] Authenticated user -> redirecting to /(tabs)');
      router.replace('/(tabs)');
    }
  }, [user, isLoading, segments]);

  return (
    <>
      <StatusBar barStyle="light-content" backgroundColor="#0F172A" />
      <Stack
        screenOptions={{
          headerShown: false,
          headerBackTitle: 'Back',
          headerTintColor: '#4F46E5',
          headerTitleStyle: {
            fontWeight: '700',
            color: '#0F172A',
          },
        }}
      >
        <Stack.Screen name="(auth)" />
        <Stack.Screen name="(tabs)" />
        <Stack.Screen name="my-shift" options={{ headerShown: true, title: 'My Shift' }} />
        <Stack.Screen name="my-card" options={{ headerShown: true, title: 'My Digital Card' }} />
        <Stack.Screen name="documents/index" options={{ headerShown: true, title: 'Documents' }} />
        <Stack.Screen name="notifications/index" options={{ headerShown: true, title: 'Notifications' }} />
        <Stack.Screen name="my-projects/index" options={{ headerShown: true, title: 'My Projects' }} />
        <Stack.Screen name="emergency-attendance/index" options={{ headerShown: true, title: 'Emergency Attendance' }} />
        <Stack.Screen name="approvals/requests" options={{ headerShown: true, title: 'My Approvals' }} />
        <Stack.Screen name="assets/index" options={{ headerShown: true, title: 'My Assets' }} />
        <Stack.Screen name="attendance/logs" options={{ headerShown: true, title: 'Attendance Logs' }} />
        <Stack.Screen name="attendance/monthly-summary" options={{ headerShown: true, title: 'Monthly Summary' }} />
        <Stack.Screen name="attendance/calendar" options={{ headerShown: true, title: 'Attendance Calendar' }} />
        <Stack.Screen name="attendance/qr-scanner" options={{ headerShown: true, title: 'QR Code Punch' }} />
        <Stack.Screen name="leave/apply" options={{ headerShown: true, title: 'Apply Leave' }} />
        <Stack.Screen name="leave/balances" options={{ headerShown: true, title: 'Leave Balances' }} />
        <Stack.Screen name="leave/history" options={{ headerShown: true, title: 'Leave History' }} />
        <Stack.Screen name="leave/calendar" options={{ headerShown: true, title: 'Leave Calendar' }} />
        <Stack.Screen name="overtime/apply" options={{ headerShown: true, title: 'Claim Overtime' }} />
        <Stack.Screen name="overtime/records" options={{ headerShown: true, title: 'Overtime Records' }} />
      </Stack>
      <AppDrawer />
    </>
  );
}

export default function RootLayout() {
  return (
    <SafeAreaProvider>
      <QueryClientProvider client={queryClient}>
        <AuthProvider>
          <DrawerProvider>
            <RootLayoutNav />
          </DrawerProvider>
        </AuthProvider>
      </QueryClientProvider>
    </SafeAreaProvider>
  );
}

const styles = StyleSheet.create({
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#0F172A',
    padding: 24,
  },
  logoBadge: {
    width: 68,
    height: 68,
    borderRadius: 20,
    backgroundColor: '#6366F1',
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 20,
    shadowColor: '#6366F1',
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.4,
    shadowRadius: 16,
    elevation: 8,
  },
  logoText: {
    color: '#FFFFFF',
    fontSize: 30,
    fontWeight: '900',
  },
  spinner: {
    marginTop: 8,
    marginBottom: 16,
  },
  loadingText: {
    color: '#F8FAFC',
    fontSize: 16,
    fontWeight: '700',
    letterSpacing: 0.3,
    marginBottom: 8,
  },
  apiEndpointText: {
    color: '#64748B',
    fontSize: 11,
    fontFamily: Platform.OS === 'ios' ? 'Menlo' : 'monospace',
  },
});
