import React from 'react';

export function AuditLogTable({ logs = [], isLoading }) {
  if (isLoading) {
    return (
      <div className="p-8 text-center text-sm text-slate-400 animate-pulse">
        Loading audit logs...
      </div>
    );
  }

  if (logs.length === 0) {
    return (
      <div className="p-8 text-center text-sm text-slate-400 rounded-2xl border border-dashed border-slate-200 dark:border-slate-800">
        No audit log records found.
      </div>
    );
  }

  return (
    <div className="overflow-x-auto rounded-2xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 shadow-sm">
      <table className="w-full text-left text-xs">
        <thead>
          <tr className="border-b border-slate-100 dark:border-slate-800 bg-slate-50 dark:bg-slate-800/50 text-slate-500 dark:text-slate-400">
            <th className="py-3 px-4 font-semibold">Timestamp</th>
            <th className="py-3 px-4 font-semibold">User</th>
            <th className="py-3 px-4 font-semibold">Action</th>
            <th className="py-3 px-4 font-semibold">Entity</th>
            <th className="py-3 px-4 font-semibold">IP Address</th>
          </tr>
        </thead>
        <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
          {logs.map((log) => (
            <tr key={log.id} className="hover:bg-slate-50/50 dark:hover:bg-slate-800/30">
              <td className="py-3 px-4 text-slate-500 dark:text-slate-400 whitespace-nowrap">
                {log.createdAt ? new Date(log.createdAt).toLocaleString() : 'Recent'}
              </td>
              <td className="py-3 px-4 font-medium text-slate-900 dark:text-white">
                {log.user?.email || log.userId || 'System'}
              </td>
              <td className="py-3 px-4">
                <span className="px-2 py-0.5 rounded-md font-semibold bg-indigo-50 dark:bg-indigo-950/40 text-indigo-600 dark:text-indigo-400">
                  {log.action}
                </span>
              </td>
              <td className="py-3 px-4 text-slate-700 dark:text-slate-300">
                {log.entity} {log.entityId ? `(#${log.entityId.slice(0, 6)})` : ''}
              </td>
              <td className="py-3 px-4 font-mono text-slate-400">
                {log.ipAddress || '—'}
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

export default AuditLogTable;
