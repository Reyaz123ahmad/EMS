import React, { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { RefreshCw } from 'lucide-react';
import Card from '../../components/ui/Card';
import Input from '../../components/ui/Input';
import Button from '../../components/ui/Button';
import SalarySlipCard from '../../components/payroll/SalarySlipCard';
import payrollService from '../../services/payroll.service';
import useAuthStore from '../../store/auth.store';
import api from '../../services/api';
import { toast } from 'sonner';

export default function SalarySlipsPage() {
  const { user } = useAuthStore();
  const companyId = user?.companyId;
  const userRoles = user?.roles || (user?.role ? [user.role] : ['EMPLOYEE']);
  const isEmployee = userRoles.includes('EMPLOYEE') && !userRoles.some((r) => ['SUPER_ADMIN', 'COMPANY_ADMIN', 'HR_ADMIN', 'HR_MANAGER', 'MANAGER'].includes(r));

  const [month, setMonth] = useState('');
  const [year, setYear] = useState(new Date().getFullYear());
  const [search, setSearch] = useState('');
  const [isManualRefreshing, setIsManualRefreshing] = useState(false);

  const { data: slipsData, isLoading, isFetching, refetch } = useQuery({
    queryKey: ['salary-slips', isEmployee ? 'my' : 'all', companyId, month, year],
    queryFn: () =>
      isEmployee
        ? payrollService.getMySlips({
            month: month ? Number(month) : undefined,
            year: Number(year),
          })
        : payrollService.getAllSlips({
            companyId,
            month: month ? Number(month) : undefined,
            year: Number(year),
          }),
  });

  const handleRefresh = async () => {
    setIsManualRefreshing(true);
    try {
      await refetch();
      toast.success('Payslips updated');
    } catch (error) {
      toast.error('Failed to refresh payslips');
    } finally {
      setTimeout(() => {
        setIsManualRefreshing(false);
      }, 400);
    }
  };

  const slips = Array.isArray(slipsData)
    ? slipsData
    : Array.isArray(slipsData?.slips)
    ? slipsData.slips
    : Array.isArray(slipsData?.data?.slips)
    ? slipsData.data.slips
    : Array.isArray(slipsData?.data)
    ? slipsData.data
    : [];

  const filteredSlips = Array.isArray(slips)
    ? slips.filter((s) => {
        if (!s) return false;
        if (isEmployee) return true;
        const emp = s.employee || s.payrollItem?.employee;
        const empName = `${emp?.firstName || ''} ${emp?.lastName || ''} ${emp?.employeeCode || ''} ${s.slipNumber || ''}`.toLowerCase();
        return empName.includes(search.toLowerCase());
      })
    : [];

  const handleDownloadPdf = async (slipId) => {
    try {
      toast.info('Downloading salary slip PDF...');
      const response = await api.get(`/payroll/slips/${slipId}/download`, {
        responseType: 'blob'
      });
      const url = window.URL.createObjectURL(new Blob([response.data], { type: 'application/pdf' }));
      const link = document.createElement('a');
      link.href = url;
      link.setAttribute('download', `salary-slip-${slipId}.pdf`);
      document.body.appendChild(link);
      link.click();
      link.remove();
      window.URL.revokeObjectURL(url);
      toast.success('Salary slip downloaded successfully');
    } catch (error) {
      toast.error('Download failed');
    }
  };

  const handleSendEmail = (slipId) => {
    alert(`Salary slip queued for email delivery to employee!`);
  };

  const monthNames = [
    'All Months', 'January', 'February', 'March', 'April', 'May', 'June',
    'July', 'August', 'September', 'October', 'November', 'December'
  ];

  const isSpinning = isManualRefreshing || isFetching;

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h1 className="text-2xl font-bold text-white">
            {isEmployee ? 'My Payslips' : 'Salary Slips'}
          </h1>
          <p className="text-sm text-slate-400">
            {isEmployee
              ? 'View and download your monthly salary slips'
              : 'Search, view, and export individual payslips'}
          </p>
        </div>
        <Button
          variant="secondary"
          onClick={handleRefresh}
          disabled={isSpinning}
          className="flex items-center gap-2"
        >
          <RefreshCw className={`w-4 h-4 ${isSpinning ? 'animate-spin' : ''}`} />
          Refresh
        </Button>
      </div>

      <Card className="p-4">
        <div className="flex flex-col sm:flex-row gap-4 items-stretch sm:items-center justify-between w-full">
          {!isEmployee ? (
            <div className="flex flex-wrap items-center gap-3 flex-1">
              <div className="w-full sm:w-64">
                <Input
                  placeholder="Search employee..."
                  value={search}
                  onChange={(e) => setSearch(e.target.value)}
                />
              </div>
              <select
                value={month}
                onChange={(e) => setMonth(e.target.value)}
                className="bg-slate-900/60 border border-slate-700 rounded-xl px-3 py-2 text-sm text-white focus:outline-none focus:ring-2 focus:ring-indigo-500 h-9"
              >
                {monthNames.map((name, idx) => (
                  <option key={idx} value={idx === 0 ? '' : idx}>
                    {name}
                  </option>
                ))}
              </select>
            </div>
          ) : (
            <select
              value={month}
              onChange={(e) => setMonth(e.target.value)}
              className="bg-slate-900/60 border border-slate-700 rounded-xl px-3 py-2 text-sm text-white focus:outline-none focus:ring-2 focus:ring-indigo-500 h-9 min-w-[170px]"
            >
              {monthNames.map((name, idx) => (
                <option key={idx} value={idx === 0 ? '' : idx}>
                  {name}
                </option>
              ))}
            </select>
          )}

          <div className="flex items-center justify-end">
            <input
              type="number"
              value={year}
              onChange={(e) => setYear(Number(e.target.value))}
              min="2000"
              max="2100"
              placeholder="Year"
              className="w-28 h-9 bg-slate-900/60 border border-slate-700 rounded-xl px-3 py-1.5 text-sm text-white focus:outline-none focus:ring-2 focus:ring-indigo-500"
            />
          </div>
        </div>
      </Card>

      {isLoading ? (
        <div className="p-8 text-center text-slate-400">Loading salary slips...</div>
      ) : filteredSlips.length === 0 ? (
        <Card className="p-12 text-center text-slate-400">
          {isEmployee ? 'No payslips found.' : 'No salary slips found matching your filters.'}
        </Card>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {filteredSlips.map((slip) => (
            <SalarySlipCard
              key={slip.id}
              slip={slip}
              onDownloadPdf={handleDownloadPdf}
              onSendEmail={isEmployee ? undefined : handleSendEmail}
            />
          ))}
        </div>
      )}
    </div>
  );
}
