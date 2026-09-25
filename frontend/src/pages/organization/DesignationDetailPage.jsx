import React from 'react';
import { useParams, Link } from 'react-router-dom';
import { useDesignation } from '../../hooks/useOrganization.js';
import { Card } from '../../components/ui/Card.jsx';
import { Button } from '../../components/ui/Button.jsx';
import { DataTable } from '../../components/ui/DataTable.jsx';

export function DesignationDetailPage() {
  const { id } = useParams();
  const { data, isLoading } = useDesignation(id);

  if (isLoading) {
    return (
      <div className="p-8 flex items-center justify-center min-h-[400px]">
        <div className="animate-spin rounded-full h-10 w-10 border-b-2 border-blue-500"></div>
      </div>
    );
  }

  const designation = data?.data?.designation;

  if (!designation) {
    return (
      <div className="p-6 max-w-4xl mx-auto text-center space-y-4">
        <h2 className="text-xl font-bold text-white">Designation Not Found</h2>
        <Link to="/organization/designations">
          <Button variant="outline">Back to Designations</Button>
        </Link>
      </div>
    );
  }

  const employeeColumns = [
    {
      header: 'Employee',
      key: 'name',
      render: (r) => (
        <div className="font-medium text-slate-100">
          {r.firstName} {r.lastName}
        </div>
      )
    },
    { header: 'Code', key: 'employeeCode' },
    { header: 'Department', key: 'department', render: (r) => r.department?.name || '—' },
    { header: 'Branch', key: 'branch', render: (r) => r.branch?.name || '—' },
    { header: 'Status', key: 'status' }
  ];

  return (
    <div className="p-6 max-w-7xl mx-auto space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <div className="flex items-center gap-2 text-sm text-slate-400 mb-1">
            <Link to="/organization/designations" className="hover:text-white transition-colors">Designations</Link>
            <span>/</span>
            <span className="text-slate-200">{designation.name}</span>
          </div>
          <h1 className="text-2xl sm:text-3xl font-bold text-white">{designation.name}</h1>
        </div>

        <Link to="/organization/designations">
          <Button variant="outline" size="sm" className="border-slate-700">
            Back to Designations
          </Button>
        </Link>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <Card className="p-6 bg-slate-900/70 border-slate-800 backdrop-blur-md space-y-4">
          <h3 className="text-base font-semibold text-white">Role Details</h3>
          <div className="space-y-3 text-sm">
            <div>
              <span className="text-xs text-slate-400 block">Designation Code</span>
              <span className="font-mono text-slate-200">{designation.code || 'N/A'}</span>
            </div>
            <div>
              <span className="text-xs text-slate-400 block">Grade Level</span>
              <span className="text-slate-200 font-mono">Level {designation.level || 1}</span>
            </div>
            <div>
              <span className="text-xs text-slate-400 block">Description</span>
              <span className="text-slate-200">{designation.description || '—'}</span>
            </div>
          </div>
        </Card>

        <Card className="p-6 bg-slate-900/70 border-slate-800 backdrop-blur-md space-y-4">
          <h3 className="text-base font-semibold text-white">Headcount</h3>
          <div className="text-3xl font-bold text-emerald-400">
            {designation.employees ? designation.employees.length : 0}
          </div>
          <p className="text-xs text-slate-400">
            Active staff members currently holding this designation.
          </p>
        </Card>
      </div>

      <div className="space-y-4">
        <h2 className="text-lg font-bold text-white">Employees in this Role</h2>
        <DataTable
          columns={employeeColumns}
          data={designation.employees || []}
          emptyMessage="No employees currently hold this designation."
        />
      </div>
    </div>
  );
}

export default DesignationDetailPage;
