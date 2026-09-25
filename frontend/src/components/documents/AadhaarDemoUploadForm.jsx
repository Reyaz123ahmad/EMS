import React, { useState } from 'react';
import { Card } from '../ui/Card.jsx';
import { Button } from '../ui/Button.jsx';
import { Input } from '../ui/Input.jsx';
import { useSendAadhaarOTP, useUploadAadhaar } from '../../hooks/useDocuments.js';

export function AadhaarDemoUploadForm({ onUploadSuccess, employeeId }) {
  const [aadhaarRaw, setAadhaarRaw] = useState('');
  const [name, setName] = useState('');
  const [selectedFile, setSelectedFile] = useState(null);
  const [previewUrl, setPreviewUrl] = useState('');
  const [errorMsg, setErrorMsg] = useState('');
  const [loading, setLoading] = useState(false);

  const sendOtpMutation = useSendAadhaarOTP();
  const uploadMutation = useUploadAadhaar();

  // Format with space every 4 digits: 1234 5678 9012
  const handleAadhaarChange = (e) => {
    const raw = e.target.value.replace(/\D/g, '').slice(0, 12);
    setAadhaarRaw(raw);
  };

  const formattedAadhaar = aadhaarRaw.replace(/(\d{4})(?=\d)/g, '$1 ');

  const handleFileChange = (e) => {
    const file = e.target.files[0];
    if (!file) return;

    setSelectedFile(file);
    if (file.type.startsWith('image/')) {
      setPreviewUrl(URL.createObjectURL(file));
    } else {
      setPreviewUrl('');
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (aadhaarRaw.length !== 12) {
      setErrorMsg('Please enter a valid 12-digit Aadhaar number.');
      return;
    }
    if (!selectedFile) {
      setErrorMsg('Please select an Aadhaar card file to upload.');
      return;
    }

    setErrorMsg('');
    setLoading(true);

    try {
      // 1. In demo mode, sendAadhaarOTP issues a DEMO transaction ID without sending an actual OTP
      const otpRes = await sendOtpMutation.mutateAsync({
        aadhaarNumber: aadhaarRaw,
        name,
        consent: true,
        employeeId
      });

      const transactionId = otpRes.data?.transactionId || otpRes.transactionId;

      // 2. Upload Aadhaar file using demo transaction ID
      const formData = new FormData();
      formData.append('file', selectedFile);
      formData.append('transactionId', transactionId);
      if (employeeId) formData.append('employeeId', employeeId);

      const uploadRes = await uploadMutation.mutateAsync(formData);
      setLoading(false);
      if (onUploadSuccess) onUploadSuccess(uploadRes);
    } catch (err) {
      setLoading(false);
      setErrorMsg(err.response?.data?.message || err.message || 'Failed to upload Aadhaar document in demo mode.');
    }
  };

  return (
    <Card className="p-6 bg-slate-900/80 border-slate-800 backdrop-blur-md shadow-xl space-y-6">
      <div className="flex items-start gap-3 p-4 rounded-xl bg-amber-500/10 border border-amber-500/30 text-amber-300 text-sm">
        <div className="text-xl">⚡</div>
        <div>
          <h4 className="font-semibold text-amber-200">Demo Mode Active</h4>
          <p className="text-xs text-amber-300/80 mt-0.5">
            Aadhaar verification OTP flow is bypassed. Direct document upload is enabled for instant testing.
          </p>
        </div>
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
            Standard 12-digit Indian National Identity Number
          </p>
        </div>

        <div>
          <label className="block text-xs font-semibold text-slate-300 mb-1.5">
            Full Name (As per Aadhaar) *
          </label>
          <Input
            value={name}
            onChange={(e) => setName(e.target.value)}
            placeholder="e.g. Ramesh Kumar"
            required
            className="bg-slate-950/70 border-slate-700 text-slate-100"
          />
        </div>

        <div>
          <label className="block text-xs font-semibold text-slate-300 mb-1.5">
            Aadhaar Card Document File (PDF / Image) *
          </label>
          <div className="border-2 border-dashed border-slate-700 hover:border-blue-500/60 transition-colors rounded-xl p-6 text-center bg-slate-950/40">
            <input
              type="file"
              id="demoAadhaarFile"
              accept=".pdf,.png,.jpg,.jpeg"
              onChange={handleFileChange}
              className="hidden"
            />
            <label htmlFor="demoAadhaarFile" className="cursor-pointer space-y-2 block">
              <div className="w-12 h-12 mx-auto rounded-full bg-blue-500/10 flex items-center justify-center text-blue-400 text-xl font-bold">
                📄
              </div>
              <div className="text-sm font-medium text-slate-200">
                {selectedFile ? selectedFile.name : 'Click or drag file to upload Aadhaar'}
              </div>
              <p className="text-xs text-slate-500">Supports PDF, PNG, JPG up to 10MB</p>
            </label>
          </div>

          {previewUrl && (
            <div className="mt-3 p-2 bg-slate-950/80 border border-slate-800 rounded-lg inline-block">
              <img src={previewUrl} alt="Aadhaar Preview" className="h-28 object-contain rounded" />
            </div>
          )}
        </div>

        <Button
          type="submit"
          disabled={loading || aadhaarRaw.length !== 12 || !selectedFile}
          className="w-full bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-500 hover:to-indigo-500 text-white font-medium py-2.5 rounded-lg shadow-lg shadow-blue-500/20"
        >
          {loading ? 'Uploading Aadhaar...' : 'Upload Aadhaar (Demo Direct Mode)'}
        </Button>
      </form>
    </Card>
  );
}

export default AadhaarDemoUploadForm;
