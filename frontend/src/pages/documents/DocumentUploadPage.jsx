import React, { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { useUploadDocument } from '../../hooks/useDocuments.js';
import { useEmployees } from '../../hooks/useEmployee.js';
import { Card } from '../../components/ui/Card.jsx';
import { Button } from '../../components/ui/Button.jsx';
import { Input } from '../../components/ui/Input.jsx';

export function DocumentUploadPage() {
  const navigate = useNavigate();
  const uploadMutation = useUploadDocument();
  const { data: empData } = useEmployees({ limit: 100 });
  const employees = empData?.data?.employees || [];

  const [formData, setFormData] = useState({
    title: '',
    type: 'NATIONAL_ID',
    employeeId: '',
    notes: ''
  });

  const [selectedFile, setSelectedFile] = useState(null);
  const [previewUrl, setPreviewUrl] = useState('');
  const [errorMsg, setErrorMsg] = useState('');

  const handleFileChange = (e) => {
    const file = e.target.files[0];
    if (!file) return;

    setSelectedFile(file);
    if (file.type.startsWith('image/')) {
      const url = URL.createObjectURL(file);
      setPreviewUrl(url);
    } else {
      setPreviewUrl('');
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!selectedFile) {
      setErrorMsg('Please select a document file to upload.');
      return;
    }

    setErrorMsg('');
    const form = new FormData();
    form.append('file', selectedFile);
    form.append('title', formData.title || selectedFile.name);
    form.append('type', formData.type);
    if (formData.employeeId) form.append('employeeId', formData.employeeId);
    if (formData.notes) form.append('notes', formData.notes);

    try {
      await uploadMutation.mutateAsync(form);
      navigate('/documents');
    } catch (err) {
      setErrorMsg(err.response?.data?.message || 'Failed to upload document.');
    }
  };

  return (
    <div className="p-6 max-w-4xl mx-auto space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <div className="flex items-center gap-2 text-sm text-slate-400 mb-1">
            <Link to="/documents" className="hover:text-white transition-colors">Documents</Link>
            <span>/</span>
            <span className="text-slate-200">Upload</span>
          </div>
          <h1 className="text-2xl sm:text-3xl font-bold tracking-tight text-white">
            Upload Employee Document
          </h1>
          <p className="text-sm text-slate-400 mt-1">
            Upload identity verifications, contracts, certifications, and employee records.
          </p>
        </div>

        <Link to="/documents">
          <Button variant="outline" size="sm" className="border-slate-700">
            Cancel
          </Button>
        </Link>
      </div>

      {errorMsg && (
        <div className="p-4 rounded-xl bg-red-500/10 border border-red-500/30 text-red-400 text-sm">
          {errorMsg}
        </div>
      )}

      <Card className="p-6 bg-slate-900/70 border-slate-800 backdrop-blur-md">
        <form onSubmit={handleSubmit} className="space-y-6">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
            <div>
              <label className="block text-xs font-semibold text-slate-400 mb-1">Document Title *</label>
              <Input
                value={formData.title}
                onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                required
                placeholder="Passport Copy 2026"
                className="bg-slate-950/60 border-slate-800"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-400 mb-1">Document Type *</label>
              <select
                value={formData.type}
                onChange={(e) => {
                  const val = e.target.value;
                  if (val === 'AADHAAR') {
                    navigate('/documents/aadhaar/upload');
                    return;
                  }
                  setFormData({ ...formData, type: val });
                }}
                className="w-full h-11 px-3 rounded-lg bg-slate-950/60 border border-slate-800 text-sm text-slate-200 focus:outline-none focus:border-blue-500"
              >
                <option value="NATIONAL_ID">National ID / Passport</option>
                <option value="AADHAAR">Aadhaar Card (Special Verification Flow →)</option>
                <option value="TAX_FORM">Tax Document (W-4 / W-2)</option>
                <option value="CONTRACT">Employment Contract</option>
                <option value="RESUME">Resume / CV</option>
                <option value="CERTIFICATE">Certificate / Diploma</option>
                <option value="OTHER">Other Documentation</option>
              </select>
            </div>

            <div className="sm:col-span-2">
              <label className="block text-xs font-semibold text-slate-400 mb-1">
                Assign to Employee (Optional)
              </label>
              <select
                value={formData.employeeId}
                onChange={(e) => setFormData({ ...formData, employeeId: e.target.value })}
                className="w-full h-11 px-3 rounded-lg bg-slate-950/60 border border-slate-800 text-sm text-slate-200 focus:outline-none focus:border-blue-500"
              >
                <option value="">Company-Wide Document (No single employee)</option>
                {employees.map((emp) => (
                  <option key={emp.id} value={emp.id}>
                    {emp.firstName} {emp.lastName} ({emp.employeeCode || emp.email})
                  </option>
                ))}
              </select>
            </div>

            <div className="sm:col-span-2">
              <label className="block text-xs font-semibold text-slate-400 mb-1">Notes / Remarks</label>
              <Input
                value={formData.notes}
                onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
                placeholder="Scanned at HR onboarding desk"
                className="bg-slate-950/60 border-slate-800"
              />
            </div>
          </div>

          {/* File Upload Box */}
          <div className="space-y-2">
            <label className="block text-xs font-semibold text-slate-400">File Attachment *</label>
            <div className="p-8 border-2 border-dashed border-slate-800 hover:border-slate-700 rounded-2xl bg-slate-950/40 text-center cursor-pointer transition-colors">
              <input
                type="file"
                accept=".pdf,.png,.jpg,.jpeg,.doc,.docx"
                onChange={handleFileChange}
                className="hidden"
                id="doc-file-input"
              />
              <label htmlFor="doc-file-input" className="cursor-pointer space-y-2 block">
                <div className="w-12 h-12 mx-auto rounded-xl bg-blue-500/10 border border-blue-500/20 flex items-center justify-center text-blue-400">
                  <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M7 16a4 4 0 01-.88-7.903A5 5 0 1115.9 6L16 6a5 5 0 011 9.9M15 13l-3-3m0 0l-3 3m3-3v12" />
                  </svg>
                </div>
                <div className="text-sm font-medium text-slate-200">
                  {selectedFile ? selectedFile.name : 'Click to select PDF, PNG, JPG, or DOC'}
                </div>
                <div className="text-xs text-slate-500">Maximum file size: 10MB</div>
              </label>
            </div>
          </div>

          {previewUrl && (
            <div className="p-4 rounded-xl bg-slate-950/60 border border-slate-800">
              <span className="text-xs text-slate-400 block mb-2">Image Preview:</span>
              <img src={previewUrl} alt="Preview" className="max-h-48 rounded-lg object-contain" />
            </div>
          )}

          <div className="flex justify-end gap-3 pt-4 border-t border-slate-800">
            <Link to="/documents">
              <Button type="button" variant="outline" className="border-slate-700">
                Cancel
              </Button>
            </Link>
            <Button
              type="submit"
              isLoading={uploadMutation.isPending}
              className="bg-blue-600 hover:bg-blue-500 text-white"
            >
              Upload Document
            </Button>
          </div>
        </form>
      </Card>
    </div>
  );
}

export default DocumentUploadPage;
