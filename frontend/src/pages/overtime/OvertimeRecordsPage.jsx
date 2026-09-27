import React, { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import useAuthStore from '../../store/auth.store.js';
import Card from '../../components/ui/Card';
import Table from '../../components/ui/Table';
import Button from '../../components/ui/Button';
import Input from '../../components/ui/Input';
import Badge from '../../components/ui/Badge';
import overtimeService from '../../services/overtime.service.js';
import { formatDate, formatCurrency, formatDuration } from '../../utils/formatters';

export default function OvertimeRecordsPage() {
  const { user } = useAuthStore();
  const companyId = user?.companyId;

  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState('');

  const { data: rawData = [], isLoading, error, refetch } = useQuery({
    queryKey: ['overtime-records', companyId, statusFilter],
    queryFn: () => overtimeService.listOvertimeRecords({
      companyId,
      status: statusFilter || undefined,
    }),
  });

  const records = Array.isArray(rawData)
    ? rawData
    : Array.isArray(rawData?.records)
    ? rawData.records
    : Array.isArray(rawData?.data?.records)
    ? rawData.data.records
    : Array.isArray(rawData?.data?.data)
    ? rawData.data.data
    : Array.isArray(rawData?.data)
    ? rawData.data
    : [];

  const filteredRecords = records.filter((r) => {
    if (!r) return false;
    const empName = `${r.employee?.firstName || ''} ${r.employee?.lastName || ''}`.toLowerCase();
    const code = (r.employee?.employeeCode || '').toLowerCase();
    const term = search.toLowerCase();
    return empName.includes(term) || code.includes(term);
  });

  const columns = [
    {
      header: 'Employee',
      accessor: 'employee',
      cell: (row) => (
        <div>
          <div className="font-semibold text-white">
            {row.employee ? `${row.employee.firstName} ${row.employee.lastName}` : 'N/A'}
          </div>
          <div className="text-xs text-slate-400">
            {row.employee?.employeeCode || row.employee?.department?.name || 'Staff'}
          </div>
        </div>
      ),
    },
    {
      header: 'Date',
      accessor: 'date',
      cell: (row) => <span className="text-slate-200">{formatDate(row.date)}</span>,
    },
    {
      header: 'Duration',
      accessor: 'minutes',
      cell: (row) => (
        <span className="font-bold text-amber-400">
          {formatDuration(row.minutes || row.requestedMinutes || (row.duration ? row.duration * 60 : 0))}
        </span>
      ),
    },
    {
      header: 'Rate Multiplier',
      accessor: 'multiplier',
      cell: (row) => <span className="text-slate-300 font-medium">{row.multiplier || 1.5}x</span>,
    },
    {
      header: 'Payout',
      accessor: 'amount',
      cell: (row) => (
        <span className="font-semibold text-emerald-400">
          {row.amount ? formatCurrency(row.amount) : 'Pending Calc'}
        </span>
      ),
    },
    {
      header: 'Status',
      accessor: 'status',
      cell: (row) => (
        <Badge
          variant={
            row.status === 'APPROVED' ? 'success' : row.status === 'REJECTED' ? 'danger' : 'warning'
          }
        >
          {row.status}
        </Badge>
      ),
    },
  ];

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h1 className="text-2xl font-bold text-white">Overtime Records & Logs</h1>
          <p className="text-sm text-slate-400">Comprehensive log of logged overtime hours and payroll calculations</p>
        </div>
        <Button variant="secondary" onClick={() => refetch()}>
          Refresh
        </Button>
      </div>

      <Card className="p-4">
        <div className="flex flex-col sm:flex-row gap-4 justify-between items-center mb-4">
          <Input
            placeholder="Search employee..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full sm:w-80"
          />
          <select
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
            className="bg-slate-900/60 border border-slate-700 rounded-xl px-3 py-2 text-sm text-white focus:outline-none focus:ring-2 focus:ring-indigo-500"
          >
            <option value="">All Statuses</option>
            <option value="APPROVED">Approved</option>
            <option value="PENDING">Pending</option>
            <option value="REJECTED">Rejected</option>
          </select>
        </div>

        <Table columns={columns} data={filteredRecords} isLoading={isLoading} />
      </Card>
    </div>
  );
}
