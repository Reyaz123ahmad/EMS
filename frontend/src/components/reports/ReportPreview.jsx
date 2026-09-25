import React from 'react';
import { Card } from '../ui/Card.jsx';
import { DataTable } from '../ui/DataTable.jsx';

export function ReportPreview({ reportData, isLoading }) {
  if (isLoading) {
    return (
      <Card className="p-12 bg-slate-900/70 border-slate-800 text-center backdrop-blur-md">
        <div className="animate-spin rounded-full h-10 w-10 border-b-2 border-blue-500 mx-auto mb-4"></div>
        <p className="text-sm text-slate-400">Processing report analytics & compiling dataset...</p>
      </Card>
    );
  }

  if (!reportData || !reportData.rows || reportData.rows.length === 0) {
    return (
      <Card className="p-12 bg-slate-900/70 border-slate-800 text-center backdrop-blur-md">
        <div className="w-12 h-12 mx-auto rounded-2xl bg-slate-800/80 border border-slate-700 flex items-center justify-center text-slate-400 mb-3">
          <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 17v-2m3 2v-4m3 4v-6m2 10H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
          </svg>
        </div>
        <h4 className="text-base font-semibold text-slate-200">No Records Found</h4>
        <p className="text-xs text-slate-500 max-w-sm mx-auto mt-1">
          Select parameters above and click "Run Report Query" to view tabulated data.
        </p>
      </Card>
    );
  }

  const keys = Object.keys(reportData.rows[0] || {});
  const columns = keys.map((key) => ({
    header: key.replace(/([A-Z])/g, ' $1').trim(),
    key: key,
    render: (row) => {
      const val = row[key];
      if (typeof val === 'boolean') return val ? 'Yes' : 'No';
      if (val === null || val === undefined) return '—';
      return String(val);
    }
  }));

  return (
    <div className="space-y-3">
      <div className="flex items-center justify-between text-xs text-slate-400 px-1">
        <span>Generated: <strong className="text-slate-300">{new Date(reportData.generatedAt).toLocaleString()}</strong></span>
        <span>Total Records: <strong className="text-blue-400">{reportData.totalRecords}</strong></span>
      </div>

      <DataTable
        columns={columns}
        data={reportData.rows}
        emptyMessage="No rows in dataset."
      />
    </div>
  );
}

export default ReportPreview;
