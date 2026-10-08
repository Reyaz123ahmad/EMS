import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  StatusBar,
  TouchableOpacity,
  RefreshControl,
  Alert,
  ActivityIndicator,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useQuery } from '@tanstack/react-query';
import api from '../../services/api';
import { FileText, Download, ShieldCheck, Folder, Sparkles, AlertCircle } from 'lucide-react-native';

export default function DocumentsScreen() {
  const [refreshing, setRefreshing] = useState(false);

  const { data: docsData, isLoading, refetch } = useQuery({
    queryKey: ['myDocumentsList'],
    queryFn: async () => {
      try {
        const res = await api.get('/documents/my');
        return res.data?.data || res.data || [];
      } catch {
        const fallbackRes = await api.get('/documents');
        return fallbackRes.data?.data || fallbackRes.data || [];
      }
    },
  });

  const onRefresh = async () => {
    setRefreshing(true);
    await refetch();
    setRefreshing(false);
  };

  const docsList = Array.isArray(docsData) ? docsData : docsData?.documents || [];

  const handleDownload = (doc) => {
    Alert.alert('Download Started', `Downloading ${doc.title || doc.name || 'document'}...`);
  };

  return (
    <SafeAreaView style={styles.container}>
      <StatusBar barStyle="dark-content" backgroundColor="#F8FAFC" />
      <ScrollView
        contentContainerStyle={styles.scrollContent}
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} colors={['#4F46E5']} />}
      >
        <View style={styles.headerBanner}>
          <Folder size={22} color="#4F46E5" />
          <View>
            <Text style={styles.bannerTitle}>Company & Employee Documents</Text>
            <Text style={styles.bannerSubtitle}>Official contracts, policies, and certificates</Text>
          </View>
        </View>

        {isLoading && docsList.length === 0 ? (
          <View style={styles.loadingBox}>
            <ActivityIndicator size="small" color="#4F46E5" />
            <Text style={styles.loadingText}>Loading documents...</Text>
          </View>
        ) : docsList.length === 0 ? (
          <View style={styles.emptyCard}>
            <FileText size={38} color="#94A3B8" />
            <Text style={styles.emptyTitle}>No Documents Available</Text>
            <Text style={styles.emptySubtitle}>
              Official certificates and employment documents uploaded by HR will appear here.
            </Text>
          </View>
        ) : (
          <View style={styles.docList}>
            {docsList.map((doc, idx) => {
              const title = doc.title || doc.name || `Document #${idx + 1}`;
              const category = doc.category || doc.type || doc.documentType?.name || 'Document';
              const dateStr = doc.createdAt
                ? new Date(doc.createdAt).toLocaleDateString('en-US', {
                    month: 'short',
                    day: 'numeric',
                    year: 'numeric',
                  })
                : 'Active';

              return (
                <View key={doc.id || idx} style={styles.docCard}>
                  <View style={styles.docLeft}>
                    <View style={styles.docIcon}>
                      <FileText size={20} color="#4F46E5" />
                    </View>
                    <View style={{ flex: 1 }}>
                      <Text style={styles.docTitle}>{title}</Text>
                      <Text style={styles.docMeta}>
                        {category} • {dateStr}
                      </Text>
                    </View>
                  </View>

                  <TouchableOpacity style={styles.downloadBtn} onPress={() => handleDownload(doc)} activeOpacity={0.7}>
                    <Download size={18} color="#4F46E5" />
                  </TouchableOpacity>
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
  headerBanner: {
    backgroundColor: '#FFFFFF',
    borderRadius: 18,
    padding: 20,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 16,
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
  bannerSubtitle: { fontSize: 12, color: '#64748B', marginTop: 3, fontWeight: '500' },
  docList: { gap: 12 },
  docCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 18,
    padding: 18,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    borderWidth: 1,
    borderColor: '#E2E8F0',
    shadowColor: '#000000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.02,
    shadowRadius: 4,
    elevation: 1,
  },
  docLeft: { flexDirection: 'row', alignItems: 'center', gap: 14, flex: 1 },
  docIcon: {
    width: 42,
    height: 42,
    borderRadius: 14,
    backgroundColor: '#EEF2FF',
    alignItems: 'center',
    justifyContent: 'center',
  },
  docTitle: { fontSize: 14, fontWeight: '800', color: '#0F172A', marginBottom: 4, letterSpacing: -0.1 },
  docMeta: { fontSize: 11, color: '#64748B', fontWeight: '600' },
  downloadBtn: {
    width: 38,
    height: 38,
    borderRadius: 19,
    backgroundColor: '#EEF2FF',
    alignItems: 'center',
    justifyContent: 'center',
    marginLeft: 12,
  },
});
