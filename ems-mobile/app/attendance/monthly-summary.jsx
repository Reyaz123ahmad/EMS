import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  StatusBar,
  RefreshControl,
  ActivityIndicator,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useQuery } from '@tanstack/react-query';
import attendanceService from '../../services/attendance.service';
import {
  CheckCircle2,
  Clock,
  AlertCircle,
  TrendingUp,
  UserX,
  CalendarDays,
} from 'lucide-react-native';

export default function MonthlySummaryScreen() {
  const [refreshing, setRefreshing] = useState(false);

  const { data: summaryData, isLoading, refetch } = useQuery({
    queryKey: ['attendanceMonthlySummary'],
    queryFn: () => attendanceService.getSummary(),
  });

  const onRefresh = async () => {
    setRefreshing(true);
    await refetch();
    setRefreshing(false);
  };

  const summary = summaryData?.summary || summaryData?.data || summaryData || {};
  const hasData =
    summary &&
    (summary.presentDays !== undefined ||
      summary.totalWorkingDays !== undefined ||
      summary.attendanceRate !== undefined ||
      summary.absentDays !== undefined);

  return (
    <SafeAreaView style={styles.container}>
      <StatusBar barStyle="dark-content" backgroundColor="#F8FAFC" />
      <ScrollView
        contentContainerStyle={styles.scrollContent}
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} colors={['#4F46E5']} />}
      >
        {isLoading && !hasData ? (
          <View style={{ alignItems: 'center', padding: 40 }}>
            <ActivityIndicator size="small" color="#4F46E5" />
            <Text style={{ marginTop: 10, color: '#64748B', fontSize: 13 }}>Loading attendance summary...</Text>
          </View>
        ) : (
          <>
            {/* KPI Banner */}
            <View style={styles.kpiCard}>
              <Text style={styles.kpiTitle}>Monthly Attendance Performance</Text>
              <Text style={styles.kpiValue}>{summary.attendanceRate ?? 0}%</Text>
              <Text style={styles.kpiSub}>Compliance rate for current calendar month</Text>
            </View>

            {/* Breakdown Grid */}
            <View style={styles.grid}>
              {/* Present */}
              <View style={styles.card}>
                <View style={[styles.iconWrap, { backgroundColor: '#ECFDF5' }]}>
                  <CheckCircle2 size={18} color="#059669" />
                </View>
                <Text style={styles.cardLabel}>Present Days</Text>
                <Text style={[styles.cardVal, { color: '#059669' }]}>
                  {summary.presentDays ?? 0} / {summary.totalWorkingDays ?? 0}
                </Text>
                <Text style={styles.cardSub}>Recorded in shift</Text>
              </View>

              {/* Absent (REQUIRED) */}
              <View style={[styles.card, styles.cardAbsent]}>
                <View style={[styles.iconWrap, { backgroundColor: '#FEF2F2' }]}>
                  <UserX size={18} color="#DC2626" />
                </View>
                <Text style={styles.cardLabel}>Absent Days</Text>
                <Text style={[styles.cardVal, { color: '#DC2626' }]}>{summary.absentDays ?? 0}</Text>
                <Text style={styles.cardSub}>Days missed</Text>
              </View>

              {/* Late Arrivals */}
              <View style={styles.card}>
                <View style={[styles.iconWrap, { backgroundColor: '#FEF3C7' }]}>
                  <AlertCircle size={18} color="#D97706" />
                </View>
                <Text style={styles.cardLabel}>Late Arrivals</Text>
                <Text style={[styles.cardVal, { color: '#D97706' }]}>{summary.lateDays ?? 0}</Text>
                <Text style={styles.cardSub}>Past grace period</Text>
              </View>

              {/* Leave Days */}
              <View style={styles.card}>
                <View style={[styles.iconWrap, { backgroundColor: '#EFF6FF' }]}>
                  <CalendarDays size={18} color="#2563EB" />
                </View>
                <Text style={styles.cardLabel}>Leave Days</Text>
                <Text style={[styles.cardVal, { color: '#2563EB' }]}>
                  {summary.leaveDays ?? summary.onLeaveDays ?? 0}
                </Text>
                <Text style={styles.cardSub}>Approved leaves</Text>
              </View>

              {/* Avg Hours */}
              <View style={styles.card}>
                <View style={[styles.iconWrap, { backgroundColor: '#EEF2FF' }]}>
                  <Clock size={18} color="#4F46E5" />
                </View>
                <Text style={styles.cardLabel}>Avg Hours/Day</Text>
                <Text style={[styles.cardVal, { color: '#4F46E5' }]}>{summary.averageHours ?? 0}h</Text>
                <Text style={styles.cardSub}>Average punch time</Text>
              </View>

              {/* Overtime */}
              <View style={styles.card}>
                <View style={[styles.iconWrap, { backgroundColor: '#FAF5FF' }]}>
                  <TrendingUp size={18} color="#7C3AED" />
                </View>
                <Text style={styles.cardLabel}>Overtime Hours</Text>
                <Text style={[styles.cardVal, { color: '#7C3AED' }]}>{summary.overtimeHours ?? 0}h</Text>
                <Text style={styles.cardSub}>Extra hours worked</Text>
              </View>
            </View>
          </>
        )}
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#F8FAFC' },
  scrollContent: { padding: 22, paddingBottom: 44 },
  kpiCard: {
    backgroundColor: '#1E1B4B',
    borderRadius: 22,
    padding: 28,
    alignItems: 'center',
    marginBottom: 18,
    shadowColor: '#4F46E5',
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.35,
    shadowRadius: 16,
    elevation: 8,
  },
  kpiTitle: { fontSize: 13, color: '#A5B4FC', fontWeight: '800', textTransform: 'uppercase', letterSpacing: 0.8 },
  kpiValue: { fontSize: 48, fontWeight: '900', color: '#FFFFFF', marginVertical: 8 },
  kpiSub: { fontSize: 12, color: '#E0E7FF', fontWeight: '500' },
  grid: { flexDirection: 'row', flexWrap: 'wrap', gap: 14 },
  card: {
    width: '47%',
    backgroundColor: '#FFFFFF',
    borderRadius: 18,
    padding: 18,
    borderWidth: 1,
    borderColor: '#E2E8F0',
    gap: 3,
    shadowColor: '#000000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.02,
    shadowRadius: 4,
    elevation: 1,
  },
  cardAbsent: {
    borderColor: '#FEE2E2',
  },
  iconWrap: {
    width: 34,
    height: 34,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 6,
  },
  cardLabel: { fontSize: 11, color: '#64748B', fontWeight: '700', letterSpacing: 0.1 },
  cardVal: { fontSize: 20, fontWeight: '900', color: '#0F172A', marginTop: 2 },
  cardSub: { fontSize: 10.5, color: '#94A3B8', marginTop: 2, fontWeight: '500' },
});
