import React, { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { useDocuments, useVerifyDocument, useRejectDocument, useDeleteDocument } from '../../hooks/useDocuments.js';
import { DataTable } from '../../components/ui/DataTable.jsx';
import { Button } from '../../components/ui/Button.jsx';
import { Card } from '../../components/ui/Card.jsx';
import { Input } from '../../components/ui/Input.jsx';
import { Modal } from '../../components/ui/Modal.jsx';
import useAuthStore from '../../store/auth.store.js';

export function DocumentListPage() {
  const navigate = useNavigate();
  const { user } = useAuthStore();
  const userRoles = user?.roles || (user?.role ? [user.role] : ['EMPLOYEE']);
  const isEmployee = userRoles.includes('EMPLOYEE') && !userRoles.some((r) => ['SUPER_ADMIN', 'COMPANY_ADMIN', 'HR_ADMIN', 'HR_MANAGER', 'MANAGER'].includes(r));

  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState('');
  const [typeFilter, setTypeFilter] = useState('');
  const [page, setPage] = useState(1);

  const [docToReject, setDocToReject] = useState(null);
  const [rejectReason, setRejectReason] = useState('');
  const [docToDelete, setDocToDelete] = useState(null);

  const { data, isLoading } = useDocuments({
    search,
    status: statusFilter,
    type: typeFilter,
    page,
    limit: 10
  });

  const verifyMutation = useVerifyDocument();
  const rejectMutation = useRejectDocument();
  const deleteMutation = useDeleteDocument();

  const documents = data?.data?.documents || data?.documents || (Array.isArray(data?.data) ? data.data : []) || [];
  const pagination = data?.data?.pagination || data?.pagination || {
    page: data?.data?.page || page,
    limit: data?.data?.limit || 10,
    total: data?.data?.total || documents.length,
    totalPages: data?.data?.totalPages || 1
  };

  const handleVerify = async (docId) => {
    try {
      await verifyMutation.mutateAsync({ id: docId, data: {} });
    } catch (err) {
      console.error(err);
    }
  };

  const handleReject = async () => {
    if (!docToReject) return;
    try {
      await rejectMutation.mutateAsync({
        id: docToReject.id,
        data: { reason: rejectReason }
      });
      setDocToReject(null);
      setRejectReason('');
    } catch (err) {
      console.error(err);
    }
  };

  const handleDelete = async () => {
    if (!docToDelete) return;
    try {
      await deleteMutation.mutateAsync(docToDelete.id);
      setDocToDelete(null);
    } catch (err) {
      console.error(err);
    }
  };

  const columns = [
    {
      header: 'Document Name',
      key: 'title',
      render: (r) => (
        <div className="flex items-center gap-3">
          <div className="w-9 h-9 rounded-xl bg-blue-500/10 border border-blue-500/20 text-blue-400 flex items-center justify-center font-bold text-xs">
            {r.type ? r.type.slice(0, 3) : 'DOC'}
          </div>
          <div>
            <div className="font-semibold text-slate-100 hover:text-blue-400 transition-colors">
              {r.title || r.fileName}
            </div>
            <div className="text-xs text-slate-400 font-mono">{r.type}</div>
          </div>
        </div>
      )
    },
    ...(!isEmployee
      ? [
          {
            header: 'Employee',
            key: 'emp',
            render: (r) => (
              <div className="text-xs text-slate-300">
                <div className="font-medium text-slate-200">
                  {r.employee ? `${r.employee.firstName} ${r.employee.lastName}` : 'Company Wide'}
                </div>
                <div className="text-slate-400 font-mono">{r.employee?.employeeCode || '—'}</div>
              </div>
            )
          },
        ]
      : []),
    {
      header: 'Status',
      key: 'status',
      render: (r) => {
        const colors = {
          PENDING: 'bg-amber-500/10 text-amber-400 border-amber-500/30',
          VERIFIED: 'bg-emerald-500/10 text-emerald-400 border-emerald-500/30',
          REJECTED: 'bg-red-500/10 text-red-400 border-red-500/30'
        };
        const status = r.status || 'PENDING';
        return (
          <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-semibold border ${colors[status] || colors.PENDING}`}>
            {status}
          </span>
        );
      }
    },
    {
      header: 'Upload Date',
      key: 'uploadedAt',
      render: (r) => (
        <span className="text-xs text-slate-400 font-mono">
          {r.createdAt ? new Date(r.createdAt).toLocaleDateString() : '—'}
        </span>
      )
    },
    {
      header: 'Actions',
      key: 'actions',
      align: 'right',
      render: (r) => (
        <div className="flex items-center justify-end gap-2" onClick={(e) => e.stopPropagation()}>
          <Button
            variant="ghost"
            size="sm"
            onClick={() => navigate(`/documents/${r.id}`)}
            className="text-slate-300 hover:text-white"
          >
            View
          </Button>
          {!isEmployee && r.status === 'PENDING' && (
            <>
              <Button
                variant="outline"
                size="sm"
                onClick={() => handleVerify(r.id)}
                isLoading={verifyMutation.isPending}
                className="border-emerald-500/30 text-emerald-400 hover:bg-emerald-500/10 text-xs"
              >
                Verify
              </Button>
              <Button
                variant="outline"
                size="sm"
                onClick={() => setDocToReject(r)}
                className="border-red-500/30 text-red-400 hover:bg-red-500/10 text-xs"
              >
                Reject
              </Button>
            </>
          )}
          <Button
            variant="ghost"
            size="sm"
            onClick={() => setDocToDelete(r)}
            className="text-red-400/80 hover:text-red-300 hover:bg-red-500/10"
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
            {isEmployee ? 'My Documents' : 'Document Management'}
          </h1>
          <p className="text-sm text-slate-400 mt-1">
            {isEmployee
              ? 'View and manage your identity proofs, certificates, and uploaded files.'
              : 'Review compliance certificates, employee identity proofs, contracts, and HR documents.'}
          </p>
        </div>

        <Link to="/documents/upload">
          <Button className="bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-500 hover:to-indigo-500">
            <svg className="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-8l-4-4m0 0L8 8m4-4v12" />
            </svg>
            Upload Document
          </Button>
        </Link>
      </div>

      <Card className="p-4 bg-slate-900/70 border-slate-800 backdrop-blur-md">
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
          <Input
            type="text"
            placeholder={isEmployee ? 'Search document title...' : 'Search document title or employee...'}
            value={search}
            onChange={(e) => {
              setSearch(e.target.value);
              setPage(1);
            }}
            className="bg-slate-950/60 border-slate-800"
          />

          <select
            value={statusFilter}
            onChange={(e) => {
              setStatusFilter(e.target.value);
              setPage(1);
            }}
            className="h-11 px-3 rounded-lg bg-slate-950/60 border border-slate-800 text-sm text-slate-200 focus:outline-none focus:border-blue-500"
          >
            <option value="">All Statuses</option>
            <option value="PENDING">Pending Review</option>
            <option value="VERIFIED">Verified</option>
            <option value="REJECTED">Rejected</option>
          </select>

          <select
            value={typeFilter}
            onChange={(e) => {
              setTypeFilter(e.target.value);
              setPage(1);
            }}
            className="h-11 px-3 rounded-lg bg-slate-950/60 border border-slate-800 text-sm text-slate-200 focus:outline-none focus:border-blue-500"
          >
            <option value="">All Document Types</option>
            <option value="NATIONAL_ID">National ID / Passport</option>
            <option value="TAX_FORM">Tax Document (W-4 / W-2)</option>
            <option value="CONTRACT">Employment Contract</option>
            <option value="RESUME">Resume / CV</option>
            <option value="CERTIFICATE">Certificate / Diploma</option>
            <option value="OTHER">Other Documentation</option>
          </select>
        </div>
      </Card>

      <DataTable
        columns={columns}
        data={documents}
        isLoading={isLoading}
        emptyMessage="No documents found matching filters."
        pagination={{
          page: pagination.page,
          limit: pagination.limit,
          total: pagination.total,
          totalPages: pagination.totalPages,
          onPageChange: (newPage) => setPage(newPage)
        }}
        onRowClick={(r) => navigate(`/documents/${r.id}`)}
      />

      {/* Reject Modal */}
      <Modal
        isOpen={Boolean(docToReject)}
        onClose={() => setDocToReject(null)}
        title="Reject Document"
      >
        <div className="space-y-4">
          <p className="text-sm text-slate-300">
            Please specify the reason for rejecting <span className="font-semibold text-white">{docToReject?.title || docToReject?.fileName}</span>:
          </p>
          <Input
            value={rejectReason}
            onChange={(e) => setRejectReason(e.target.value)}
            placeholder="e.g., Expired ID or illegible scan"
            className="bg-slate-950/60 border-slate-800"
          />
          <div className="flex justify-end gap-3 pt-4 border-t border-slate-800">
            <Button variant="outline" onClick={() => setDocToReject(null)}>
              Cancel
            </Button>
            <Button
              variant="primary"
              onClick={handleReject}
              isLoading={rejectMutation.isPending}
              className="bg-red-600 hover:bg-red-500"
            >
              Confirm Rejection
            </Button>
          </div>
        </div>
      </Modal>

      {/* Delete Modal */}
      <Modal
        isOpen={Boolean(docToDelete)}
        onClose={() => setDocToDelete(null)}
        title="Delete Document"
      >
        <div className="space-y-4">
          <p className="text-sm text-slate-300">
            Are you sure you want to delete <span className="font-semibold text-white">{docToDelete?.title || docToDelete?.fileName}</span>?
          </p>
          <div className="flex justify-end gap-3 pt-4 border-t border-slate-800">
            <Button variant="outline" onClick={() => setDocToDelete(null)}>
              Cancel
            </Button>
            <Button
              variant="primary"
              onClick={handleDelete}
              isLoading={deleteMutation.isPending}
              className="bg-red-600 hover:bg-red-500"
            >
              Delete
            </Button>
          </div>
        </div>
      </Modal>
    </div>
  );
}

export default DocumentListPage;
