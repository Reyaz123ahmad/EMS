import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import { useGenerateReport, useExportReport } from '../../hooks/useReports.js';
import { useDepartments, useBranches } from '../../hooks/useOrganization.js';
import { ReportFilters } from '../../components/reports/ReportFilters.jsx';
import { ReportPreview } from '../../components/reports/ReportPreview.jsx';
import { ExportButton } from '../../components/reports/ExportButton.jsx';
import { Card } from '../../components/ui/Card.jsx';
import { Button } from '../../components/ui/Button.jsx';

const REPORT_CATEGORIES = [
  { id: 'ATTENDANCE', label: 'Attendance & Punches', icon: 'M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z', desc: 'Daily logs, punctuality, method & work duration' },
  { id: 'EMPLOYEE', label: 'Employee Directory', icon: 'M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z', desc: 'Active headcount, contact info, roles & status' },
  { id: 'LEAVE', label: 'Leave & Absences', icon: 'M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z', desc: 'Approved, pending leaves, time-off allocations' },
  { id: 'PAYROLL', label: 'Payroll Summaries', icon: 'M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z', desc: 'Salary runs, gross payouts, and deduction audits' },
  { id: 'OVERTIME', label: 'Overtime Logs', icon: 'M13 10V3L4 14h7v7l9-11h-7z', desc: 'Extended work hours and extra duty logs' },
  { id: 'PERFORMANCE', label: 'Performance Reviews', icon: 'M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z', desc: 'Quarterly appraisals, KPI evaluations' },
  { id: 'PROJECT', label: 'Project Allocations', icon: 'M19 11H5m14 0a2 2 0 012 2v6a2 2 0 01-2 2H5a2 2 0 01-2-2v-6a2 2 0 012-2m14 0V9a2 2 0 00-2-2M5 11V9a2 2 0 012-2m0 0V5a2 2 0 012-2h6a2 2 0 012 2v2M7 7h10', desc: 'Staff allocation across deliverables' },
  { id: 'CLIENT', label: 'Client Accounts', icon: 'M21 13.255A23.931 23.931 0 0112 15c-3.183 0-6.22-.62-9-1.745M16 6V4a2 2 0 00-2-2h-4a2 2 0 00-2 2v2m4 6h.01M5 20h14a2 2 0 002-2V8a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z', desc: 'Client rosters and engagement mapping' }
];

export function ReportsPage() {
  const [selectedType, setSelectedType] = useState('ATTENDANCE');
  const [filters, setFilters] = useState({
    startDate: '',
    endDate: '',
    departmentId: '',
    branchId: ''
  });

  const [reportData, setReportData] = useState(null);
  const [errorMsg, setErrorMsg] = useState('');

  const generateMutation = useGenerateReport();
  const exportMutation = useExportReport();

  const { data: deptData } = useDepartments();
  const { data: branchData } = useBranches();

  const departments = deptData?.data?.departments || [];
  const branches = branchData?.data?.branches || [];

  const handleGenerate = async () => {
    setErrorMsg('');
    try {
      const response = await generateMutation.mutateAsync({
        type: selectedType,
        filters
      });
      setReportData(response.data || response);
    } catch (err) {
      setErrorMsg(err.response?.data?.message || 'Failed to generate report dataset.');
    }
  };

  const handleCloudArchive = async () => {
    try {
      await exportMutation.mutateAsync({
        type: selectedType,
        filters,
        format: 'CSV'
      });
      alert('Report exported and logged to Cloud Report History.');
    } catch (err) {
      alert('Failed to archive report.');
    }
  };

  return (
    <div className="p-6 max-w-7xl mx-auto space-y-6">
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl sm:text-3xl font-bold tracking-tight text-white">
            Analytics & Reports
          </h1>
          <p className="text-sm text-slate-400 mt-1">
            Generate custom data exports, compliance logs, attendance matrices, and financial statements.
          </p>
        </div>

        <div className="flex items-center gap-3">
          <Link to="/reports/history">
            <Button variant="outline" size="sm" className="border-slate-700 hover:bg-slate-800 text-slate-200">
              <svg className="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
              Export History
            </Button>
          </Link>
        </div>
      </div>

      {errorMsg && (
        <div className="p-4 rounded-xl bg-red-500/10 border border-red-500/30 text-red-400 text-sm">
          {errorMsg}
        </div>
      )}

      {/* Report Categories Grid */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
        {REPORT_CATEGORIES.map((cat) => {
          const isSelected = selectedType === cat.id;
          return (
            <button
              key={cat.id}
              onClick={() => {
                setSelectedType(cat.id);
                setReportData(null);
              }}
              className={`p-4 rounded-2xl border text-left transition-all cursor-pointer ${
                isSelected
                  ? 'bg-blue-600/10 border-blue-500 text-blue-400 shadow-lg shadow-blue-500/10'
                  : 'bg-slate-900/60 border-slate-800 text-slate-400 hover:border-slate-700 hover:text-slate-200'
              }`}
            >
              <svg className="w-6 h-6 mb-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d={cat.icon} />
              </svg>
              <div className="font-semibold text-sm text-white">{cat.label}</div>
              <div className="text-[11px] text-slate-500 mt-1 line-clamp-1">{cat.desc}</div>
            </button>
          );
        })}
      </div>

      {/* Filters Form */}
      <ReportFilters
        filters={filters}
        onChange={setFilters}
        onGenerate={handleGenerate}
        isLoading={generateMutation.isPending}
        departments={departments}
        branches={branches}
      />

      {/* Action and Preview Section */}
      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <h2 className="text-lg font-bold text-white">
            {REPORT_CATEGORIES.find((c) => c.id === selectedType)?.label} Data
          </h2>

          {reportData && reportData.rows && reportData.rows.length > 0 && (
            <ExportButton
              data={reportData.rows}
              fileName={`${selectedType.toLowerCase()}_report`}
              onExportApi={handleCloudArchive}
              isLoading={exportMutation.isPending}
            />
          )}
        </div>

        <ReportPreview reportData={reportData} isLoading={generateMutation.isPending} />
      </div>
    </div>
  );
}

export default ReportsPage;
