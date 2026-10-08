import React from 'react';
import { TouchableOpacity, View, StyleSheet } from 'react-native';
import { Tabs, useRouter } from 'expo-router';
import { Home, Clock, Calendar, Wallet, User, Menu, Bell } from 'lucide-react-native';
import { useDrawer } from '../../context/DrawerContext';

export default function TabsLayout() {
  const { openDrawer } = useDrawer();
  const router = useRouter();

  return (
    <Tabs
      screenOptions={{
        headerShown: true,
        headerStyle: {
          backgroundColor: '#FFFFFF',
          elevation: 0,
          shadowOpacity: 0,
          borderBottomWidth: 0.5,
          borderBottomColor: '#F1F5F9',
        },
        headerTitleStyle: {
          fontWeight: '800',
          color: '#0F172A',
          fontSize: 18,
          letterSpacing: 0.2,
        },
        headerShadowVisible: false,
        headerLeft: () => (
          <TouchableOpacity
            style={styles.headerBtnLeft}
            onPress={openDrawer}
            activeOpacity={0.7}
            hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
          >
            <Menu size={22} color="#0F172A" />
          </TouchableOpacity>
        ),
        headerRight: () => (
          <TouchableOpacity
            style={styles.headerBtnRight}
            onPress={() => router.push('/notifications')}
            activeOpacity={0.7}
            hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
          >
            <Bell size={20} color="#64748B" />
            <View style={styles.notificationDot} />
          </TouchableOpacity>
        ),
        tabBarActiveTintColor: '#4F46E5',
        tabBarInactiveTintColor: '#94A3B8',
        tabBarStyle: {
          backgroundColor: '#FFFFFF',
          borderTopColor: '#F1F5F9',
          borderTopWidth: 0.5,
          height: 64,
          paddingBottom: 10,
          paddingTop: 8,
          shadowColor: '#000000',
          shadowOffset: { width: 0, height: -2 },
          shadowOpacity: 0.04,
          shadowRadius: 8,
          elevation: 8,
        },
        tabBarLabelStyle: {
          fontSize: 11,
          fontWeight: '700',
          letterSpacing: 0.1,
        },
      }}
    >
      <Tabs.Screen
        name="index"
        options={{
          title: 'Home',
          headerTitle: 'EMS Dashboard',
          tabBarIcon: ({ color, size }) => <Home size={size || 22} color={color} />,
        }}
      />
      <Tabs.Screen
        name="attendance"
        options={{
          title: 'Attendance',
          headerTitle: 'Attendance & Clock-in',
          tabBarIcon: ({ color, size }) => <Clock size={size || 22} color={color} />,
        }}
      />
      <Tabs.Screen
        name="leave"
        options={{
          title: 'Leave',
          headerTitle: 'Leave Management',
          tabBarIcon: ({ color, size }) => <Calendar size={size || 22} color={color} />,
        }}
      />
      <Tabs.Screen
        name="payroll"
        options={{
          title: 'Payroll',
          headerTitle: 'Salary & Payslips',
          tabBarIcon: ({ color, size }) => <Wallet size={size || 22} color={color} />,
        }}
      />
      <Tabs.Screen
        name="profile"
        options={{
          title: 'Profile',
          headerTitle: 'My Profile',
          tabBarIcon: ({ color, size }) => <User size={size || 22} color={color} />,
        }}
      />
    </Tabs>
  );
}

const styles = StyleSheet.create({
  headerBtnLeft: {
    paddingLeft: 20,
    paddingRight: 12,
    paddingVertical: 8,
  },
  headerBtnRight: {
    paddingRight: 20,
    paddingLeft: 12,
    paddingVertical: 8,
    position: 'relative',
  },
  notificationDot: {
    position: 'absolute',
    top: 5,
    right: 19,
    width: 9,
    height: 9,
    borderRadius: 5,
    backgroundColor: '#EF4444',
    borderWidth: 1.5,
    borderColor: '#FFFFFF',
  },
});
