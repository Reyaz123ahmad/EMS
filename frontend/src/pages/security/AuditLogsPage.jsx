import React, { useState } from 'react';
import { useAuditLogs } from '../../hooks/useAdvancedSecurity.js';
import AuditLogTable from '../../components/security/AuditLogTable.jsx';
import { FileText, Download, Filter } from 'lucide-react';
import { toast } from 'sonner';

export function AuditLogsPage() {
  const [actionFilter, setActionFilter] = useState('');
  const { data: logs = [], isLoading } = useAuditLogs(actionFilter ? { action: actionFilter } : {});

  const handleExport = () => {
    toast.success('Exporting audit trail logs as CSV...');
  };

  return (
    <div className="max-w-7xl mx-auto space-y-8 py-6 px-4 sm:px-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl sm:text-3xl font-bold text-slate-900 dark:text-white">
            Compliance Audit Trail
          </h1>
          <p className="text-sm text-slate-500 dark:text-slate-400 mt-1">
            Immutable log of system modifications, policy changes, and employee record edits.
          </p>
        </div>

        <div className="flex items-center gap-3">
          <select
            value={actionFilter}
            onChange={(e) => setActionFilter(e.target.value)}
            className="rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 px-3 py-2 text-xs font-semibold"
          >
            <option value="">All Actions</option>
            <option value="CREATE">CREATE</option>
            <option value="UPDATE">UPDATE</option>
            <option value="DELETE">DELETE</option>
            <option value="LOGIN">LOGIN</option>
          </select>

          <button
            onClick={handleExport}
            className="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-xl bg-slate-900 hover:bg-slate-800 dark:bg-white dark:hover:bg-slate-100 text-white dark:text-slate-900 text-xs font-bold transition-colors"
          >
            <Download className="h-4 w-4" /> Export
          </button>
        </div>
      </div>

      <AuditLogTable logs={logs} isLoading={isLoading} />
    </div>
  );
}

export default AuditLogsPage;
