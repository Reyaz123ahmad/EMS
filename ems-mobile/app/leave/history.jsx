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
import leaveService from '../../services/leave.service';
import { Calendar, Clock, CheckCircle2 } from 'lucide-react-native';

export default function LeaveHistoryScreen() {
  const [refreshing, setRefreshing] = useState(false);

  const { data: historyData, isLoading, refetch } = useQuery({
    queryKey: ['leaveHistoryScreen'],
    queryFn: () => leaveService.getMyRequests(),
  });

  const onRefresh = async () => {
    setRefreshing(true);
    await refetch();
    setRefreshing(false);
  };

  const requestsList = historyData?.requests || historyData?.data || (Array.isArray(historyData) ? historyData : []);

  return (
    <SafeAreaView style={styles.container}>
      <StatusBar barStyle="dark-content" backgroundColor="#F8FAFC" />
      <ScrollView
        contentContainerStyle={styles.scrollContent}
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} colors={['#4F46E5']} />}
      >
        <View style={styles.header}>
          <Text style={styles.title}>Leave Application History</Text>
          <Text style={styles.sub}>Status of all historical and active leave requests</Text>
        </View>

        {isLoading ? (
          <View style={styles.loadingBox}>
            <ActivityIndicator size="small" color="#4F46E5" />
            <Text style={styles.loadingText}>Loading leave history...</Text>
          </View>
        ) : requestsList.length === 0 ? (
          <View style={styles.emptyCard}>
            <Calendar size={36} color="#94A3B8" />
            <Text style={styles.emptyTitle}>No Leave Applications</Text>
            <Text style={styles.emptySub}>You have not submitted any leave applications yet.</Text>
          </View>
        ) : (
          <View style={styles.list}>
            {requestsList.map((item, idx) => {
              const status = item.status || 'PENDING';
              const isApproved = status === 'APPROVED';
              const isRejected = status === 'REJECTED';

              return (
                <View key={item.id || idx} style={styles.card}>
                  <View style={styles.cardTop}>
                    <Text style={styles.typeName}>{item.leaveType?.name || 'Leave'}</Text>
                    <View
                      style={[
                        styles.badge,
                        isApproved ? styles.badgeApproved : isRejected ? styles.badgeRejected : styles.badgePending,
                      ]}
                    >
                      <Text
                        style={[
                          styles.badgeText,
                          isApproved ? styles.badgeTextApproved : isRejected ? styles.badgeTextRejected : styles.badgeTextPending,
                        ]}
                      >
                        {status}
                      </Text>
                    </View>
                  </View>

                  <View style={styles.dateRow}>
                    <Calendar size={13} color="#64748B" />
                    <Text style={styles.dateText}>
                      {item.startDate} {item.endDate && item.endDate !== item.startDate ? `— ${item.endDate}` : ''}
                    </Text>
                  </View>

                  {item.reason && <Text style={styles.reasonText}>"{item.reason}"</Text>}
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
  header: { marginBottom: 18 },
  title: { fontSize: 17, fontWeight: '800', color: '#0F172A', letterSpacing: -0.2 },
  sub: { fontSize: 12, color: '#64748B', marginTop: 3, fontWeight: '500' },
  loadingBox: { flex: 1, padding: 44, alignItems: 'center', justifyContent: 'center', gap: 12, minHeight: 200 },
  loadingText: { fontSize: 13, color: '#64748B', fontWeight: '600' },
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
  emptyTitle: { fontSize: 16, fontWeight: '800', color: '#334155', marginTop: 14, marginBottom: 6, letterSpacing: -0.1 },
  emptySub: { fontSize: 13, color: '#94A3B8', textAlign: 'center', fontWeight: '500' },
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
    marginBottom: 10,
  },
  typeName: { fontSize: 14, fontWeight: '800', color: '#0F172A', letterSpacing: -0.1 },
  badge: { paddingHorizontal: 10, paddingVertical: 4, borderRadius: 10 },
  badgePending: { backgroundColor: '#FEF3C7' },
  badgeApproved: { backgroundColor: '#ECFDF5' },
  badgeRejected: { backgroundColor: '#FEF2F2' },
  badgeText: { fontSize: 10, fontWeight: '800', letterSpacing: 0.2 },
  badgeTextPending: { color: '#B45309' },
  badgeTextApproved: { color: '#059669' },
  badgeTextRejected: { color: '#DC2626' },
  dateRow: { flexDirection: 'row', alignItems: 'center', gap: 7, marginBottom: 10 },
  dateText: { fontSize: 13, color: '#475569', fontWeight: '600' },
  reasonText: { fontSize: 12, color: '#64748B', fontStyle: 'italic', fontWeight: '500' },
});
