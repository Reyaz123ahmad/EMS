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
import { useLeaveBalances } from '../../hooks/useLeaveBalances';
import { PieChart, ChevronLeft, ChevronRight, Sparkles, Award } from 'lucide-react-native';

export default function LeaveBalancesScreen() {
  const [refreshing, setRefreshing] = useState(false);
  const [selectedYear, setSelectedYear] = useState(new Date().getFullYear());

  const { data: balancesData, isLoading, refetch } = useLeaveBalances(selectedYear);

  const onRefresh = async () => {
    setRefreshing(true);
    await refetch();
    setRefreshing(false);
  };

  const rawList =
    balancesData?.balances ||
    balancesData?.data?.balances ||
    balancesData?.data ||
    (Array.isArray(balancesData) ? balancesData : []);

  const balancesList = Array.isArray(rawList) ? rawList : [];

  return (
    <SafeAreaView style={styles.container}>
      <StatusBar barStyle="dark-content" backgroundColor="#F8FAFC" />
      <ScrollView
        contentContainerStyle={styles.scrollContent}
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} colors={['#4F46E5']} />}
      >
        <View style={styles.header}>
          <Text style={styles.title}>Annual Leave Quotas</Text>
          <Text style={styles.sub}>Track your available, consumed, and remaining balance leaves</Text>
        </View>

        {/* Year Selector */}
        <View style={styles.yearSelector}>
          <TouchableOpacity
            style={styles.yearArrow}
            onPress={() => setSelectedYear((y) => y - 1)}
            activeOpacity={0.7}
          >
            <ChevronLeft size={18} color="#4F46E5" />
          </TouchableOpacity>
          <View style={{ alignItems: 'center' }}>
            <Text style={styles.yearText}>Calendar Year {selectedYear}</Text>
            <Text style={styles.yearSub}>Quota Allocation Period</Text>
          </View>
          <TouchableOpacity
            style={styles.yearArrow}
            onPress={() => setSelectedYear((y) => y + 1)}
            activeOpacity={0.7}
          >
            <ChevronRight size={18} color="#4F46E5" />
          </TouchableOpacity>
        </View>

        {isLoading && balancesList.length === 0 ? (
          <View style={styles.loadingBox}>
            <ActivityIndicator size="small" color="#4F46E5" />
            <Text style={styles.loadingText}>Loading leave balances...</Text>
          </View>
        ) : balancesList.length === 0 ? (
          <View style={styles.emptyCard}>
            <PieChart size={38} color="#94A3B8" />
            <Text style={styles.emptyTitle}>No Leave Balances Available</Text>
            <Text style={styles.emptySub}>
              No leave quotas have been allocated for year {selectedYear}. Please contact HR.
            </Text>
          </View>
        ) : (
          <View style={styles.list}>
            {balancesList.map((item, idx) => {
              const name = item.leaveType?.name || item.name || 'Leave Category';
              const code = item.leaveType?.code || item.code || '';
              const total = Number(item.totalDays ?? item.quota ?? 0);
              const used = Number(item.usedDays ?? 0);
              const remaining = Number(item.remainingDays ?? Math.max(0, total - used));
              const carriedOver = Number(item.carriedOver ?? item.carriedOverDays ?? 0);
              const progressPct = total > 0 ? Math.min(100, Math.round((used / total) * 100)) : 0;

              return (
                <View key={item.id || idx} style={styles.card}>
                  <View style={styles.cardTop}>
                    <View>
                      <Text style={styles.typeName}>{name}</Text>
                      {code ? <Text style={styles.typeCode}>Code: {code}</Text> : null}
                    </View>
                    <View style={styles.remainingPill}>
                      <Text style={styles.remainingText}>{remaining} Available</Text>
                    </View>
                  </View>

                  <View style={styles.statsRow}>
                    <View style={styles.statCol}>
                      <Text style={styles.statLabel}>Allocated</Text>
                      <Text style={styles.statVal}>{total} Days</Text>
                    </View>
                    <View style={styles.divider} />
                    <View style={styles.statCol}>
                      <Text style={styles.statLabel}>Consumed</Text>
                      <Text style={[styles.statVal, { color: '#D97706' }]}>{used} Days</Text>
                    </View>
                    <View style={styles.divider} />
                    <View style={styles.statCol}>
                      <Text style={styles.statLabel}>Available</Text>
                      <Text style={[styles.statVal, { color: '#059669' }]}>{remaining} Days</Text>
                    </View>
                  </View>

                  {carriedOver > 0 ? (
                    <Text style={styles.carryOverNote}>
                      Includes {carriedOver} carried over days from previous cycle
                    </Text>
                  ) : null}

                  {/* Progress bar */}
                  <View style={styles.progressTrack}>
                    <View style={[styles.progressFill, { width: `${progressPct}%` }]} />
                  </View>
                </View>
              );
            })}
          </View>
        )}
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#F8FAFC' },
  scrollContent: { padding: 22, paddingBottom: 44 },
  header: { marginBottom: 16 },
  title: { fontSize: 17, fontWeight: '800', color: '#0F172A', letterSpacing: -0.2 },
  sub: { fontSize: 12, color: '#64748B', marginTop: 3, fontWeight: '500' },
  yearSelector: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    backgroundColor: '#FFFFFF',
    borderRadius: 16,
    padding: 14,
    borderWidth: 1,
    borderColor: '#E2E8F0',
    marginBottom: 18,
    shadowColor: '#000000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.03,
    shadowRadius: 6,
    elevation: 1,
  },
  yearArrow: {
    width: 38,
    height: 38,
    borderRadius: 12,
    backgroundColor: '#EEF2FF',
    alignItems: 'center',
    justifyContent: 'center',
  },
  yearText: { fontSize: 15, fontWeight: '800', color: '#0F172A' },
  yearSub: { fontSize: 10.5, color: '#64748B', marginTop: 2, fontWeight: '500' },
  loadingBox: { flex: 1, padding: 44, alignItems: 'center', justifyContent: 'center', gap: 12, minHeight: 200 },
  loadingText: { fontSize: 13, color: '#64748B', fontWeight: '600' },
  emptyCard: {
    alignItems: 'center',
    justifyContent: 'center',
    padding: 44,
    backgroundColor: '#FFFFFF',
    borderRadius: 22,
    borderWidth: 1,
    borderColor: '#E2E8F0',
    shadowColor: '#000000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.03,
    shadowRadius: 6,
    elevation: 1,
  },
  emptyTitle: { fontSize: 16, fontWeight: '800', color: '#0F172A', marginTop: 14, letterSpacing: -0.1 },
  emptySub: { fontSize: 13, color: '#64748B', textAlign: 'center', marginTop: 6, lineHeight: 20, fontWeight: '500' },
  list: { gap: 14 },
  card: {
    backgroundColor: '#FFFFFF',
    borderRadius: 20,
    padding: 20,
    borderWidth: 1,
    borderColor: '#E2E8F0',
    shadowColor: '#000000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.03,
    shadowRadius: 6,
    elevation: 1,
  },
  cardTop: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 16,
  },
  typeName: { fontSize: 15, fontWeight: '800', color: '#0F172A', letterSpacing: -0.1 },
  typeCode: { fontSize: 11, color: '#64748B', marginTop: 3, fontWeight: '500' },
  remainingPill: {
    backgroundColor: '#ECFDF5',
    paddingHorizontal: 12,
    paddingVertical: 5,
    borderRadius: 10,
    borderWidth: 1,
    borderColor: '#A7F3D0',
  },
  remainingText: { fontSize: 12, fontWeight: '800', color: '#059669', letterSpacing: 0.1 },
  statsRow: {
    flexDirection: 'row',
    backgroundColor: '#F8FAFC',
    borderRadius: 14,
    padding: 14,
    marginBottom: 12,
  },
  statCol: { flex: 1, alignItems: 'center' },
  divider: { width: 1, height: 26, backgroundColor: '#E2E8F0' },
  statLabel: { fontSize: 10, color: '#64748B', marginBottom: 3, fontWeight: '600', letterSpacing: 0.2, textTransform: 'uppercase' },
  statVal: { fontSize: 14, fontWeight: '800', color: '#0F172A' },
  carryOverNote: {
    fontSize: 10.5,
    color: '#6366F1',
    fontWeight: '600',
    marginBottom: 10,
  },
  progressTrack: {
    height: 7,
    backgroundColor: '#F1F5F9',
    borderRadius: 4,
    overflow: 'hidden',
  },
  progressFill: {
    height: '100%',
    backgroundColor: '#4F46E5',
    borderRadius: 4,
  },
});
