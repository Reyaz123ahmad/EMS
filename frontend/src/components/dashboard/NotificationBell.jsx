import React, { useEffect } from 'react';
import { Link } from 'react-router-dom';
import { Bell, CheckCheck, ArrowRight } from 'lucide-react';
import useNotificationStore from '../../store/notification.store';
import Dropdown from '../ui/Dropdown';
import dayjs from 'dayjs';
import relativeTime from 'dayjs/plugin/relativeTime';

dayjs.extend(relativeTime);

export const NotificationBell = () => {
  const {
    notifications,
    unreadCount,
    fetchNotifications,
    fetchUnreadCount,
    markRead,
    markAllRead
  } = useNotificationStore();

  useEffect(() => {
    fetchUnreadCount();
    fetchNotifications({}, { page: 1, limit: 5 });
  }, [fetchUnreadCount, fetchNotifications]);

  const recent = notifications.slice(0, 5);

  return (
    <Dropdown
      align="right"
      width="w-80 sm:w-96"
      trigger={
        <div className="relative p-2 rounded-xl text-slate-600 hover:text-slate-900 hover:bg-slate-100 dark:text-slate-300 dark:hover:text-white dark:hover:bg-slate-800 transition-colors">
          <Bell className="w-5 h-5" />
          {unreadCount > 0 && (
            <span className="absolute top-1.5 right-1.5 flex h-4 min-w-4 items-center justify-center rounded-full bg-rose-500 px-1 text-[10px] font-bold text-white ring-2 ring-white dark:ring-slate-900 animate-pulse">
              {unreadCount > 99 ? '99+' : unreadCount}
            </span>
          )}
        </div>
      }
    >
      <div className="p-2">
        <div className="flex items-center justify-between pb-3 px-2 border-b border-slate-100 dark:border-slate-800">
          <div className="flex items-center gap-2">
            <h4 className="text-xs font-bold text-slate-900 dark:text-slate-100">
              Notifications
            </h4>
            {unreadCount > 0 && (
              <span className="rounded-full bg-indigo-50 dark:bg-indigo-950/60 px-2 py-0.5 text-[10px] font-semibold text-indigo-600 dark:text-indigo-400">
                {unreadCount} new
              </span>
            )}
          </div>
          {unreadCount > 0 && (
            <button
              type="button"
              onClick={(e) => {
                e.stopPropagation();
                markAllRead();
              }}
              className="text-[11px] font-semibold text-indigo-600 dark:text-indigo-400 hover:underline flex items-center gap-1"
            >
              <CheckCheck className="w-3.5 h-3.5" />
              Mark all read
            </button>
          )}
        </div>

        <div className="max-h-72 overflow-y-auto divide-y divide-slate-100 dark:divide-slate-800 my-1">
          {recent.length === 0 ? (
            <div className="py-6 text-center text-xs text-slate-400">
              No recent notifications
            </div>
          ) : (
            recent.map((n) => (
              <div
                key={n.id}
                onClick={() => markRead(n.id)}
                className={`p-3 text-left transition-colors cursor-pointer hover:bg-slate-50 dark:hover:bg-slate-800/60 rounded-xl ${
                  !n.isRead ? 'bg-indigo-50/40 dark:bg-indigo-950/20 font-medium' : ''
                }`}
              >
                <div className="flex items-center justify-between gap-2">
                  <span className="text-xs font-semibold text-slate-900 dark:text-slate-100 truncate">
                    {n.title}
                  </span>
                  <span className="text-[10px] text-slate-400 whitespace-nowrap">
                    {dayjs(n.createdAt).fromNow()}
                  </span>
                </div>
                <p className="text-[11px] text-slate-500 dark:text-slate-400 mt-1 line-clamp-2 leading-tight">
                  {n.body}
                </p>
              </div>
            ))
          )}
        </div>

        <div className="pt-2 border-t border-slate-100 dark:border-slate-800 text-center">
          <Link
            to="/notifications"
            className="inline-flex items-center gap-1 text-xs font-semibold text-indigo-600 dark:text-indigo-400 hover:underline"
          >
            <span>View all notifications</span>
            <ArrowRight className="w-3.5 h-3.5" />
          </Link>
        </div>
      </div>
    </Dropdown>
  );
};

export default NotificationBell;
