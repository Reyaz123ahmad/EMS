import React from 'react';
import { useQuery } from '@tanstack/react-query';
import { useNavigate } from 'react-router-dom';
import { faceRegistrationService } from '../../services/face-registration.service';
import { Clock, CheckCircle2, XCircle, ShieldCheck, Camera, ArrowRight, RefreshCw, AlertCircle } from 'lucide-react';

export default function FaceRegistrationStatusPage() {
  const navigate = useNavigate();

  const { data: statusData, isLoading, refetch, isRefetching } = useQuery({
    queryKey: ['face-registration-status'],
    queryFn: () => faceRegistrationService.getMyStatus()
  });

  const status = statusData?.status || 'NOT_REGISTERED';

  if (isLoading) {
    return (
      <div className="max-w-2xl mx-auto p-8 space-y-4">
        <div className="h-8 bg-slate-800 animate-pulse rounded-xl w-64 mx-auto" />
        <div className="h-64 bg-slate-900/60 border border-slate-800 animate-pulse rounded-3xl" />
      </div>
    );
  }

  return (
    <div className="max-w-2xl mx-auto space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-black text-white flex items-center gap-2.5">
            <ShieldCheck className="w-7 h-7 text-indigo-400" />
            Face Biometric Status
          </h1>
          <p className="text-xs text-slate-400 mt-1">
            Real-time status of your facial recognition registration and verification credentials.
          </p>
        </div>
        <button
          type="button"
          onClick={() => refetch()}
          disabled={isRefetching}
          className="p-2.5 rounded-xl border border-slate-700 bg-slate-800 text-slate-300 hover:bg-slate-700 hover:text-white transition"
          title="Refresh Status"
        >
          <RefreshCw className={`w-4 h-4 ${isRefetching ? 'animate-spin text-indigo-400' : ''}`} />
        </button>
      </div>

      {status === 'PENDING' && (
        <div className="bg-amber-950/20 border-2 border-amber-500/40 rounded-3xl p-8 text-center backdrop-blur-xl shadow-2xl space-y-5">
          <div className="w-16 h-16 rounded-2xl bg-amber-500/20 border border-amber-500/30 flex items-center justify-center mx-auto text-amber-400 shadow-inner">
            <Clock className="h-9 w-9 animate-pulse" />
          </div>

          <div className="space-y-1">
            <span className="inline-block px-3 py-1 rounded-full text-xs font-bold uppercase tracking-wider bg-amber-500/10 text-amber-400 border border-amber-500/20">
              Pending HR Review
            </span>
            <h2 className="text-xl font-bold text-white">Face Registration Under Review</h2>
            <p className="text-xs text-slate-300 max-w-md mx-auto">
              Your face registration request has been submitted securely and is waiting for approval by HR Admin or HR Manager.
            </p>
          </div>

          {statusData?.pendingPhotoUrl && (
            <div className="w-28 h-28 mx-auto rounded-2xl overflow-hidden border-2 border-amber-500/40 shadow-md">
              <img
                src={statusData.pendingPhotoUrl}
                alt="Submitted Face"
                className="w-full h-full object-cover"
              />
            </div>
          )}

          <div className="bg-slate-900/80 border border-slate-800 rounded-2xl p-4 text-xs text-slate-400 space-y-1 max-w-sm mx-auto">
            <p>
              Requested At:{' '}
              <strong className="text-slate-200">
                {statusData?.createdAt ? new Date(statusData.createdAt).toLocaleString() : 'Recent'}
              </strong>
            </p>
            <p>Security verification will unlock facial attendance immediately upon approval.</p>
          </div>
        </div>
      )}

      {status === 'APPROVED' && (
        <div className="bg-emerald-950/20 border-2 border-emerald-500/40 rounded-3xl p-8 text-center backdrop-blur-xl shadow-2xl space-y-5">
          <div className="w-16 h-16 rounded-2xl bg-emerald-500/20 border border-emerald-500/30 flex items-center justify-center mx-auto text-emerald-400 shadow-inner">
            <CheckCircle2 className="h-9 w-9" />
          </div>

          <div className="space-y-1">
            <span className="inline-block px-3 py-1 rounded-full text-xs font-bold uppercase tracking-wider bg-emerald-500/10 text-emerald-400 border border-emerald-500/20">
              Active & Verified
            </span>
            <h2 className="text-xl font-bold text-white">Face Biometric Approved</h2>
            <p className="text-xs text-slate-300 max-w-md mx-auto">
              Your face biometric data is enrolled and verified. You can mark check-in, breaks, and check-out using face mode.
            </p>
          </div>

          {statusData?.facePhotoUrl && (
            <div className="w-28 h-28 mx-auto rounded-2xl overflow-hidden border-2 border-emerald-500/40 shadow-md">
              <img
                src={statusData.facePhotoUrl}
                alt="Registered Face"
                className="w-full h-full object-cover"
              />
            </div>
          )}

          <div className="pt-2 flex flex-col sm:flex-row gap-3 justify-center">
            <button
              type="button"
              onClick={() => navigate('/attendance')}
              className="inline-flex items-center justify-center gap-2 px-6 py-3 rounded-xl text-xs font-bold bg-indigo-600 hover:bg-indigo-500 text-white shadow-lg shadow-indigo-600/30 transition"
            >
              Mark Attendance Now
              <ArrowRight className="w-4 h-4" />
            </button>
            <button
              type="button"
              onClick={() => navigate('/face/register')}
              className="inline-flex items-center justify-center gap-2 px-6 py-3 rounded-xl text-xs font-semibold border border-slate-700 bg-slate-800 text-slate-300 hover:bg-slate-700 transition"
            >
              Update / Re-enroll Face
            </button>
          </div>
        </div>
      )}

      {status === 'REJECTED' && (
        <div className="bg-rose-950/20 border-2 border-rose-500/40 rounded-3xl p-8 text-center backdrop-blur-xl shadow-2xl space-y-5">
          <div className="w-16 h-16 rounded-2xl bg-rose-500/20 border border-rose-500/30 flex items-center justify-center mx-auto text-rose-400 shadow-inner">
            <XCircle className="h-9 w-9" />
          </div>

          <div className="space-y-1">
            <span className="inline-block px-3 py-1 rounded-full text-xs font-bold uppercase tracking-wider bg-rose-500/10 text-rose-400 border border-rose-500/20">
              Registration Rejected
            </span>
            <h2 className="text-xl font-bold text-white">Face Verification Rejected</h2>
            <p className="text-xs text-rose-300/90 max-w-md mx-auto">
              Your face registration was not approved by the HR administrator.
            </p>
          </div>

          {statusData?.rejectionReason && (
            <div className="bg-rose-900/30 border border-rose-500/30 rounded-2xl p-4 text-xs text-rose-200 max-w-md mx-auto flex items-start gap-2.5 text-left">
              <AlertCircle className="w-4 h-4 text-rose-400 flex-shrink-0 mt-0.5" />
              <div>
                <strong className="block text-rose-300 font-semibold mb-0.5">Rejection Reason:</strong>
                <span>{statusData.rejectionReason}</span>
              </div>
            </div>
          )}

          <div className="pt-2">
            <button
              type="button"
              onClick={() => navigate('/face/register')}
              className="w-full sm:w-auto inline-flex items-center justify-center gap-2 px-8 py-3 rounded-xl text-xs font-bold bg-rose-600 hover:bg-rose-500 text-white shadow-lg shadow-rose-600/30 transition"
            >
              <Camera className="w-4 h-4" />
              Capture & Submit New Face Photo
            </button>
          </div>
        </div>
      )}

      {status === 'NOT_REGISTERED' && (
        <div className="bg-slate-900/60 border border-slate-800 rounded-3xl p-8 text-center backdrop-blur-xl shadow-2xl space-y-5">
          <div className="w-16 h-16 rounded-2xl bg-indigo-500/20 border border-indigo-500/30 flex items-center justify-center mx-auto text-indigo-400 shadow-inner">
            <Camera className="h-9 w-9" />
          </div>

          <div className="space-y-1">
            <h2 className="text-xl font-bold text-white">No Face Registered Yet</h2>
            <p className="text-xs text-slate-400 max-w-md mx-auto">
              You have not enrolled your face biometric for attendance verification. Complete enrollment to mark attendance seamlessly.
            </p>
          </div>

          <div className="pt-2">
            <button
              type="button"
              onClick={() => navigate('/face/register')}
              className="inline-flex items-center justify-center gap-2 px-8 py-3 rounded-xl text-xs font-bold bg-gradient-to-r from-indigo-600 to-purple-600 hover:from-indigo-500 hover:to-purple-500 text-white shadow-lg shadow-indigo-600/30 transition"
            >
              Enroll Face Biometric
              <ArrowRight className="w-4 h-4" />
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
