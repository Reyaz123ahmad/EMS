import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Pressable,
  Modal,
  StatusBar,
  Image,
  Dimensions,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useRouter, usePathname } from 'expo-router';
import { useQuery } from '@tanstack/react-query';
import { useAuth } from '../hooks/useAuth';
import { useDrawer } from '../context/DrawerContext';
import { notificationService } from '../services/notification.service';
import {
  LayoutDashboard,
  Clock,
  FolderKanban,
  AlertTriangle,
  CheckSquare,
  Package,
  Calendar,
  Timer,
  FileText,
  CreditCard,
  Folder,
  Bell,
  User,
  ChevronDown,
  ChevronRight,
  LogOut,
  X,
  Sparkles,
} from 'lucide-react-native';

const { width } = Dimensions.get('window');
const DRAWER_WIDTH = Math.min(width * 0.82, 330);

export default function AppDrawer() {
  const { isOpen, closeDrawer } = useDrawer();
  const router = useRouter();
  const pathname = usePathname();
  const { user, logout } = useAuth();

  const { data: unreadCount = 0 } = useQuery({
    queryKey: ['notificationsUnreadCount'],
    queryFn: async () => {
      try {
        return await notificationService.getUnreadCount();
      } catch {
        return 0;
      }
    },
    enabled: Boolean(user),
    refetchInterval: 30000,
  });

  const [expandedGroups, setExpandedGroups] = useState({
    attendance: true,
    leave: false,
    overtime: false,
  });

  const toggleGroup = (key) => {
    setExpandedGroups((prev) => ({
      ...prev,
      [key]: !prev[key],
    }));
  };

  const handleNavigate = (route) => {
    closeDrawer();
    router.push(route);
  };

  const isCurrentActive = (route) => {
    if (route === '/(tabs)' && (pathname === '/' || pathname === '/(tabs)')) return true;
    return pathname === route;
  };

  if (!isOpen) return null;

  return (
    <Modal visible={isOpen} transparent animationType="fade" onRequestClose={closeDrawer}>
      <View style={styles.overlay}>
        <Pressable style={styles.backdrop} onPress={closeDrawer} />

        <View style={styles.drawerContainer}>
          <SafeAreaView style={styles.drawerInner}>
            <StatusBar barStyle="light-content" backgroundColor="#0F172A" />

            {/* Header / Brand Logo */}
            <View style={styles.brandHeader}>
              <View style={styles.brandLeft}>
                <View style={styles.logoBadge}>
                  <Text style={styles.logoText}>E</Text>
                </View>
                <View>
                  <Text style={styles.brandTitle}>EMS Platform</Text>
                  <Text style={styles.brandSubtitle}>Enterprise Workspace</Text>
                </View>
              </View>
              <TouchableOpacity onPress={closeDrawer} style={styles.closeBtn} activeOpacity={0.7}>
                <X size={20} color="#94A3B8" />
              </TouchableOpacity>
            </View>

            {/* Navigation Menu Items */}
            <ScrollView
              style={styles.menuScroll}
              contentContainerStyle={styles.menuContent}
              showsVerticalScrollIndicator={false}
            >
              <Text style={styles.menuSectionHeader}>MAIN NAVIGATION</Text>

              {/* 1. Dashboard */}
              <TouchableOpacity
                style={[styles.navItem, isCurrentActive('/(tabs)') && styles.navItemActive]}
                onPress={() => handleNavigate('/(tabs)')}
              >
                <LayoutDashboard size={19} color={isCurrentActive('/(tabs)') ? '#6366F1' : '#94A3B8'} />
                <Text style={[styles.navItemText, isCurrentActive('/(tabs)') && styles.navItemTextActive]}>
                  Dashboard
                </Text>
              </TouchableOpacity>

              {/* 2. Attendance & Punch (Accordion) */}
              <View style={styles.accordionContainer}>
                <TouchableOpacity
                  style={styles.accordionHeader}
                  onPress={() => toggleGroup('attendance')}
                  activeOpacity={0.7}
                >
                  <View style={styles.accordionLeft}>
                    <Clock size={19} color="#94A3B8" />
                    <Text style={styles.navItemText}>Attendance & Punch</Text>
                  </View>
                  {expandedGroups.attendance ? (
                    <ChevronDown size={17} color="#64748B" />
                  ) : (
                    <ChevronRight size={17} color="#64748B" />
                  )}
                </TouchableOpacity>

                {expandedGroups.attendance && (
                  <View style={styles.subItemsContainer}>
                    <TouchableOpacity
                      style={[styles.subItem, isCurrentActive('/(tabs)/attendance') && styles.subItemActive]}
                      onPress={() => handleNavigate('/(tabs)/attendance')}
                    >
                      <View style={styles.subDot} />
                      <Text style={[styles.subItemText, isCurrentActive('/(tabs)/attendance') && styles.subItemTextActive]}>
                        Clock In/Out (Live)
                      </Text>
                    </TouchableOpacity>

                    <TouchableOpacity
                      style={[styles.subItem, isCurrentActive('/attendance/logs') && styles.subItemActive]}
                      onPress={() => handleNavigate('/attendance/logs')}
                    >
                      <View style={styles.subDot} />
                      <Text style={[styles.subItemText, isCurrentActive('/attendance/logs') && styles.subItemTextActive]}>
                        My Attendance Logs
                      </Text>
                    </TouchableOpacity>

                    <TouchableOpacity
                      style={[styles.subItem, isCurrentActive('/attendance/monthly-summary') && styles.subItemActive]}
                      onPress={() => handleNavigate('/attendance/monthly-summary')}
                    >
                      <View style={styles.subDot} />
                      <Text style={[styles.subItemText, isCurrentActive('/attendance/monthly-summary') && styles.subItemTextActive]}>
                        Monthly Summary
                      </Text>
                    </TouchableOpacity>

                    <TouchableOpacity
                      style={[styles.subItem, isCurrentActive('/attendance/calendar') && styles.subItemActive]}
                      onPress={() => handleNavigate('/attendance/calendar')}
                    >
                      <View style={styles.subDot} />
                      <Text style={[styles.subItemText, isCurrentActive('/attendance/calendar') && styles.subItemTextActive]}>
                        Attendance Calendar
                      </Text>
                    </TouchableOpacity>

                    <TouchableOpacity
                      style={[styles.subItem, isCurrentActive('/attendance/qr-scanner') && styles.subItemActive]}
                      onPress={() => handleNavigate('/attendance/qr-scanner')}
                    >
                      <View style={styles.subDot} />
                      <Text style={[styles.subItemText, isCurrentActive('/attendance/qr-scanner') && styles.subItemTextActive]}>
                        QR Scanner Punch
                      </Text>
                    </TouchableOpacity>
                  </View>
                )}
              </View>

              {/* 3. My Projects */}
              <TouchableOpacity
                style={[styles.navItem, isCurrentActive('/my-projects') && styles.navItemActive]}
                onPress={() => handleNavigate('/my-projects')}
              >
                <FolderKanban size={19} color={isCurrentActive('/my-projects') ? '#6366F1' : '#94A3B8'} />
                <Text style={[styles.navItemText, isCurrentActive('/my-projects') && styles.navItemTextActive]}>
                  My Projects
                </Text>
              </TouchableOpacity>

              {/* 4. Emergency Attendance */}
              <TouchableOpacity
                style={[styles.navItem, isCurrentActive('/emergency-attendance') && styles.navItemActive]}
                onPress={() => handleNavigate('/emergency-attendance')}
              >
                <AlertTriangle size={19} color={isCurrentActive('/emergency-attendance') ? '#F59E0B' : '#94A3B8'} />
                <Text style={[styles.navItemText, isCurrentActive('/emergency-attendance') && styles.navItemTextActive]}>
                  Emergency Attendance
                </Text>
              </TouchableOpacity>

              {/* 5. My Approvals */}
              <TouchableOpacity
                style={[styles.navItem, isCurrentActive('/approvals/requests') && styles.navItemActive]}
                onPress={() => handleNavigate('/approvals/requests')}
              >
                <CheckSquare size={19} color={isCurrentActive('/approvals/requests') ? '#10B981' : '#94A3B8'} />
                <Text style={[styles.navItemText, isCurrentActive('/approvals/requests') && styles.navItemTextActive]}>
                  My Approvals
                </Text>
              </TouchableOpacity>

              {/* 6. My Assets */}
              <TouchableOpacity
                style={[styles.navItem, isCurrentActive('/assets') && styles.navItemActive]}
                onPress={() => handleNavigate('/assets')}
              >
                <Package size={19} color={isCurrentActive('/assets') ? '#6366F1' : '#94A3B8'} />
                <Text style={[styles.navItemText, isCurrentActive('/assets') && styles.navItemTextActive]}>
                  My Assets
                </Text>
              </TouchableOpacity>

              {/* 7. My Leave (Accordion) */}
              <View style={styles.accordionContainer}>
                <TouchableOpacity
                  style={styles.accordionHeader}
                  onPress={() => toggleGroup('leave')}
                  activeOpacity={0.7}
                >
                  <View style={styles.accordionLeft}>
                    <Calendar size={19} color="#94A3B8" />
                    <Text style={styles.navItemText}>My Leave</Text>
                  </View>
                  {expandedGroups.leave ? (
                    <ChevronDown size={17} color="#64748B" />
                  ) : (
                    <ChevronRight size={17} color="#64748B" />
                  )}
                </TouchableOpacity>

                {expandedGroups.leave && (
                  <View style={styles.subItemsContainer}>
                    <TouchableOpacity
                      style={[styles.subItem, isCurrentActive('/(tabs)/leave') && styles.subItemActive]}
                      onPress={() => handleNavigate('/(tabs)/leave')}
                    >
                      <View style={styles.subDot} />
                      <Text style={[styles.subItemText, isCurrentActive('/(tabs)/leave') && styles.subItemTextActive]}>
                        My Requests
                      </Text>
                    </TouchableOpacity>

                    <TouchableOpacity
                      style={[styles.subItem, isCurrentActive('/leave/apply') && styles.subItemActive]}
                      onPress={() => handleNavigate('/leave/apply')}
                    >
                      <View style={styles.subDot} />
                      <Text style={[styles.subItemText, isCurrentActive('/leave/apply') && styles.subItemTextActive]}>
                        Apply Leave
                      </Text>
                    </TouchableOpacity>

                    <TouchableOpacity
                      style={[styles.subItem, isCurrentActive('/leave/balances') && styles.subItemActive]}
                      onPress={() => handleNavigate('/leave/balances')}
                    >
                      <View style={styles.subDot} />
                      <Text style={[styles.subItemText, isCurrentActive('/leave/balances') && styles.subItemTextActive]}>
                        My Balance Quota
                      </Text>
                    </TouchableOpacity>

                    <TouchableOpacity
                      style={[styles.subItem, isCurrentActive('/leave/history') && styles.subItemActive]}
                      onPress={() => handleNavigate('/leave/history')}
                    >
                      <View style={styles.subDot} />
                      <Text style={[styles.subItemText, isCurrentActive('/leave/history') && styles.subItemTextActive]}>
                        Leave History
                      </Text>
                    </TouchableOpacity>

                    <TouchableOpacity
                      style={[styles.subItem, isCurrentActive('/leave/calendar') && styles.subItemActive]}
                      onPress={() => handleNavigate('/leave/calendar')}
                    >
                      <View style={styles.subDot} />
                      <Text style={[styles.subItemText, isCurrentActive('/leave/calendar') && styles.subItemTextActive]}>
                        Leave Calendar
                      </Text>
                    </TouchableOpacity>
                  </View>
                )}
              </View>

              {/* 8. My Overtime (Accordion) */}
              <View style={styles.accordionContainer}>
                <TouchableOpacity
                  style={styles.accordionHeader}
                  onPress={() => toggleGroup('overtime')}
                  activeOpacity={0.7}
                >
                  <View style={styles.accordionLeft}>
                    <Timer size={19} color="#94A3B8" />
                    <Text style={styles.navItemText}>My Overtime</Text>
                  </View>
                  {expandedGroups.overtime ? (
                    <ChevronDown size={17} color="#64748B" />
                  ) : (
                    <ChevronRight size={17} color="#64748B" />
                  )}
                </TouchableOpacity>

                {expandedGroups.overtime && (
                  <View style={styles.subItemsContainer}>
                    <TouchableOpacity
                      style={[styles.subItem, isCurrentActive('/overtime/apply') && styles.subItemActive]}
                      onPress={() => handleNavigate('/overtime/apply')}
                    >
                      <View style={styles.subDot} />
                      <Text style={[styles.subItemText, isCurrentActive('/overtime/apply') && styles.subItemTextActive]}>
                        Claim Overtime
                      </Text>
                    </TouchableOpacity>

                    <TouchableOpacity
                      style={[styles.subItem, isCurrentActive('/overtime/records') && styles.subItemActive]}
                      onPress={() => handleNavigate('/overtime/records')}
                    >
                      <View style={styles.subDot} />
                      <Text style={[styles.subItemText, isCurrentActive('/overtime/records') && styles.subItemTextActive]}>
                        My Overtime Records
                      </Text>
                    </TouchableOpacity>
                  </View>
                )}
              </View>

              {/* 9. My Payslips */}
              <TouchableOpacity
                style={[styles.navItem, isCurrentActive('/(tabs)/payroll') && styles.navItemActive]}
                onPress={() => handleNavigate('/(tabs)/payroll')}
              >
                <FileText size={19} color={isCurrentActive('/(tabs)/payroll') ? '#6366F1' : '#94A3B8'} />
                <Text style={[styles.navItemText, isCurrentActive('/(tabs)/payroll') && styles.navItemTextActive]}>
                  My Payslips
                </Text>
              </TouchableOpacity>

              {/* 10. My Shift */}
              <TouchableOpacity
                style={[styles.navItem, isCurrentActive('/my-shift') && styles.navItemActive]}
                onPress={() => handleNavigate('/my-shift')}
              >
                <Clock size={19} color={isCurrentActive('/my-shift') ? '#6366F1' : '#94A3B8'} />
                <Text style={[styles.navItemText, isCurrentActive('/my-shift') && styles.navItemTextActive]}>
                  My Shift
                </Text>
              </TouchableOpacity>

              {/* 11. My Card */}
              <TouchableOpacity
                style={[styles.navItem, isCurrentActive('/my-card') && styles.navItemActive]}
                onPress={() => handleNavigate('/my-card')}
              >
                <CreditCard size={19} color={isCurrentActive('/my-card') ? '#6366F1' : '#94A3B8'} />
                <Text style={[styles.navItemText, isCurrentActive('/my-card') && styles.navItemTextActive]}>
                  My Digital Card
                </Text>
              </TouchableOpacity>

              {/* 12. Documents */}
              <TouchableOpacity
                style={[styles.navItem, isCurrentActive('/documents') && styles.navItemActive]}
                onPress={() => handleNavigate('/documents')}
              >
                <Folder size={19} color={isCurrentActive('/documents') ? '#6366F1' : '#94A3B8'} />
                <Text style={[styles.navItemText, isCurrentActive('/documents') && styles.navItemTextActive]}>
                  Documents
                </Text>
              </TouchableOpacity>

              {/* 13. Notifications */}
              <TouchableOpacity
                style={[styles.navItem, isCurrentActive('/notifications') && styles.navItemActive]}
                onPress={() => handleNavigate('/notifications')}
              >
                <View style={{ flexDirection: 'row', alignItems: 'center', gap: 12 }}>
                  <Bell size={19} color={isCurrentActive('/notifications') ? '#6366F1' : '#94A3B8'} />
                  <Text style={[styles.navItemText, isCurrentActive('/notifications') && styles.navItemTextActive]}>
                    Notifications
                  </Text>
                </View>
                {unreadCount > 0 ? (
                  <View style={styles.badgePill}>
                    <Text style={styles.badgePillText}>{unreadCount > 99 ? '99+' : unreadCount}</Text>
                  </View>
                ) : null}
              </TouchableOpacity>

              {/* 14. My Profile */}
              <TouchableOpacity
                style={[styles.navItem, isCurrentActive('/(tabs)/profile') && styles.navItemActive]}
                onPress={() => handleNavigate('/(tabs)/profile')}
              >
                <User size={19} color={isCurrentActive('/(tabs)/profile') ? '#6366F1' : '#94A3B8'} />
                <Text style={[styles.navItemText, isCurrentActive('/(tabs)/profile') && styles.navItemTextActive]}>
                  My Profile
                </Text>
              </TouchableOpacity>
            </ScrollView>

            {/* Bottom Employee Card & Sign Out */}
            <View style={styles.bottomCard}>
              <View style={styles.userInfoRow}>
                <View style={styles.avatarCircle}>
                  <Text style={styles.avatarText}>
                    {user?.name ? user.name.charAt(0).toUpperCase() : 'U'}
                  </Text>
                </View>
                <View style={styles.userTextCol}>
                  <Text style={styles.userName} numberOfLines={1}>
                    {user?.name || 'Employee'}
                  </Text>
                  <Text style={styles.userRole} numberOfLines={1}>
                    {user?.role || user?.designation || 'Staff'}
                  </Text>
                </View>
              </View>

              <TouchableOpacity
                style={styles.logoutButton}
                onPress={async () => {
                  closeDrawer();
                  await logout();
                }}
              >
                <LogOut size={16} color="#EF4444" />
                <Text style={styles.logoutText}>Sign Out</Text>
              </TouchableOpacity>
            </View>
          </SafeAreaView>
        </View>
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    backgroundColor: 'transparent',
  },
  backdrop: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: 'rgba(15, 23, 42, 0.65)',
    zIndex: 1,
  },
  drawerContainer: {
    position: 'absolute',
    top: 0,
    left: 0,
    bottom: 0,
    width: DRAWER_WIDTH,
    backgroundColor: '#0F172A',
    zIndex: 10,
    elevation: 16,
    shadowColor: '#000',
    shadowOffset: { width: 4, height: 0 },
    shadowOpacity: 0.3,
    shadowRadius: 16,
  },
  drawerInner: {
    flex: 1,
    justifyContent: 'space-between',
  },
  brandHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 20,
    paddingVertical: 18,
    borderBottomWidth: 1,
    borderBottomColor: '#1E293B',
  },
  brandLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  logoBadge: {
    width: 38,
    height: 38,
    borderRadius: 12,
    backgroundColor: '#6366F1',
    alignItems: 'center',
    justifyContent: 'center',
  },
  logoText: {
    color: '#FFFFFF',
    fontWeight: '900',
    fontSize: 18,
  },
  brandTitle: {
    color: '#FFFFFF',
    fontSize: 15,
    fontWeight: '700',
  },
  brandSubtitle: {
    color: '#64748B',
    fontSize: 11,
    fontWeight: '500',
  },
  closeBtn: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: '#1E293B',
    alignItems: 'center',
    justifyContent: 'center',
  },
  menuScroll: {
    flex: 1,
  },
  menuContent: {
    paddingHorizontal: 12,
    paddingVertical: 14,
    gap: 3,
  },
  menuSectionHeader: {
    color: '#475569',
    fontSize: 10,
    fontWeight: '800',
    letterSpacing: 0.8,
    marginHorizontal: 8,
    marginTop: 6,
    marginBottom: 8,
  },
  navItem: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 12,
    paddingVertical: 11,
    borderRadius: 10,
    gap: 12,
  },
  navItemActive: {
    backgroundColor: '#1E1B4B',
  },
  navItemText: {
    flex: 1,
    color: '#94A3B8',
    fontSize: 13.5,
    fontWeight: '600',
  },
  navItemTextActive: {
    color: '#FFFFFF',
    fontWeight: '700',
  },
  accordionContainer: {
    marginBottom: 2,
  },
  accordionHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 12,
    paddingVertical: 11,
    borderRadius: 10,
  },
  accordionLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  subItemsContainer: {
    paddingLeft: 36,
    paddingVertical: 4,
    gap: 2,
  },
  subItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    paddingVertical: 8,
    paddingHorizontal: 8,
    borderRadius: 8,
  },
  subItemActive: {
    backgroundColor: '#1E1B4B',
  },
  subDot: {
    width: 5,
    height: 5,
    borderRadius: 2.5,
    backgroundColor: '#475569',
  },
  subItemText: {
    color: '#94A3B8',
    fontSize: 12.5,
    fontWeight: '500',
  },
  subItemTextActive: {
    color: '#818CF8',
    fontWeight: '700',
  },
  badgePill: {
    backgroundColor: '#EF4444',
    paddingHorizontal: 7,
    paddingVertical: 1.5,
    borderRadius: 10,
  },
  badgePillText: {
    color: '#FFFFFF',
    fontSize: 10,
    fontWeight: '800',
  },
  bottomCard: {
    padding: 16,
    backgroundColor: '#1E293B',
    borderTopWidth: 1,
    borderTopColor: '#334155',
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  userInfoRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    flex: 1,
  },
  avatarCircle: {
    width: 38,
    height: 38,
    borderRadius: 19,
    backgroundColor: '#4F46E5',
    alignItems: 'center',
    justifyContent: 'center',
  },
  avatarText: {
    color: '#FFFFFF',
    fontWeight: '800',
    fontSize: 15,
  },
  userTextCol: {
    flex: 1,
  },
  userName: {
    color: '#FFFFFF',
    fontSize: 13,
    fontWeight: '700',
  },
  userRole: {
    color: '#94A3B8',
    fontSize: 11,
    fontWeight: '500',
  },
  logoutButton: {
    padding: 8,
    borderRadius: 8,
    backgroundColor: 'rgba(239, 68, 68, 0.1)',
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  logoutText: {
    color: '#EF4444',
    fontSize: 11,
    fontWeight: '700',
  },
});
