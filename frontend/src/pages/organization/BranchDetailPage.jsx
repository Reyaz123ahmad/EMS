import React from 'react';
import { useParams, Link } from 'react-router-dom';
import { useBranch } from '../../hooks/useOrganization.js';
import { Card } from '../../components/ui/Card.jsx';
import { Button } from '../../components/ui/Button.jsx';
import { DataTable } from '../../components/ui/DataTable.jsx';

export function BranchDetailPage() {
  const { id } = useParams();
  const { data, isLoading } = useBranch(id);

  if (isLoading) {
    return (
      <div className="p-8 flex items-center justify-center min-h-[400px]">
        <div className="animate-spin rounded-full h-10 w-10 border-b-2 border-blue-500"></div>
      </div>
    );
  }

  const branch = data?.data?.branch;

  if (!branch) {
    return (
      <div className="p-6 max-w-4xl mx-auto text-center space-y-4">
        <h2 className="text-xl font-bold text-white">Branch Not Found</h2>
        <Link to="/organization/branches">
          <Button variant="outline">Back to Branches</Button>
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
    { header: 'Designation', key: 'designation', render: (r) => r.designation?.name || '—' },
    { header: 'Status', key: 'status' }
  ];

  return (
    <div className="p-6 max-w-7xl mx-auto space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <div className="flex items-center gap-2 text-sm text-slate-400 mb-1">
            <Link to="/organization/branches" className="hover:text-white transition-colors">Branches</Link>
            <span>/</span>
            <span className="text-slate-200">{branch.name}</span>
          </div>
          <h1 className="text-2xl sm:text-3xl font-bold text-white">{branch.name}</h1>
        </div>

        <Link to="/organization/branches">
          <Button variant="outline" size="sm" className="border-slate-700">
            Back to Branches
          </Button>
        </Link>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <Card className="p-6 bg-slate-900/70 border-slate-800 backdrop-blur-md space-y-4">
          <h3 className="text-base font-semibold text-white">Branch Details</h3>
          <div className="space-y-3 text-sm">
            <div>
              <span className="text-xs text-slate-400 block">Branch Code</span>
              <span className="font-mono text-slate-200">{branch.code || 'N/A'}</span>
            </div>
            <div>
              <span className="text-xs text-slate-400 block">Address</span>
              <span className="text-slate-200">{branch.address || '—'}</span>
            </div>
            <div>
              <span className="text-xs text-slate-400 block">City & State</span>
              <span className="text-slate-200">{branch.city || '—'}, {branch.state || ''}</span>
            </div>
            <div>
              <span className="text-xs text-slate-400 block">Country</span>
              <span className="text-slate-200">{branch.country || 'USA'}</span>
            </div>
          </div>
        </Card>

        <Card className="p-6 bg-slate-900/70 border-slate-800 backdrop-blur-md space-y-4">
          <h3 className="text-base font-semibold text-white">Geo-Fence Configuration</h3>
          <div className="space-y-3 text-sm">
            <div>
              <span className="text-xs text-slate-400 block">Coordinates</span>
              <span className="font-mono text-emerald-400">
                {branch.latitude && branch.longitude
                  ? `${branch.latitude.toFixed(5)}, ${branch.longitude.toFixed(5)}`
                  : 'Not configured'}
              </span>
            </div>
            <div>
              <span className="text-xs text-slate-400 block">Allowed Punch Radius</span>
              <span className="text-slate-200">{branch.radiusMeters || 100} meters</span>
            </div>
          </div>
        </Card>

        <Card className="p-6 bg-slate-900/70 border-slate-800 backdrop-blur-md space-y-4">
          <h3 className="text-base font-semibold text-white">Workforce Count</h3>
          <div className="text-3xl font-bold text-blue-400">
            {branch.employees ? branch.employees.length : 0}
          </div>
          <p className="text-xs text-slate-400">
            Total active employees assigned to this physical location.
          </p>
        </Card>
      </div>

      <div className="space-y-4">
        <h2 className="text-lg font-bold text-white">Assigned Employees</h2>
        <DataTable
          columns={employeeColumns}
          data={branch.employees || []}
          emptyMessage="No employees are currently assigned to this branch location."
        />
      </div>
    </div>
  );
}

export default BranchDetailPage;
