import React from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import { useCompany } from '../../hooks/useCompany.js';
import useAuthStore from '../../store/auth.store.js';
import { Card } from '../../components/ui/Card.jsx';
import { Button } from '../../components/ui/Button.jsx';
import { Spinner } from '../../components/ui/Spinner.jsx';
import { Tabs } from '../../components/ui/Tabs.jsx';

export function CompanyDetailPage() {
  const { id } = useParams();
  const navigate = useNavigate();
  const { user } = useAuthStore();
  const isSuperAdmin = user?.role === 'SUPER_ADMIN' || user?.userRoles?.[0]?.role?.name === 'SUPER_ADMIN' || user?.roles?.includes('SUPER_ADMIN');
  const { data, isLoading } = useCompany(id);

  const company = data?.data?.company;

  if (isLoading) {
    return (
      <div className="flex h-96 items-center justify-center">
        <Spinner size="lg" className="text-blue-500" />
      </div>
    );
  }

  if (!company) {
    return (
      <div className="p-8 text-center text-slate-400">
        <p>Company not found.</p>
        <Link to="/companies">
          <Button variant="outline" className="mt-4">Back to Companies</Button>
        </Link>
      </div>
    );
  }

  const subscription = company.subscription || {};
  const plan = subscription.plan || { name: 'Trial Plan' };

  return (
    <div className="p-6 max-w-7xl mx-auto space-y-6">
      {/* Top Banner */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 bg-slate-900/60 border border-slate-800 p-6 rounded-2xl backdrop-blur-md">
        <div className="flex items-center gap-4">
          <div className="w-16 h-16 rounded-2xl bg-gradient-to-br from-blue-600 to-indigo-600 text-white font-bold flex items-center justify-center text-2xl shadow-xl shadow-blue-500/20">
            {company.name?.charAt(0)?.toUpperCase()}
          </div>
          <div>
            <div className="flex items-center gap-3">
              <h1 className="text-2xl font-bold text-white">{company.name}</h1>
              <span className="px-2.5 py-0.5 rounded-full text-xs font-semibold bg-emerald-500/10 text-emerald-400 border border-emerald-500/30">
                {company.status || subscription.status || 'ACTIVE'}
              </span>
            </div>
            <p className="text-sm text-slate-400 mt-1 font-mono">
              <span className="text-blue-400 font-bold">{company.companyCode || 'COMP-ORG'}</span> • {company.domain} • {company.email}
            </p>
          </div>
        </div>

        <div className="flex items-center gap-3">
          {!isSuperAdmin && (
            <Button
              variant="outline"
              onClick={() => navigate(`/companies/${id}/settings`)}
              className="border-slate-700"
            >
              Configure Settings
            </Button>
          )}
          {!isSuperAdmin && (
            <Link to="/employees/create">
              <Button className="bg-blue-600 hover:bg-blue-500">
                Add Employee
              </Button>
            </Link>
          )}
        </div>
      </div>

      {/* Subscription & Quota Highlights */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-6">
        <Card className="p-5 bg-slate-900/60 border-slate-800">
          <span className="text-xs text-slate-400 uppercase font-semibold">Active Plan</span>
          <div className="text-xl font-bold text-white mt-1">{plan.name}</div>
          <div className="text-xs text-slate-400 mt-2">
            Status: <span className="font-semibold text-emerald-400">{subscription.status || 'TRIAL'}</span>
          </div>
        </Card>

        <Card className="p-5 bg-slate-900/60 border-slate-800">
          <span className="text-xs text-slate-400 uppercase font-semibold">Team Size</span>
          <div className="text-xl font-bold text-white mt-1">
            {company.users?.length || company._count?.users || 0} / {plan.maxEmployees === -1 ? 'Unlimited' : (plan.maxEmployees || 50)}
          </div>
          <div className="text-xs text-slate-400 mt-2">Employees Quota</div>
        </Card>

        <Card className="p-5 bg-slate-900/60 border-slate-800">
          <span className="text-xs text-slate-400 uppercase font-semibold">Physical Locations</span>
          <div className="text-xl font-bold text-white mt-1">
            {company.branches?.length || 1} / {plan.maxBranches === -1 ? 'Unlimited' : (plan.maxBranches || 1)}
          </div>
          <div className="text-xs text-slate-400 mt-2">Active Branches</div>
        </Card>
      </div>

      {/* Tabs for details */}
      <Tabs
        tabs={[
          { id: 'overview', label: 'Company Overview' },
          { id: 'users', label: 'Registered Users', count: company.users?.length || 0 },
          { id: 'branches', label: 'Branches', count: company.branches?.length || 0 }
        ]}
      >
        {(currentTab) => (
          <div className="bg-slate-900/40 border border-slate-800 rounded-2xl p-6">
            {currentTab === 'overview' && (
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-6 text-sm">
                <div>
                  <span className="text-slate-400">Phone Contact:</span>
                  <p className="font-semibold text-slate-200 mt-1">{company.phone || 'Not configured'}</p>
                </div>
                <div>
                  <span className="text-slate-400">Headquarters Address:</span>
                  <p className="font-semibold text-slate-200 mt-1">{company.address || 'Not configured'}</p>
                </div>
                <div>
                  <span className="text-slate-400">Creation Date:</span>
                  <p className="font-semibold text-slate-200 mt-1">{new Date(company.createdAt).toLocaleDateString()}</p>
                </div>
                <div>
                  <span className="text-slate-400">Company Code:</span>
                  <p className="font-mono text-xs text-indigo-400 font-bold mt-1">{company.companyCode || 'COMP-ORG'}</p>
                </div>
              </div>
            )}

            {currentTab === 'users' && (
              <div className="space-y-3">
                {(company.users || []).map((u) => (
                  <div key={u.id} className="flex items-center justify-between p-3 rounded-xl bg-slate-950/40 border border-slate-800 text-sm">
                    <div>
                      <div className="font-semibold text-slate-200">{u.email}</div>
                      <div className="text-xs text-slate-400">Role: {u.roles?.[0]?.role?.name || 'MEMBER'}</div>
                    </div>
                    <span className="text-xs font-semibold px-2 py-0.5 rounded bg-slate-800 text-slate-300">
                      {u.status}
                    </span>
                  </div>
                ))}
              </div>
            )}

            {currentTab === 'branches' && (
              <div className="space-y-3">
                {(company.branches || []).map((b) => (
                  <div key={b.id} className="p-3 rounded-xl bg-slate-950/40 border border-slate-800 text-sm">
                    <div className="font-semibold text-slate-200">{b.name}</div>
                    <div className="text-xs text-slate-400">{b.address}</div>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}
      </Tabs>
    </div>
  );
}

export default CompanyDetailPage;
