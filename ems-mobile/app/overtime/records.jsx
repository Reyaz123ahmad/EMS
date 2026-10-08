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
import api from '../../services/api';
import { Timer, Calendar } from 'lucide-react-native';

export default function OvertimeRecordsScreen() {
  const [refreshing, setRefreshing] = useState(false);

  const { data: recordsData, isLoading, refetch } = useQuery({
    queryKey: ['myOvertimeRecords'],
    queryFn: async () => {
      try {
        const res = await api.get('/overtime/my');
        return res.data?.data || res.data || [];
      } catch {
        try {
          const fallbackRes = await api.get('/overtime/records');
          return fallbackRes.data?.data || fallbackRes.data || [];
        } catch {
          return [];
        }
      }
    },
  });

  const onRefresh = async () => {
    setRefreshing(true);
    await refetch();
    setRefreshing(false);
  };

  const list = Array.isArray(recordsData) ? recordsData : recordsData?.records || [];

  return (
    <SafeAreaView style={styles.container}>
      <StatusBar barStyle="dark-content" backgroundColor="#F8FAFC" />
      <ScrollView
        contentContainerStyle={styles.scrollContent}
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} colors={['#4F46E5']} />}
      >
        <View style={styles.header}>
          <Text style={styles.title}>Overtime Claim Records</Text>
          <Text style={styles.sub}>History of approved and pending overtime hours</Text>
        </View>

        {isLoading && list.length === 0 ? (
          <View style={{ alignItems: 'center', padding: 40 }}>
            <ActivityIndicator size="small" color="#4F46E5" />
            <Text style={{ marginTop: 10, color: '#64748B', fontSize: 13 }}>Loading overtime claims...</Text>
          </View>
        ) : list.length === 0 ? (
          <View style={{ alignItems: 'center', justifyContent: 'center', padding: 40, backgroundColor: '#FFFFFF', borderRadius: 16, borderWidth: 1, borderColor: '#E2E8F0' }}>
            <Timer size={38} color="#94A3B8" />
            <Text style={{ fontSize: 15, fontWeight: '700', color: '#0F172A', marginTop: 12 }}>No Overtime Records</Text>
            <Text style={{ fontSize: 12.5, color: '#64748B', textAlign: 'center', marginTop: 4 }}>
              Overtime hours claimed and approved will be recorded here.
            </Text>
          </View>
        ) : (
          <View style={styles.list}>
            {list.map((item, idx) => {
              const hours = item.hours || item.overtimeHours || item.durationHours || 0;
              const status = (item.status || 'APPROVED').toUpperCase();
              const dateStr = item.date || item.overtimeDate || (item.createdAt ? new Date(item.createdAt).toISOString().split('T')[0] : 'Active');
              const reason = item.reason || item.remarks || 'Standard overtime duties';

              return (
                <View key={item.id || idx} style={styles.card}>
                  <View style={styles.cardTop}>
                    <View style={styles.hoursBadge}>
                      <Timer size={14} color="#4F46E5" />
                      <Text style={styles.hoursText}>{hours} Hours</Text>
                    </View>
                    <View style={styles.statusBadge}>
                      <Text style={styles.statusText}>{status}</Text>
                    </View>
                  </View>

                  <View style={styles.dateRow}>
                    <Calendar size={13} color="#64748B" />
                    <Text style={styles.dateText}>{dateStr}</Text>
                  </View>

                  <Text style={styles.reasonText}>"{reason}"</Text>
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
  hoursBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 7,
    backgroundColor: '#EEF2FF',
    paddingHorizontal: 10,
    paddingVertical: 5,
    borderRadius: 10,
  },
  hoursText: { fontSize: 12, fontWeight: '800', color: '#4F46E5', letterSpacing: 0.1 },
  statusBadge: {
    backgroundColor: '#ECFDF5',
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 10,
  },
  statusText: { fontSize: 10, fontWeight: '800', color: '#059669', letterSpacing: 0.2 },
  dateRow: { flexDirection: 'row', alignItems: 'center', gap: 7, marginBottom: 10 },
  dateText: { fontSize: 13, color: '#475569', fontWeight: '600' },
  reasonText: { fontSize: 12, color: '#64748B', fontStyle: 'italic', fontWeight: '500' },
});
