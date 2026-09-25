import React, { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { useCompanies } from '../../hooks/useCompany.js';
import { DataTable } from '../../components/ui/DataTable.jsx';
import { Button } from '../../components/ui/Button.jsx';
import { Card } from '../../components/ui/Card.jsx';
import { Input } from '../../components/ui/Input.jsx';

export function CompanyListPage() {
  const navigate = useNavigate();
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState('');
  const [page, setPage] = useState(1);

  const { data, isLoading } = useCompanies({
    search,
    status: statusFilter,
    page,
    limit: 10
  });

  const companies = data?.data?.companies || [];
  const pagination = data?.data?.pagination || { page: 1, limit: 10, total: 0, totalPages: 1 };

  const columns = [
    {
      header: 'Company Name',
      key: 'name',
      render: (row) => (
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-blue-600 to-indigo-600 text-white font-bold flex items-center justify-center text-sm shadow-md">
            {row.name?.charAt(0)?.toUpperCase() || 'C'}
          </div>
          <div>
            <div className="font-semibold text-slate-100 hover:text-blue-400 transition-colors">
              {row.name}
            </div>
            <div className="text-xs text-slate-400 font-mono">{row.domain || 'no-domain'}</div>
          </div>
        </div>
      )
    },
    {
      header: 'Contact Email',
      key: 'email',
      render: (row) => <span className="text-slate-300 text-xs font-mono">{row.email}</span>
    },
    {
      header: 'Plan & Status',
      key: 'status',
      render: (row) => {
        const statusColors = {
          ACTIVE: 'bg-emerald-500/10 text-emerald-400 border-emerald-500/30',
          TRIAL: 'bg-amber-500/10 text-amber-400 border-amber-500/30',
          SUSPENDED: 'bg-red-500/10 text-red-400 border-red-500/30',
          EXPIRED: 'bg-slate-500/10 text-slate-400 border-slate-500/30'
        };
        const status = row.status || (row.subscription?.status) || 'ACTIVE';
        return (
          <div className="flex flex-col gap-1 items-start">
            <span
              className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-semibold border ${
                statusColors[status] || statusColors.ACTIVE
              }`}
            >
              <span className="w-1.5 h-1.5 rounded-full bg-current mr-1.5 animate-pulse" />
              {status}
            </span>
            <span className="text-[11px] text-slate-400">
              {row.subscription?.plan?.name ? `${row.subscription.plan.name} Plan` : '14-Day Trial'}
            </span>
          </div>
        );
      }
    },
    {
      header: 'Users / Size',
      key: 'counts',
      render: (row) => (
        <div className="text-xs text-slate-300">
          <div><span className="font-semibold text-slate-100">{row._count?.users || row.users?.length || 0}</span> Users</div>
          <div className="text-slate-500">{row._count?.branches || row.branches?.length || 1} Branches</div>
        </div>
      )
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
            onClick={() => navigate(`/companies/${row.id}`)}
            className="text-slate-300 hover:text-white hover:bg-slate-800"
          >
            View
          </Button>
          <Button
            variant="outline"
            size="sm"
            onClick={() => navigate(`/companies/${row.id}/settings`)}
            className="border-slate-700 hover:border-slate-600"
          >
            Settings
          </Button>
        </div>
      )
    }
  ];

  return (
    <div className="p-6 max-w-7xl mx-auto space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl sm:text-3xl font-bold tracking-tight text-white">
            Companies Directory
          </h1>
          <p className="text-sm text-slate-400 mt-1">
            Manage multi-tenant enterprise organizations and their subscriptions.
          </p>
        </div>

        <Link to="/companies/create">
          <Button className="bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-500 hover:to-indigo-500 shadow-lg shadow-blue-500/20">
            <svg className="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 4v16m8-8H4" />
            </svg>
            Create Company
          </Button>
        </Link>
      </div>

      {/* Filter and Search Bar */}
      <Card className="p-4 bg-slate-900/70 border-slate-800 backdrop-blur-md">
        <div className="flex flex-col sm:flex-row items-center gap-4">
          <div className="flex-1 w-full">
            <Input
              type="text"
              placeholder="Search companies by name or domain..."
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
              <option value="TRIAL">Trial</option>
              <option value="SUSPENDED">Suspended</option>
              <option value="EXPIRED">Expired</option>
            </select>
          </div>
        </div>
      </Card>

      {/* Companies Table */}
      <DataTable
        columns={columns}
        data={companies}
        isLoading={isLoading}
        emptyMessage="No companies registered yet. Click 'Create Company' to get started."
        pagination={{
          page: pagination.page,
          limit: pagination.limit,
          total: pagination.total,
          totalPages: pagination.totalPages,
          onPageChange: (newPage) => setPage(newPage)
        }}
        onRowClick={(row) => navigate(`/companies/${row.id}`)}
      />
    </div>
  );
}

export default CompanyListPage;
