import React, { useState } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { 
  DollarSign, 
  ArrowLeft, 
  Plus, 
  Edit3, 
  Layers, 
  Calendar, 
  Calculator, 
  RefreshCw, 
  CheckCircle2, 
  AlertCircle, 
  X,
  FileSpreadsheet,
  User,
  ShieldCheck
} from 'lucide-react';
import { toast } from 'sonner';
import payrollService from '../../services/payroll.service.js';
import api from '../../services/api.js';

export default function EmployeeSalaryPage() {
  const { id } = useParams();
  const navigate = useNavigate();
  const queryClient = useQueryClient();

  const [isAssignModalOpen, setIsAssignModalOpen] = useState(false);

  // Fetch Company Rules
  const { data: config } = useQuery({
    queryKey: ['company-payroll-rules'],
    queryFn: () => payrollService.getPayrollConfig()
  });

  // Fetch Structure for this Employee
  const { data: structureData, isLoading, error, refetch, isFetching } = useQuery({
    queryKey: ['employee-salary-structure', id],
    queryFn: async () => {
      const res = await payrollService.getEmployeeSalaryStructure(id);
      return res?.data?.structure || res?.structure || res?.data || res;
    }
  });

  // Fetch Templates
  const { data: templates = [] } = useQuery({
    queryKey: ['payroll-structure-templates'],
    queryFn: () => payrollService.listStructureTemplates()
  });

  // Fetch Employee Profile if structure does not have it
  const { data: employeeData } = useQuery({
    queryKey: ['employee-details', id],
    queryFn: async () => {
      try {
        const res = await api.get(`/employees/${id}`);
        return res.data?.data?.employee || res.data?.data || res.data;
      } catch {
        return null;
      }
    },
    enabled: !!id
  });

  const employee = structureData?.employee || employeeData || {};
  const employeeName = employee.firstName ? `${employee.firstName} ${employee.lastName || ''}` : 'Employee Compensation';

  // Assignment Modal Form State
  const [selectedTemplateId, setSelectedTemplateId] = useState('');
  const [ctc, setCTC] = useState('600000');
  const [effectiveFrom, setEffectiveFrom] = useState('2026-04-01');

  const activeTemplateId = selectedTemplateId || templates[0]?.id || 'standard-company-rules';
  const selectedTemplate = templates.find(t => t.id === activeTemplateId) || templates[0] || {
    name: 'Company Standard',
    components: [
      { name: 'Basic', basis: '% of CTC', value: config?.basicPercentOfCTC ?? 40, type: 'EARNING' },
      { name: 'HRA', basis: '% of CTC', value: config?.hraPercentOfCTC ?? 20, type: 'EARNING' },
      { name: 'Special', basis: '% of CTC', value: Math.max(0, 100 - (config?.basicPercentOfCTC ?? 40) - (config?.hraPercentOfCTC ?? 20)), type: 'EARNING' },
      { name: 'PF', basis: '% of Basic', value: config?.pfEmployeePercent ?? 12, type: 'DEDUCTION' },
      { name: 'ESI', basis: '% of Gross', value: config?.esiEmployeePercent ?? 0.75, type: 'DEDUCTION' }
    ]
  };

  // Live Modal Preview Calculation
  const numCTC = parseFloat(ctc) || 0;
  const monthlyCTC = numCTC / 12;
  const basicPct = selectedTemplate.components?.find(c => c.name.toLowerCase().includes('basic'))?.value ?? 40;
  const hraPct = selectedTemplate.components?.find(c => c.name.toLowerCase().includes('hra'))?.value ?? 20;
  const specialPct = selectedTemplate.components?.find(c => c.name.toLowerCase().includes('special'))?.value ?? 40;
  const pfPct = selectedTemplate.components?.find(c => c.name.toLowerCase().includes('pf'))?.value ?? 12;

  const previewBasic = (monthlyCTC * basicPct) / 100;
  const previewHRA = (monthlyCTC * hraPct) / 100;
  const previewSpecial = (monthlyCTC * specialPct) / 100;
  const previewPF = Math.min(previewBasic, 15000) * (pfPct / 100);
  const previewNet = Math.round(monthlyCTC - previewPF);

  // Mutation to Assign Structure
  const assignMutation = useMutation({
    mutationFn: (payload) => payrollService.assignEmployeeStructure(id, payload),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['employee-salary-structure', id] });
      queryClient.invalidateQueries({ queryKey: ['payroll-salary-structures'] });
      toast.success('Salary structure successfully assigned to employee');
      setIsAssignModalOpen(false);
    },
    onError: (err) => {
      toast.error(err.response?.data?.message || err.message || 'Failed to assign salary structure');
    }
  });

  const handleSaveAssignment = (e) => {
    e.preventDefault();
    if (!numCTC || numCTC <= 0) {
      toast.error('Please enter a valid CTC amount');
      return;
    }

    const payload = {
      ctc: numCTC,
      effectiveFrom,
      components: [
        { name: 'Basic Salary', code: 'BASIC', amount: previewBasic, type: 'EARNING' },
        { name: 'House Rent Allowance', code: 'HRA', amount: previewHRA, type: 'EARNING' },
        { name: 'Special Allowance', code: 'SPECIAL', amount: previewSpecial, type: 'EARNING' }
      ]
    };

    assignMutation.mutate(payload);
  };

  const currentCTC = Number(structureData?.ctc || 0);
  const currentMonthly = currentCTC / 12;
  const components = structureData?.components || [];

  return (
    <div className="space-y-6 max-w-5xl mx-auto">
      {/* Navigation Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div className="flex items-center gap-3">
          <button
            onClick={() => navigate('/payroll/salary-structures')}
            className="p-2 rounded-xl bg-slate-900 border border-slate-800 text-slate-400 hover:text-white transition"
          >
            <ArrowLeft className="w-5 h-5" />
          </button>
          <div>
            <h1 className="text-2xl font-bold text-slate-100 flex items-center gap-2.5">
              <DollarSign className="w-6 h-6 text-emerald-400" />
              {employeeName}
            </h1>
            <p className="text-xs text-slate-400 mt-0.5">
              Code: <span className="text-slate-200 font-semibold">{employee.employeeCode || 'N/A'}</span> • Department: <span className="text-slate-200">{employee.department?.name || 'General'}</span>
            </p>
          </div>
        </div>

        <div className="flex items-center gap-3">
          <button
            onClick={() => refetch()}
            disabled={isFetching}
            className="px-3.5 py-2 text-sm font-medium rounded-xl bg-slate-800 text-slate-200 hover:bg-slate-700 hover:text-white transition flex items-center gap-2 border border-slate-700 shadow-sm disabled:opacity-50"
          >
            <RefreshCw className={`w-4 h-4 ${isFetching ? 'animate-spin text-emerald-400' : ''}`} />
            Refresh
          </button>

          <button
            onClick={() => setIsAssignModalOpen(true)}
            className="px-4 py-2 text-sm font-semibold rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white shadow-lg shadow-emerald-600/30 transition flex items-center gap-2"
          >
            <Plus className="w-4 h-4" />
            {structureData ? 'Modify Salary Structure' : 'Assign Salary Structure'}
          </button>
        </div>
      </div>

      {isLoading ? (
        <div className="p-12 rounded-2xl bg-slate-900 border border-slate-800 text-center space-y-4">
          <div className="inline-block w-8 h-8 border-4 border-emerald-500 border-t-transparent rounded-full animate-spin"></div>
          <p className="text-sm text-slate-400">Loading compensation package details...</p>
        </div>
      ) : !structureData || !structureData.ctc ? (
        /* Empty State */
        <div className="p-12 rounded-2xl bg-slate-900 border border-slate-800 text-center space-y-4">
          <FileSpreadsheet className="w-12 h-12 text-slate-600 mx-auto" />
          <div>
            <h3 className="text-lg font-semibold text-slate-200">No Salary Structure Assigned</h3>
            <p className="text-sm text-slate-400 mt-1 max-w-md mx-auto">
              This employee has not been assigned a salary package yet. Assigning a structure enables monthly payroll calculation and automated payslip generation.
            </p>
          </div>
          <button
            onClick={() => setIsAssignModalOpen(true)}
            className="px-5 py-2.5 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white text-sm font-semibold shadow-lg shadow-emerald-600/30 transition inline-flex items-center gap-2"
          >
            <Plus className="w-4 h-4" />
            Assign Salary Structure Now
          </button>
        </div>
      ) : (
        /* Assigned Structure Cards */
        <div className="space-y-6">
          {/* Top CTC Summary Cards */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            <div className="p-5 rounded-2xl bg-slate-900 border border-slate-800 shadow-sm">
              <p className="text-xs font-semibold text-slate-400 uppercase tracking-wider">Annual CTC Package</p>
              <h3 className="text-2xl font-bold text-slate-100 mt-1.5">₹{currentCTC.toLocaleString('en-IN')}</h3>
              <p className="text-xs text-slate-500 mt-2">Annualized cost to company</p>
            </div>

            <div className="p-5 rounded-2xl bg-slate-900 border border-slate-800 shadow-sm">
              <p className="text-xs font-semibold text-slate-400 uppercase tracking-wider">Monthly Gross Commitment</p>
              <h3 className="text-2xl font-bold text-emerald-400 mt-1.5">₹{Math.round(currentMonthly).toLocaleString('en-IN')}</h3>
              <p className="text-xs text-slate-500 mt-2">Base disbursement before statutory deductions</p>
            </div>

            <div className="p-5 rounded-2xl bg-slate-900 border border-slate-800 shadow-sm">
              <p className="text-xs font-semibold text-slate-400 uppercase tracking-wider">Effective From</p>
              <h3 className="text-lg font-bold text-indigo-400 mt-2">
                {structureData.effectiveFrom ? new Date(structureData.effectiveFrom).toLocaleDateString('en-IN', { year: 'numeric', month: 'long', day: 'numeric' }) : 'Active'}
              </h3>
              <p className="text-xs text-slate-500 mt-2">Applicable cycle starting date</p>
            </div>
          </div>

          {/* Detailed Component Breakdown */}
          <div className="p-6 rounded-2xl bg-slate-900 border border-slate-800 shadow-sm space-y-4">
            <div className="flex items-center justify-between pb-3 border-b border-slate-800">
              <div>
                <h3 className="text-lg font-bold text-slate-100">Monthly Compensation Breakdown</h3>
                <p className="text-xs text-slate-400">Fixed earnings and statutory allocations</p>
              </div>
              <button
                onClick={() => setIsAssignModalOpen(true)}
                className="text-xs text-indigo-400 hover:text-indigo-300 font-semibold flex items-center gap-1"
              >
                <Edit3 className="w-3.5 h-3.5" /> Edit Breakdown
              </button>
            </div>

            <div className="overflow-x-auto">
              <table className="w-full text-left text-sm text-slate-300">
                <thead className="bg-slate-800/60 uppercase text-xs font-semibold text-slate-400">
                  <tr>
                    <th className="px-4 py-3">Component</th>
                    <th className="px-4 py-3">Type</th>
                    <th className="px-4 py-3">Monthly Amount</th>
                    <th className="px-4 py-3 text-right">Annual Amount</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-800/60">
                  {components.length > 0 ? (
                    components.map((c, idx) => {
                      const amt = Number(c.amount || 0);
                      return (
                        <tr key={idx} className="hover:bg-slate-800/30">
                          <td className="px-4 py-3 font-semibold text-slate-200">
                            {c.component?.name || 'Base Salary Component'}
                          </td>
                          <td className="px-4 py-3">
                            <span className="px-2 py-0.5 rounded text-[11px] font-semibold bg-emerald-500/10 text-emerald-400 border border-emerald-500/20">
                              {c.component?.type || 'EARNING'}
                            </span>
                          </td>
                          <td className="px-4 py-3 font-bold text-slate-100">
                            ₹{amt.toLocaleString('en-IN')}
                          </td>
                          <td className="px-4 py-3 text-right text-slate-400">
                            ₹{(amt * 12).toLocaleString('en-IN')}
                          </td>
                        </tr>
                      );
                    })
                  ) : (
                    <>
                      <tr className="hover:bg-slate-800/30">
                        <td className="px-4 py-3 font-semibold text-slate-200">Basic Salary (40%)</td>
                        <td className="px-4 py-3"><span className="px-2 py-0.5 rounded text-[11px] font-semibold bg-emerald-500/10 text-emerald-400">EARNING</span></td>
                        <td className="px-4 py-3 font-bold text-slate-100">₹{(currentMonthly * 0.40).toLocaleString('en-IN')}</td>
                        <td className="px-4 py-3 text-right text-slate-400">₹{(currentCTC * 0.40).toLocaleString('en-IN')}</td>
                      </tr>
                      <tr className="hover:bg-slate-800/30">
                        <td className="px-4 py-3 font-semibold text-slate-200">House Rent Allowance (20%)</td>
                        <td className="px-4 py-3"><span className="px-2 py-0.5 rounded text-[11px] font-semibold bg-emerald-500/10 text-emerald-400">EARNING</span></td>
                        <td className="px-4 py-3 font-bold text-slate-100">₹{(currentMonthly * 0.20).toLocaleString('en-IN')}</td>
                        <td className="px-4 py-3 text-right text-slate-400">₹{(currentCTC * 0.20).toLocaleString('en-IN')}</td>
                      </tr>
                      <tr className="hover:bg-slate-800/30">
                        <td className="px-4 py-3 font-semibold text-slate-200">Special Allowance (40%)</td>
                        <td className="px-4 py-3"><span className="px-2 py-0.5 rounded text-[11px] font-semibold bg-emerald-500/10 text-emerald-400">EARNING</span></td>
                        <td className="px-4 py-3 font-bold text-slate-100">₹{(currentMonthly * 0.40).toLocaleString('en-IN')}</td>
                        <td className="px-4 py-3 text-right text-slate-400">₹{(currentCTC * 0.40).toLocaleString('en-IN')}</td>
                      </tr>
                    </>
                  )}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}

      {/* ASSIGN SALARY STRUCTURE MODAL */}
      {isAssignModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/75 backdrop-blur-sm animate-in fade-in-0 duration-150">
          <div className="bg-slate-900 border border-slate-800 rounded-2xl max-w-xl w-full max-h-[90vh] overflow-y-auto shadow-2xl space-y-5 p-6">
            <div className="flex items-center justify-between pb-3 border-b border-slate-800">
              <div>
                <h2 className="text-lg font-bold text-white flex items-center gap-2">
                  <DollarSign className="w-5 h-5 text-emerald-400" />
                  Assign Salary Structure
                </h2>
                <p className="text-xs text-slate-400 mt-0.5">
                  Select a template and enter annual CTC for <span className="text-slate-200 font-semibold">{employeeName}</span>
                </p>
              </div>
              <button
                onClick={() => setIsAssignModalOpen(false)}
                className="p-1.5 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800 transition"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleSaveAssignment} className="space-y-4">
              {/* Auto-Sync Banner */}
              <div className="p-3 rounded-xl bg-indigo-950/40 border border-indigo-500/30 flex items-center gap-2 text-xs text-indigo-200">
                <span className="flex h-2 w-2 relative">
                  <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
                  <span className="relative inline-flex rounded-full h-2 w-2 bg-emerald-500"></span>
                </span>
                <span>
                  <strong className="text-emerald-400">Auto-Linked</strong> to Company Payroll Rules (Basic {config?.basicPercentOfCTC ?? 40}%, HRA {config?.hraPercentOfCTC ?? 20}%, PF {config?.pfEmployeePercent ?? 12}%)
                </span>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-300 uppercase mb-1.5">
                  Select Structure Template
                </label>
                <select
                  value={activeTemplateId}
                  onChange={(e) => setSelectedTemplateId(e.target.value)}
                  className="w-full px-4 py-2.5 bg-slate-800 border border-slate-700 rounded-xl text-sm font-medium text-white focus:outline-none focus:ring-2 focus:ring-emerald-500"
                >
                  {templates.map((tpl) => (
                    <option key={tpl.id} value={tpl.id}>
                      {tpl.name} {tpl.description ? `(${tpl.description})` : ''}
                    </option>
                  ))}
                </select>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-semibold text-slate-300 uppercase mb-1.5">
                    Annual CTC (₹) *
                  </label>
                  <input
                    type="number"
                    step="1000"
                    min="1"
                    placeholder="e.g. 600000"
                    value={ctc}
                    onChange={(e) => setCTC(e.target.value)}
                    className="w-full px-4 py-2.5 bg-slate-800 border border-slate-700 rounded-xl text-sm font-bold text-emerald-400 focus:outline-none focus:ring-2 focus:ring-emerald-500"
                    required
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-300 uppercase mb-1.5">
                    Effective From Date *
                  </label>
                  <input
                    type="date"
                    value={effectiveFrom}
                    onChange={(e) => setEffectiveFrom(e.target.value)}
                    className="w-full px-4 py-2.5 bg-slate-800 border border-slate-700 rounded-xl text-sm text-white focus:outline-none focus:ring-2 focus:ring-emerald-500"
                    required
                  />
                </div>
              </div>

              {/* Real-time Calculation Breakdown Preview */}
              <div className="p-4 rounded-xl bg-slate-800/80 border border-slate-700 space-y-3">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-bold text-slate-200 flex items-center gap-1.5">
                    <Calculator className="w-3.5 h-3.5 text-indigo-400" />
                    Salary Allocation Preview
                  </span>
                  <span className="text-xs font-bold text-indigo-300">
                    Monthly CTC: ₹{Math.round(monthlyCTC).toLocaleString('en-IN')}
                  </span>
                </div>

                <div className="space-y-1.5 text-xs">
                  <div className="flex justify-between py-1 border-b border-slate-700/60">
                    <span className="text-slate-400">Basic Salary ({basicPct}%):</span>
                    <span className="font-semibold text-slate-200">₹{Math.round(previewBasic).toLocaleString('en-IN')}</span>
                  </div>
                  <div className="flex justify-between py-1 border-b border-slate-700/60">
                    <span className="text-slate-400">House Rent Allowance ({hraPct}%):</span>
                    <span className="font-semibold text-slate-200">₹{Math.round(previewHRA).toLocaleString('en-IN')}</span>
                  </div>
                  <div className="flex justify-between py-1 border-b border-slate-700/60">
                    <span className="text-slate-400">Special Allowance ({specialPct}%):</span>
                    <span className="font-semibold text-slate-200">₹{Math.round(previewSpecial).toLocaleString('en-IN')}</span>
                  </div>
                  <div className="flex justify-between py-1 border-b border-slate-700/60">
                    <span className="text-rose-400">Provident Fund (PF {pfPct}% on Basic):</span>
                    <span className="font-semibold text-rose-400">-₹{Math.round(previewPF).toLocaleString('en-IN')}</span>
                  </div>
                  <div className="flex justify-between py-1 font-bold text-emerald-400 pt-1">
                    <span>Estimated Monthly Net:</span>
                    <span>₹{Math.round(previewNet).toLocaleString('en-IN')}</span>
                  </div>
                </div>
              </div>

              {/* Modal Actions */}
              <div className="flex justify-end gap-3 pt-2">
                <button
                  type="button"
                  onClick={() => setIsAssignModalOpen(false)}
                  className="px-4 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 text-xs font-semibold transition"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={assignMutation.isPending}
                  className="px-5 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-semibold shadow-lg shadow-emerald-600/30 transition flex items-center gap-1.5 disabled:opacity-50"
                >
                  {assignMutation.isPending ? (
                    <RefreshCw className="w-3.5 h-3.5 animate-spin" />
                  ) : (
                    <CheckCircle2 className="w-3.5 h-3.5" />
                  )}
                  Save & Assign Structure
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
