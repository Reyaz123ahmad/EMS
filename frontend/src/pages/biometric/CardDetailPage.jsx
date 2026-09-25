import React from 'react';
import { useParams, Link, useNavigate } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import {
  ArrowLeft,
  Download,
  RefreshCw,
  Ban,
  ShieldCheck,
  Calendar,
  User,
  Building,
  CreditCard,
  QrCode
} from 'lucide-react';
import api from '../../services/api';
import CardPreview from '../../components/biometric/CardPreview';
import { useRegenerateQR, useDeactivateCard } from '../../hooks/useBiometricCards';
import dayjs from 'dayjs';

export default function CardDetailPage() {
  const { id } = useParams();
  const navigate = useNavigate();

  const { data, isLoading, refetch } = useQuery({
    queryKey: ['biometric-card-detail', id],
    queryFn: async () => {
      const res = await api.get('/biometric/cards', { params: { limit: 100 } });
      const found = res.data?.data?.cards?.find((c) => c.id === id);
      return found || null;
    }
  });

  const regenerateMutation = useRegenerateQR();
  const deactivateMutation = useDeactivateCard();

  const card = data;

  const handleRegenerate = () => {
    if (window.confirm('Regenerate QR signature and create a new PDF badge for this employee?')) {
      regenerateMutation.mutate(id, {
        onSuccess: () => refetch()
      });
    }
  };

  const handleDeactivate = () => {
    const reason = window.prompt(`Enter reason to deactivate card ${card?.cardNumber}:`, 'Lost or damaged card');
    if (reason) {
      deactivateMutation.mutate(
        { cardId: id, reason },
        {
          onSuccess: () => refetch()
        }
      );
    }
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-[400px] text-slate-400">
        Loading card information...
      </div>
    );
  }

  if (!card) {
    return (
      <div className="text-center py-16 space-y-4">
        <CreditCard className="w-16 h-16 text-slate-600 mx-auto" />
        <h2 className="text-xl font-bold text-slate-200">Card Not Found</h2>
        <Link
          to="/biometric/cards"
          className="inline-flex items-center gap-2 px-4 py-2 bg-indigo-600 text-white rounded-xl text-sm font-semibold"
        >
          <ArrowLeft className="w-4 h-4" /> Back to Card Directory
        </Link>
      </div>
    );
  }

  return (
    <div className="max-w-5xl mx-auto space-y-6">
      {/* Top Navigation */}
      <div className="flex items-center justify-between">
        <button
          onClick={() => navigate('/biometric/cards')}
          className="inline-flex items-center gap-2 text-sm text-slate-400 hover:text-slate-200 transition"
        >
          <ArrowLeft className="w-4 h-4" /> Back to Cards
        </button>

        <div className="flex items-center gap-3">
          {card.pdfUrl && (
            <a
              href={card.pdfUrl}
              target="_blank"
              rel="noreferrer"
              className="inline-flex items-center gap-2 px-4 py-2 bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-semibold rounded-xl shadow-lg transition"
            >
              <Download className="w-4 h-4" /> Download PDF Badge
            </a>
          )}

          {card.isActive && (
            <>
              <button
                onClick={handleRegenerate}
                disabled={regenerateMutation.isPending}
                className="inline-flex items-center gap-2 px-4 py-2 bg-slate-800 hover:bg-slate-700 text-amber-300 text-xs font-semibold rounded-xl border border-slate-700 transition"
              >
                <RefreshCw className={`w-4 h-4 ${regenerateMutation.isPending ? 'animate-spin' : ''}`} />
                Regenerate QR
              </button>
              <button
                onClick={handleDeactivate}
                disabled={deactivateMutation.isPending}
                className="inline-flex items-center gap-2 px-4 py-2 bg-rose-950/60 hover:bg-rose-900 border border-rose-800/80 text-rose-300 text-xs font-semibold rounded-xl transition"
              >
                <Ban className="w-4 h-4" /> Deactivate
              </button>
            </>
          )}
        </div>
      </div>

      {/* Main Content Layout */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* Left: Interactive Preview */}
        <div className="lg:col-span-5 flex flex-col items-center justify-center p-6 bg-slate-900 border border-slate-800 rounded-3xl shadow-xl">
          <h3 className="text-sm font-bold text-slate-300 uppercase tracking-wider mb-6">
            Physical Badge Preview
          </h3>
          <CardPreview employee={card.employee} card={card} qrCodeUrl={card.qrUrl} />
          {card.pdfUrl && (
            <p className="mt-4 text-xs text-slate-400 text-center">
              Print-ready CR80 card template with high-resolution QR image
            </p>
          )}
        </div>

        {/* Right: Metadata & Security Breakdown */}
        <div className="lg:col-span-7 space-y-6">
          {/* Card Info Card */}
          <div className="bg-slate-900 border border-slate-800 rounded-3xl p-6 shadow-xl space-y-4">
            <div className="flex items-center justify-between pb-4 border-b border-slate-800">
              <div className="space-y-0.5">
                <span className="text-xs text-slate-400">Card Identifier</span>
                <h2 className="text-xl font-mono font-bold text-amber-400">{card.cardNumber}</h2>
              </div>
              <div>
                {card.isActive ? (
                  <span className="px-3 py-1 rounded-full text-xs font-bold bg-emerald-500/10 text-emerald-400 border border-emerald-500/30">
                    Active & Valid
                  </span>
                ) : (
                  <span className="px-3 py-1 rounded-full text-xs font-bold bg-rose-500/10 text-rose-400 border border-rose-500/30">
                    Deactivated
                  </span>
                )}
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4 text-sm">
              <div className="p-3 bg-slate-950 rounded-2xl border border-slate-800/80">
                <span className="text-xs text-slate-400 block mb-1">Card Type</span>
                <span className="font-semibold text-slate-200">{card.cardType}</span>
              </div>
              <div className="p-3 bg-slate-950 rounded-2xl border border-slate-800/80">
                <span className="text-xs text-slate-400 block mb-1">QR Regenerations</span>
                <span className="font-semibold text-indigo-400">{card.regenerationCount || 0} times</span>
              </div>
              <div className="p-3 bg-slate-950 rounded-2xl border border-slate-800/80">
                <span className="text-xs text-slate-400 block mb-1">Assigned Date</span>
                <span className="font-semibold text-slate-200">
                  {dayjs(card.assignedAt).format('DD MMMM YYYY')}
                </span>
              </div>
              <div className="p-3 bg-slate-950 rounded-2xl border border-slate-800/80">
                <span className="text-xs text-slate-400 block mb-1">Expiry Date</span>
                <span className="font-semibold text-slate-200">
                  {card.expiresAt ? dayjs(card.expiresAt).format('DD MMMM YYYY') : 'Lifetime'}
                </span>
              </div>
            </div>
          </div>

          {/* Employee Link */}
          <div className="bg-slate-900 border border-slate-800 rounded-3xl p-6 shadow-xl space-y-3">
            <h3 className="font-bold text-slate-200 flex items-center gap-2">
              <User className="w-4 h-4 text-indigo-400" />
              Assigned Employee
            </h3>
            <div className="flex items-center gap-4 p-4 bg-slate-950 rounded-2xl border border-slate-800">
              <div className="w-12 h-12 rounded-xl bg-indigo-600 flex items-center justify-center font-bold text-lg text-white">
                {card.employee?.firstName?.charAt(0)}
              </div>
              <div>
                <h4 className="font-bold text-slate-100">
                  {card.employee?.firstName} {card.employee?.lastName}
                </h4>
                <p className="text-xs text-slate-400 font-mono">
                  {card.employee?.employeeCode} • {card.employee?.department?.name || 'Department'}
                </p>
                <p className="text-xs text-indigo-300">{card.employee?.email}</p>
              </div>
            </div>
          </div>

          {/* Security Hash info */}
          <div className="bg-slate-900 border border-slate-800 rounded-3xl p-6 shadow-xl space-y-2">
            <h3 className="font-bold text-slate-200 flex items-center gap-2">
              <ShieldCheck className="w-4 h-4 text-emerald-400" />
              Tamper-Proof Cryptographic Verification
            </h3>
            <p className="text-xs text-slate-400 leading-relaxed">
              Every QR code is cryptographically signed using HMAC-SHA256 bound to employee ID, company ID, issue timestamp, and expiration. Any modification will be instantly rejected by scanner terminals.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
