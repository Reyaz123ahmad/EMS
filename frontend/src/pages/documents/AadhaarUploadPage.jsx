import React, { useState } from 'react';
import { useNavigate, Link, useSearchParams } from 'react-router-dom';
import { useAadhaarMode } from '../../hooks/useDocuments.js';
import { useEmployees } from '../../hooks/useEmployee.js';
import { Button } from '../../components/ui/Button.jsx';
import { Card } from '../../components/ui/Card.jsx';
import { AadhaarDemoUploadForm } from '../../components/documents/AadhaarDemoUploadForm.jsx';
import { AadhaarOTPForm } from '../../components/documents/AadhaarOTPForm.jsx';
import { AadhaarOTPVerify } from '../../components/documents/AadhaarOTPVerify.jsx';
import { AadhaarFileUpload } from '../../components/documents/AadhaarFileUpload.jsx';

export function AadhaarUploadPage() {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const preselectedEmpId = searchParams.get('employeeId') || '';

  const { data: modeData, isLoading: isModeLoading } = useAadhaarMode();
  const { data: empData } = useEmployees({ limit: 100 });
  const employees = empData?.data?.employees || [];

  const [selectedEmployeeId, setSelectedEmployeeId] = useState(preselectedEmpId);
  const [currentStep, setCurrentStep] = useState(1);
  const [transactionData, setTransactionData] = useState(null);
  const [uploadSuccess, setUploadSuccess] = useState(false);

  const mode = modeData?.data?.mode || modeData?.mode || 'DEMO';
  const isOtpMode = mode === 'OTP';

  const handleOtpSent = (data) => {
    setTransactionData(data);
    setCurrentStep(2);
  };

  const handleVerified = (data) => {
    setTransactionData(data);
    setCurrentStep(3);
  };

  const handleUploadSuccess = (res) => {
    setUploadSuccess(true);
  };

  if (isModeLoading) {
    return (
      <div className="p-8 max-w-3xl mx-auto text-center space-y-4">
        <div className="w-8 h-8 border-4 border-blue-500 border-t-transparent rounded-full animate-spin mx-auto"></div>
        <p className="text-sm text-slate-400">Loading Aadhaar verification service configuration...</p>
      </div>
    );
  }

  return (
    <div className="p-6 max-w-3xl mx-auto space-y-6">
      {/* Header & Breadcrumb */}
      <div className="flex items-center justify-between">
        <div>
          <div className="flex items-center gap-2 text-sm text-slate-400 mb-1">
            <Link to="/documents" className="hover:text-white transition-colors">Documents</Link>
            <span>/</span>
            <span className="text-slate-200">Aadhaar Verification</span>
          </div>
          <h1 className="text-2xl sm:text-3xl font-bold tracking-tight text-white flex items-center gap-3">
            Aadhaar Card Upload
            <span className={`text-xs px-2.5 py-1 rounded-full font-semibold border ${
              isOtpMode
                ? 'bg-blue-500/10 text-blue-400 border-blue-500/30'
                : 'bg-amber-500/10 text-amber-400 border-amber-500/30'
            }`}>
              {isOtpMode ? 'UIDAI OTP Flow' : 'Demo Mode'}
            </span>
          </h1>
          <p className="text-sm text-slate-400 mt-1">
            {isOtpMode
              ? 'Official UIDAI OTP authentication and document registration.'
              : 'Direct Aadhaar document upload without OTP authentication (Demo Mode).'}
          </p>
        </div>

        <Link to="/documents">
          <Button variant="outline" size="sm" className="border-slate-700">
            Cancel
          </Button>
        </Link>
      </div>

      {/* Optional Employee Target Selector for Admins */}
      {employees.length > 0 && !uploadSuccess && (
        <Card className="p-4 bg-slate-900/60 border-slate-800">
          <label className="block text-xs font-semibold text-slate-400 mb-1">
            Target Employee Profile (Optional for Admins / Self by default)
          </label>
          <select
            value={selectedEmployeeId}
            onChange={(e) => setSelectedEmployeeId(e.target.value)}
            className="w-full h-10 px-3 rounded-lg bg-slate-950/70 border border-slate-800 text-sm text-slate-200 focus:outline-none focus:border-blue-500"
          >
            <option value="">Current Authenticated User</option>
            {employees.map((emp) => (
              <option key={emp.id} value={emp.id}>
                {emp.firstName} {emp.lastName} ({emp.employeeCode || emp.email})
              </option>
            ))}
          </select>
        </Card>
      )}

      {/* Success State */}
      {uploadSuccess ? (
        <Card className="p-8 bg-slate-900/90 border-slate-800 text-center space-y-5 shadow-2xl backdrop-blur-md">
          <div className="w-16 h-16 rounded-full bg-emerald-500/10 text-emerald-400 text-3xl font-bold flex items-center justify-center mx-auto border border-emerald-500/20">
            ✓
          </div>
          <div className="space-y-2">
            <h2 className="text-xl font-bold text-white">Aadhaar Upload Completed Successfully</h2>
            <p className="text-sm text-slate-400 max-w-md mx-auto">
              Your Aadhaar document has been registered in the system.
              {isOtpMode
                ? ' Status is marked as VERIFIED via UIDAI.'
                : ' Status is marked as PENDING for manual HR verification.'}
            </p>
          </div>
          <div className="pt-2 flex items-center justify-center gap-3">
            <Button
              onClick={() => navigate('/documents')}
              className="bg-blue-600 hover:bg-blue-500 text-white"
            >
              View Document Portal
            </Button>
            <Button
              variant="outline"
              onClick={() => {
                setUploadSuccess(false);
                setCurrentStep(1);
                setTransactionData(null);
              }}
              className="border-slate-700"
            >
              Upload Another
            </Button>
          </div>
        </Card>
      ) : isOtpMode ? (
        /* Production 3-Step Wizard */
        <div className="space-y-6">
          {/* Step Progress Bar */}
          <div className="flex items-center justify-between px-2">
            {[
              { num: 1, label: 'Aadhaar Details' },
              { num: 2, label: 'OTP Verification' },
              { num: 3, label: 'Document Upload' }
            ].map((step, idx) => (
              <div key={step.num} className="flex items-center gap-2">
                <div
                  className={`w-8 h-8 rounded-full flex items-center justify-center text-xs font-bold border transition-colors ${
                    currentStep === step.num
                      ? 'bg-blue-600 border-blue-500 text-white shadow-lg shadow-blue-500/30'
                      : currentStep > step.num
                      ? 'bg-emerald-500/20 border-emerald-500/40 text-emerald-400'
                      : 'bg-slate-800 border-slate-700 text-slate-500'
                  }`}
                >
                  {currentStep > step.num ? '✓' : step.num}
                </div>
                <span
                  className={`text-xs font-medium hidden sm:inline ${
                    currentStep === step.num ? 'text-white' : 'text-slate-500'
                  }`}
                >
                  {step.label}
                </span>
                {idx < 2 && <div className="w-8 sm:w-16 h-0.5 bg-slate-800 mx-1"></div>}
              </div>
            ))}
          </div>

          {/* Step Views */}
          {currentStep === 1 && (
            <AadhaarOTPForm
              onOtpSent={handleOtpSent}
              employeeId={selectedEmployeeId}
            />
          )}

          {currentStep === 2 && transactionData && (
            <AadhaarOTPVerify
              transactionData={transactionData}
              onVerified={handleVerified}
              onBack={() => setCurrentStep(1)}
              employeeId={selectedEmployeeId}
            />
          )}

          {currentStep === 3 && transactionData && (
            <AadhaarFileUpload
              transactionData={transactionData}
              onUploadSuccess={handleUploadSuccess}
              employeeId={selectedEmployeeId}
            />
          )}
        </div>
      ) : (
        /* Demo Mode Single-Step Form */
        <AadhaarDemoUploadForm
          onUploadSuccess={handleUploadSuccess}
          employeeId={selectedEmployeeId}
        />
      )}
    </div>
  );
}

export default AadhaarUploadPage;
