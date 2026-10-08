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
import { FolderKanban, CheckCircle2, Clock, Users, Calendar } from 'lucide-react-native';

export default function MyProjectsScreen() {
  const [refreshing, setRefreshing] = useState(false);

  const { data: projectsData, isLoading, refetch } = useQuery({
    queryKey: ['myProjectsList'],
    queryFn: async () => {
      try {
        const res = await api.get('/projects/my');
        return res.data?.data || res.data || [];
      } catch {
        return [];
      }
    },
  });

  const onRefresh = async () => {
    setRefreshing(true);
    await refetch();
    setRefreshing(false);
  };

  const list = Array.isArray(projectsData) ? projectsData : projectsData?.projects || [];

  return (
    <SafeAreaView style={styles.container}>
      <StatusBar barStyle="dark-content" backgroundColor="#F8FAFC" />
      <ScrollView
        contentContainerStyle={styles.scrollContent}
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} colors={['#4F46E5']} />}
      >
        <View style={styles.banner}>
          <FolderKanban size={22} color="#4F46E5" />
          <View>
            <Text style={styles.bannerTitle}>Assigned Projects</Text>
            <Text style={styles.bannerSub}>Active workspace project deliverables</Text>
          </View>
        </View>

        {isLoading && list.length === 0 ? (
          <View style={{ alignItems: 'center', padding: 40 }}>
            <ActivityIndicator size="small" color="#4F46E5" />
            <Text style={{ marginTop: 10, color: '#64748B', fontSize: 13 }}>Loading assigned projects...</Text>
          </View>
        ) : list.length === 0 ? (
          <View style={{ alignItems: 'center', justifyContent: 'center', padding: 40, backgroundColor: '#FFFFFF', borderRadius: 16, borderWidth: 1, borderColor: '#E2E8F0' }}>
            <FolderKanban size={38} color="#94A3B8" />
            <Text style={{ fontSize: 15, fontWeight: '700', color: '#0F172A', marginTop: 12 }}>No Assigned Projects</Text>
            <Text style={{ fontSize: 12.5, color: '#64748B', textAlign: 'center', marginTop: 4 }}>
              You do not have any active project assignments at this time.
            </Text>
          </View>
        ) : (
          <View style={styles.list}>
            {list.map((item) => (
              <View key={item.id} style={styles.projectCard}>
                <View style={styles.cardTop}>
                  <Text style={styles.codeText}>{item.code || 'PROJECT'}</Text>
                  <View style={[styles.statusBadge, item.progress === 100 ? styles.statusBadgeCompleted : styles.statusBadgeActive]}>
                    <Text style={[styles.statusBadgeText, item.progress === 100 ? styles.statusTextCompleted : styles.statusTextActive]}>
                      {item.status || 'ACTIVE'}
                    </Text>
                  </View>
                </View>

                <Text style={styles.projectTitle}>{item.title}</Text>

                <View style={styles.detailsRow}>
                  <View style={styles.detailItem}>
                    <Users size={14} color="#64748B" />
                    <Text style={styles.detailText}>{item.role || 'Member'}</Text>
                  </View>
                  <View style={styles.detailItem}>
                    <Calendar size={14} color="#64748B" />
                    <Text style={styles.detailText}>{item.deadline || 'Ongoing'}</Text>
                  </View>
                </View>

                {/* Progress bar */}
                <View style={styles.progressContainer}>
                  <View style={styles.progressTop}>
                    <Text style={styles.progressLabel}>Progress</Text>
                    <Text style={styles.progressVal}>{item.progress || 0}%</Text>
                  </View>
                  <View style={styles.progressBarTrack}>
                    <View style={[styles.progressBarFill, { width: `${item.progress || 0}%` }]} />
                  </View>
                </View>
              </View>
            ))}
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
  list: { gap: 14 },
  projectCard: {
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
    marginBottom: 10,
  },
  codeText: { fontSize: 11, fontWeight: '800', color: '#4F46E5', letterSpacing: 0.6 },
  statusBadge: {
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 10,
  },
  statusBadgeActive: { backgroundColor: '#EEF2FF' },
  statusBadgeCompleted: { backgroundColor: '#ECFDF5' },
  statusBadgeText: { fontSize: 10, fontWeight: '800', letterSpacing: 0.2 },
  statusTextActive: { color: '#4F46E5' },
  statusTextCompleted: { color: '#059669' },
  projectTitle: { fontSize: 16, fontWeight: '800', color: '#0F172A', marginBottom: 14, letterSpacing: -0.1 },
  detailsRow: { flexDirection: 'row', gap: 18, marginBottom: 16 },
  detailItem: { flexDirection: 'row', alignItems: 'center', gap: 7 },
  detailText: { fontSize: 12, color: '#64748B', fontWeight: '600' },
  progressContainer: { marginTop: 4 },
  progressTop: { flexDirection: 'row', justifyContent: 'space-between', marginBottom: 8 },
  progressLabel: { fontSize: 11, color: '#64748B', fontWeight: '700', letterSpacing: 0.1 },
  progressVal: { fontSize: 11, color: '#0F172A', fontWeight: '800' },
  progressBarTrack: {
    height: 7,
    backgroundColor: '#F1F5F9',
    borderRadius: 4,
    overflow: 'hidden',
  },
  progressBarFill: {
    height: '100%',
    backgroundColor: '#4F46E5',
    borderRadius: 4,
  },
});
