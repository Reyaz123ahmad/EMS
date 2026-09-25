import React, { useState } from 'react';
import { ShieldCheck, QrCode, UserCheck, AlertTriangle, RefreshCw } from 'lucide-react';
import QRScanner from '../components/biometric/QRScanner';
import { useVerifyQR } from '../hooks/useBiometricCards';

export default function VerifyQRPage() {
  const [verificationResult, setVerificationResult] = useState(null);
  const verifyMutation = useVerifyQR();

  const handleScan = async (qrData) => {
    try {
      const res = await verifyMutation.mutateAsync(qrData);
      setVerificationResult({
        success: true,
        data: res.data
      });
    } catch (err) {
      setVerificationResult({
        success: false,
        error: err.response?.data?.message || err.message || 'Verification failed. QR code may be tampered or invalid.'
      });
    }
  };

  const handleReset = () => {
    setVerificationResult(null);
  };

  return (
    <div className="min-h-screen bg-slate-950 text-white flex flex-col items-center justify-center p-4 sm:p-6">
      {/* Container */}
      <div className="w-full max-w-md bg-slate-900 border border-slate-800 rounded-3xl p-6 shadow-2xl space-y-6">
        {/* Header */}
        <div className="text-center space-y-2">
          <div className="w-12 h-12 rounded-2xl bg-indigo-600/20 border border-indigo-500/30 flex items-center justify-center mx-auto text-indigo-400 shadow-inner">
            <QrCode className="w-6 h-6" />
          </div>
          <h1 className="text-2xl font-bold text-slate-100">Identity Badge Verification</h1>
          <p className="text-xs text-slate-400">
            Public tamper-proof QR verification terminal. Scan any employee card to inspect legitimacy.
          </p>
        </div>

        {/* Verification Result State */}
        {verificationResult ? (
          <div className="space-y-4 animate-fadeIn">
            {verificationResult.success ? (
              <div className="p-5 bg-emerald-950/40 border border-emerald-500/40 rounded-2xl space-y-4 text-center">
                <div className="w-12 h-12 rounded-full bg-emerald-500/20 border border-emerald-500/40 flex items-center justify-center mx-auto text-emerald-400">
                  <ShieldCheck className="w-7 h-7" />
                </div>
                <div>
                  <span className="px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-emerald-500/20 text-emerald-400 uppercase tracking-wide border border-emerald-500/30">
                    Cryptographically Verified
                  </span>
                  <h3 className="text-xl font-bold text-white mt-2">
                    {verificationResult.data?.employee?.name || 'Verified Employee'}
                  </h3>
                  <p className="text-xs font-mono text-indigo-300">
                    Code: {verificationResult.data?.employee?.employeeCode}
                  </p>
                </div>

                <div className="grid grid-cols-2 gap-2 text-left text-xs bg-slate-950/80 p-3 rounded-xl border border-slate-800">
                  <div>
                    <span className="text-slate-400 block">Department:</span>
                    <span className="font-semibold text-slate-200">
                      {verificationResult.data?.employee?.department || 'General'}
                    </span>
                  </div>
                  <div>
                    <span className="text-slate-400 block">Card No:</span>
                    <span className="font-mono font-bold text-amber-400">
                      {verificationResult.data?.card?.cardNumber}
                    </span>
                  </div>
                </div>
              </div>
            ) : (
              <div className="p-5 bg-rose-950/40 border border-rose-500/40 rounded-2xl space-y-3 text-center">
                <div className="w-12 h-12 rounded-full bg-rose-500/20 border border-rose-500/40 flex items-center justify-center mx-auto text-rose-400">
                  <AlertTriangle className="w-7 h-7" />
                </div>
                <h3 className="text-lg font-bold text-rose-200">Invalid or Tampered QR Code</h3>
                <p className="text-xs text-rose-300/80">
                  {verificationResult.error}
                </p>
              </div>
            )}

            <button
              onClick={handleReset}
              className="w-full py-2.5 bg-indigo-600 hover:bg-indigo-500 text-white rounded-xl text-xs font-bold transition flex items-center justify-center gap-2"
            >
              <RefreshCw className="w-4 h-4" /> Scan Another Card
            </button>
          </div>
        ) : (
          <div className="space-y-4">
            <QRScanner onScan={handleScan} active={!verificationResult} />
          </div>
        )}

        <div className="text-center pt-2 border-t border-slate-800">
          <p className="text-[11px] text-slate-500 font-mono">
            Powered by Edudibon EMS Biometric Engine v2.0
          </p>
        </div>
      </div>
    </div>
  );
}
