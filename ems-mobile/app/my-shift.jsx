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
import shiftService from '../services/shift.service';
import { Clock, Calendar, Sparkles, Tag, ShieldCheck, Sun, Moon, AlertCircle } from 'lucide-react-native';

function calculateWorkingHours(startTime, endTime) {
  if (!startTime || !endTime) return null;
  const [sh, sm] = startTime.split(':').map(Number);
  const [eh, em] = endTime.split(':').map(Number);
  if (isNaN(sh) || isNaN(sm) || isNaN(eh) || isNaN(em)) return null;

  let startMin = sh * 60 + sm;
  let endMin = eh * 60 + em;
  if (endMin <= startMin) endMin += 24 * 60; // overnight shift

  const totalMin = endMin - startMin;
  const hours = totalMin / 60;
  return Number.isInteger(hours) ? `${hours}` : hours.toFixed(1);
}

export default function MyShiftScreen() {
  const [refreshing, setRefreshing] = useState(false);

  const { data, isLoading, refetch } = useQuery({
    queryKey: ['myShiftDetails'],
    queryFn: () => shiftService.getMyShift(),
  });

  const onRefresh = async () => {
    setRefreshing(true);
    await refetch();
    setRefreshing(false);
  };

  const shift = data?.shift || data?.currentShift || data || {};
  const hasShift = Boolean(shift?.startTime || shift?.name);
  const isNight = Boolean(
    shift?.isNightShift ||
      (shift?.startTime && shift?.endTime && shift.endTime <= shift.startTime)
  );

  const calculatedHours = calculateWorkingHours(shift?.startTime, shift?.endTime);
  const workingHoursDisplay =
    shift?.workingHours ||
    shift?.requiredHours ||
    calculatedHours ||
    '--';

  return (
    <SafeAreaView style={styles.container}>
      <StatusBar barStyle="dark-content" backgroundColor="#F8FAFC" />
      <ScrollView
        contentContainerStyle={styles.scrollContent}
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} colors={['#4F46E5']} />}
      >
        {isLoading ? (
          <View style={styles.loadingBox}>
            <ActivityIndicator size="small" color="#4F46E5" />
            <Text style={styles.loadingText}>Loading shift roster...</Text>
          </View>
        ) : !hasShift ? (
          <View style={styles.emptyCard}>
            <AlertCircle size={36} color="#94A3B8" />
            <Text style={styles.emptyTitle}>No Shift Assigned</Text>
            <Text style={styles.emptySub}>
              You do not have an active shift roster assigned for today. Please contact HR.
            </Text>
          </View>
        ) : (
          <>
            {/* Shift Overview Card */}
            <View style={styles.heroCard}>
              <View style={styles.heroTop}>
                {isNight ? (
                  <View style={[styles.iconCircle, { backgroundColor: '#312E81' }]}>
                    <Moon size={24} color="#A5B4FC" />
                  </View>
                ) : (
                  <View style={[styles.iconCircle, { backgroundColor: '#FEF3C7' }]}>
                    <Sun size={24} color="#D97706" />
                  </View>
                )}
                <View style={styles.badgeRow}>
                  <View style={styles.statusBadge}>
                    <Text style={styles.statusBadgeText}>ACTIVE ROSTER</Text>
                  </View>
                </View>
              </View>

              <Text style={styles.shiftTitle}>{shift?.name || 'Assigned Shift'}</Text>
              <Text style={styles.shiftTimings}>
                {shift?.startTime || '--:--'} — {shift?.endTime || '--:--'}
              </Text>
              <Text style={styles.shiftSub}>
                {isNight ? 'Night Working Shift Schedule' : 'Standard Working Schedule'}
              </Text>
            </View>

            {/* Shift Parameters Grid */}
            <View style={styles.grid}>
              <View style={styles.paramCard}>
                <Clock size={18} color="#4F46E5" />
                <Text style={styles.paramLabel}>Grace Period</Text>
                <Text style={styles.paramValue}>{shift?.graceMinutes ?? 15} Minutes</Text>
              </View>

              <View style={styles.paramCard}>
                <Calendar size={18} color="#059669" />
                <Text style={styles.paramLabel}>Working Hours</Text>
                <Text style={styles.paramValue}>{workingHoursDisplay} Hours/Day</Text>
              </View>

              <View style={styles.paramCard}>
                <Tag size={18} color="#D97706" />
                <Text style={styles.paramLabel}>Shift Code</Text>
                <Text style={styles.paramValue}>{shift?.code || shift?.shiftCode || 'N/A'}</Text>
              </View>

              <View style={styles.paramCard}>
                <ShieldCheck size={18} color="#7C3AED" />
                <Text style={styles.paramLabel}>Overtime Rule</Text>
                <Text style={styles.paramValue}>{shift?.allowOvertime ? 'Eligible' : 'Standard'}</Text>
              </View>
            </View>

            {/* Guidelines Card */}
            <View style={styles.guidelinesCard}>
              <Text style={styles.guidelinesTitle}>Attendance Guidelines</Text>
              <Text style={styles.guidelineItem}>• Clock-in window unlocks 5 minutes before scheduled start time ({shift?.startTime || '--:--'}).</Text>
              <Text style={styles.guidelineItem}>• Arriving after the {shift?.graceMinutes ?? 15}-minute grace window marks a Late Arrival.</Text>
              <Text style={styles.guidelineItem}>• Expected checkout time is upon completing {workingHoursDisplay} hours at {shift?.endTime || '--:--'}.</Text>
            </View>
          </>
        )}
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F8FAFC',
  },
  scrollContent: {
    padding: 22,
    paddingBottom: 44,
  },
  loadingBox: {
    flex: 1,
    padding: 44,
    alignItems: 'center',
    justifyContent: 'center',
    gap: 12,
    minHeight: 200,
  },
  loadingText: {
    color: '#64748B',
    fontSize: 14,
    fontWeight: '600',
  },
  emptyCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 22,
    padding: 36,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#E2E8F0',
    shadowColor: '#000000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.03,
    shadowRadius: 6,
    elevation: 1,
  },
  emptyTitle: {
    fontSize: 17,
    fontWeight: '800',
    color: '#0F172A',
    marginTop: 14,
    marginBottom: 6,
    letterSpacing: -0.1,
  },
  emptySub: {
    fontSize: 13,
    color: '#64748B',
    textAlign: 'center',
    lineHeight: 20,
    fontWeight: '500',
  },
  heroCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 22,
    padding: 26,
    borderWidth: 1,
    borderColor: '#E2E8F0',
    marginBottom: 18,
    shadowColor: '#000000',
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.06,
    shadowRadius: 14,
    elevation: 4,
  },
  heroTop: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 18,
  },
  iconCircle: {
    width: 52,
    height: 52,
    borderRadius: 26,
    alignItems: 'center',
    justifyContent: 'center',
  },
  badgeRow: {
    flexDirection: 'row',
  },
  statusBadge: {
    backgroundColor: '#ECFDF5',
    paddingHorizontal: 12,
    paddingVertical: 5,
    borderRadius: 14,
    borderWidth: 1,
    borderColor: '#A7F3D0',
  },
  statusBadgeText: {
    color: '#059669',
    fontSize: 10,
    fontWeight: '800',
    letterSpacing: 0.5,
  },
  shiftTitle: {
    fontSize: 24,
    fontWeight: '800',
    color: '#0F172A',
    marginBottom: 6,
    letterSpacing: -0.3,
  },
  shiftTimings: {
    fontSize: 20,
    fontWeight: '800',
    color: '#4F46E5',
    marginBottom: 8,
    letterSpacing: -0.2,
  },
  shiftSub: {
    fontSize: 13,
    color: '#64748B',
    fontWeight: '600',
    lineHeight: 20,
  },
  grid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 12,
    marginBottom: 18,
  },
  paramCard: {
    width: '48%',
    backgroundColor: '#FFFFFF',
    borderRadius: 18,
    padding: 18,
    borderWidth: 1,
    borderColor: '#E2E8F0',
    gap: 5,
    shadowColor: '#000000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.03,
    shadowRadius: 6,
    elevation: 1,
  },
  paramLabel: {
    fontSize: 11,
    color: '#64748B',
    fontWeight: '700',
    marginTop: 6,
    letterSpacing: 0.2,
    textTransform: 'uppercase',
  },
  paramValue: {
    fontSize: 15,
    fontWeight: '800',
    color: '#0F172A',
    letterSpacing: -0.1,
  },
  guidelinesCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 20,
    padding: 20,
    borderWidth: 1,
    borderColor: '#E2E8F0',
    gap: 10,
    shadowColor: '#000000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.03,
    shadowRadius: 6,
    elevation: 1,
  },
  guidelinesTitle: {
    fontSize: 15,
    fontWeight: '800',
    color: '#0F172A',
    marginBottom: 6,
    letterSpacing: -0.1,
  },
  guidelineItem: {
    fontSize: 13,
    color: '#475569',
    lineHeight: 20,
    fontWeight: '500',
  },
});
