import React, { useState } from 'react';
import Card from '../../components/ui/Card';
import Button from '../../components/ui/Button';
import Input from '../../components/ui/Input';
import PayrollPreview from '../../components/payroll/PayrollPreview';
import PayrollProgress from '../../components/payroll/PayrollProgress';
import { usePreviewPayroll, useProcessPayroll } from '../../hooks/usePayroll';
import { useAuthStore } from '../../store/authStore';
import { useNavigate } from 'react-router-dom';

export default function PayrollRunPage() {
  const { user } = useAuthStore();
  const companyId = user?.companyId;
  const navigate = useNavigate();

  const now = new Date();
  const [month, setMonth] = useState(now.getMonth() + 1);
  const [year, setYear] = useState(now.getFullYear());
  const [previewResult, setPreviewResult] = useState(null);
  const [isProcessing, setIsProcessing] = useState(false);
  const [errorMsg, setErrorMsg] = useState('');
  const [successMsg, setSuccessMsg] = useState('');

  const previewPayroll = usePreviewPayroll();
  const processPayroll = useProcessPayroll();

  const handleGeneratePreview = async (e) => {
    e.preventDefault();
    setErrorMsg('');
    setSuccessMsg('');
    setPreviewResult(null);

    try {
      const res = await previewPayroll.mutateAsync({
        companyId,
        month: Number(month),
        year: Number(year),
      });
      setPreviewResult(res.data?.data || res.data);
    } catch (err) {
      setErrorMsg(err.response?.data?.message || err.message || 'Failed to generate preview');
    }
  };

  const handleRunPayroll = async () => {
    setErrorMsg('');
    setSuccessMsg('');
    setIsProcessing(true);

    try {
      const res = await processPayroll.mutateAsync({
        companyId,
        month: Number(month),
        year: Number(year),
        processedBy: user?.id,
      });

      setSuccessMsg('Payroll run processed successfully! Salary slips have been generated.');
      setTimeout(() => {
        const runId = res.data?.data?.id || res.data?.id;
        if (runId) {
          navigate(`/payroll/runs/${runId}`);
        } else {
          navigate('/payroll/runs');
        }
      }, 2000);
    } catch (err) {
      setErrorMsg(err.response?.data?.message || err.message || 'Failed to process payroll');
    } finally {
      setIsProcessing(false);
    }
  };

  const monthNames = [
    'January', 'February', 'March', 'April', 'May', 'June',
    'July', 'August', 'September', 'October', 'November', 'December'
  ];

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h1 className="text-2xl font-bold text-white">Execute Payroll Run</h1>
          <p className="text-sm text-slate-400">Calculate monthly salaries, attendance deductions, and bonuses</p>
        </div>
        <Button variant="secondary" onClick={() => navigate('/payroll/runs')}>
          View Past Runs
        </Button>
      </div>

      <Card className="p-6">
        {errorMsg && (
          <div className="mb-4 p-4 rounded-xl bg-rose-500/10 border border-rose-500/30 text-rose-400 text-sm">
            ✕ {errorMsg}
          </div>
        )}
        {successMsg && (
          <div className="mb-4 p-4 rounded-xl bg-emerald-500/10 border border-emerald-500/30 text-emerald-400 text-sm">
            ✓ {successMsg}
          </div>
        )}

        <form onSubmit={handleGeneratePreview} className="flex flex-wrap gap-4 items-end">
          <div>
            <label className="block text-sm font-medium text-slate-300 mb-1">Target Month</label>
            <select
              value={month}
              onChange={(e) => setMonth(Number(e.target.value))}
              className="bg-slate-900/60 border border-slate-700 rounded-xl px-4 py-2.5 text-sm text-white focus:outline-none focus:ring-2 focus:ring-indigo-500 min-w-[160px]"
            >
              {monthNames.map((name, idx) => (
                <option key={idx + 1} value={idx + 1}>
                  {name}
                </option>
              ))}
            </select>
          </div>

          <div>
            <label className="block text-sm font-medium text-slate-300 mb-1">Target Year</label>
            <Input
              type="number"
              value={year}
              onChange={(e) => setYear(Number(e.target.value))}
              className="w-32"
            />
          </div>

          <Button variant="primary" type="submit" loading={previewPayroll.isPending}>
            Calculate Preview
          </Button>
        </form>
      </Card>

      {isProcessing && (
        <PayrollProgress
          step={2}
          totalSteps={3}
          statusText="Calculating gross pay, tax deductions, generating individual salary slips..."
        />
      )}

      {previewResult && !isProcessing && (
        <div className="space-y-4">
          <div className="flex justify-between items-center bg-slate-900/80 p-4 rounded-xl border border-slate-800">
            <div>
              <span className="text-xs text-slate-400 uppercase font-semibold">Ready to Finalize:</span>
              <div className="text-lg font-bold text-white">
                {monthNames[month - 1]} {year} Payroll Batch
              </div>
            </div>
            <Button
              variant="success"
              size="lg"
              onClick={handleRunPayroll}
              loading={processPayroll.isPending}
            >
              🚀 Process & Lock Payroll
            </Button>
          </div>

          <PayrollPreview previewData={previewResult} />
        </div>
      )}
    </div>
  );
}
