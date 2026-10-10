import React, { useState, useEffect, useCallback, useMemo } from 'react';
import {
  View,
  Text,
  Image,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  StatusBar,
  RefreshControl,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { LinearGradient } from 'expo-linear-gradient';
import { useAuth } from '../../hooks/useAuth';
import { useRouter } from 'expo-router';
import { useQuery } from '@tanstack/react-query';
import dashboardService from '../../services/dashboard.service';
import attendanceService from '../../services/attendance.service';
import { useLeaveBalances } from '../../hooks/useLeaveBalances';
import {
  User,
  Clock,
  Calendar,
  Wallet,
  Shield,
  Fingerprint,
  TrendingUp,
  Sparkles,
  Moon,
} from 'lucide-react-native';

// ─── Helpers ───────────────────────────────────────────────────────────────────

function getCurrentDate() {
  return new Date().toLocaleDateString('en-US', {
    weekday: 'long',
    month: 'long',
    day: 'numeric',
  });
}

function getDisplayRole(raw) {
  const map = {
    SUPER_ADMIN: 'Super Admin',
    COMPANY_ADMIN: 'Company Admin',
    HR_ADMIN: 'HR Admin',
    HR_MANAGER: 'HR Manager',
    MANAGER: 'Manager',
    EMPLOYEE: 'Employee',
    CLIENT: 'Client',
  };
  return map[(raw || '').toUpperCase()] || 'Member';
}

function formatTime(isoString) {
  if (!isoString) return '--:--';
  try {
    return new Date(isoString).toLocaleTimeString([], {
      hour: '2-digit',
      minute: '2-digit',
      hour12: true,
    });
  } catch {
    return '--:--';
  }
}

function formatWorked(minutes) {
  const m = Number(minutes) || 0;
  return `${Math.floor(m / 60)}h ${m % 60}m`;
}

// ─── Component ─────────────────────────────────────────────────────────────────

export default function HomeScreen() {
  const { user } = useAuth();
  const router = useRouter();
  const [refreshing, setRefreshing] = useState(false);
  const [nowTs, setNowTs] = useState(Date.now());

  // 60-second live update ticker
  useEffect(() => {
    const timer = setInterval(() => setNowTs(Date.now()), 60000);
    return () => clearInterval(timer);
  }, []);

  // ── Queries ────────────────────────────────────────────────────────────────
  const {
    data: dashData,
    isLoading: dashLoading,
    refetch: refetchDashboard,
  } = useQuery({
    queryKey: ['employeeDashboard'],
    queryFn: () => dashboardService.getEmployeeDashboard(),
  });

  const {
    data: todayStatus,
    isLoading: todayLoading,
    refetch: refetchToday,
  } = useQuery({
    queryKey: ['attendance', 'today'],
    queryFn: () => attendanceService.getTodayStatus(),
    staleTime: 15000,
    refetchInterval: 30000,
  });

  const { data: leaveBalancesData, refetch: refetchBalances } = useLeaveBalances();

  const onRefresh = useCallback(async () => {
    setRefreshing(true);
    await Promise.all([refetchDashboard(), refetchToday(), refetchBalances()]);
    setRefreshing(false);
  }, [refetchDashboard, refetchToday, refetchBalances]);

  // ── Derived values — all from API, never hardcoded ─────────────────────────
  const userName = user?.name || user?.email?.split('@')[0] || 'there';
  const displayRole = getDisplayRole(user?.role || user?.roles?.[0]);

  const isCheckedIn =
    todayStatus?.isCheckedIn ||
    todayStatus?.checkedIn ||
    dashData?.isCheckedIn ||
    false;

  const isCheckedOut =
    Boolean(todayStatus?.attendance?.checkOutAt) ||
    todayStatus?.checkedOut ||
    false;

  const isOnBreak = todayStatus?.isOnBreak || todayStatus?.onBreak || false;

  const attendanceState = todayStatus?.attendanceState || null;
  const isLate = (todayStatus?.lateMinutes || 0) > 0;

  // Shift data
  const shift =
    todayStatus?.currentShift ||
    todayStatus?.shift?.shift ||
    todayStatus?.shift ||
    dashData?.currentShift ||
    dashData?.shift ||
    null;

  const shiftName = shift?.name || null;
  const shiftTimings =
    shift?.startTime && shift?.endTime
      ? `${shift.startTime} - ${shift.endTime}`
      : '--:-- - --:--';

  const isNightShift =
    shiftName?.toLowerCase().includes('night') ||
    (shift?.startTime && parseInt(shift.startTime.split(':')[0], 10) >= 18);

  // Attendance log & Live Worked Time
  const log = todayStatus?.attendance || todayStatus?.log || null;
  const checkInIso = log?.checkInAt || todayStatus?.checkInAt || todayStatus?.checkIn || dashData?.checkInTime;
  const checkOutIso = log?.checkOutAt || todayStatus?.checkOutAt || todayStatus?.checkOut || dashData?.checkOutTime;
  const checkInTime = formatTime(checkInIso);

  const workedMinutes = useMemo(() => {
    if (log?.totalWorkedMinutes) return log.totalWorkedMinutes;
    if (checkInIso) {
      const startMs = new Date(checkInIso).getTime();
      if (!isNaN(startMs)) {
        const endMs = checkOutIso ? new Date(checkOutIso).getTime() : nowTs;
        if (!isNaN(endMs) && endMs >= startMs) {
          return Math.floor((endMs - startMs) / 60000);
        }
      }
    }
    return dashData?.workMinutesToday || 0;
  }, [log?.totalWorkedMinutes, checkInIso, checkOutIso, dashData?.workMinutesToday, nowTs]);

  const workedStr = formatWorked(workedMinutes);

  // Status label & dot color
  let statusLabel = 'Not Checked In';
  let statusDotColor = '#EF4444';
  let statusPillLabel = null;
  let statusPillColor = '#6B7280';

  if (isOnBreak) {
    statusLabel = 'On Break';
    statusDotColor = '#F59E0B';
  } else if (isCheckedIn) {
    statusLabel = 'Checked In';
    statusDotColor = '#10B981';
    statusPillLabel = isLate ? 'Late' : 'On Time';
    statusPillColor = isLate ? '#EF4444' : '#10B981';
  } else if (isCheckedOut) {
    statusLabel = 'Checked Out';
    statusDotColor = '#64748B';
  } else if (attendanceState === 'HOLIDAY') {
    statusLabel = 'Holiday';
    statusDotColor = '#F59E0B';
  } else if (attendanceState === 'WEEKLY_OFF') {
    statusLabel = 'Weekly Off';
    statusDotColor = '#A855F7';
  } else if (attendanceState === 'ON_LEAVE') {
    statusLabel = 'On Leave';
    statusDotColor = '#3B82F6';
  }

  // Clock button label
  const clockBtnLabel = isCheckedIn
    ? 'Clock Out Now →'
    : 'Clock In Now (Face Verification) →';

  // KPI stats
  const monthlyPresent = dashData?.monthlyAttendanceCount ?? null;

  const balancesList =
    leaveBalancesData?.balances ||
    leaveBalancesData?.data?.balances ||
    leaveBalancesData?.data ||
    (Array.isArray(leaveBalancesData) ? leaveBalancesData : []);

  const totalLeave =
    balancesList.length > 0
      ? balancesList.reduce((s, b) => s + Number(b.remainingDays || 0), 0)
      : dashData?.totalLeaveRemaining ?? null;

  // Upcoming holidays
  const upcomingHolidays = dashData?.upcomingHolidays || [];

  const isAnyLoading = dashLoading || todayLoading;

  // ── Render ────────────────────────────────────────────────────────────────
  return (
    <SafeAreaView edges={['left', 'right']} style={styles.container}>
      <StatusBar barStyle="dark-content" backgroundColor="#F0F2FF" />

      <ScrollView
        contentContainerStyle={styles.scroll}
        showsVerticalScrollIndicator={false}
        refreshControl={
          <RefreshControl
            refreshing={refreshing}
            onRefresh={onRefresh}
            colors={['#4F46E5']}
            tintColor="#4F46E5"
          />
        }
      >
        {/* ── Greeting Section ─────────────────────────────────────────── */}
        <View style={styles.greetingRow}>
          <View style={styles.greetingLeft}>
            <Text style={styles.greetingLabel}>{getCurrentDate()}</Text>
            <Text style={styles.greetingName}>
              {isAnyLoading && !userName ? '...' : userName}
            </Text>
            <Text style={styles.greetingTagline}>
              Keep going! Great things take consistency.
            </Text>

            {/* Role badge */}
            <View style={styles.roleBadge}>
              <User size={12} color="#4F46E5" />
              <Text style={styles.roleText}>{displayRole}</Text>
            </View>
          </View>

          {/* Avatar circle — shows real photo if available, falls back to icon */}
          <View style={styles.avatarCircle}>
            {user?.photoUrl ? (
              <Image
                source={{ uri: user.photoUrl }}
                style={styles.avatarImage}
                onError={() => {}}
              />
            ) : (
              <User size={28} color="#4F46E5" />
            )}
          </View>
        </View>

        {/* ── Shift Card (dark gradient) ───────────────────────────────── */}
        <LinearGradient
          colors={['#1e1b4b', '#4c1d95', '#312e81']}
          start={{ x: 0, y: 0 }}
          end={{ x: 1, y: 1 }}
          style={styles.shiftCard}
        >
          {/* Row 1: Status + Pills */}
          <View style={styles.shiftRow1}>
            <View style={styles.statusLeft}>
              <View style={[styles.statusDot, { backgroundColor: statusDotColor }]} />
              <Text style={styles.statusText}>{statusLabel}</Text>
            </View>
            <View style={styles.shiftPills}>
              {statusPillLabel && (
                <View style={[styles.pill, { backgroundColor: statusPillColor + '33', borderColor: statusPillColor + '66' }]}>
                  <Text style={[styles.pillText, { color: statusPillColor }]}>
                    {statusPillLabel}
                  </Text>
                </View>
              )}
              {shiftName && (
                <View style={styles.shiftTypePill}>
                  {isNightShift ? (
                    <Moon size={11} color="#C4B5FD" />
                  ) : (
                    <Sparkles size={11} color="#FCD34D" />
                  )}
                  <Text style={styles.shiftTypePillText}>{shiftName}</Text>
                </View>
              )}
            </View>
          </View>

          {/* Row 2: Three data columns */}
          <View style={styles.shiftDataRow}>
            <View style={styles.shiftDataCol}>
              <View style={styles.shiftDataLabelRow}>
                <Clock size={11} color="#A5B4FC" />
                <Text style={styles.shiftDataLabel}>Shift Schedule</Text>
              </View>
              <Text style={styles.shiftDataValue}>{shiftTimings}</Text>
            </View>

            <View style={styles.shiftDataDivider} />

            <View style={styles.shiftDataCol}>
              <Text style={styles.shiftDataLabel}>Check In Time</Text>
              <Text style={styles.shiftDataValue}>{checkInTime}</Text>
            </View>

            <View style={styles.shiftDataDivider} />

            <View style={styles.shiftDataCol}>
              <Text style={styles.shiftDataLabel}>Hours Worked</Text>
              <Text style={[styles.shiftDataValue, { color: '#A5B4FC' }]}>
                {isAnyLoading && !log ? '--' : workedStr}
              </Text>
            </View>
          </View>

          {/* Row 3: Clock In/Out button */}
          <LinearGradient
            colors={['#6366F1', '#4F46E5']}
            start={{ x: 0, y: 0 }}
            end={{ x: 1, y: 0 }}
            style={styles.clockBtnGradient}
          >
            <TouchableOpacity
              style={styles.clockBtn}
              onPress={() => router.push('/attendance')}
              activeOpacity={0.85}
            >
              <Fingerprint size={18} color="#FFFFFF" />
              <Text style={styles.clockBtnText}>{clockBtnLabel}</Text>
            </TouchableOpacity>
          </LinearGradient>
        </LinearGradient>

        {/* ── Stats Row ────────────────────────────────────────────────── */}
        <View style={styles.statsRow}>
          {/* Today's Work */}
          <View style={styles.statCard}>
            <View style={[styles.statIconCircle, { backgroundColor: '#EEF2FF' }]}>
              <Clock size={20} color="#4F46E5" />
            </View>
            <Text style={[styles.statValue, { color: '#0F172A' }]}>
              {isAnyLoading ? '--' : workedStr}
            </Text>
            <Text style={styles.statLabel}>Today's Work</Text>
          </View>

          {/* Month Present */}
          <View style={styles.statCard}>
            <View style={[styles.statIconCircle, { backgroundColor: '#ECFDF5' }]}>
              <TrendingUp size={20} color="#059669" />
            </View>
            <Text style={[styles.statValue, { color: '#059669' }]}>
              {dashLoading ? '--' : monthlyPresent !== null ? `${monthlyPresent}d` : '—'}
            </Text>
            <Text style={styles.statLabel}>Month Present</Text>
          </View>

          {/* Leave Balance */}
          <View style={styles.statCard}>
            <View style={[styles.statIconCircle, { backgroundColor: '#FEF3C7' }]}>
              <Calendar size={20} color="#D97706" />
            </View>
            <Text style={[styles.statValue, { color: '#D97706' }]}>
              {totalLeave !== null ? `${totalLeave}d` : '—'}
            </Text>
            <Text style={styles.statLabel}>Leave Balance</Text>
          </View>
        </View>

        {/* ── Quick Actions ─────────────────────────────────────────────── */}
        <View style={styles.sectionHeader}>
          <Text style={styles.sectionTitle}>Quick Actions</Text>
          <TouchableOpacity onPress={() => router.push('/attendance')} activeOpacity={0.7}>
            <Text style={styles.viewAllLink}>View All →</Text>
          </TouchableOpacity>
        </View>

        <View style={styles.quickGrid}>
          {/* 1. Attendance Logs */}
          <TouchableOpacity
            style={styles.qaCard}
            onPress={() => router.push('/attendance')}
            activeOpacity={0.75}
          >
            <View style={[styles.qaIconCircle, { backgroundColor: '#EDE9FE' }]}>
              <Clock size={22} color="#7C3AED" />
            </View>
            <Text style={styles.qaLabel}>Attendance{'\n'}Logs</Text>
          </TouchableOpacity>

          {/* 2. Apply Leaves */}
          <TouchableOpacity
            style={styles.qaCard}
            onPress={() => router.push('/leave')}
            activeOpacity={0.75}
          >
            <View style={[styles.qaIconCircle, { backgroundColor: '#DCFCE7' }]}>
              <Calendar size={22} color="#16A34A" />
            </View>
            <Text style={styles.qaLabel}>Apply{'\n'}Leaves</Text>
          </TouchableOpacity>

          {/* 3. My Payslips */}
          <TouchableOpacity
            style={styles.qaCard}
            onPress={() => router.push('/payroll')}
            activeOpacity={0.75}
          >
            <View style={[styles.qaIconCircle, { backgroundColor: '#FCE7F3' }]}>
              <Wallet size={22} color="#DB2777" />
            </View>
            <Text style={styles.qaLabel}>My{'\n'}Payslips</Text>
          </TouchableOpacity>

          {/* 4. Security */}
          <TouchableOpacity
            style={styles.qaCard}
            onPress={() => router.push('/(tabs)/profile')}
            activeOpacity={0.75}
          >
            <View style={[styles.qaIconCircle, { backgroundColor: '#DBEAFE' }]}>
              <Shield size={22} color="#2563EB" />
            </View>
            <Text style={styles.qaLabel}>Security</Text>
          </TouchableOpacity>

          {/* 5. Profile */}
          <TouchableOpacity
            style={styles.qaCard}
            onPress={() => router.push('/(tabs)/profile')}
            activeOpacity={0.75}
          >
            <View style={[styles.qaIconCircle, { backgroundColor: '#EEF2FF' }]}>
              <User size={22} color="#4F46E5" />
            </View>
            <Text style={styles.qaLabel}>Profile</Text>
          </TouchableOpacity>
        </View>

        {/* ── Upcoming Holidays ─────────────────────────────────────────── */}
        {upcomingHolidays.length > 0 && (
          <View style={styles.holidayCard}>
            <Text style={styles.holidayTitle}>Upcoming Holidays</Text>
            {upcomingHolidays.slice(0, 3).map((h) => (
              <View key={h.id} style={styles.holidayRow}>
                <View style={styles.holidayLeft}>
                  <Sparkles size={14} color="#D97706" />
                  <Text style={styles.holidayName}>{h.name}</Text>
                </View>
                <Text style={styles.holidayDate}>
                  {new Date(h.date).toLocaleDateString('en-US', {
                    month: 'short',
                    day: 'numeric',
                  })}
                </Text>
              </View>
            ))}
          </View>
        )}

        <View style={{ height: 24 }} />
      </ScrollView>
    </SafeAreaView>
  );
}

// ─── Styles ────────────────────────────────────────────────────────────────────

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F0F2FF',
  },


  // Scroll content
  scroll: {
    paddingBottom: 24,
  },

  // Greeting
  greetingRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 20,
    paddingTop: 20,
    paddingBottom: 16,
  },
  greetingLeft: {
    flex: 1,
  },
  greetingLabel: {
    fontSize: 13,
    color: '#64748B',
    fontWeight: '500',
    marginBottom: 2,
  },
  greetingName: {
    fontSize: 26,
    fontWeight: '800',
    color: '#0F172A',
    letterSpacing: -0.5,
    marginBottom: 6,
  },
  greetingTagline: {
    fontSize: 12,
    color: '#64748B',
    fontWeight: '400',
    marginBottom: 12,
    lineHeight: 17,
  },
  roleBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 5,
    alignSelf: 'flex-start',
    backgroundColor: '#EEF2FF',
    paddingHorizontal: 12,
    paddingVertical: 5,
    borderRadius: 20,
  },
  roleText: {
    fontSize: 11,
    fontWeight: '700',
    color: '#4F46E5',
  },
  avatarCircle: {
    width: 52,
    height: 52,
    borderRadius: 26,
    backgroundColor: '#EEF2FF',
    alignItems: 'center',
    justifyContent: 'center',
    marginLeft: 12,
    borderWidth: 2,
    borderColor: '#C7D2FE',
    overflow: 'hidden',
  },
  avatarImage: {
    width: 52,
    height: 52,
    borderRadius: 26,
  },

  // Shift Card
  shiftCard: {
    marginHorizontal: 16,
    borderRadius: 20,
    padding: 18,
    marginBottom: 16,
    shadowColor: '#4F46E5',
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.3,
    shadowRadius: 16,
    elevation: 10,
  },
  shiftRow1: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 18,
  },
  statusLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 7,
  },
  statusDot: {
    width: 9,
    height: 9,
    borderRadius: 5,
  },
  statusText: {
    fontSize: 13,
    fontWeight: '700',
    color: '#FFFFFF',
    letterSpacing: 0.3,
  },
  shiftPills: {
    flexDirection: 'row',
    gap: 6,
    alignItems: 'center',
  },
  pill: {
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 8,
    borderWidth: 1,
  },
  pillText: {
    fontSize: 10,
    fontWeight: '700',
  },
  shiftTypePill: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    backgroundColor: 'rgba(255,255,255,0.12)',
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 10,
  },
  shiftTypePillText: {
    fontSize: 11,
    color: '#E0E7FF',
    fontWeight: '600',
  },

  // Shift data columns
  shiftDataRow: {
    flexDirection: 'row',
    backgroundColor: 'rgba(255,255,255,0.08)',
    borderRadius: 14,
    padding: 14,
    marginBottom: 16,
    alignItems: 'center',
  },
  shiftDataCol: {
    flex: 1,
    alignItems: 'center',
  },
  shiftDataDivider: {
    width: 1,
    height: 32,
    backgroundColor: 'rgba(255,255,255,0.15)',
  },
  shiftDataLabelRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 3,
    marginBottom: 4,
  },
  shiftDataLabel: {
    fontSize: 9,
    color: '#A5B4FC',
    fontWeight: '600',
    letterSpacing: 0.3,
    textTransform: 'uppercase',
    textAlign: 'center',
  },
  shiftDataValue: {
    fontSize: 13,
    fontWeight: '800',
    color: '#FFFFFF',
    textAlign: 'center',
  },

  // Clock button
  clockBtnGradient: {
    borderRadius: 14,
    overflow: 'hidden',
  },
  clockBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 10,
    paddingVertical: 14,
  },
  clockBtnText: {
    fontSize: 14,
    fontWeight: '800',
    color: '#FFFFFF',
    letterSpacing: 0.2,
  },

  // Stats Row
  statsRow: {
    flexDirection: 'row',
    gap: 10,
    marginHorizontal: 16,
    marginBottom: 20,
  },
  statCard: {
    flex: 1,
    backgroundColor: '#FFFFFF',
    borderRadius: 16,
    padding: 14,
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.04,
    shadowRadius: 6,
    elevation: 2,
  },
  statIconCircle: {
    width: 40,
    height: 40,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 8,
  },
  statValue: {
    fontSize: 16,
    fontWeight: '800',
    letterSpacing: -0.3,
    marginBottom: 2,
  },
  statLabel: {
    fontSize: 10,
    color: '#64748B',
    fontWeight: '500',
    textAlign: 'center',
  },

  // Quick Actions
  sectionHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginHorizontal: 16,
    marginBottom: 12,
  },
  sectionTitle: {
    fontSize: 15,
    fontWeight: '800',
    color: '#0F172A',
  },
  viewAllLink: {
    fontSize: 12,
    fontWeight: '600',
    color: '#4F46E5',
  },
  quickGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 10,
    marginHorizontal: 16,
    marginBottom: 20,
  },
  qaCard: {
    width: '30%',
    backgroundColor: '#FFFFFF',
    borderRadius: 16,
    paddingVertical: 16,
    paddingHorizontal: 8,
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.04,
    shadowRadius: 6,
    elevation: 2,
  },
  qaIconCircle: {
    width: 48,
    height: 48,
    borderRadius: 24,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 8,
  },
  qaLabel: {
    fontSize: 11,
    fontWeight: '600',
    color: '#334155',
    textAlign: 'center',
    lineHeight: 15,
  },

  // Holidays
  holidayCard: {
    backgroundColor: '#FFFBEB',
    borderWidth: 1,
    borderColor: '#FDE68A',
    borderRadius: 18,
    padding: 18,
    marginHorizontal: 16,
    marginBottom: 8,
  },
  holidayTitle: {
    fontSize: 14,
    fontWeight: '800',
    color: '#92400E',
    marginBottom: 12,
  },
  holidayRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 8,
    borderBottomWidth: 1,
    borderBottomColor: '#FEF3C7',
  },
  holidayLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  holidayName: {
    fontSize: 13,
    color: '#78350F',
    fontWeight: '700',
  },
  holidayDate: {
    fontSize: 12,
    color: '#B45309',
    fontWeight: '700',
  },
});
