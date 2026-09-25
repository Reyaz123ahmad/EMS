import React, { useState } from 'react';
import { Card } from '../ui/Card.jsx';
import { Button } from '../ui/Button.jsx';
import { Input } from '../ui/Input.jsx';
import { useSendAadhaarOTP } from '../../hooks/useDocuments.js';

export function AadhaarOTPForm({ onOtpSent, employeeId }) {
  const [aadhaarRaw, setAadhaarRaw] = useState('');
  const [name, setName] = useState('');
  const [consent, setConsent] = useState(true);
  const [errorMsg, setErrorMsg] = useState('');
  const [loading, setLoading] = useState(false);

  const sendOtpMutation = useSendAadhaarOTP();

  const handleAadhaarChange = (e) => {
    const raw = e.target.value.replace(/\D/g, '').slice(0, 12);
    setAadhaarRaw(raw);
  };

  const formattedAadhaar = aadhaarRaw.replace(/(\d{4})(?=\d)/g, '$1 ');

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (aadhaarRaw.length !== 12) {
      setErrorMsg('Please enter a valid 12-digit Aadhaar number.');
      return;
    }
    if (!consent) {
      setErrorMsg('You must provide consent for UIDAI Aadhaar verification.');
      return;
    }

    setErrorMsg('');
    setLoading(true);

    try {
      const response = await sendOtpMutation.mutateAsync({
        aadhaarNumber: aadhaarRaw,
        name,
        consent,
        employeeId
      });

      setLoading(false);
      const data = response.data || response;
      if (onOtpSent) {
        onOtpSent({
          transactionId: data.transactionId,
          maskedAadhaar: `XXXX-XXXX-${aadhaarRaw.slice(-4)}`,
          rawAadhaar: aadhaarRaw,
          name
        });
      }
    } catch (err) {
      setLoading(false);
      setErrorMsg(err.response?.data?.message || err.message || 'Failed to dispatch Aadhaar OTP. Please check the details and try again.');
    }
  };

  return (
    <Card className="p-6 bg-slate-900/80 border-slate-800 backdrop-blur-md shadow-xl space-y-6">
      <div className="border-b border-slate-800 pb-4">
        <h3 className="text-lg font-semibold text-white">Step 1: Enter Aadhaar Details</h3>
        <p className="text-xs text-slate-400 mt-1">
          Provide your 12-digit Aadhaar number to trigger an official UIDAI OTP to your registered mobile number.
        </p>
      </div>

      {errorMsg && (
        <div className="p-3.5 rounded-lg bg-red-500/10 border border-red-500/30 text-red-400 text-xs sm:text-sm">
          {errorMsg}
        </div>
      )}

      <form onSubmit={handleSubmit} className="space-y-5">
        <div>
          <label className="block text-xs font-semibold text-slate-300 mb-1.5">
            Aadhaar Number (12 Digits) *
          </label>
          <Input
            value={formattedAadhaar}
            onChange={handleAadhaarChange}
            placeholder="XXXX XXXX XXXX"
            required
            maxLength={14}
            className="bg-slate-950/70 border-slate-700 font-mono text-base tracking-widest text-slate-100 placeholder:text-slate-600"
          />
          <p className="text-[11px] text-slate-500 mt-1">
            An authentication OTP will be transmitted to the mobile registered with this number.
          </p>
        </div>

        <div>
          <label className="block text-xs font-semibold text-slate-300 mb-1.5">
            Full Name (As per Aadhaar)
          </label>
          <Input
            value={name}
            onChange={(e) => setName(e.target.value)}
            placeholder="e.g. Ramesh Kumar"
            className="bg-slate-950/70 border-slate-700 text-slate-100"
          />
        </div>

        <div className="p-4 rounded-xl bg-slate-950/50 border border-slate-800 space-y-2">
          <label className="flex items-start gap-3 cursor-pointer">
            <input
              type="checkbox"
              checked={consent}
              onChange={(e) => setConsent(e.target.checked)}
              className="mt-1 rounded border-slate-700 bg-slate-900 text-blue-600 focus:ring-blue-500"
            />
            <span className="text-xs text-slate-300 leading-relaxed">
              I hereby give my explicit consent to EMS to fetch and verify my identity details from UIDAI for employee verification purposes under the Aadhaar Act.
            </span>
          </label>
        </div>

        <Button
          type="submit"
          disabled={loading || aadhaarRaw.length !== 12 || !consent}
          className="w-full bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-500 hover:to-indigo-500 text-white font-medium py-2.5 rounded-lg shadow-lg shadow-blue-500/20"
        >
          {loading ? 'Requesting UIDAI OTP...' : 'Send Aadhaar OTP'}
        </Button>
      </form>
    </Card>
  );
}

export default AadhaarOTPForm;
