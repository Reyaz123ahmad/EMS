import React, { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { 
  ShieldCheck, 
  RefreshCw, 
  Calculator, 
  HelpCircle, 
  CheckCircle2, 
  AlertCircle,
  FileText,
  Info
} from 'lucide-react';
import payrollService from '../../services/payroll.service.js';

export default function TaxSlabsPage() {
  const [calcCTC, setCalcCTC] = useState('1200000');
  const [selectedRegime, setSelectedRegime] = useState('NEW_REGIME');

  const { data, isLoading, error, refetch, isFetching } = useQuery({
    queryKey: ['payroll-tax-slabs'],
    queryFn: () => payrollService.listTaxSlabs()
  });

  const financialYear = data?.financialYear || '2026-2027';
  const regimes = data?.regimes || [
    {
      regime: 'NEW_REGIME',
      name: 'New Tax Regime (Default Section 115BAC)',
      slabs: [
        { from: 0, to: 300000, rate: 0 },
        { from: 300000, to: 700000, rate: 5 },
        { from: 700000, to: 1000000, rate: 10 },
        { from: 1000000, to: 1200000, rate: 15 },
        { from: 1200000, to: 1500000, rate: 20 },
        { from: 1500000, to: null, rate: 30 }
      ]
    },
    {
      regime: 'OLD_REGIME',
      name: 'Old Tax Regime (With Chapter VI-A Deductions)',
      slabs: [
        { from: 0, to: 250000, rate: 0 },
        { from: 250000, to: 500000, rate: 5 },
        { from: 500000, to: 1000000, rate: 20 },
        { from: 1000000, to: null, rate: 30 }
      ]
    }
  ];

  // Simple Estimator Calculator
  const computeTax = (annualIncome, regimeType) => {
    const income = Math.max(0, parseFloat(annualIncome) || 0);
    const standardDeduction = regimeType === 'NEW_REGIME' ? 75000 : 50000;
    const taxable = Math.max(0, income - standardDeduction);

    let tax = 0;
    const targetRegime = regimes.find(r => r.regime === regimeType) || regimes[0];

    for (const slab of targetRegime.slabs) {
      if (taxable > slab.from) {
        const upper = slab.to !== null ? Math.min(taxable, slab.to) : taxable;
        const taxableInSlab = upper - slab.from;
        tax += (taxableInSlab * slab.rate) / 100;
      }
    }

    // 87A Rebate for New Regime if taxable <= 7,00,000
    if (regimeType === 'NEW_REGIME' && taxable <= 700000) {
      tax = 0;
    }

    const cess = tax * 0.04;
    const totalTax = tax + cess;

    return {
      taxable,
      standardDeduction,
      baseTax: Math.round(tax),
      cess: Math.round(cess),
      totalTax: Math.round(totalTax),
      monthlyTDS: Math.round(totalTax / 12)
    };
  };

  const estNew = computeTax(calcCTC, 'NEW_REGIME');
  const estOld = computeTax(calcCTC, 'OLD_REGIME');

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-slate-100 flex items-center gap-2.5">
            <ShieldCheck className="w-7 h-7 text-indigo-400" />
            Income Tax Slabs & TDS Configuration
          </h1>
          <p className="text-sm text-slate-400 mt-1">
            Indian statutory income tax slabs, exemptions, and TDS brackets for Financial Year {financialYear}
          </p>
        </div>

        <div className="flex items-center gap-3">
          <button
            onClick={() => refetch()}
            disabled={isFetching}
            className="px-3.5 py-2 text-sm font-medium rounded-lg bg-slate-800 text-slate-200 hover:bg-slate-700 hover:text-white transition flex items-center gap-2 border border-slate-700 shadow-sm disabled:opacity-50"
          >
            <RefreshCw className={`w-4 h-4 ${isFetching ? 'animate-spin text-indigo-400' : ''}`} />
            Refresh Slabs
          </button>
        </div>
      </div>

      {isLoading ? (
        <div className="p-12 rounded-xl bg-slate-900 border border-slate-800 text-center space-y-4">
          <div className="inline-block w-8 h-8 border-4 border-indigo-500 border-t-transparent rounded-full animate-spin"></div>
          <p className="text-sm text-slate-400">Loading statutory tax slabs...</p>
        </div>
      ) : error ? (
        <div className="p-8 rounded-xl bg-slate-900 border border-slate-800 text-center space-y-3">
          <AlertCircle className="w-10 h-10 text-rose-400 mx-auto" />
          <h3 className="text-base font-semibold text-slate-200">Failed to fetch tax slabs</h3>
          <p className="text-sm text-slate-400">{error.message}</p>
        </div>
      ) : (
        <>
          {/* Tax Slabs Comparison Cards */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {regimes.map((reg) => (
              <div key={reg.regime} className="rounded-xl bg-slate-900 border border-slate-800 shadow-sm overflow-hidden flex flex-col justify-between">
                <div className="p-5 border-b border-slate-800">
                  <div className="flex items-center justify-between">
                    <h3 className="text-lg font-bold text-slate-100">{reg.name}</h3>
                    {reg.regime === 'NEW_REGIME' && (
                      <span className="px-2.5 py-0.5 rounded-full text-xs font-semibold bg-indigo-500/10 text-indigo-400 border border-indigo-500/20">
                        Default
                      </span>
                    )}
                  </div>
                  <p className="text-xs text-slate-400 mt-1">
                    {reg.regime === 'NEW_REGIME' 
                      ? 'Standard Deduction ₹75,000, Full 87A rebate up to ₹7,00,000 taxable income'
                      : 'Allows 80C (₹1.5L), 80D (Health), HRA, Home Loan Interest Deductions'}
                  </p>
                </div>

                <div className="p-5">
                  <table className="w-full text-left text-sm text-slate-300">
                    <thead className="text-xs uppercase text-slate-400 border-b border-slate-800">
                      <tr>
                        <th className="pb-3">Income Range</th>
                        <th className="pb-3 text-right">Applicable Tax Rate</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-800/60">
                      {reg.slabs.map((slab, idx) => (
                        <tr key={idx}>
                          <td className="py-3 text-slate-200">
                            {slab.to === null ? (
                              <span>Above ₹{(slab.from).toLocaleString('en-IN')}</span>
                            ) : (
                              <span>₹{(slab.from).toLocaleString('en-IN')} - ₹{(slab.to).toLocaleString('en-IN')}</span>
                            )}
                          </td>
                          <td className="py-3 text-right font-bold text-indigo-400">
                            {slab.rate === 0 ? <span className="text-emerald-400 font-semibold">NIL (0%)</span> : `${slab.rate}%`}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>

                <div className="p-4 bg-slate-800/30 border-t border-slate-800 text-xs text-slate-400 flex items-center gap-2">
                  <Info className="w-4 h-4 text-slate-500 shrink-0" />
                  <span>Plus 4% Health & Education Cess on total income tax calculated.</span>
                </div>
              </div>
            ))}
          </div>

          {/* Interactive Quick Tax Comparison Tool */}
          <div className="rounded-xl bg-slate-900 border border-slate-800 p-6 shadow-sm space-y-6">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-indigo-500/10 border border-indigo-500/20 flex items-center justify-center text-indigo-400">
                <Calculator className="w-5 h-5" />
              </div>
              <div>
                <h3 className="text-lg font-bold text-slate-100">Live Tax & TDS Estimator</h3>
                <p className="text-xs text-slate-400">Preview simulated monthly payroll TDS deductions for any CTC package</p>
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-6 items-end">
              <div className="space-y-2">
                <label className="text-xs font-semibold text-slate-400 uppercase tracking-wider">Annual Gross CTC (₹)</label>
                <input
                  type="number"
                  value={calcCTC}
                  onChange={(e) => setCalcCTC(e.target.value)}
                  className="w-full px-4 py-2.5 bg-slate-800 border border-slate-700 rounded-lg text-slate-100 font-bold text-lg focus:outline-none focus:ring-2 focus:ring-indigo-500/40"
                  placeholder="e.g. 1200000"
                />
              </div>

              <div className="p-4 rounded-xl bg-slate-800/60 border border-slate-700/60 space-y-1">
                <div className="flex justify-between text-xs text-slate-400">
                  <span>New Regime Annual Tax:</span>
                  <span className="font-bold text-indigo-400">₹{estNew.totalTax.toLocaleString('en-IN')}</span>
                </div>
                <div className="flex justify-between text-xs text-slate-400">
                  <span>Monthly Payroll TDS:</span>
                  <span className="font-bold text-emerald-400">₹{estNew.monthlyTDS.toLocaleString('en-IN')}/mo</span>
                </div>
              </div>

              <div className="p-4 rounded-xl bg-slate-800/60 border border-slate-700/60 space-y-1">
                <div className="flex justify-between text-xs text-slate-400">
                  <span>Old Regime (Zero Exemption):</span>
                  <span className="font-bold text-slate-300">₹{estOld.totalTax.toLocaleString('en-IN')}</span>
                </div>
                <div className="flex justify-between text-xs text-slate-400">
                  <span>Monthly Payroll TDS:</span>
                  <span className="font-bold text-amber-400">₹{estOld.monthlyTDS.toLocaleString('en-IN')}/mo</span>
                </div>
              </div>
            </div>
          </div>
        </>
      )}
    </div>
  );
}
