import React, { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { 
  DollarSign, 
  Search, 
  RefreshCw, 
  Users, 
  Layers, 
  TrendingUp, 
  Plus, 
  AlertCircle,
  FileSpreadsheet,
  X,
  PlusCircle,
  Trash2,
  Calculator,
  CheckCircle2,
  ExternalLink
} from 'lucide-react';
import { Link } from 'react-router-dom';
import { toast } from 'sonner';
import payrollService from '../../services/payroll.service.js';

export default function SalaryStructuresPage() {
  const queryClient = useQueryClient();
  const [search, setSearch] = useState('');
  const [page, setPage] = useState(1);
  const [isModalOpen, setIsModalOpen] = useState(false);

  // Queries
  const { data: config } = useQuery({
    queryKey: ['company-payroll-rules'],
    queryFn: () => payrollService.getPayrollConfig()
  });

  const { data, isLoading, error, refetch, isFetching } = useQuery({
    queryKey: ['payroll-salary-structures', { page, search }],
    queryFn: () => payrollService.listSalaryStructures({
      page,
      search: search || undefined
    })
  });

  const { data: templates = [] } = useQuery({
    queryKey: ['payroll-structure-templates'],
    queryFn: () => payrollService.listStructureTemplates()
  });

  const getRulesBasedComponents = () => {
    const basic = config?.basicPercentOfCTC ?? 40;
    const hra = config?.hraPercentOfCTC ?? 20;
    const special = Math.max(0, 100 - basic - hra);
    const pf = config?.pfEmployeePercent ?? 12;
    const esi = config?.esiEmployeePercent ?? 0.75;

    return [
      { name: 'Basic', code: 'BASIC', basis: '% of CTC', value: basic, type: 'EARNING' },
      { name: 'HRA', code: 'HRA', basis: '% of CTC', value: hra, type: 'EARNING' },
      { name: 'Special', code: 'SPECIAL', basis: '% of CTC', value: special, type: 'EARNING' },
      ...(config?.pfEnabled !== false ? [{ name: 'PF', code: 'PF', basis: '% of Basic', value: pf, type: 'DEDUCTION' }] : []),
      ...(config?.esiEnabled !== false ? [{ name: 'ESI', code: 'ESI', basis: '% of Gross', value: esi, type: 'DEDUCTION' }] : [])
    ];
  };

  // Create Template State
  const [templateForm, setTemplateForm] = useState({
    name: '',
    description: '',
    components: getRulesBasedComponents()
  });

  // When config loads or modal opens, auto-sync if form is pristine
  const handleOpenModal = () => {
    setTemplateForm({
      name: '',
      description: '',
      components: getRulesBasedComponents()
    });
    setIsModalOpen(true);
  };

  const handleResetToCompanyRules = () => {
    setTemplateForm(prev => ({
      ...prev,
      components: getRulesBasedComponents()
    }));
    toast.info('Components auto-synced with Company Payroll Rules');
  };

  const [previewCTC, setPreviewCTC] = useState(600000);

  // Mutation to create structure template
  const createMutation = useMutation({
    mutationFn: (newStruct) => payrollService.createStructureTemplate(newStruct),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['payroll-structure-templates'] });
      queryClient.invalidateQueries({ queryKey: ['payroll-salary-structures'] });
      toast.success('Salary structure template created successfully');
      setIsModalOpen(false);
      setTemplateForm({
        name: '',
        description: '',
        components: [
          { name: 'Basic', code: 'BASIC', basis: '% of CTC', value: 40, type: 'EARNING' },
          { name: 'HRA', code: 'HRA', basis: '% of CTC', value: 20, type: 'EARNING' },
          { name: 'Special', code: 'SPECIAL', basis: '% of CTC', value: 40, type: 'EARNING' },
          { name: 'PF', code: 'PF', basis: '% of Basic', value: 12, type: 'DEDUCTION' },
          { name: 'ESI', code: 'ESI', basis: '% of Gross', value: 0.75, type: 'DEDUCTION' }
        ]
      });
    },
    onError: (err) => {
      toast.error(err.response?.data?.message || err.message || 'Failed to create structure template');
    }
  });

  const handleAddComponent = () => {
    setTemplateForm({
      ...templateForm,
      components: [
        ...templateForm.components,
        { name: 'Allowance', code: 'ALLOWANCE', basis: '% of CTC', value: 10, type: 'EARNING' }
      ]
    });
  };

  const handleRemoveComponent = (idx) => {
    setTemplateForm({
      ...templateForm,
      components: templateForm.components.filter((_, i) => i !== idx)
    });
  };

  const handleComponentChange = (idx, field, val) => {
    const updated = [...templateForm.components];
    updated[idx] = { ...updated[idx], [field]: val };
    setTemplateForm({ ...templateForm, components: updated });
  };

  const handleSaveTemplate = (e) => {
    e.preventDefault();
    if (!templateForm.name.trim()) {
      toast.error('Structure Name is required');
      return;
    }
    createMutation.mutate(templateForm);
  };

  // Preview Calculations for Modal
  const mCTC = previewCTC / 12;
  const basicComp = templateForm.components.find(c => c.name.toLowerCase().includes('basic')) || { value: 40 };
  const basicVal = (mCTC * (parseFloat(basicComp.value) || 40)) / 100;
  const hraComp = templateForm.components.find(c => c.name.toLowerCase().includes('hra')) || { value: 20 };
  const hraVal = (mCTC * (parseFloat(hraComp.value) || 20)) / 100;
  const pfComp = templateForm.components.find(c => c.name.toLowerCase().includes('pf')) || { value: 12 };
  const pfVal = Math.min(basicVal, 15000) * ((parseFloat(pfComp.value) || 12) / 100);

  // Table Data
  const structures = data?.structures || (Array.isArray(data) ? data : []);
  const total = data?.total || structures.length;
  const totalBaseCTC = structures.reduce((sum, s) => sum + Number(s.ctc || 0), 0);
  const avgCTC = structures.length > 0 ? Math.round(totalBaseCTC / structures.length) : 0;

  const filteredStructures = structures.filter(s => {
    if (!search) return true;
    const term = search.toLowerCase();
    const name = `${s.employee?.firstName || ''} ${s.employee?.lastName || ''}`.toLowerCase();
    const code = (s.employee?.employeeCode || '').toLowerCase();
    return name.includes(term) || code.includes(term);
  });

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-slate-100 flex items-center gap-2.5">
            <DollarSign className="w-7 h-7 text-emerald-400" />
            Salary Structures & Templates
          </h1>
          <p className="text-sm text-slate-400 mt-1">
            Create salary structure templates, configure compensation rules, and manage employee CTC assignments
          </p>
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
            onClick={handleOpenModal}
            className="px-4 py-2 text-sm font-semibold rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white shadow-lg shadow-emerald-600/30 transition flex items-center gap-2"
          >
            <Plus className="w-4 h-4" />
            Create Salary Structure
          </button>
        </div>
      </div>

      {/* Metric Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <div className="p-5 rounded-2xl bg-slate-900 border border-slate-800 shadow-sm">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-xs font-semibold text-slate-400 uppercase tracking-wider">Active Structures</p>
              <h3 className="text-2xl font-bold text-slate-100 mt-1.5">{total}</h3>
            </div>
            <div className="w-12 h-12 rounded-xl bg-emerald-500/10 border border-emerald-500/20 flex items-center justify-center text-emerald-400">
              <Users className="w-6 h-6" />
            </div>
          </div>
          <p className="text-xs text-slate-500 mt-2">Assigned employee packages</p>
        </div>

        <div className="p-5 rounded-2xl bg-slate-900 border border-slate-800 shadow-sm">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-xs font-semibold text-slate-400 uppercase tracking-wider">Average Annual CTC</p>
              <h3 className="text-2xl font-bold text-indigo-400 mt-1.5">₹{avgCTC.toLocaleString('en-IN')}</h3>
            </div>
            <div className="w-12 h-12 rounded-xl bg-indigo-500/10 border border-indigo-500/20 flex items-center justify-center text-indigo-400">
              <TrendingUp className="w-6 h-6" />
            </div>
          </div>
          <p className="text-xs text-slate-500 mt-2">Mean package across active workforce</p>
        </div>

        <div className="p-5 rounded-2xl bg-slate-900 border border-slate-800 shadow-sm">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-xs font-semibold text-slate-400 uppercase tracking-wider">Total Annualized Payroll</p>
              <h3 className="text-2xl font-bold text-sky-400 mt-1.5">₹{totalBaseCTC.toLocaleString('en-IN')}</h3>
            </div>
            <div className="w-12 h-12 rounded-xl bg-sky-500/10 border border-sky-500/20 flex items-center justify-center text-sky-400">
              <Layers className="w-6 h-6" />
            </div>
          </div>
          <p className="text-xs text-slate-500 mt-2">Aggregated base salary commitments</p>
        </div>
      </div>

      {/* Available Structure Templates Carousel / Grid */}
      {templates.length > 0 && (
        <div className="p-5 rounded-2xl bg-slate-900 border border-slate-800 shadow-sm space-y-3">
          <div className="flex items-center justify-between">
            <h3 className="text-sm font-bold text-slate-200">Pre-Configured Structure Templates ({templates.length})</h3>
            <span className="text-xs text-slate-400">Ready to assign to employees</span>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-3 pt-1">
            {templates.map((tpl, i) => (
              <div key={tpl.id || i} className="p-4 rounded-xl bg-slate-800/60 border border-slate-700/80 space-y-2">
                <div className="flex items-center justify-between">
                  <h4 className="font-bold text-sm text-emerald-400">{tpl.name}</h4>
                  <span className="text-[11px] px-2 py-0.5 rounded-full bg-emerald-500/10 text-emerald-300 border border-emerald-500/20 font-medium">
                    Template
                  </span>
                </div>
                <p className="text-xs text-slate-400 line-clamp-2">{tpl.description || 'Standard proportioned structure'}</p>
                <div className="flex flex-wrap gap-1 pt-1">
                  {(tpl.components || []).map((c, ci) => (
                    <span key={ci} className="text-[10px] px-1.5 py-0.5 rounded bg-slate-900 text-slate-300 border border-slate-700">
                      {c.name}: {c.value}%
                    </span>
                  ))}
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Filter and Search */}
      <div className="p-4 rounded-2xl bg-slate-900 border border-slate-800 shadow-sm">
        <div className="relative w-full">
          <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            placeholder="Search employee salary structure by name or employee code..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full pl-10 pr-4 py-2.5 bg-slate-800/80 border border-slate-700 rounded-xl text-sm text-slate-200 placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-emerald-500/40 focus:border-emerald-500"
          />
        </div>
      </div>

      {/* Main Table */}
      <div className="rounded-2xl bg-slate-900 border border-slate-800 shadow-sm overflow-hidden">
        {isLoading ? (
          <div className="p-12 text-center space-y-4">
            <div className="inline-block w-8 h-8 border-4 border-emerald-500 border-t-transparent rounded-full animate-spin"></div>
            <p className="text-sm text-slate-400">Loading salary structures...</p>
          </div>
        ) : error ? (
          <div className="p-8 text-center space-y-3">
            <AlertCircle className="w-10 h-10 text-rose-400 mx-auto" />
            <h3 className="text-base font-semibold text-slate-200">Unable to load salary structures</h3>
            <p className="text-sm text-slate-400">{error.message}</p>
            <button
              onClick={() => refetch()}
              className="px-4 py-1.5 rounded-lg bg-emerald-600 text-white text-xs font-medium hover:bg-emerald-500 transition"
            >
              Try Again
            </button>
          </div>
        ) : filteredStructures.length === 0 ? (
          <div className="p-12 text-center space-y-4">
            <FileSpreadsheet className="w-12 h-12 text-slate-600 mx-auto" />
            <div>
              <h3 className="text-base font-medium text-slate-200">No salary structures configured</h3>
              <p className="text-sm text-slate-400 mt-1">
                Assign salary structures to employees or create a new template to start payroll processing.
              </p>
            </div>
            <div className="flex justify-center gap-3 pt-2">
              <button
                onClick={() => setIsModalOpen(true)}
                className="px-4 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-semibold shadow-md transition flex items-center gap-1.5"
              >
                <Plus className="w-4 h-4" />
                Create Salary Structure
              </button>
              <Link
                to="/employees"
                className="px-4 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs font-semibold border border-slate-700 transition flex items-center gap-1.5"
              >
                <Users className="w-4 h-4" />
                Browse Employees
              </Link>
            </div>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-sm text-slate-300">
              <thead className="bg-slate-800/60 text-xs uppercase font-semibold text-slate-400 border-b border-slate-800">
                <tr>
                  <th className="px-6 py-4">Employee</th>
                  <th className="px-6 py-4">Department / Designation</th>
                  <th className="px-6 py-4">Annual CTC</th>
                  <th className="px-6 py-4">Monthly Gross</th>
                  <th className="px-6 py-4">Component Breakdown</th>
                  <th className="px-6 py-4">Effective Date</th>
                  <th className="px-6 py-4 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-800/60">
                {filteredStructures.map((st) => {
                  const emp = st.employee || {};
                  const ctc = Number(st.ctc || 0);
                  const monthly = Math.round(ctc / 12);
                  const components = st.components || [];

                  return (
                    <tr key={st.id || emp.id} className="hover:bg-slate-800/30 transition-colors">
                      <td className="px-6 py-4">
                        <div className="flex items-center gap-3">
                          <div className="w-9 h-9 rounded-full bg-emerald-500/20 border border-emerald-500/30 text-emerald-300 font-semibold text-xs flex items-center justify-center">
                            {emp.firstName?.[0] || 'E'}{emp.lastName?.[0] || ''}
                          </div>
                          <div>
                            <p className="font-semibold text-slate-100">{emp.firstName || ''} {emp.lastName || ''}</p>
                            <p className="text-xs text-slate-400">{emp.employeeCode || 'EMP'}</p>
                          </div>
                        </div>
                      </td>

                      <td className="px-6 py-4">
                        <p className="text-slate-200">{emp.department?.name || 'General'}</p>
                        <p className="text-xs text-slate-400">{emp.designation?.name || 'Staff'}</p>
                      </td>

                      <td className="px-6 py-4 font-bold text-slate-100">
                        ₹{ctc.toLocaleString('en-IN')}
                      </td>

                      <td className="px-6 py-4 font-medium text-emerald-400">
                        ₹{monthly.toLocaleString('en-IN')}
                      </td>

                      <td className="px-6 py-4">
                        <div className="flex flex-wrap gap-1.5 max-w-sm">
                          {components.length > 0 ? (
                            components.map((c, idx) => (
                              <span
                                key={idx}
                                className="inline-flex items-center gap-1 px-2 py-0.5 rounded text-[11px] font-medium bg-slate-800 border border-slate-700 text-slate-300"
                              >
                                <span className="text-emerald-400">{c.component?.name || 'Component'}:</span> ₹{Number(c.amount || 0).toLocaleString('en-IN')}
                              </span>
                            ))
                          ) : (
                            <span className="text-xs text-slate-500">Standard base components</span>
                          )}
                        </div>
                      </td>

                      <td className="px-6 py-4 text-xs text-slate-400">
                        {st.effectiveFrom ? new Date(st.effectiveFrom).toLocaleDateString() : 'Active'}
                      </td>

                      <td className="px-6 py-4 text-right">
                        <Link
                          to={`/payroll/employee/${emp.id || st.employeeId}`}
                          className="px-3 py-1.5 rounded-lg bg-indigo-600/20 hover:bg-indigo-600/30 text-indigo-300 border border-indigo-500/30 text-xs font-semibold inline-flex items-center gap-1 transition"
                        >
                          Modify Structure
                          <ExternalLink className="w-3 h-3" />
                        </Link>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* CREATE SALARY STRUCTURE MODAL */}
      {isModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/75 backdrop-blur-sm animate-in fade-in-0 duration-150">
          <div className="bg-slate-900 border border-slate-800 rounded-2xl max-w-2xl w-full max-h-[90vh] overflow-y-auto shadow-2xl space-y-5 p-6">
            <div className="flex items-center justify-between pb-3 border-b border-slate-800">
              <div>
                <h2 className="text-lg font-bold text-white flex items-center gap-2">
                  <PlusCircle className="w-5 h-5 text-emerald-400" />
                  Create Salary Structure Template
                </h2>
                <p className="text-xs text-slate-400 mt-0.5">
                  Define component calculation basis, percentage formulas, and statutory deductions
                </p>
              </div>
              <button
                onClick={() => setIsModalOpen(false)}
                className="p-1.5 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800 transition"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleSaveTemplate} className="space-y-4">
              <div>
                <label className="block text-xs font-semibold text-slate-300 uppercase mb-1.5">
                  Structure Name *
                </label>
                <input
                  type="text"
                  placeholder="e.g. Standard Engineer"
                  value={templateForm.name}
                  onChange={(e) => setTemplateForm({ ...templateForm, name: e.target.value })}
                  className="w-full px-4 py-2.5 bg-slate-800 border border-slate-700 rounded-xl text-sm text-white focus:outline-none focus:ring-2 focus:ring-emerald-500"
                  required
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-300 uppercase mb-1.5">
                  Description (Optional)
                </label>
                <input
                  type="text"
                  placeholder="e.g. Standard package for Software Developers and Engineers"
                  value={templateForm.description}
                  onChange={(e) => setTemplateForm({ ...templateForm, description: e.target.value })}
                  className="w-full px-4 py-2 bg-slate-800 border border-slate-700 rounded-xl text-sm text-white focus:outline-none focus:ring-2 focus:ring-emerald-500"
                />
              </div>

              {/* Auto-Sync with Company Rules Banner */}
              <div className="p-3.5 rounded-xl bg-indigo-950/40 border border-indigo-500/30 flex items-center justify-between gap-3">
                <div className="flex items-center gap-2 text-xs text-indigo-200">
                  <span className="flex h-2 w-2 relative">
                    <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
                    <span className="relative inline-flex rounded-full h-2 w-2 bg-emerald-500"></span>
                  </span>
                  <span>
                    <strong className="text-emerald-400">Auto-Populated</strong> from Company Rules (Basic {config?.basicPercentOfCTC ?? 40}%, HRA {config?.hraPercentOfCTC ?? 20}%, PF {config?.pfEmployeePercent ?? 12}%)
                  </span>
                </div>
                <button
                  type="button"
                  onClick={handleResetToCompanyRules}
                  className="px-2.5 py-1 rounded-lg bg-indigo-600/30 hover:bg-indigo-600/50 text-indigo-300 text-[11px] font-semibold border border-indigo-500/40 transition flex items-center gap-1 shrink-0"
                >
                  <RefreshCw className="w-3 h-3" />
                  Re-Sync Rules
                </button>
              </div>

              {/* Components Table */}
              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <label className="block text-xs font-semibold text-slate-300 uppercase">
                    Salary Components
                  </label>
                  <button
                    type="button"
                    onClick={handleAddComponent}
                    className="text-xs text-emerald-400 hover:text-emerald-300 font-semibold flex items-center gap-1"
                  >
                    <Plus className="w-3.5 h-3.5" /> Add Component
                  </button>
                </div>

                <div className="rounded-xl border border-slate-800 overflow-hidden">
                  <table className="w-full text-left text-xs text-slate-300">
                    <thead className="bg-slate-800/80 uppercase text-[10px] font-semibold text-slate-400">
                      <tr>
                        <th className="px-3 py-2.5">Name</th>
                        <th className="px-3 py-2.5">Basis</th>
                        <th className="px-3 py-2.5">Value (%)</th>
                        <th className="px-3 py-2.5 text-center">Action</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-800/60 bg-slate-900/50">
                      {templateForm.components.map((c, idx) => (
                        <tr key={idx}>
                          <td className="px-3 py-2">
                            <input
                              type="text"
                              value={c.name}
                              onChange={(e) => handleComponentChange(idx, 'name', e.target.value)}
                              className="w-full px-2 py-1 bg-slate-800 border border-slate-700 rounded text-xs text-white"
                              required
                            />
                          </td>
                          <td className="px-3 py-2">
                            <select
                              value={c.basis}
                              onChange={(e) => handleComponentChange(idx, 'basis', e.target.value)}
                              className="w-full px-2 py-1 bg-slate-800 border border-slate-700 rounded text-xs text-white"
                            >
                              <option value="% of CTC">% of CTC</option>
                              <option value="% of Basic">% of Basic</option>
                              <option value="% of Gross">% of Gross</option>
                              <option value="Fixed Amount">Fixed Amount</option>
                            </select>
                          </td>
                          <td className="px-3 py-2">
                            <input
                              type="number"
                              step="0.05"
                              value={c.value}
                              onChange={(e) => handleComponentChange(idx, 'value', e.target.value)}
                              className="w-20 px-2 py-1 bg-slate-800 border border-slate-700 rounded text-xs text-white"
                              required
                            />
                          </td>
                          <td className="px-3 py-2 text-center">
                            <button
                              type="button"
                              onClick={() => handleRemoveComponent(idx)}
                              className="p-1 rounded text-slate-400 hover:text-rose-400 transition"
                            >
                              <Trash2 className="w-3.5 h-3.5" />
                            </button>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>

              {/* Live Preview for Sample CTC */}
              <div className="p-4 rounded-xl bg-indigo-950/30 border border-indigo-500/20 space-y-2">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-bold text-indigo-200 flex items-center gap-1.5">
                    <Calculator className="w-3.5 h-3.5 text-indigo-400" />
                    Live Preview Simulation
                  </span>
                  <div className="flex items-center gap-1 text-xs text-slate-400">
                    <span>Sample CTC: ₹</span>
                    <input
                      type="number"
                      value={previewCTC}
                      onChange={(e) => setPreviewCTC(Number(e.target.value))}
                      className="w-24 px-1.5 py-0.5 bg-slate-900 border border-slate-700 rounded text-xs text-white"
                    />
                  </div>
                </div>

                <div className="grid grid-cols-3 gap-2 pt-1 text-center">
                  <div className="p-2 rounded bg-slate-900/80 border border-slate-800">
                    <p className="text-[10px] text-slate-400">Basic Salary</p>
                    <p className="text-sm font-bold text-emerald-400">₹{Math.round(basicVal).toLocaleString('en-IN')}</p>
                  </div>
                  <div className="p-2 rounded bg-slate-900/80 border border-slate-800">
                    <p className="text-[10px] text-slate-400">HRA</p>
                    <p className="text-sm font-bold text-emerald-400">₹{Math.round(hraVal).toLocaleString('en-IN')}</p>
                  </div>
                  <div className="p-2 rounded bg-slate-900/80 border border-slate-800">
                    <p className="text-[10px] text-slate-400">PF (12% Basic)</p>
                    <p className="text-sm font-bold text-rose-400">₹{Math.round(pfVal).toLocaleString('en-IN')}</p>
                  </div>
                </div>
              </div>

              {/* Modal Actions */}
              <div className="flex justify-end gap-3 pt-2">
                <button
                  type="button"
                  onClick={() => setIsModalOpen(false)}
                  className="px-4 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 text-xs font-semibold transition"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={createMutation.isPending}
                  className="px-5 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-semibold shadow-lg shadow-emerald-600/30 transition flex items-center gap-1.5 disabled:opacity-50"
                >
                  {createMutation.isPending ? (
                    <RefreshCw className="w-3.5 h-3.5 animate-spin" />
                  ) : (
                    <CheckCircle2 className="w-3.5 h-3.5" />
                  )}
                  Save Structure Template
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
