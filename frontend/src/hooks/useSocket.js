import { useEffect, useCallback } from 'react';
import { socketService } from '../services/socket.service';
import useAuthStore from '../store/auth.store';
import useNotificationStore from '../store/notification.store';
import { toast } from 'sonner';

export const useSocket = () => {
  const { isAuthenticated, accessToken } = useAuthStore();
  const { addNotification, setUnreadCount } = useNotificationStore();

  useEffect(() => {
    if (isAuthenticated && accessToken) {
      const socket = socketService.connect(accessToken);

      // Default real-time listeners
      const unsubNewNotif = socketService.on('notification:new', (notification) => {
        addNotification(notification);
        toast.info(notification.title || 'New Notification', {
          description: notification.body,
          duration: 5000
        });
      });

      const unsubUnreadCount = socketService.on('notification:unread_count', ({ count }) => {
        setUnreadCount(count);
      });

      const unsubSecurity = socketService.on('security:alert', (alert) => {
        toast.error(`Security Alert: ${alert.type || 'Alert'}`, {
          description: alert.message || 'Suspicious security activity detected',
          duration: 8000
        });
      });

      return () => {
        unsubNewNotif?.();
        unsubUnreadCount?.();
        unsubSecurity?.();
      };
    } else {
      socketService.disconnect();
    }
  }, [isAuthenticated, accessToken, addNotification, setUnreadCount]);

  return socketService;
};

export const useSocketEvent = (event, handler) => {
  useEffect(() => {
    if (!event || !handler) return;
    const cleanup = socketService.on(event, handler);
    return () => {
      cleanup?.();
    };
  }, [event, handler]);
};

export const useSocketEmit = () => {
  return useCallback((event, data) => {
    return socketService.emit(event, data);
  }, []);
};

export default useSocket;
