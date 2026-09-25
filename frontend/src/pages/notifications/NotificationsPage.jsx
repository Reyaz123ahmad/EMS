import React, { useState, useEffect } from 'react';
import useNotificationStore from '../../store/notification.store';
import {
  Bell,
  CheckCheck,
  Trash2,
  Filter,
  CheckCircle2,
  Clock,
  ShieldAlert,
  Calendar,
  DollarSign,
  FileCheck,
  Megaphone,
  Inbox
} from 'lucide-react';
import Button from '../../components/ui/Button';
import Badge from '../../components/ui/Badge';
import Pagination from '../../components/ui/Pagination';
import EmptyState from '../../components/ui/EmptyState';
import Skeleton from '../../components/ui/Skeleton';
import dayjs from 'dayjs';
import relativeTime from 'dayjs/plugin/relativeTime';

dayjs.extend(relativeTime);

export const NotificationsPage = () => {
  const {
    notifications,
    isLoading,
    pagination,
    fetchNotifications,
    markRead,
    markAllRead,
    deleteNotification
  } = useNotificationStore();

  const [filterType, setFilterType] = useState('');
  const [filterPriority, setFilterPriority] = useState('');
  const [filterStatus, setFilterStatus] = useState('ALL'); // 'ALL' | 'UNREAD' | 'READ'
  const [page, setPage] = useState(1);

  useEffect(() => {
    const filters = {};
    if (filterType) filters.type = filterType;
    if (filterPriority) filters.priority = filterPriority;
    if (filterStatus === 'UNREAD') filters.isRead = false;
    if (filterStatus === 'READ') filters.isRead = true;

    fetchNotifications(filters, { page, limit: 15 });
  }, [filterType, filterPriority, filterStatus, page, fetchNotifications]);

  const getTypeIcon = (type) => {
    switch (type) {
      case 'ATTENDANCE':
        return <Clock className="w-4 h-4 text-emerald-500" />;
      case 'LEAVE':
        return <Calendar className="w-4 h-4 text-amber-500" />;
      case 'PAYROLL':
        return <DollarSign className="w-4 h-4 text-sky-500" />;
      case 'SECURITY':
        return <ShieldAlert className="w-4 h-4 text-rose-500" />;
      case 'APPROVAL':
        return <FileCheck className="w-4 h-4 text-indigo-500" />;
      case 'ANNOUNCEMENT':
        return <Megaphone className="w-4 h-4 text-purple-500" />;
      default:
        return <Bell className="w-4 h-4 text-slate-500" />;
    }
  };

  const getPriorityBadge = (priority) => {
    switch (priority) {
      case 'URGENT':
        return <Badge variant="danger" size="sm">Urgent</Badge>;
      case 'HIGH':
        return <Badge variant="warning" size="sm">High</Badge>;
      case 'LOW':
        return <Badge variant="neutral" size="sm">Low</Badge>;
      case 'MEDIUM':
      default:
        return <Badge variant="primary" size="sm">Normal</Badge>;
    }
  };

  return (
    <div className="space-y-6 animate-in fade-in-0 duration-200">
      {/* Page Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-slate-900 dark:text-slate-100 flex items-center gap-2.5">
            <Bell className="w-6 h-6 text-indigo-600 dark:text-indigo-400" />
            Notifications
          </h1>
          <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">
            Stay updated with system announcements, approvals, security alerts, and tasks.
          </p>
        </div>

        <div className="flex items-center gap-2.5">
          <Button
            variant="outline"
            size="sm"
            onClick={() => markAllRead()}
            disabled={notifications.length === 0}
            className="flex items-center gap-2 text-xs"
          >
            <CheckCheck className="w-4 h-4 text-emerald-500" />
            Mark all read
          </Button>
        </div>
      </div>

      {/* Filters Bar */}
      <div className="flex flex-wrap items-center gap-3 p-4 rounded-2xl border border-slate-200/80 dark:border-slate-800 bg-white/80 dark:bg-slate-900/80 backdrop-blur-md shadow-sm">
        <div className="flex items-center gap-2 text-xs font-semibold text-slate-500 dark:text-slate-400 mr-2">
          <Filter className="w-4 h-4 text-indigo-500" />
          Filter:
        </div>

        {/* Status Filter */}
        <div className="inline-flex rounded-xl bg-slate-100 dark:bg-slate-800 p-1">
          {['ALL', 'UNREAD', 'READ'].map((status) => (
            <button
              key={status}
              type="button"
              onClick={() => {
                setFilterStatus(status);
                setPage(1);
              }}
              className={`px-3 py-1 text-xs font-medium rounded-lg transition-colors ${
                filterStatus === status
                  ? 'bg-white dark:bg-slate-700 text-indigo-600 dark:text-indigo-400 shadow-sm'
                  : 'text-slate-600 dark:text-slate-300 hover:text-slate-900 dark:hover:text-white'
              }`}
            >
              {status.charAt(0) + status.slice(1).toLowerCase()}
            </button>
          ))}
        </div>

        {/* Type Select */}
        <select
          value={filterType}
          onChange={(e) => {
            setFilterType(e.target.value);
            setPage(1);
          }}
          className="rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 px-3 py-1.5 text-xs text-slate-700 dark:text-slate-200 focus:outline-none focus:ring-2 focus:ring-indigo-500/20"
        >
          <option value="">All Types</option>
          <option value="ATTENDANCE">Attendance</option>
          <option value="LEAVE">Leave</option>
          <option value="PAYROLL">Payroll</option>
          <option value="SECURITY">Security</option>
          <option value="APPROVAL">Approval</option>
          <option value="ANNOUNCEMENT">Announcement</option>
          <option value="SYSTEM">System</option>
        </select>

        {/* Priority Select */}
        <select
          value={filterPriority}
          onChange={(e) => {
            setFilterPriority(e.target.value);
            setPage(1);
          }}
          className="rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 px-3 py-1.5 text-xs text-slate-700 dark:text-slate-200 focus:outline-none focus:ring-2 focus:ring-indigo-500/20"
        >
          <option value="">All Priorities</option>
          <option value="URGENT">Urgent</option>
          <option value="HIGH">High</option>
          <option value="MEDIUM">Medium</option>
          <option value="LOW">Low</option>
        </select>
      </div>

      {/* Notifications List */}
      <div className="space-y-3">
        {isLoading ? (
          <div className="space-y-3">
            {[1, 2, 3, 4].map((i) => (
              <div key={i} className="p-4 rounded-2xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 space-y-2">
                <Skeleton width="40%" height="16px" />
                <Skeleton width="80%" height="14px" />
              </div>
            ))}
          </div>
        ) : notifications.length === 0 ? (
          <EmptyState
            icon={Inbox}
            title="No notifications"
            description="You are all caught up! No notifications match your selected filters."
          />
        ) : (
          notifications.map((item) => (
            <div
              key={item.id}
              className={`group flex items-start justify-between gap-4 p-4 sm:p-5 rounded-2xl border transition-all duration-200 shadow-sm ${
                !item.isRead
                  ? 'border-indigo-200 bg-indigo-50/30 dark:border-indigo-900/50 dark:bg-indigo-950/20 ring-1 ring-indigo-500/10'
                  : 'border-slate-200/80 bg-white dark:border-slate-800 dark:bg-slate-900 hover:border-slate-300 dark:hover:border-slate-700'
              }`}
            >
              <div className="flex items-start gap-3.5">
                <div className={`w-9 h-9 rounded-xl flex items-center justify-center flex-shrink-0 mt-0.5 shadow-sm ${
                  !item.isRead
                    ? 'bg-indigo-600 text-white shadow-indigo-500/30'
                    : 'bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300'
                }`}>
                  {getTypeIcon(item.type)}
                </div>

                <div className="space-y-1">
                  <div className="flex flex-wrap items-center gap-2">
                    <h3 className={`text-sm font-semibold ${
                      !item.isRead ? 'text-indigo-950 dark:text-indigo-200' : 'text-slate-900 dark:text-slate-100'
                    }`}>
                      {item.title}
                    </h3>
                    {getPriorityBadge(item.priority)}
                    {!item.isRead && (
                      <span className="w-2 h-2 rounded-full bg-indigo-600 animate-pulse" />
                    )}
                  </div>

                  <p className="text-xs text-slate-600 dark:text-slate-300 leading-relaxed max-w-2xl">
                    {item.body}
                  </p>

                  <div className="flex items-center gap-3 pt-1 text-[11px] text-slate-400 dark:text-slate-500 font-medium">
                    <span>{dayjs(item.createdAt).fromNow()}</span>
                    <span>•</span>
                    <span className="uppercase tracking-wider font-semibold">{item.type}</span>
                  </div>
                </div>
              </div>

              {/* Actions */}
              <div className="flex items-center gap-1.5 opacity-90 group-hover:opacity-100 transition-opacity">
                {!item.isRead && (
                  <button
                    type="button"
                    onClick={() => markRead(item.id)}
                    title="Mark as read"
                    className="p-1.5 rounded-lg text-slate-400 hover:text-indigo-600 hover:bg-indigo-50 dark:hover:bg-indigo-950/40 transition-colors"
                  >
                    <CheckCircle2 className="w-4 h-4" />
                  </button>
                )}
                <button
                  type="button"
                  onClick={() => deleteNotification(item.id)}
                  title="Delete"
                  className="p-1.5 rounded-lg text-slate-400 hover:text-rose-600 hover:bg-rose-50 dark:hover:bg-rose-950/40 transition-colors"
                >
                  <Trash2 className="w-4 h-4" />
                </button>
              </div>
            </div>
          ))
        )}
      </div>

      {/* Pagination */}
      {pagination && pagination.totalPages > 1 && (
        <Pagination
          currentPage={pagination.page}
          totalPages={pagination.totalPages}
          totalItems={pagination.total}
          limit={pagination.limit}
          onPageChange={(newPage) => setPage(newPage)}
        />
      )}
    </div>
  );
};

export default NotificationsPage;
