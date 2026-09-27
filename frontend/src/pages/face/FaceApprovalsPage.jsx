import React, { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { faceRegistrationService } from '../../services/face-registration.service';
import { UserCheck, CheckCircle2, XCircle, Clock, Shield, Search, RefreshCw, AlertTriangle, Eye, Sparkles } from 'lucide-react';
import { toast } from 'sonner';

export default function FaceApprovalsPage() {
  const queryClient = useQueryClient();
  const [activeTab, setActiveTab] = useState('PENDING'); // PENDING | APPROVED | REJECTED | ALL
  const [selectedRequest, setSelectedRequest] = useState(null);
  const [rejectReason, setRejectReason] = useState('Photo is unclear or face is partially obscured');
  const [previewImage, setPreviewImage] = useState(null);
  const [searchQuery, setSearchQuery] = useState('');

  const { data, isLoading, refetch, isRefetching } = useQuery({
    queryKey: ['face-pending-requests', activeTab],
    queryFn: () => faceRegistrationService.listPendingRequests({ status: activeTab })
  });

  const approveMutation = useMutation({
    mutationFn: (requestId) => faceRegistrationService.approveRequest(requestId),
    onSuccess: (res) => {
      toast.success(res?.message || 'Face registration approved successfully');
      queryClient.invalidateQueries({ queryKey: ['face-pending-requests'] });
      queryClient.invalidateQueries({ queryKey: ['face-registration-status'] });
      queryClient.invalidateQueries({ queryKey: ['employeesWithFace'] });
      queryClient.invalidateQueries({ queryKey: ['faceStats'] });
    },
    onError: (err) => {
      toast.error(err.response?.data?.message || 'Failed to approve request');
    }
  });

  const rejectMutation = useMutation({
    mutationFn: ({ id, reason }) => faceRegistrationService.rejectRequest(id, reason),
    onSuccess: (res) => {
      toast.success(res?.message || 'Face registration request rejected');
      setSelectedRequest(null);
      queryClient.invalidateQueries({ queryKey: ['face-pending-requests'] });
      queryClient.invalidateQueries({ queryKey: ['face-registration-status'] });
    },
    onError: (err) => {
      toast.error(err.response?.data?.message || 'Failed to reject request');
    }
  });

  const handleRejectSubmit = (e) => {
    e.preventDefault();
    if (!selectedRequest) return;
    rejectMutation.mutate({ id: selectedRequest.id, reason: rejectReason });
  };

  const requests = (data?.requests || []).filter((req) => {
    if (!searchQuery) return true;
    const name = `${req.employee?.firstName || ''} ${req.employee?.lastName || ''}`.toLowerCase();
    const code = (req.employee?.employeeCode || '').toLowerCase();
    const email = (req.employee?.email || '').toLowerCase();
    const q = searchQuery.toLowerCase();
    return name.includes(q) || code.includes(q) || email.includes(q);
  });

  return (
    <div className="max-w-6xl mx-auto space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-black text-white flex items-center gap-2.5">
            <UserCheck className="w-7 h-7 text-indigo-400" />
            Face Registration Approvals
          </h1>
          <p className="text-xs text-slate-400 mt-1">
            Review and authorize employee facial recognition biometric enrollment requests.
          </p>
        </div>

        <div className="flex items-center gap-2">
          <button
            type="button"
            onClick={() => refetch()}
            disabled={isRefetching}
            className="p-2.5 rounded-xl border border-slate-700 bg-slate-800 text-slate-300 hover:bg-slate-700 hover:text-white transition"
            title="Refresh List"
          >
            <RefreshCw className={`w-4 h-4 ${isRefetching ? 'animate-spin text-indigo-400' : ''}`} />
          </button>
        </div>
      </div>

      {/* Filter Tabs & Search */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-slate-900/60 border border-slate-800 rounded-2xl p-4">
        <div className="flex gap-2">
          {['PENDING', 'APPROVED', 'REJECTED', 'ALL'].map((tab) => (
            <button
              key={tab}
              type="button"
              onClick={() => setActiveTab(tab)}
              className={`px-4 py-2 rounded-xl text-xs font-bold transition ${
                activeTab === tab
                  ? 'bg-indigo-600 text-white shadow-lg shadow-indigo-600/30'
                  : 'bg-slate-800/80 text-slate-400 hover:bg-slate-800 hover:text-slate-200'
              }`}
            >
              {tab}
            </button>
          ))}
        </div>

        <div className="relative w-full sm:w-72">
          <Search className="w-4 h-4 text-slate-500 absolute left-3 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            placeholder="Search by name or code..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full pl-9 pr-4 py-2 bg-slate-950 border border-slate-800 rounded-xl text-xs text-white placeholder-slate-500 focus:outline-none focus:border-indigo-500"
          />
        </div>
      </div>

      {/* Content List */}
      {isLoading ? (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {[1, 2, 3, 4].map((i) => (
            <div key={i} className="h-44 bg-slate-900/40 border border-slate-800 animate-pulse rounded-2xl" />
          ))}
        </div>
      ) : requests.length === 0 ? (
        <div className="p-16 text-center bg-slate-900/40 border border-slate-800/80 rounded-3xl space-y-3">
          <div className="w-14 h-14 rounded-2xl bg-indigo-500/10 border border-indigo-500/20 flex items-center justify-center mx-auto text-indigo-400">
            <CheckCircle2 className="w-7 h-7" />
          </div>
          <h3 className="text-base font-bold text-slate-200">No {activeTab.toLowerCase()} requests</h3>
          <p className="text-xs text-slate-500 max-w-sm mx-auto">
            {activeTab === 'PENDING'
              ? 'All submitted employee face templates have been reviewed.'
              : `There are currently no face enrollment records under "${activeTab}".`}
          </p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {requests.map((request) => (
            <div
              key={request.id}
              className="bg-slate-900/80 border border-slate-800/90 rounded-2xl p-5 hover:border-slate-700 transition flex flex-col justify-between shadow-lg"
            >
              <div className="flex gap-4">
                {/* Face Photo Thumbnail */}
                <div className="relative group flex-shrink-0">
                  <div className="w-24 h-28 rounded-xl overflow-hidden border-2 border-slate-700 bg-black flex items-center justify-center">
                    <img
                      src={request.pendingPhotoUrl}
                      alt="Submitted Face"
                      className="w-full h-full object-cover"
                    />
                  </div>
                  <button
                    type="button"
                    onClick={() => setPreviewImage(request.pendingPhotoUrl)}
                    className="absolute inset-0 bg-black/60 opacity-0 group-hover:opacity-100 flex items-center justify-center transition rounded-xl text-white text-xs font-semibold gap-1"
                  >
                    <Eye className="w-3.5 h-3.5" /> View
                  </button>
                </div>

                {/* Info Details */}
                <div className="flex-1 min-w-0 space-y-1.5">
                  <div className="flex items-start justify-between gap-2">
                    <div>
                      <h3 className="text-base font-bold text-white truncate">
                        {request.employee?.firstName} {request.employee?.lastName}
                      </h3>
                      <p className="text-xs text-indigo-400 font-medium">
                        {request.employee?.employeeCode}
                      </p>
                    </div>

                    <span
                      className={`px-2.5 py-0.5 rounded-full text-[10px] font-bold uppercase tracking-wider ${
                        request.status === 'APPROVED'
                          ? 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/30'
                          : request.status === 'REJECTED'
                          ? 'bg-rose-500/10 text-rose-400 border border-rose-500/30'
                          : 'bg-amber-500/10 text-amber-400 border border-amber-500/30'
                      }`}
                    >
                      {request.status}
                    </span>
                  </div>

                  <div className="text-xs text-slate-400 space-y-0.5">
                    <p className="truncate">
                      Dept: <span className="text-slate-300">{request.employee?.department?.name || 'General'}</span>
                    </p>
                    <p className="truncate">
                      Branch: <span className="text-slate-300">{request.employee?.branch?.name || 'Main Office'}</span>
                    </p>
                    <p className="text-[11px] text-slate-500">
                      Requested: {new Date(request.createdAt).toLocaleString()}
                    </p>
                  </div>

                  {request.livenessScore && (
                    <div className="inline-flex items-center gap-1 text-[11px] font-semibold text-emerald-400 bg-emerald-500/10 px-2 py-0.5 rounded-md border border-emerald-500/20">
                      <Sparkles className="w-3 h-3" />
                      Liveness Verified: {(Number(request.livenessScore) * 100).toFixed(0)}%
                    </div>
                  )}

                  {request.rejectionReason && (
                    <p className="text-[11px] text-rose-400 font-medium bg-rose-500/10 px-2 py-1 rounded-md border border-rose-500/20">
                      Reason: {request.rejectionReason}
                    </p>
                  )}
                </div>
              </div>

              {/* Action Buttons for PENDING requests */}
              {request.status === 'PENDING' && (
                <div className="flex gap-2 mt-4 pt-3 border-t border-slate-800">
                  <button
                    type="button"
                    disabled={approveMutation.isPending || rejectMutation.isPending}
                    onClick={() => approveMutation.mutate(request.id)}
                    className="flex-1 py-2 rounded-xl text-xs font-bold bg-emerald-600 hover:bg-emerald-500 text-white shadow-md shadow-emerald-600/20 transition flex items-center justify-center gap-1.5 disabled:opacity-50"
                  >
                    <CheckCircle2 className="w-4 h-4" />
                    Approve
                  </button>
                  <button
                    type="button"
                    disabled={approveMutation.isPending || rejectMutation.isPending}
                    onClick={() => setSelectedRequest(request)}
                    className="flex-1 py-2 rounded-xl text-xs font-bold bg-rose-600/80 hover:bg-rose-600 text-white shadow-md shadow-rose-600/20 transition flex items-center justify-center gap-1.5 disabled:opacity-50"
                  >
                    <XCircle className="w-4 h-4" />
                    Reject
                  </button>
                </div>
              )}
            </div>
          ))}
        </div>
      )}

      {/* Reject Reason Modal */}
      {selectedRequest && (
        <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-slate-900 border border-slate-800 rounded-3xl p-6 max-w-md w-full shadow-2xl space-y-5">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-rose-500/20 text-rose-400 flex items-center justify-center border border-rose-500/30">
                <AlertTriangle className="w-5 h-5" />
              </div>
              <div>
                <h3 className="text-base font-bold text-white">Reject Face Registration</h3>
                <p className="text-xs text-slate-400">
                  Provide reason for {selectedRequest.employee?.firstName} {selectedRequest.employee?.lastName}
                </p>
              </div>
            </div>

            <form onSubmit={handleRejectSubmit} className="space-y-4">
              <div>
                <label className="block text-xs font-bold uppercase tracking-wider text-slate-400 mb-2">
                  Rejection Reason
                </label>
                <textarea
                  rows={3}
                  value={rejectReason}
                  onChange={(e) => setRejectReason(e.target.value)}
                  placeholder="Explain why the face template is rejected..."
                  className="w-full bg-slate-950 border border-slate-800 rounded-xl p-3 text-xs text-white placeholder-slate-500 focus:outline-none focus:border-rose-500"
                  required
                />
              </div>

              <div className="flex gap-2">
                <button
                  type="button"
                  onClick={() => setSelectedRequest(null)}
                  className="flex-1 py-2.5 rounded-xl text-xs font-semibold bg-slate-800 text-slate-300 hover:bg-slate-700 transition"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={rejectMutation.isPending}
                  className="flex-1 py-2.5 rounded-xl text-xs font-bold bg-rose-600 hover:bg-rose-500 text-white shadow-lg shadow-rose-600/30 transition disabled:opacity-50"
                >
                  {rejectMutation.isPending ? 'Rejecting...' : 'Confirm Reject'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Large Image Preview Modal */}
      {previewImage && (
        <div
          className="fixed inset-0 z-50 bg-black/90 backdrop-blur-md flex items-center justify-center p-4 cursor-pointer"
          onClick={() => setPreviewImage(null)}
        >
          <div className="relative max-w-lg w-full rounded-2xl overflow-hidden border-2 border-indigo-500/50 shadow-2xl">
            <img src={previewImage} alt="Full Face Preview" className="w-full h-auto object-cover" />
          </div>
        </div>
      )}
    </div>
  );
}
