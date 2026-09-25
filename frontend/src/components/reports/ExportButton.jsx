import React, { useState } from 'react';
import { Button } from '../ui/Button.jsx';
import * as XLSX from 'xlsx';

export function ExportButton({ data = [], fileName = 'report', onExportApi, isLoading }) {
  const [isExportingLocal, setIsExportingLocal] = useState(false);

  const exportAsCSV = () => {
    if (!data.length) return;
    setIsExportingLocal(true);
    try {
      const ws = XLSX.utils.json_to_sheet(data);
      const wb = XLSX.utils.book_new();
      XLSX.utils.book_append_sheet(wb, ws, 'Report');
      XLSX.writeFile(wb, `${fileName}_${Date.now()}.csv`);
    } catch (err) {
      console.error(err);
    } finally {
      setIsExportingLocal(false);
    }
  };

  const exportAsExcel = () => {
    if (!data.length) return;
    setIsExportingLocal(true);
    try {
      const ws = XLSX.utils.json_to_sheet(data);
      const wb = XLSX.utils.book_new();
      XLSX.utils.book_append_sheet(wb, ws, 'Report');
      XLSX.writeFile(wb, `${fileName}_${Date.now()}.xlsx`);
    } catch (err) {
      console.error(err);
    } finally {
      setIsExportingLocal(false);
    }
  };

  return (
    <div className="flex items-center gap-2">
      <Button
        variant="outline"
        size="sm"
        disabled={!data.length || isLoading || isExportingLocal}
        onClick={exportAsCSV}
        className="border-slate-700 hover:bg-slate-800 text-xs text-slate-200"
      >
        <svg className="w-3.5 h-3.5 mr-1.5 text-slate-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4" />
        </svg>
        Export CSV
      </Button>

      <Button
        variant="outline"
        size="sm"
        disabled={!data.length || isLoading || isExportingLocal}
        onClick={exportAsExcel}
        className="border-slate-700 hover:bg-slate-800 text-xs text-slate-200"
      >
        <svg className="w-3.5 h-3.5 mr-1.5 text-emerald-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
        </svg>
        Export Excel
      </Button>

      {onExportApi && (
        <Button
          size="sm"
          disabled={!data.length || isLoading}
          onClick={onExportApi}
          className="bg-blue-600 hover:bg-blue-500 text-xs text-white"
        >
          Cloud Archive
        </Button>
      )}
    </div>
  );
}

export default ExportButton;
