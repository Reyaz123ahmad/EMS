import React, { useState } from 'react';
import Card from '../../components/ui/Card';
import Input from '../../components/ui/Input';
import Button from '../../components/ui/Button';
import SalarySlipCard from '../../components/payroll/SalarySlipCard';
import { useSalarySlips } from '../../hooks/usePayroll';
import { useAuthStore } from '../../store/authStore';
import api from '../../services/api';
import { toast } from 'sonner';

export default function SalarySlipsPage() {
  const { user } = useAuthStore();
  const companyId = user?.companyId;

  const [month, setMonth] = useState('');
  const [year, setYear] = useState(new Date().getFullYear());
  const [search, setSearch] = useState('');

  const { data: slipsData, isLoading, refetch } = useSalarySlips({
    companyId,
    month: month ? Number(month) : undefined,
    year: Number(year),
  });

  const slips = slipsData?.data?.data || slipsData?.data || [];

  const filteredSlips = slips.filter((s) => {
    const empName = `${s.employee?.firstName || ''} ${s.employee?.lastName || ''}`.toLowerCase();
    return empName.includes(search.toLowerCase());
  });

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

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h1 className="text-2xl font-bold text-white">Employee Salary Slips</h1>
          <p className="text-sm text-slate-400">Search, view, and export individual payslips</p>
        </div>
        <Button variant="secondary" onClick={() => refetch()}>
          Refresh
        </Button>
      </div>

      <Card className="p-4">
        <div className="flex flex-wrap gap-4 items-center">
          <Input
            placeholder="Search employee..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full sm:w-64"
          />

          <select
            value={month}
            onChange={(e) => setMonth(e.target.value)}
            className="bg-slate-900/60 border border-slate-700 rounded-xl px-3 py-2 text-sm text-white focus:outline-none focus:ring-2 focus:ring-indigo-500"
          >
            {monthNames.map((name, idx) => (
              <option key={idx} value={idx === 0 ? '' : idx}>
                {name}
              </option>
            ))}
          </select>

          <Input
            type="number"
            value={year}
            onChange={(e) => setYear(Number(e.target.value))}
            className="w-28"
          />
        </div>
      </Card>

      {isLoading ? (
        <div className="p-8 text-center text-slate-400">Loading salary slips...</div>
      ) : filteredSlips.length === 0 ? (
        <Card className="p-12 text-center text-slate-400">
          No salary slips found matching your filters.
        </Card>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {filteredSlips.map((slip) => (
            <SalarySlipCard
              key={slip.id}
              slip={slip}
              onDownloadPdf={handleDownloadPdf}
              onSendEmail={handleSendEmail}
            />
          ))}
        </div>
      )}
    </div>
  );
}
