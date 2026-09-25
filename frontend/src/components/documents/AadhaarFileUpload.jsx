import React, { useState } from 'react';
import { Card } from '../ui/Card.jsx';
import { Button } from '../ui/Button.jsx';
import { useUploadAadhaar } from '../../hooks/useDocuments.js';

export function AadhaarFileUpload({ transactionData, onUploadSuccess, employeeId }) {
  const [selectedFile, setSelectedFile] = useState(null);
  const [previewUrl, setPreviewUrl] = useState('');
  const [errorMsg, setErrorMsg] = useState('');
  const [loading, setLoading] = useState(false);

  const uploadMutation = useUploadAadhaar();

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

  const handleUpload = async (e) => {
    e.preventDefault();
    if (!selectedFile) {
      setErrorMsg('Please select an Aadhaar card file to upload.');
      return;
    }

    setErrorMsg('');
    setLoading(true);

    try {
      const formData = new FormData();
      formData.append('file', selectedFile);
      formData.append('transactionId', transactionData.transactionId);
      if (employeeId) formData.append('employeeId', employeeId);

      const uploadRes = await uploadMutation.mutateAsync(formData);
      setLoading(false);
      if (onUploadSuccess) onUploadSuccess(uploadRes);
    } catch (err) {
      setLoading(false);
      setErrorMsg(err.response?.data?.message || err.message || 'Failed to upload Aadhaar document.');
    }
  };

  return (
    <Card className="p-6 bg-slate-900/80 border-slate-800 backdrop-blur-md shadow-xl space-y-6">
      <div className="flex items-start gap-3 p-4 rounded-xl bg-emerald-500/10 border border-emerald-500/30 text-emerald-300 text-sm">
        <div className="text-xl">✓</div>
        <div>
          <h4 className="font-semibold text-emerald-200">OTP Verified Successfully</h4>
          <p className="text-xs text-emerald-300/80 mt-0.5">
            UIDAI transaction <span className="font-mono">{transactionData.transactionId}</span> is confirmed.
            Please attach your Aadhaar card document to complete registration.
          </p>
        </div>
      </div>

      <div className="border-b border-slate-800 pb-4">
        <h3 className="text-lg font-semibold text-white">Step 3: Upload Aadhaar Document</h3>
        <p className="text-xs text-slate-400 mt-1">
          Upload a scanned copy or clear photo of your Aadhaar card (Front & Back or Combined PDF).
        </p>
      </div>

      {errorMsg && (
        <div className="p-3.5 rounded-lg bg-red-500/10 border border-red-500/30 text-red-400 text-xs sm:text-sm">
          {errorMsg}
        </div>
      )}

      <form onSubmit={handleUpload} className="space-y-6">
        <div>
          <label className="block text-xs font-semibold text-slate-300 mb-1.5">
            Aadhaar Card Document (PDF / Image) *
          </label>
          <div className="border-2 border-dashed border-slate-700 hover:border-blue-500/60 transition-colors rounded-xl p-6 text-center bg-slate-950/40">
            <input
              type="file"
              id="aadhaarUploadFile"
              accept=".pdf,.png,.jpg,.jpeg"
              onChange={handleFileChange}
              className="hidden"
            />
            <label htmlFor="aadhaarUploadFile" className="cursor-pointer space-y-2 block">
              <div className="w-12 h-12 mx-auto rounded-full bg-blue-500/10 flex items-center justify-center text-blue-400 text-xl font-bold">
                📄
              </div>
              <div className="text-sm font-medium text-slate-200">
                {selectedFile ? selectedFile.name : 'Click or drag file to upload Aadhaar document'}
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
          disabled={loading || !selectedFile}
          className="w-full bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-500 hover:to-teal-500 text-white font-medium py-2.5 rounded-lg shadow-lg shadow-emerald-500/20"
        >
          {loading ? 'Finalizing Aadhaar Registration...' : 'Complete & Save Aadhaar'}
        </Button>
      </form>
    </Card>
  );
}

export default AadhaarFileUpload;
