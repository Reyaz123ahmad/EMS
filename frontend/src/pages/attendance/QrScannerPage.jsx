import React, { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { QrCode, ShieldCheck, Camera, RefreshCw, AlertTriangle, CheckCircle2, UserCheck } from 'lucide-react';
import api from '../../services/api.js';
import Card from '../../components/ui/Card.jsx';
import Button from '../../components/ui/Button.jsx';
import Spinner from '../../components/ui/Spinner.jsx';
import { toast } from 'sonner';

export default function QrScannerPage() {
  const queryClient = useQueryClient();
  const [manualCode, setManualCode] = useState('');
  const [scanResult, setScanResult] = useState(null);

  const { data: response, isLoading, refetch } = useQuery({
    queryKey: ['attendance', 'qr-scanner'],
    queryFn: async () => {
      const res = await api.get('/attendance/qr-scanner');
      return res.data;
    }
  });

  const scanMutation = useMutation({
    mutationFn: async (cardData) => {
      const res = await api.post('/attendance/card-scan', cardData);
      return res.data;
    },
    onSuccess: (data) => {
      setScanResult({ success: true, message: data.message || 'Attendance verified and recorded successfully', data: data.data });
      toast.success('Card scanned successfully!');
      queryClient.invalidateQueries({ queryKey: ['attendance'] });
    },
    onError: (err) => {
      setScanResult({
        success: false,
        message: err.response?.data?.message || err.message || 'Card verification failed'
      });
      toast.error('QR Scan failed');
    }
  });

  const handleTestScan = (e) => {
    e.preventDefault();
    if (!manualCode.trim()) {
      toast.error('Please enter a card code or employee token');
      return;
    }
    scanMutation.mutate({
      cardCode: manualCode.trim(),
      timestamp: new Date().toISOString()
    });
  };

  const data = response?.data || {};
  const activeCardsCount = data.activeCardsCount || 0;
  const recentCards = data.recentCards || [];

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-black text-white flex items-center gap-2">
            <QrCode className="w-7 h-7 text-indigo-400" />
            Card QR Scanner Terminal
          </h1>
          <p className="text-sm text-slate-400">
            Physical & digital employee QR badge scanner for instant contactless attendance punches
          </p>
        </div>

        <div className="flex items-center gap-3">
          <Button variant="secondary" size="sm" onClick={() => refetch()} className="gap-2">
            <RefreshCw className="w-4 h-4" />
            Refresh
          </Button>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Scanner Terminal */}
        <Card className="p-6 bg-slate-900 border-slate-800 space-y-6">
          <div className="text-center space-y-2">
            <div className="w-16 h-16 rounded-2xl bg-indigo-600/20 border border-indigo-500/30 flex items-center justify-center mx-auto text-indigo-400">
              <Camera className="w-8 h-8" />
            </div>
            <h2 className="text-lg font-bold text-white">Live Terminal Scanner</h2>
            <p className="text-xs text-slate-400">Point optical scanner or webcam towards the employee QR badge</p>
          </div>

          <div className="relative aspect-video rounded-2xl bg-slate-950 border-2 border-dashed border-indigo-500/40 flex flex-col items-center justify-center p-6 text-center overflow-hidden">
            <div className="w-36 h-36 border-2 border-indigo-400 rounded-xl relative animate-pulse flex items-center justify-center">
              <QrCode className="w-20 h-20 text-indigo-400/40" />
              <div className="absolute inset-x-0 top-0 h-0.5 bg-gradient-to-r from-transparent via-indigo-400 to-transparent animate-bounce" />
            </div>
            <span className="text-xs text-indigo-300 font-mono mt-3">Optical Scan Sensor Active</span>
          </div>

          {/* Quick Manual Code Entry */}
          <form onSubmit={handleTestScan} className="space-y-3">
            <label className="block text-xs font-semibold uppercase tracking-wider text-slate-400">
              Manual Card Code / Token Entry
            </label>
            <div className="flex gap-2">
              <input
                type="text"
                value={manualCode}
                onChange={(e) => setManualCode(e.target.value)}
                placeholder="e.g. CARD-EMP-1001"
                className="flex-1 bg-slate-800 border border-slate-700 rounded-xl px-4 py-2.5 text-sm text-white placeholder-slate-500 focus:outline-none focus:border-indigo-500"
              />
              <Button type="submit" disabled={scanMutation.isPending} className="whitespace-nowrap">
                {scanMutation.isPending ? <Spinner size="sm" /> : 'Punch In / Out'}
              </Button>
            </div>
          </form>

          {/* Result Alert */}
          {scanResult && (
            <div className={`p-4 rounded-xl border text-sm flex items-start gap-3 ${
              scanResult.success
                ? 'bg-emerald-500/10 border-emerald-500/30 text-emerald-300'
                : 'bg-rose-500/10 border-rose-500/30 text-rose-300'
            }`}>
              {scanResult.success ? (
                <CheckCircle2 className="w-5 h-5 text-emerald-400 shrink-0 mt-0.5" />
              ) : (
                <AlertTriangle className="w-5 h-5 text-rose-400 shrink-0 mt-0.5" />
              )}
              <div>
                <p className="font-semibold">{scanResult.success ? 'Punch Verified' : 'Scan Failed'}</p>
                <p className="text-xs opacity-90 mt-0.5">{scanResult.message}</p>
              </div>
            </div>
          )}
        </Card>

        {/* Active Cards & Status */}
        <div className="space-y-6">
          <div className="grid grid-cols-2 gap-4">
            <Card className="p-5 bg-gradient-to-br from-indigo-500/10 to-transparent border-indigo-500/20">
              <span className="text-xs font-semibold uppercase text-indigo-400">Enrolled Badges</span>
              <div className="text-2xl font-bold text-white mt-1">{activeCardsCount}</div>
              <p className="text-xs text-slate-400 mt-1">Ready for punch verification</p>
            </Card>

            <Card className="p-5 bg-gradient-to-br from-emerald-500/10 to-transparent border-emerald-500/20">
              <span className="text-xs font-semibold uppercase text-emerald-400">Scanner Engine</span>
              <div className="text-2xl font-bold text-emerald-400 mt-1">ONLINE</div>
              <p className="text-xs text-slate-400 mt-1">Sha-256 HMAC Active</p>
            </Card>
          </div>

          <Card className="p-6 bg-slate-900 border-slate-800 space-y-4">
            <h3 className="text-sm font-bold uppercase tracking-wider text-slate-300">
              Enrolled Employee Digital Cards
            </h3>

            {isLoading ? (
              <div className="flex justify-center p-8">
                <Spinner size="md" />
              </div>
            ) : recentCards.length === 0 ? (
              <p className="text-xs text-slate-500 text-center py-6">No custom biometric cards found</p>
            ) : (
              <div className="divide-y divide-slate-800">
                {recentCards.map((card) => (
                  <div key={card.id} className="py-3 flex items-center justify-between">
                    <div>
                      <p className="text-sm font-semibold text-white">
                        {card.employee?.firstName} {card.employee?.lastName}
                      </p>
                      <p className="text-xs font-mono text-slate-400">{card.employee?.employeeCode}</p>
                    </div>
                    <span className="px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-indigo-500/20 text-indigo-400">
                      {card.cardNumber || 'VALID'}
                    </span>
                  </div>
                ))}
              </div>
            )}
          </Card>
        </div>
      </div>
    </div>
  );
}
