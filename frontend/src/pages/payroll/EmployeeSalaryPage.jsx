import React from 'react';
import { useParams } from 'react-router-dom';
import SalaryBreakdown from '../../components/payroll/SalaryBreakdown';
import Card from '../../components/ui/Card';
import Button from '../../components/ui/Button';
import { useEmployeeSalaryStructure } from '../../hooks/usePayroll';
import { useAuthStore } from '../../store/authStore';

export default function EmployeeSalaryPage() {
  const { id } = useParams();
  const { user } = useAuthStore();
  const employeeId = id || user?.employeeId || user?.id;

  const { data: structureData, isLoading, refetch } = useEmployeeSalaryStructure(employeeId);
  const structure = structureData?.data?.data || structureData?.data;

  return (
    <div className="space-y-6 max-w-4xl mx-auto">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-2xl font-bold text-white">Employee Compensation & Structure</h1>
          <p className="text-sm text-slate-400">Detailed breakdown of fixed compensation and allowances</p>
        </div>
        <Button variant="secondary" onClick={() => refetch()}>
          Refresh
        </Button>
      </div>

      {isLoading ? (
        <div className="p-8 text-center text-slate-400">Loading compensation details...</div>
      ) : (
        <SalaryBreakdown
          structure={structure}
          employeeName={user?.name || `${user?.firstName || ''} ${user?.lastName || ''}`}
        />
      )}
    </div>
  );
}
