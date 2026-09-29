import React, { useState, useEffect } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { 
  DollarSign, 
  Percent, 
  ShieldCheck, 
  Save, 
  RefreshCw, 
  Clock, 
  Calculator, 
  Building2, 
  AlertCircle,
  HelpCircle,
  CheckCircle2
} from 'lucide-react';
import { toast } from 'sonner';
import payrollService from '../../services/payroll.service.js';

export default function PayrollRulesPage() {
  const queryClient = useQueryClient();

  const { data: config, isLoading, error, refetch, isFetching } = useQuery({
    queryKey: ['company-payroll-rules'],
    queryFn: () => payrollService.getPayrollConfig()
  });

  const [form, setForm] = useState({
    basicPercentOfCTC: 40,
    hraPercentOfCTC: 20,
    specialPercentOfCTC: 40,
    pfEnabled: true,
    pfEmployeePercent: 12,
    pfEmployerPercent: 12,
    pfCeiling: 15000,
    esiEnabled: true,
    esiEmployeePercent: 0.75,
    esiEmployerPercent: 3.25,
    esiCeiling: 21000,
    ptState: 'MAHARASHTRA',
    tdsEnabled: true,
    lopDivisor: 30,
    lateMarksForHalfDay: 3,
    overtimeRate: 125,
    roundOffRule: 'NEAREST_RUPEE'
  });

  useEffect(() => {
    if (config) {
      setForm({
        basicPercentOfCTC: config.basicPercentOfCTC ?? 40,
        hraPercentOfCTC: config.hraPercentOfCTC ?? 20,
        specialPercentOfCTC: config.specialPercentOfCTC ?? 40,
        pfEnabled: config.pfEnabled ?? true,
        pfEmployeePercent: config.pfEmployeePercent ?? 12,
        pfEmployerPercent: config.pfEmployerPercent ?? 12,
        pfCeiling: config.pfCeiling ?? 15000,
        esiEnabled: config.esiEnabled ?? true,
        esiEmployeePercent: config.esiEmployeePercent ?? 0.75,
        esiEmployerPercent: config.esiEmployerPercent ?? 3.25,
        esiCeiling: config.esiCeiling ?? 21000,
        ptState: config.ptState || 'MAHARASHTRA',
        tdsEnabled: config.tdsEnabled ?? true,
        lopDivisor: config.lopDivisor ?? 30,
        lateMarksForHalfDay: config.lateMarksForHalfDay ?? 3,
        overtimeRate: config.overtimeRate ?? 125,
        roundOffRule: config.roundOffRule || 'NEAREST_RUPEE'
      });
    }
  }, [config]);

  const updateMutation = useMutation({
    mutationFn: (data) => payrollService.updatePayrollConfig(data),
    onSuccess: (updated) => {
      queryClient.setQueryData(['company-payroll-rules'], updated);
      toast.success('Company payroll rules and statutory policies saved successfully');
    },
    onError: (err) => {
      toast.error(err.response?.data?.message || err.message || 'Failed to save payroll rules');
    }
  });

  const handleSubmit = (e) => {
    e.preventDefault();
    updateMutation.mutate(form);
  };

  const sampleCTC = 600000;
  const sampleMonthlyCTC = sampleCTC / 12;
  const sampleBasic = (sampleMonthlyCTC * (parseFloat(form.basicPercentOfCTC) || 40)) / 100;
  const sampleHRA = (sampleMonthlyCTC * (parseFloat(form.hraPercentOfCTC) || 20)) / 100;
  const sampleSpecial = Math.max(0, sampleMonthlyCTC - sampleBasic - sampleHRA);
  const samplePF = form.pfEnabled ? Math.min(sampleBasic, parseFloat(form.pfCeiling) || 15000) * ((parseFloat(form.pfEmployeePercent) || 12) / 100) : 0;
  const sampleESI = form.esiEnabled && sampleMonthlyCTC <= (parseFloat(form.esiCeiling) || 21000) ? (sampleMonthlyCTC * (parseFloat(form.esiEmployeePercent) || 0.75)) / 100 : 0;
  const samplePT = form.ptState !== 'NONE' ? 200 : 0;
  const sampleNet = Math.round(sampleMonthlyCTC - samplePF - sampleESI - samplePT);

  if (isLoading) {
    return (
      <div className="p-12 text-center space-y-4">
        <div className="inline-block w-8 h-8 border-4 border-indigo-500 border-t-transparent rounded-full animate-spin"></div>
        <p className="text-sm text-slate-400">Loading company payroll rules...</p>
      </div>
    );
  }

  return (
    <div className="space-y-6 max-w-6xl mx-auto">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-slate-100 flex items-center gap-2.5">
            <DollarSign className="w-7 h-7 text-indigo-400" />
            Company Payroll Rules & Statutory Policies
          </h1>
          <p className="text-sm text-slate-400 mt-1">
            Configure standard CTC salary proportions, PF/ESI statutory ceilings, PT state rules, and LOP deduction formulas
          </p>
        </div>

        <div className="flex items-center gap-3">
          <button
            type="button"
            onClick={() => refetch()}
            disabled={isFetching}
            className="px-3.5 py-2 text-sm font-medium rounded-lg bg-slate-800 text-slate-200 hover:bg-slate-700 hover:text-white transition flex items-center gap-2 border border-slate-700 shadow-sm disabled:opacity-50"
          >
            <RefreshCw className={`w-4 h-4 ${isFetching ? 'animate-spin text-indigo-400' : ''}`} />
            Refresh
          </button>
        </div>
      </div>

      <form onSubmit={handleSubmit} className="space-y-6">
        {/* Section 1: Standard CTC Distribution */}
        <div className="p-6 rounded-2xl bg-slate-900 border border-slate-800 shadow-sm space-y-5">
          <div className="flex items-center gap-3 pb-3 border-b border-slate-800">
            <Percent className="w-5 h-5 text-indigo-400" />
            <div>
              <h2 className="text-lg font-bold text-slate-100">Standard Salary Components (% of CTC)</h2>
              <p className="text-xs text-slate-400">Default proportion used when creating templates and assigning employee compensation</p>
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-5">
            <div>
              <label className="block text-xs font-semibold text-slate-300 uppercase tracking-wider mb-2">
                Basic % of CTC
              </label>
              <div className="relative">
                <input
                  type="number"
                  step="0.5"
                  min="0"
                  max="100"
                  value={form.basicPercentOfCTC}
                  onChange={(e) => setForm({ ...form, basicPercentOfCTC: e.target.value })}
                  className="w-full pl-4 pr-10 py-2.5 bg-slate-800/90 border border-slate-700 rounded-xl text-sm font-medium text-slate-100 focus:outline-none focus:ring-2 focus:ring-indigo-500"
                  required
                />
                <span className="absolute right-3.5 top-1/2 -translate-y-1/2 text-sm font-bold text-slate-400">%</span>
              </div>
              <p className="text-[11px] text-slate-400 mt-1.5">Usually 40%–50% of annual CTC in India</p>
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-300 uppercase tracking-wider mb-2">
                HRA % of CTC
              </label>
              <div className="relative">
                <input
                  type="number"
                  step="0.5"
                  min="0"
                  max="100"
                  value={form.hraPercentOfCTC}
                  onChange={(e) => setForm({ ...form, hraPercentOfCTC: e.target.value })}
                  className="w-full pl-4 pr-10 py-2.5 bg-slate-800/90 border border-slate-700 rounded-xl text-sm font-medium text-slate-100 focus:outline-none focus:ring-2 focus:ring-indigo-500"
                  required
                />
                <span className="absolute right-3.5 top-1/2 -translate-y-1/2 text-sm font-bold text-slate-400">%</span>
              </div>
              <p className="text-[11px] text-slate-400 mt-1.5">Usually 20% of CTC (or 50% of Basic)</p>
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-300 uppercase tracking-wider mb-2">
                Special Allowance % (Balancing)
              </label>
              <div className="relative">
                <input
                  type="number"
                  readOnly
                  value={Math.max(0, 100 - (parseFloat(form.basicPercentOfCTC) || 0) - (parseFloat(form.hraPercentOfCTC) || 0))}
                  className="w-full pl-4 pr-10 py-2.5 bg-slate-800/40 border border-slate-700/60 rounded-xl text-sm font-medium text-indigo-400 focus:outline-none cursor-not-allowed"
                />
                <span className="absolute right-3.5 top-1/2 -translate-y-1/2 text-sm font-bold text-slate-400">%</span>
              </div>
              <p className="text-[11px] text-slate-400 mt-1.5">Auto-computed as remainder to make 100%</p>
            </div>
          </div>
        </div>

        {/* Section 2: Statutory Compliance (PF, ESI, PT, TDS) */}
        <div className="p-6 rounded-2xl bg-slate-900 border border-slate-800 shadow-sm space-y-6">
          <div className="flex items-center gap-3 pb-3 border-b border-slate-800">
            <ShieldCheck className="w-5 h-5 text-emerald-400" />
            <div>
              <h2 className="text-lg font-bold text-slate-100">Statutory Deductions (PF, ESI, PT, TDS)</h2>
              <p className="text-xs text-slate-400">Configure Indian statutory thresholds, employee/employer contribution rates, and ceiling limits</p>
            </div>
          </div>

          {/* PF Section */}
          <div className="p-4 rounded-xl bg-slate-800/40 border border-slate-800 space-y-4">
            <div className="flex items-center justify-between">
              <div>
                <h3 className="text-sm font-bold text-slate-200">Employees' Provident Fund (EPF)</h3>
                <p className="text-xs text-slate-400">Deduct 12% on Basic up to ₹15,000 monthly ceiling</p>
              </div>
              <label className="relative inline-flex items-center cursor-pointer">
                <input
                  type="checkbox"
                  checked={form.pfEnabled}
                  onChange={(e) => setForm({ ...form, pfEnabled: e.target.checked })}
                  className="sr-only peer"
                />
                <div className="w-11 h-6 bg-slate-700 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-slate-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-emerald-600"></div>
              </label>
            </div>

            {form.pfEnabled && (
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 pt-2">
                <div>
                  <label className="block text-xs font-semibold text-slate-300 mb-1.5">PF Employee %</label>
                  <input
                    type="number"
                    step="0.1"
                    min="0"
                    max="20"
                    value={form.pfEmployeePercent}
                    onChange={(e) => setForm({ ...form, pfEmployeePercent: e.target.value })}
                    className="w-full px-3.5 py-2 bg-slate-800 border border-slate-700 rounded-lg text-sm text-slate-100"
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-slate-300 mb-1.5">PF Employer %</label>
                  <input
                    type="number"
                    step="0.1"
                    min="0"
                    max="20"
                    value={form.pfEmployerPercent}
                    onChange={(e) => setForm({ ...form, pfEmployerPercent: e.target.value })}
                    className="w-full px-3.5 py-2 bg-slate-800 border border-slate-700 rounded-lg text-sm text-slate-100"
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-slate-300 mb-1.5">PF Monthly Ceiling (₹)</label>
                  <input
                    type="number"
                    step="500"
                    min="0"
                    value={form.pfCeiling}
                    onChange={(e) => setForm({ ...form, pfCeiling: e.target.value })}
                    className="w-full px-3.5 py-2 bg-slate-800 border border-slate-700 rounded-lg text-sm text-slate-100"
                  />
                </div>
              </div>
            )}
          </div>

          {/* ESI Section */}
          <div className="p-4 rounded-xl bg-slate-800/40 border border-slate-800 space-y-4">
            <div className="flex items-center justify-between">
              <div>
                <h3 className="text-sm font-bold text-slate-200">Employee State Insurance (ESI)</h3>
                <p className="text-xs text-slate-400">Applicable for employees with Gross monthly salary $\le$ ₹21,000</p>
              </div>
              <label className="relative inline-flex items-center cursor-pointer">
                <input
                  type="checkbox"
                  checked={form.esiEnabled}
                  onChange={(e) => setForm({ ...form, esiEnabled: e.target.checked })}
                  className="sr-only peer"
                />
                <div className="w-11 h-6 bg-slate-700 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-slate-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-emerald-600"></div>
              </label>
            </div>

            {form.esiEnabled && (
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 pt-2">
                <div>
                  <label className="block text-xs font-semibold text-slate-300 mb-1.5">ESI Employee %</label>
                  <input
                    type="number"
                    step="0.05"
                    min="0"
                    max="10"
                    value={form.esiEmployeePercent}
                    onChange={(e) => setForm({ ...form, esiEmployeePercent: e.target.value })}
                    className="w-full px-3.5 py-2 bg-slate-800 border border-slate-700 rounded-lg text-sm text-slate-100"
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-slate-300 mb-1.5">ESI Employer %</label>
                  <input
                    type="number"
                    step="0.05"
                    min="0"
                    max="10"
                    value={form.esiEmployerPercent}
                    onChange={(e) => setForm({ ...form, esiEmployerPercent: e.target.value })}
                    className="w-full px-3.5 py-2 bg-slate-800 border border-slate-700 rounded-lg text-sm text-slate-100"
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-slate-300 mb-1.5">ESI Monthly Wage Limit (₹)</label>
                  <input
                    type="number"
                    step="500"
                    min="0"
                    value={form.esiCeiling}
                    onChange={(e) => setForm({ ...form, esiCeiling: e.target.value })}
                    className="w-full px-3.5 py-2 bg-slate-800 border border-slate-700 rounded-lg text-sm text-slate-100"
                  />
                </div>
              </div>
            )}
          </div>

          {/* PT & TDS */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
            <div>
              <label className="block text-xs font-semibold text-slate-300 uppercase tracking-wider mb-2">
                Professional Tax (PT) State
              </label>
              <select
                value={form.ptState}
                onChange={(e) => setForm({ ...form, ptState: e.target.value })}
                className="w-full px-3.5 py-2.5 bg-slate-800 border border-slate-700 rounded-xl text-sm font-medium text-slate-100 focus:outline-none focus:ring-2 focus:ring-indigo-500"
              >
                <option value="MAHARASHTRA">Maharashtra (MH - ₹200/mo, ₹300 in Feb)</option>
                <option value="KARNATAKA">Karnataka (KA - ₹200/mo above ₹15k)</option>
                <option value="TELANGANA">Telangana (TS - ₹200/mo above ₹20k)</option>
                <option value="ANDHRA PRADESH">Andhra Pradesh (AP - ₹200/mo)</option>
                <option value="TAMIL NADU">Tamil Nadu (TN - Slab based)</option>
                <option value="GUJARAT">Gujarat (GJ - Slab based)</option>
                <option value="WEST BENGAL">West Bengal (WB - Slab based)</option>
                <option value="NONE">None / Exempt State</option>
              </select>
              <p className="text-[11px] text-slate-400 mt-1.5">State-specific statutory PT rules applied automatically</p>
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-300 uppercase tracking-wider mb-2">
                TDS / Withholding Tax Calculation
              </label>
              <div className="flex items-center justify-between p-2.5 bg-slate-800/80 border border-slate-700 rounded-xl">
                <span className="text-sm text-slate-200">Enable monthly income tax (TDS)</span>
                <label className="relative inline-flex items-center cursor-pointer">
                  <input
                    type="checkbox"
                    checked={form.tdsEnabled}
                    onChange={(e) => setForm({ ...form, tdsEnabled: e.target.checked })}
                    className="sr-only peer"
                  />
                  <div className="w-11 h-6 bg-slate-700 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-slate-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-emerald-600"></div>
                </label>
              </div>
              <p className="text-[11px] text-slate-400 mt-1.5">Calculates annual income tax under default regime</p>
            </div>
          </div>
        </div>

        {/* Section 3: Attendance, Overtime & Deduction Rules */}
        <div className="p-6 rounded-2xl bg-slate-900 border border-slate-800 shadow-sm space-y-5">
          <div className="flex items-center gap-3 pb-3 border-b border-slate-800">
            <Clock className="w-5 h-5 text-amber-400" />
            <div>
              <h2 className="text-lg font-bold text-slate-100">Attendance, Overtime & Round Off Rules</h2>
              <p className="text-xs text-slate-400">Configure Loss of Pay (LOP) divisor, late mark penalty thresholds, and rounding rules</p>
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-4 gap-5">
            <div>
              <label className="block text-xs font-semibold text-slate-300 uppercase tracking-wider mb-2">
                LOP Divisor
              </label>
              <select
                value={form.lopDivisor}
                onChange={(e) => setForm({ ...form, lopDivisor: Number(e.target.value) })}
                className="w-full px-3.5 py-2.5 bg-slate-800 border border-slate-700 rounded-xl text-sm font-medium text-slate-100 focus:outline-none focus:ring-2 focus:ring-indigo-500"
              >
                <option value={30}>30 Days (Standard India)</option>
                <option value={26}>26 Days (Excluding Sundays)</option>
                <option value={31}>31 Days (Calendar Max)</option>
              </select>
              <p className="text-[11px] text-slate-400 mt-1.5">Formula: (Absent Days / Divisor) * Monthly CTC</p>
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-300 uppercase tracking-wider mb-2">
                Late Marks for Half Day
              </label>
              <input
                type="number"
                min="1"
                max="10"
                value={form.lateMarksForHalfDay}
                onChange={(e) => setForm({ ...form, lateMarksForHalfDay: Number(e.target.value) })}
                className="w-full px-3.5 py-2.5 bg-slate-800 border border-slate-700 rounded-xl text-sm font-medium text-slate-100 focus:outline-none focus:ring-2 focus:ring-indigo-500"
                required
              />
              <p className="text-[11px] text-slate-400 mt-1.5">e.g. 3 late marks = 0.5 day LOP penalty</p>
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-300 uppercase tracking-wider mb-2">
                Overtime Hourly Rate (₹)
              </label>
              <input
                type="number"
                min="0"
                step="5"
                value={form.overtimeRate}
                onChange={(e) => setForm({ ...form, overtimeRate: Number(e.target.value) })}
                className="w-full px-3.5 py-2.5 bg-slate-800 border border-slate-700 rounded-xl text-sm font-medium text-slate-100 focus:outline-none focus:ring-2 focus:ring-indigo-500"
                required
              />
              <p className="text-[11px] text-slate-400 mt-1.5">Hourly payout for approved OT hours</p>
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-300 uppercase tracking-wider mb-2">
                Round Off Rule
              </label>
              <select
                value={form.roundOffRule}
                onChange={(e) => setForm({ ...form, roundOffRule: e.target.value })}
                className="w-full px-3.5 py-2.5 bg-slate-800 border border-slate-700 rounded-xl text-sm font-medium text-slate-100 focus:outline-none focus:ring-2 focus:ring-indigo-500"
              >
                <option value="NEAREST_RUPEE">Nearest Rupee (Standard)</option>
                <option value="CEIL">Ceil (Round Up)</option>
                <option value="FLOOR">Floor (Round Down)</option>
                <option value="EXACT">Exact (With Paise)</option>
              </select>
              <p className="text-[11px] text-slate-400 mt-1.5">Applies to final net salary payout</p>
            </div>
          </div>
        </div>

        {/* Live Calculation Preview for Sample CTC */}
        <div className="p-6 rounded-2xl bg-indigo-950/40 border border-indigo-500/20 shadow-sm space-y-3">
          <div className="flex items-center justify-between">
            <h3 className="text-sm font-bold text-indigo-200 flex items-center gap-2">
              <Calculator className="w-4 h-4 text-indigo-400" />
              Live Simulation for Standard CTC ₹6,00,000 / Year (₹50,000 / Month)
            </h3>
            <span className="text-xs px-2.5 py-0.5 rounded-full bg-indigo-500/20 text-indigo-300 font-semibold">
              Instant Simulation
            </span>
          </div>

          <div className="grid grid-cols-2 sm:grid-cols-6 gap-3 pt-2 text-center">
            <div className="p-3 rounded-xl bg-slate-900/80 border border-slate-800">
              <p className="text-[11px] text-slate-400 uppercase font-semibold">Monthly CTC</p>
              <p className="text-base font-bold text-slate-100 mt-1">₹{sampleMonthlyCTC.toLocaleString('en-IN')}</p>
            </div>
            <div className="p-3 rounded-xl bg-slate-900/80 border border-slate-800">
              <p className="text-[11px] text-slate-400 uppercase font-semibold">Basic ({form.basicPercentOfCTC}%)</p>
              <p className="text-base font-bold text-emerald-400 mt-1">₹{sampleBasic.toLocaleString('en-IN')}</p>
            </div>
            <div className="p-3 rounded-xl bg-slate-900/80 border border-slate-800">
              <p className="text-[11px] text-slate-400 uppercase font-semibold">HRA ({form.hraPercentOfCTC}%)</p>
              <p className="text-base font-bold text-emerald-400 mt-1">₹{sampleHRA.toLocaleString('en-IN')}</p>
            </div>
            <div className="p-3 rounded-xl bg-slate-900/80 border border-slate-800">
              <p className="text-[11px] text-slate-400 uppercase font-semibold">PF ({form.pfEmployeePercent}%)</p>
              <p className="text-base font-bold text-rose-400 mt-1">₹{samplePF.toLocaleString('en-IN')}</p>
            </div>
            <div className="p-3 rounded-xl bg-slate-900/80 border border-slate-800">
              <p className="text-[11px] text-slate-400 uppercase font-semibold">PT</p>
              <p className="text-base font-bold text-rose-400 mt-1">₹{samplePT.toLocaleString('en-IN')}</p>
            </div>
            <div className="p-3 rounded-xl bg-slate-900/80 border border-slate-800">
              <p className="text-[11px] text-slate-400 uppercase font-semibold">Estimated Net</p>
              <p className="text-base font-bold text-indigo-300 mt-1">₹{sampleNet.toLocaleString('en-IN')}</p>
            </div>
          </div>
        </div>

        {/* Submit Actions */}
        <div className="flex justify-end gap-3 pt-2">
          <button
            type="submit"
            disabled={updateMutation.isPending}
            className="px-6 py-2.5 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white font-semibold text-sm shadow-lg shadow-indigo-600/30 transition flex items-center gap-2 disabled:opacity-50"
          >
            {updateMutation.isPending ? (
              <RefreshCw className="w-4 h-4 animate-spin" />
            ) : (
              <Save className="w-4 h-4" />
            )}
            Save Payroll Configuration
          </button>
        </div>
      </form>
    </div>
  );
}
