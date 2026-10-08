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
import { Package, Laptop, Smartphone, Key, ShieldCheck, AlertCircle } from 'lucide-react-native';

export default function MyAssetsScreen() {
  const [refreshing, setRefreshing] = useState(false);

  const { data: assetsData, isLoading, refetch } = useQuery({
    queryKey: ['myAssetsList'],
    queryFn: async () => {
      try {
        const res = await api.get('/assets/my');
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

  const list = Array.isArray(assetsData) ? assetsData : assetsData?.assets || [];

  return (
    <SafeAreaView style={styles.container}>
      <StatusBar barStyle="dark-content" backgroundColor="#F8FAFC" />
      <ScrollView
        contentContainerStyle={styles.scrollContent}
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} colors={['#4F46E5']} />}
      >
        <View style={styles.banner}>
          <Package size={22} color="#4F46E5" />
          <View>
            <Text style={styles.bannerTitle}>Assigned Assets</Text>
            <Text style={styles.bannerSub}>Company hardware and security equipment</Text>
          </View>
        </View>

        {isLoading && list.length === 0 ? (
          <View style={{ alignItems: 'center', padding: 40 }}>
            <ActivityIndicator size="small" color="#4F46E5" />
            <Text style={{ marginTop: 10, color: '#64748B', fontSize: 13 }}>Loading assigned assets...</Text>
          </View>
        ) : list.length === 0 ? (
          <View style={{ alignItems: 'center', justifyContent: 'center', padding: 40, backgroundColor: '#FFFFFF', borderRadius: 16, borderWidth: 1, borderColor: '#E2E8F0' }}>
            <Package size={38} color="#94A3B8" />
            <Text style={{ fontSize: 15, fontWeight: '700', color: '#0F172A', marginTop: 12 }}>No Assets Assigned</Text>
            <Text style={{ fontSize: 12.5, color: '#64748B', textAlign: 'center', marginTop: 4 }}>
              Company equipment or assets assigned to you by IT/Admin will appear here.
            </Text>
          </View>
        ) : (
          <View style={styles.list}>
            {list.map((item, idx) => {
              const asset = item.asset || item;
              const name = asset.name || asset.title || `Asset #${idx + 1}`;
              const tag = asset.assetCode || asset.tag || asset.assetTag || 'N/A';
              const serial = asset.serialNumber || asset.serial || 'N/A';
              const condition = (asset.condition || 'GOOD').toUpperCase();
              const category = typeof asset.category === 'object'
                ? (asset.category?.name || asset.category?.displayName || 'Hardware')
                : (asset.category || 'Hardware');

              return (
                <View key={item.id || asset.id || idx} style={styles.card}>
                  <View style={styles.cardTop}>
                    <View style={styles.iconCircle}>
                      <Package size={20} color="#4F46E5" />
                    </View>
                    <View style={styles.conditionBadge}>
                      <Text style={styles.conditionText}>{condition}</Text>
                    </View>
                  </View>

                  <Text style={styles.assetName}>{name}</Text>

                  <View style={styles.metaGrid}>
                    <View>
                      <Text style={styles.metaLabel}>Asset Tag</Text>
                      <Text style={styles.metaVal}>{tag}</Text>
                    </View>
                    <View>
                      <Text style={styles.metaLabel}>Category</Text>
                      <Text style={styles.metaVal}>{category}</Text>
                    </View>
                    <View>
                      <Text style={styles.metaLabel}>Serial Number</Text>
                      <Text style={styles.metaVal}>{serial}</Text>
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
    marginBottom: 14,
  },
  iconCircle: {
    width: 42,
    height: 42,
    borderRadius: 14,
    backgroundColor: '#EEF2FF',
    alignItems: 'center',
    justifyContent: 'center',
  },
  conditionBadge: {
    backgroundColor: '#ECFDF5',
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 10,
  },
  conditionText: { fontSize: 10, fontWeight: '800', color: '#059669', letterSpacing: 0.2 },
  assetName: { fontSize: 15, fontWeight: '800', color: '#0F172A', marginBottom: 16, letterSpacing: -0.1 },
  metaGrid: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    backgroundColor: '#F8FAFC',
    borderRadius: 14,
    padding: 14,
  },
  metaLabel: { fontSize: 10, color: '#64748B', fontWeight: '600', marginBottom: 3, letterSpacing: 0.2, textTransform: 'uppercase' },
  metaVal: { fontSize: 12, fontWeight: '800', color: '#0F172A' },
});
