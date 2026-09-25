import React, { useState, useEffect } from 'react';
import { Card } from '../ui/Card.jsx';
import { Button } from '../ui/Button.jsx';
import { Input } from '../ui/Input.jsx';
import { useVerifyAadhaarOTP, useSendAadhaarOTP } from '../../hooks/useDocuments.js';

export function AadhaarOTPVerify({ transactionData, onVerified, onBack, employeeId }) {
  const [otp, setOtp] = useState('');
  const [timeLeft, setTimeLeft] = useState(600); // 10 minutes countdown in seconds
  const [canResend, setCanResend] = useState(false);
  const [errorMsg, setErrorMsg] = useState('');
  const [loading, setLoading] = useState(false);
  const [resending, setResending] = useState(false);
  const [resendMsg, setResendMsg] = useState('');

  const verifyMutation = useVerifyAadhaarOTP();
  const resendMutation = useSendAadhaarOTP();

  useEffect(() => {
    if (timeLeft <= 0) {
      setCanResend(true);
      return;
    }
    const timer = setInterval(() => {
      setTimeLeft((prev) => {
        if (prev <= 1) {
          setCanResend(true);
          return 0;
        }
        return prev - 1;
      });
    }, 1000);

    return () => clearInterval(timer);
  }, [timeLeft]);

  const formatTime = (secs) => {
    const mins = Math.floor(secs / 60);
    const s = secs % 60;
    return `${mins}:${s < 10 ? '0' : ''}${s}`;
  };

  const handleVerify = async (e) => {
    e.preventDefault();
    if (!otp || otp.length !== 6) {
      setErrorMsg('Please enter a 6-digit OTP.');
      return;
    }

    setErrorMsg('');
    setLoading(true);

    try {
      const response = await verifyMutation.mutateAsync({
        transactionId: transactionData.transactionId,
        otp: otp.trim(),
        aadhaarNumber: transactionData.rawAadhaar,
        employeeId
      });

      setLoading(false);
      const data = response.data || response;
      if (onVerified) {
        onVerified({
          ...transactionData,
          aadhaarData: data.aadhaarData,
          verified: true
        });
      }
    } catch (err) {
      setLoading(false);
      setErrorMsg(err.response?.data?.message || err.message || 'OTP verification failed. Please recheck the OTP.');
    }
  };

  const handleResend = async () => {
    if (!canResend) return;
    setErrorMsg('');
    setResendMsg('');
    setResending(true);

    try {
      const response = await resendMutation.mutateAsync({
        aadhaarNumber: transactionData.rawAadhaar,
        name: transactionData.name,
        consent: true,
        employeeId
      });

      setResending(false);
      const data = response.data || response;
      transactionData.transactionId = data.transactionId;
      setTimeLeft(600);
      setCanResend(false);
      setResendMsg('New OTP has been dispatched to your mobile.');
    } catch (err) {
      setResending(false);
      setErrorMsg(err.response?.data?.message || 'Failed to resend OTP.');
    }
  };

  return (
    <Card className="p-6 bg-slate-900/80 border-slate-800 backdrop-blur-md shadow-xl space-y-6">
      <div className="border-b border-slate-800 pb-4">
        <h3 className="text-lg font-semibold text-white">Step 2: Enter Verification OTP</h3>
        <p className="text-xs text-slate-400 mt-1">
          Enter the 6-digit OTP sent by UIDAI to the mobile registered with Aadhaar{' '}
          <span className="font-mono text-slate-200 font-semibold">{transactionData.maskedAadhaar}</span>.
        </p>
      </div>

      <div className="flex items-center justify-between p-3 rounded-lg bg-slate-950/60 border border-slate-800 text-xs">
        <span className="text-slate-400">Transaction ID:</span>
        <span className="font-mono text-blue-400 font-semibold">{transactionData.transactionId}</span>
      </div>

      {errorMsg && (
        <div className="p-3.5 rounded-lg bg-red-500/10 border border-red-500/30 text-red-400 text-xs sm:text-sm">
          {errorMsg}
        </div>
      )}

      {resendMsg && (
        <div className="p-3 rounded-lg bg-emerald-500/10 border border-emerald-500/30 text-emerald-400 text-xs">
          {resendMsg}
        </div>
      )}

      <form onSubmit={handleVerify} className="space-y-6">
        <div className="text-center space-y-2">
          <label className="block text-xs font-semibold text-slate-300">
            6-Digit UIDAI OTP *
          </label>
          <Input
            value={otp}
            onChange={(e) => setOtp(e.target.value.replace(/\D/g, '').slice(0, 6))}
            placeholder="• • • • • •"
            required
            maxLength={6}
            className="w-48 mx-auto text-center tracking-[0.5em] text-2xl font-mono bg-slate-950/80 border-slate-700 text-slate-100 placeholder:text-slate-600"
          />
        </div>

        <div className="text-center text-xs text-slate-400 flex items-center justify-center gap-2">
          <span>OTP expires in:</span>
          <span className="font-mono font-semibold text-amber-400">{formatTime(timeLeft)}</span>
        </div>

        <div className="flex items-center justify-between pt-2">
          <button
            type="button"
            onClick={onBack}
            className="text-xs text-slate-400 hover:text-white transition-colors"
          >
            ← Change Aadhaar Number
          </button>

          <button
            type="button"
            disabled={!canResend || resending}
            onClick={handleResend}
            className={`text-xs font-medium ${
              canResend ? 'text-blue-400 hover:text-blue-300 cursor-pointer' : 'text-slate-600 cursor-not-allowed'
            }`}
          >
            {resending ? 'Sending...' : 'Resend OTP'}
          </button>
        </div>

        <Button
          type="submit"
          disabled={loading || otp.length !== 6}
          className="w-full bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-500 hover:to-indigo-500 text-white font-medium py-2.5 rounded-lg shadow-lg shadow-blue-500/20"
        >
          {loading ? 'Verifying OTP with UIDAI...' : 'Verify OTP & Continue'}
        </Button>
      </form>
    </Card>
  );
}

export default AadhaarOTPVerify;
