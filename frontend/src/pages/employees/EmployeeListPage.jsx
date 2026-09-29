import React, { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { useEmployees, useDeleteEmployee } from '../../hooks/useEmployee.js';
import useAuthStore from '../../store/auth.store.js';
import { DataTable } from '../../components/ui/DataTable.jsx';
import { Button } from '../../components/ui/Button.jsx';
import { Card } from '../../components/ui/Card.jsx';
import { Input } from '../../components/ui/Input.jsx';
import { Modal } from '../../components/ui/Modal.jsx';

export function EmployeeListPage() {
  const navigate = useNavigate();
  const { user } = useAuthStore();
  const isSuperAdmin = user?.role === 'SUPER_ADMIN';
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState('');
  const [page, setPage] = useState(1);
  const [employeeToDelete, setEmployeeToDelete] = useState(null);

  const queryParams = {
    page,
    limit: 10,
    ...(search.trim() ? { search: search.trim() } : {}),
    ...(statusFilter ? { status: statusFilter } : {})
  };

  const { data, isLoading } = useEmployees(queryParams);

  const deleteEmployeeMutation = useDeleteEmployee();

  const employees = data?.data?.employees || [];
  const pagination = data?.data?.pagination || { page: 1, limit: 10, total: 0, totalPages: 1 };

  const handleDelete = async () => {
    if (!employeeToDelete) return;
    try {
      await deleteEmployeeMutation.mutateAsync(employeeToDelete.id);
      setEmployeeToDelete(null);
    } catch (err) {
      console.error(err);
    }
  };

  const columns = [
    {
      header: 'Employee',
      key: 'name',
      render: (row) => (
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-indigo-600 to-purple-600 text-white font-bold flex items-center justify-center text-sm shadow-md overflow-hidden">
            {row.facePhotoUrl ? (
              <img src={row.facePhotoUrl} alt="" className="w-full h-full object-cover" />
            ) : (
              `${row.firstName?.[0] || ''}${row.lastName?.[0] || ''}`
            )}
          </div>
          <div>
            <div className="font-semibold text-slate-100 hover:text-blue-400 transition-colors">
              {row.firstName} {row.lastName}
            </div>
            <div className="text-xs text-slate-400 font-mono">{row.employeeCode || 'No Code'}</div>
          </div>
        </div>
      )
    },
    {
      header: 'Department / Role',
      key: 'dept',
      render: (row) => {
        const roleName = row.user?.userRoles?.[0]?.role?.name || row.user?.role;
        return (
          <div className="text-xs text-slate-300">
            <div className="font-medium text-slate-200 flex items-center gap-1.5">
              <span>{row.department?.name || 'General Dept'}</span>
              {roleName && roleName !== 'EMPLOYEE' && (
                <span className="px-1.5 py-0.2 rounded text-[10px] font-semibold bg-indigo-500/20 text-indigo-300 border border-indigo-500/30">
                  {roleName}
                </span>
              )}
            </div>
            <div className="text-slate-400">{row.designation?.title || row.employmentType}</div>
          </div>
        );
      }
    },
    {
      header: 'Contact',
      key: 'contact',
      render: (row) => (
        <div className="text-xs text-slate-300 font-mono">
          <div>{row.email}</div>
          <div className="text-slate-400">{row.phone || '—'}</div>
        </div>
      )
    },
    {
      header: 'Biometrics',
      key: 'face',
      render: (row) => (
        <div>
          {row.faceRegisteredAt ? (
            <span className="inline-flex items-center px-2 py-0.5 rounded-full text-xs font-semibold bg-emerald-500/10 text-emerald-400 border border-emerald-500/30">
              <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 mr-1.5" />
              Face Active
            </span>
          ) : (
            <span className="inline-flex items-center px-2 py-0.5 rounded-full text-xs font-semibold bg-amber-500/10 text-amber-400 border border-amber-500/30">
              Pending Setup
            </span>
          )}
        </div>
      )
    },
    {
      header: 'Status',
      key: 'status',
      render: (row) => {
        const statusColors = {
          ACTIVE: 'bg-emerald-500/10 text-emerald-400 border-emerald-500/30',
          INACTIVE: 'bg-slate-500/10 text-slate-400 border-slate-500/30',
          ON_LEAVE: 'bg-amber-500/10 text-amber-400 border-amber-500/30',
          TERMINATED: 'bg-red-500/10 text-red-400 border-red-500/30'
        };
        const status = row.status || 'ACTIVE';
        return (
          <span
            className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-semibold border ${
              statusColors[status] || statusColors.ACTIVE
            }`}
          >
            {status}
          </span>
        );
      }
    },
    {
      header: 'Actions',
      key: 'actions',
      align: 'right',
      render: (row) => (
        <div className="flex items-center justify-end gap-2" onClick={(e) => e.stopPropagation()}>
          <Button
            variant="ghost"
            size="sm"
            onClick={() => navigate(`/employees/${row.id}`)}
            className="text-slate-300 hover:text-white"
          >
            View
          </Button>
          <Button
            variant="ghost"
            size="sm"
            onClick={() => navigate(`/employees/${row.id}/edit`)}
            className="text-blue-400 hover:text-blue-300"
          >
            Edit
          </Button>
          <Button
            variant="outline"
            size="sm"
            onClick={() => navigate(`/employees/${row.id}/face`)}
            className="border-slate-700 text-xs"
          >
            Face ID
          </Button>
          <Button
            variant="ghost"
            size="sm"
            onClick={() => setEmployeeToDelete(row)}
            className="text-red-400 hover:text-red-300 hover:bg-red-500/10"
          >
            Delete
          </Button>
        </div>
      )
    }
  ];

  return (
    <div className="p-6 max-w-7xl mx-auto space-y-6">
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl sm:text-3xl font-bold tracking-tight text-white">
            Employees Directory
          </h1>
          <p className="text-sm text-slate-400 mt-1">
            Manage organization workforce, roles, face biometric registration, and allocations.
          </p>
        </div>

        {!isSuperAdmin && (
          <div className="flex items-center gap-3">
            <Link to="/employees/bulk-import">
              <Button variant="outline" className="border-slate-700 hover:bg-slate-800 text-slate-200">
                <svg className="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-8l-4-4m0 0L8 8m4-4v12" />
                </svg>
                Bulk Import
              </Button>
            </Link>

            <Link to="/employees/create">
              <Button className="bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-500 hover:to-indigo-500 shadow-lg shadow-blue-500/20">
                <svg className="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 4v16m8-8H4" />
                </svg>
                Add Employee
              </Button>
            </Link>
          </div>
        )}
      </div>

      {/* Filter and Search Bar */}
      <Card className="p-4 bg-slate-900/70 border-slate-800 backdrop-blur-md">
        <div className="flex flex-col sm:flex-row items-center gap-4">
          <div className="flex-1 w-full">
            <Input
              type="text"
              placeholder="Search by name, email, or employee code..."
              value={search}
              onChange={(e) => {
                setSearch(e.target.value);
                setPage(1);
              }}
              className="w-full bg-slate-950/60 border-slate-800"
            />
          </div>

          <div className="w-full sm:w-48">
            <select
              value={statusFilter}
              onChange={(e) => {
                setStatusFilter(e.target.value);
                setPage(1);
              }}
              className="w-full h-11 px-3 rounded-lg bg-slate-950/60 border border-slate-800 text-sm text-slate-200 focus:outline-none focus:border-blue-500"
            >
              <option value="">All Statuses</option>
              <option value="ACTIVE">Active</option>
              <option value="INACTIVE">Inactive</option>
              <option value="ON_LEAVE">On Leave</option>
              <option value="TERMINATED">Terminated</option>
            </select>
          </div>
        </div>
      </Card>

      {/* Employees Table */}
      <DataTable
        columns={columns}
        data={employees}
        isLoading={isLoading}
        emptyMessage="No employees found in directory. Click 'Add Employee' to onboard a team member."
        pagination={{
          page: pagination.page,
          limit: pagination.limit,
          total: pagination.total,
          totalPages: pagination.totalPages,
          onPageChange: (newPage) => setPage(newPage)
        }}
        onRowClick={(row) => navigate(`/employees/${row.id}`)}
      />

      {/* Delete Confirmation Modal */}
      <Modal
        isOpen={Boolean(employeeToDelete)}
        onClose={() => setEmployeeToDelete(null)}
        title="Delete Employee Record"
      >
        <div className="space-y-4">
          <p className="text-sm text-slate-300">
            Are you sure you want to delete employee{' '}
            <span className="font-semibold text-white">
              {employeeToDelete?.firstName} {employeeToDelete?.lastName}
            </span>
            ? This action cannot be undone.
          </p>

          <div className="flex justify-end gap-3 pt-4 border-t border-slate-800">
            <Button variant="outline" onClick={() => setEmployeeToDelete(null)}>
              Cancel
            </Button>
            <Button
              variant="primary"
              onClick={handleDelete}
              isLoading={deleteEmployeeMutation.isPending}
              className="bg-red-600 hover:bg-red-500"
            >
              Delete Employee
            </Button>
          </div>
        </div>
      </Modal>
    </div>
  );
}

export default EmployeeListPage;
