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
import { CheckSquare, Calendar, Clock, CheckCircle2 } from 'lucide-react-native';

export default function ApprovalsRequestsScreen() {
  const [refreshing, setRefreshing] = useState(false);

  const { data: approvalsData, isLoading, refetch } = useQuery({
    queryKey: ['myApprovalsList'],
    queryFn: async () => {
      try {
        const res = await api.get('/approvals/requests');
        return res.data?.data || res.data || [];
      } catch {
        try {
          const fallbackRes = await api.get('/approvals/pending');
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

  const list = Array.isArray(approvalsData) ? approvalsData : approvalsData?.requests || [];

  return (
    <SafeAreaView style={styles.container}>
      <StatusBar barStyle="dark-content" backgroundColor="#F8FAFC" />
      <ScrollView
        contentContainerStyle={styles.scrollContent}
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} colors={['#4F46E5']} />}
      >
        <View style={styles.banner}>
          <CheckSquare size={22} color="#10B981" />
          <View>
            <Text style={styles.bannerTitle}>Approval Requests</Text>
            <Text style={styles.bannerSub}>Status of your submitted workflow requests</Text>
          </View>
        </View>

        {isLoading && list.length === 0 ? (
          <View style={styles.loadingBox}>
            <ActivityIndicator size="small" color="#4F46E5" />
            <Text style={styles.loadingText}>Loading approval requests...</Text>
          </View>
        ) : list.length === 0 ? (
          <View style={styles.emptyCard}>
            <CheckSquare size={38} color="#94A3B8" />
            <Text style={styles.emptyTitle}>No Approval Requests</Text>
            <Text style={styles.emptySub}>
              Your approval history and active submitted requests will appear here.
            </Text>
          </View>
        ) : (
          <View style={styles.list}>
            {list.map((item, idx) => {
              const category = item.category || item.entityType || 'Request';
              const title = item.title || item.entityName || `Approval Request #${idx + 1}`;
              const status = (item.status || 'PENDING').toUpperCase();
              const dateStr = item.createdAt
                ? new Date(item.createdAt).toLocaleDateString('en-US', {
                    month: 'short',
                    day: 'numeric',
                    year: 'numeric',
                  })
                : (item.dates || 'Active');

              return (
                <View key={item.id || idx} style={styles.card}>
                  <View style={styles.cardTop}>
                    <Text style={styles.categoryBadge}>{category}</Text>
                    <View
                      style={[
                        styles.statusPill,
                        status === 'APPROVED' ? styles.statusApproved : styles.statusPending,
                      ]}
                    >
                      <Text
                        style={[
                          styles.statusText,
                          status === 'APPROVED' ? styles.statusTextApproved : styles.statusTextPending,
                        ]}
                      >
                        {status}
                      </Text>
                    </View>
                  </View>

                  <Text style={styles.cardTitle}>{title}</Text>

                  <View style={styles.detailsRow}>
                    <View style={styles.detail}>
                      <Calendar size={13} color="#64748B" />
                      <Text style={styles.detailText}>{dateStr}</Text>
                    </View>
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
  banner: {
    backgroundColor: '#FFFFFF',
    borderRadius: 18,
    padding: 18,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 14,
    borderWidth: 1,
    borderColor: '#E2E8F0',
    marginBottom: 18,
    shadowColor: '#000000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.03,
    shadowRadius: 6,
    elevation: 1,
  },
  bannerTitle: { fontSize: 15, fontWeight: '800', color: '#0F172A', letterSpacing: -0.1 },
  bannerSub: { fontSize: 12, color: '#64748B', fontWeight: '500' },
  loadingBox: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    padding: 44,
    gap: 12,
    minHeight: 200,
  },
  loadingText: { marginTop: 2, color: '#64748B', fontSize: 13, fontWeight: '600' },
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
  categoryBadge: { fontSize: 11, fontWeight: '800', color: '#4F46E5', textTransform: 'uppercase', letterSpacing: 0.3 },
  statusPill: { paddingHorizontal: 10, paddingVertical: 4, borderRadius: 10 },
  statusPending: { backgroundColor: '#FEF3C7' },
  statusApproved: { backgroundColor: '#ECFDF5' },
  statusText: { fontSize: 10, fontWeight: '800', letterSpacing: 0.2 },
  statusTextPending: { color: '#B45309' },
  statusTextApproved: { color: '#059669' },
  cardTitle: { fontSize: 15, fontWeight: '800', color: '#0F172A', marginBottom: 12, letterSpacing: -0.1 },
  detailsRow: { flexDirection: 'row', gap: 12 },
  detail: { flexDirection: 'row', alignItems: 'center', gap: 7 },
  detailText: { fontSize: 12, color: '#64748B', fontWeight: '600' },
});
