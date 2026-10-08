import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  StatusBar,
  RefreshControl,
  TouchableOpacity,
  ActivityIndicator,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useQuery } from '@tanstack/react-query';
import attendanceService from '../../services/attendance.service';
import { Calendar, Clock, ChevronLeft, ChevronRight, AlertCircle } from 'lucide-react-native';

export default function AttendanceLogsScreen() {
  const [refreshing, setRefreshing] = useState(false);
  const [page, setPage] = useState(1);
  const LIMIT = 4;

  const { data: logsData, isLoading, refetch } = useQuery({
    queryKey: ['attendanceLogsPaginated', page],
    queryFn: () => attendanceService.getLogs({ page, limit: LIMIT }),
    keepPreviousData: true,
  });

  const onRefresh = async () => {
    setRefreshing(true);
    await refetch();
    setRefreshing(false);
  };

  const formatTime = (iso) => {
    if (!iso) return '--:--';
    return new Date(iso).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
  };

  const rawLogs = logsData?.logs || logsData?.data || (Array.isArray(logsData) ? logsData : []);
  const totalCount = logsData?.pagination?.total ?? logsData?.total ?? rawLogs.length;
  const totalPages = Math.max(1, logsData?.pagination?.totalPages ?? Math.ceil(totalCount / LIMIT));

  // If backend returned paginated subset, rawLogs has <= 4 items; otherwise do client-side slice:
  const isClientSliced = rawLogs.length > LIMIT;
  const logsList = isClientSliced ? rawLogs.slice((page - 1) * LIMIT, page * LIMIT) : rawLogs;

  const canGoPrev = page > 1;
  const canGoNext = page < totalPages;

  return (
    <SafeAreaView style={styles.container}>
      <StatusBar barStyle="dark-content" backgroundColor="#F8FAFC" />
      <ScrollView
        contentContainerStyle={styles.scrollContent}
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} colors={['#4F46E5']} />}
      >
        <View style={styles.header}>
          <Text style={styles.title}>Detailed Attendance History</Text>
          <Text style={styles.sub}>Showing 4 records per page with exact in/out timestamps</Text>
        </View>

        {isLoading && logsList.length === 0 ? (
          <View style={styles.loadingBox}>
            <ActivityIndicator size="small" color="#4F46E5" />
            <Text style={styles.loadingText}>Loading attendance logs...</Text>
          </View>
        ) : logsList.length === 0 ? (
          <View style={styles.emptyBox}>
            <AlertCircle size={36} color="#94A3B8" />
            <Text style={styles.emptyTitle}>No Attendance Records</Text>
            <Text style={styles.emptySub}>No attendance punches recorded for this period.</Text>
          </View>
        ) : (
          <>
            <View style={styles.list}>
              {logsList.map((item, idx) => {
                const status = (item.status || 'PRESENT').toUpperCase();
                const isPresent = status === 'PRESENT';
                const isLate = status === 'LATE';

                return (
                  <View key={item.id || idx} style={styles.card}>
                    <View style={styles.cardTop}>
                      <View style={styles.dateRow}>
                        <Calendar size={14} color="#64748B" />
                        <Text style={styles.dateText}>
                          {new Date(item.attendanceDate || item.date || item.createdAt).toLocaleDateString(
                            'en-US',
                            { weekday: 'short', month: 'short', day: 'numeric', year: 'numeric' }
                          )}
                        </Text>
                      </View>
                      <View
                        style={[
                          styles.badge,
                          isPresent ? styles.badgePresent : isLate ? styles.badgeLate : styles.badgeOther,
                        ]}
                      >
                        <Text
                          style={[
                            styles.badgeText,
                            isPresent
                              ? styles.badgeTextPresent
                              : isLate
                              ? styles.badgeTextLate
                              : styles.badgeTextOther,
                          ]}
                        >
                          {status}
                        </Text>
                      </View>
                    </View>

                    <View style={styles.timesGrid}>
                      <View style={styles.col}>
                        <Text style={styles.label}>Clock In</Text>
                        <Text style={styles.val}>{formatTime(item.checkInAt)}</Text>
                      </View>
                      <View style={styles.divider} />
                      <View style={styles.col}>
                        <Text style={styles.label}>Clock Out</Text>
                        <Text style={styles.val}>{formatTime(item.checkOutAt)}</Text>
                      </View>
                      <View style={styles.divider} />
                      <View style={styles.col}>
                        <Text style={styles.label}>Worked</Text>
                        <Text style={[styles.val, { color: '#4F46E5' }]}>
                          {item.totalWorkedMinutes
                            ? `${Math.floor(item.totalWorkedMinutes / 60)}h ${item.totalWorkedMinutes % 60}m`
                            : '--'}
                        </Text>
                      </View>
                    </View>
                  </View>
                );
              })}
            </View>

            {/* Pagination Controls */}
            <View style={styles.paginationRow}>
              <TouchableOpacity
                style={[styles.pageBtn, !canGoPrev && styles.pageBtnDisabled]}
                disabled={!canGoPrev}
                onPress={() => setPage((p) => Math.max(1, p - 1))}
                activeOpacity={0.7}
              >
                <ChevronLeft size={16} color={canGoPrev ? '#4F46E5' : '#94A3B8'} />
                <Text style={[styles.pageBtnText, !canGoPrev && styles.pageBtnTextDisabled]}>Previous</Text>
              </TouchableOpacity>

              <View style={styles.pageBadge}>
                <Text style={styles.pageIndicator}>
                  Page <Text style={{ fontWeight: '800', color: '#0F172A' }}>{page}</Text> of {totalPages}
                </Text>
              </View>

              <TouchableOpacity
                style={[styles.pageBtn, !canGoNext && styles.pageBtnDisabled]}
                disabled={!canGoNext}
                onPress={() => setPage((p) => p + 1)}
                activeOpacity={0.7}
              >
                <Text style={[styles.pageBtnText, !canGoNext && styles.pageBtnTextDisabled]}>Next</Text>
                <ChevronRight size={16} color={canGoNext ? '#4F46E5' : '#94A3B8'} />
              </TouchableOpacity>
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
  header: { marginBottom: 18 },
  title: { fontSize: 17, fontWeight: '800', color: '#0F172A', letterSpacing: -0.2 },
  sub: { fontSize: 12, color: '#64748B', marginTop: 3, fontWeight: '500' },
  loadingBox: { flex: 1, padding: 44, alignItems: 'center', justifyContent: 'center', gap: 12, minHeight: 200 },
  loadingText: { fontSize: 13, color: '#64748B', fontWeight: '600' },
  emptyBox: {
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
  emptyTitle: { fontSize: 16, fontWeight: '800', color: '#0F172A', marginTop: 12, letterSpacing: -0.1 },
  emptySub: { fontSize: 13, color: '#64748B', textAlign: 'center', marginTop: 6, fontWeight: '500' },
  list: { gap: 14 },
  card: {
    backgroundColor: '#FFFFFF',
    borderRadius: 18,
    padding: 18,
    borderWidth: 1,
    borderColor: '#E2E8F0',
    shadowColor: '#000000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.02,
    shadowRadius: 4,
    elevation: 1,
  },
  cardTop: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 14,
  },
  dateRow: { flexDirection: 'row', alignItems: 'center', gap: 7 },
  dateText: { fontSize: 13, fontWeight: '700', color: '#0F172A' },
  badge: { paddingHorizontal: 10, paddingVertical: 4, borderRadius: 10 },
  badgePresent: { backgroundColor: '#ECFDF5' },
  badgeLate: { backgroundColor: '#FEF3C7' },
  badgeOther: { backgroundColor: '#F1F5F9' },
  badgeText: { fontSize: 10, fontWeight: '800', letterSpacing: 0.2 },
  badgeTextPresent: { color: '#059669' },
  badgeTextLate: { color: '#D97706' },
  badgeTextOther: { color: '#475569' },
  timesGrid: {
    flexDirection: 'row',
    backgroundColor: '#F8FAFC',
    borderRadius: 14,
    padding: 12,
  },
  col: { flex: 1, alignItems: 'center' },
  divider: { width: 1, height: 22, backgroundColor: '#E2E8F0' },
  label: { fontSize: 10, color: '#64748B', marginBottom: 3, fontWeight: '600', letterSpacing: 0.2 },
  val: { fontSize: 13, fontWeight: '800', color: '#0F172A' },
  paginationRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: '#FFFFFF',
    borderRadius: 16,
    padding: 12,
    marginTop: 18,
    borderWidth: 1,
    borderColor: '#E2E8F0',
  },
  pageBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 5,
    backgroundColor: '#EEF2FF',
    paddingVertical: 9,
    paddingHorizontal: 14,
    borderRadius: 12,
  },
  pageBtnDisabled: {
    backgroundColor: '#F1F5F9',
  },
  pageBtnText: {
    fontSize: 12,
    fontWeight: '800',
    color: '#4F46E5',
  },
  pageBtnTextDisabled: {
    color: '#94A3B8',
  },
  pageBadge: {
    paddingHorizontal: 10,
    paddingVertical: 5,
  },
  pageIndicator: {
    fontSize: 12,
    color: '#64748B',
    fontWeight: '600',
  },
});
