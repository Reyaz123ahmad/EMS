import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  StatusBar,
  TouchableOpacity,
  RefreshControl,
  ActivityIndicator,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { notificationService } from '../../services/notification.service';
import { Bell, CheckCircle2, AlertCircle, Clock, Calendar } from 'lucide-react-native';

export default function NotificationsScreen() {
  const [refreshing, setRefreshing] = useState(false);
  const queryClient = useQueryClient();

  const { data: notifData, isLoading, refetch } = useQuery({
    queryKey: ['myNotificationsList'],
    queryFn: async () => {
      try {
        const res = await notificationService.getNotifications();
        return res?.notifications || (Array.isArray(res) ? res : res?.data || []);
      } catch {
        return [];
      }
    },
  });

  const onRefresh = async () => {
    setRefreshing(true);
    await Promise.all([
      refetch(),
      queryClient.invalidateQueries({ queryKey: ['notificationsUnreadCount'] }),
    ]);
    setRefreshing(false);
  };

  const notifications = Array.isArray(notifData)
    ? notifData
    : Array.isArray(notifData?.notifications)
    ? notifData.notifications
    : [];

  const markAllRead = async () => {
    try {
      await notificationService.markAllAsRead();
      queryClient.invalidateQueries({ queryKey: ['myNotificationsList'] });
      queryClient.invalidateQueries({ queryKey: ['notificationsUnreadCount'] });
      await refetch();
    } catch (err) {
      console.warn('[NOTIF] Mark all read error:', err.message);
    }
  };

  const handleMarkItemRead = async (item) => {
    const isUnread = Boolean(item.unread ?? (item.isRead === false));
    if (!isUnread || !item.id) return;
    try {
      await notificationService.markAsRead(item.id);
      queryClient.invalidateQueries({ queryKey: ['myNotificationsList'] });
      queryClient.invalidateQueries({ queryKey: ['notificationsUnreadCount'] });
    } catch (err) {
      console.warn('[NOTIF] Mark single read error:', err.message);
    }
  };

  return (
    <SafeAreaView style={styles.container}>
      <StatusBar barStyle="dark-content" backgroundColor="#F8FAFC" />
      <ScrollView
        contentContainerStyle={styles.scrollContent}
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} colors={['#4F46E5']} />}
      >
        <View style={styles.headerRow}>
          <Text style={styles.headerTitle}>Inbox Alerts</Text>
          {notifications.length > 0 ? (
            <TouchableOpacity onPress={markAllRead}>
              <Text style={styles.markReadText}>Mark all as read</Text>
            </TouchableOpacity>
          ) : null}
        </View>

        {isLoading && notifications.length === 0 ? (
          <View style={styles.loadingBox}>
            <ActivityIndicator size="small" color="#4F46E5" />
            <Text style={styles.loadingText}>Fetching notifications...</Text>
          </View>
        ) : notifications.length === 0 ? (
          <View style={styles.emptyCard}>
            <Bell size={38} color="#94A3B8" />
            <Text style={styles.emptyTitle}>No Notifications</Text>
            <Text style={styles.emptySub}>
              Your inbox is all caught up. New announcements and alerts will show up here.
            </Text>
          </View>
        ) : (
          <View style={styles.list}>
            {notifications.map((item, idx) => {
              const isUnread = Boolean(item.unread ?? (item.isRead === false));
              const timeStr = item.createdAt
                ? new Date(item.createdAt).toLocaleDateString('en-US', {
                    month: 'short',
                    day: 'numeric',
                  })
                : 'Recent';

              return (
                <TouchableOpacity
                  key={item.id || idx}
                  activeOpacity={isUnread ? 0.7 : 1}
                  onPress={() => handleMarkItemRead(item)}
                  style={[styles.itemCard, isUnread && styles.itemCardUnread]}
                >
                  <View style={styles.itemTop}>
                    <View style={styles.itemTitleRow}>
                      {isUnread && <View style={styles.unreadDot} />}
                      <Text style={styles.itemTitle}>{item.title || item.subject || 'Alert'}</Text>
                    </View>
                    <Text style={styles.itemTime}>{timeStr}</Text>
                  </View>
                  <Text style={styles.itemMessage}>{item.body || item.message || item.content || ''}</Text>
                </TouchableOpacity>
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
  headerRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 18,
  },
  headerTitle: { fontSize: 17, fontWeight: '800', color: '#0F172A', letterSpacing: -0.2 },
  markReadText: { fontSize: 13, color: '#4F46E5', fontWeight: '800', letterSpacing: 0.1 },
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
  itemCard: {
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
  itemCardUnread: {
    borderColor: '#C7D2FE',
    backgroundColor: '#F5F3FF',
  },
  itemTop: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 8,
  },
  itemTitleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  unreadDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: '#4F46E5',
  },
  itemTitle: { fontSize: 14, fontWeight: '800', color: '#0F172A', letterSpacing: -0.1 },
  itemTime: { fontSize: 11, color: '#94A3B8', fontWeight: '600' },
  itemMessage: { fontSize: 13, color: '#475569', lineHeight: 20, fontWeight: '500' },
});
