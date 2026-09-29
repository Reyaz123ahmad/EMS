import React, { useState } from 'react';
import { 
  ChevronDown, 
  ChevronRight, 
  AlertTriangle, 
  DollarSign, 
  User, 
  ExternalLink,
  Layers,
  ArrowUpRight,
  TrendingDown,
  TrendingUp,
  ShieldAlert,
  Info
} from 'lucide-react';
import { Link } from 'react-router-dom';

export default function PayrollPreview({ previewData }) {
  const [expandedRows, setExpandedRows] = useState({});

  if (!previewData) return null;

  const items = previewData.items || [];
  const skipped = previewData.skipped || [];
  const totalGross = previewData.totalGross ?? previewData.totals?.grossPayout ?? 0;
  const totalDeductions = previewData.totalDeductions ?? previewData.totals?.deductions ?? 0;
  const totalNet = previewData.totalNet ?? previewData.totals?.netDisbursement ?? 0;

  const toggleRow = (id) => {
    setExpandedRows(prev => ({
      ...prev,
      [id]: !prev[id]
    }));
  };

  return (
    <div className="space-y-6 animate-in fade-in-0 duration-200">
      {/* Metric Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <div className="p-5 rounded-2xl bg-emerald-950/30 border border-emerald-500/20 shadow-sm">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold text-emerald-400 uppercase tracking-wider">Total Gross Earnings</span>
            <TrendingUp className="w-5 h-5 text-emerald-400" />
          </div>
          <div className="text-2xl font-black text-white mt-1.5">
            ₹{Number(totalGross).toLocaleString('en-IN')}
          </div>
          <p className="text-xs text-slate-400 mt-1">Sum of Base + OT + Reimbursements</p>
        </div>

        <div className="p-5 rounded-2xl bg-rose-950/30 border border-rose-500/20 shadow-sm">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold text-rose-400 uppercase tracking-wider">Total Deductions</span>
            <TrendingDown className="w-5 h-5 text-rose-400" />
          </div>
          <div className="text-2xl font-black text-white mt-1.5">
            -₹{Number(totalDeductions).toLocaleString('en-IN')}
          </div>
          <p className="text-xs text-slate-400 mt-1">PF + ESI + PT + TDS + LOP + Loans</p>
        </div>

        <div className="p-5 rounded-2xl bg-indigo-950/30 border border-indigo-500/20 shadow-sm">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold text-indigo-300 uppercase tracking-wider">Total Net Disbursement</span>
            <DollarSign className="w-5 h-5 text-indigo-400" />
          </div>
          <div className="text-2xl font-black text-white mt-1.5">
            ₹{Number(totalNet).toLocaleString('en-IN')}
          </div>
          <p className="text-xs text-slate-400 mt-1">Final net payable across {items.length} employees</p>
        </div>
      </div>

      {/* Skipped Employees Warning Banner */}
      {skipped.length > 0 && (
        <div className="p-5 rounded-2xl bg-amber-500/10 border border-amber-500/30 space-y-3">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2.5">
              <AlertTriangle className="w-5 h-5 text-amber-400" />
              <h3 className="text-sm font-bold text-amber-300">
                {skipped.length} Employee{skipped.length > 1 ? 's' : ''} Skipped From Payroll Calculation
              </h3>
            </div>
            <span className="text-xs text-amber-400 font-medium">Action Required</span>
          </div>
          <p className="text-xs text-slate-300">
            Employees without an active salary structure cannot be computed. Assign a structure to include them in this pay run.
          </p>
          <div className="divide-y divide-amber-500/20 bg-slate-900/60 rounded-xl border border-amber-500/20 overflow-hidden">
            {skipped.map((sk, idx) => (
              <div key={idx} className="p-3 flex items-center justify-between text-xs">
                <div className="flex items-center gap-2">
                  <div className="w-7 h-7 rounded-full bg-amber-500/20 text-amber-300 font-bold flex items-center justify-center text-[10px]">
                    {sk.employeeName?.[0] || 'E'}
                  </div>
                  <div>
                    <span className="font-semibold text-slate-200">{sk.employeeName || sk.employeeId}</span>
                    <span className="text-slate-400 ml-2">({sk.employeeCode || 'No Code'})</span>
                  </div>
                </div>
                <div className="flex items-center gap-3">
                  <span className="px-2 py-0.5 rounded text-[10px] font-semibold bg-rose-500/20 text-rose-300 border border-rose-500/30">
                    Reason: {sk.reason === 'NO_SALARY_STRUCTURE' ? 'No Salary Structure' : sk.reason}
                  </span>
                  <Link
                    to={`/payroll/employee/${sk.employeeId}`}
                    className="px-2.5 py-1 rounded bg-amber-600 hover:bg-amber-500 text-white font-semibold inline-flex items-center gap-1 transition"
                  >
                    Assign Structure
                    <ExternalLink className="w-3 h-3" />
                  </Link>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Main Calculation Table */}
      <div className="rounded-2xl bg-slate-900 border border-slate-800 shadow-sm overflow-hidden space-y-0">
        <div className="p-4 border-b border-slate-800 flex items-center justify-between">
          <div>
            <h3 className="text-base font-bold text-white">Employee Salary Calculation Breakdown</h3>
            <p className="text-xs text-slate-400">Click any row to view itemized earnings and deductions</p>
          </div>
          <span className="text-xs font-semibold text-slate-400 bg-slate-800 px-3 py-1 rounded-full">
            {items.length} Included
          </span>
        </div>

        {items.length === 0 ? (
          <div className="p-12 text-center space-y-2">
            <Info className="w-10 h-10 text-slate-600 mx-auto" />
            <h4 className="text-sm font-medium text-slate-300">No employees computed for this period</h4>
            <p className="text-xs text-slate-500">Ensure employees have salary structures and attendance logged.</p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-sm text-slate-300">
              <thead className="bg-slate-800/80 uppercase text-xs font-semibold text-slate-400 border-b border-slate-800">
                <tr>
                  <th className="px-5 py-3.5 w-8"></th>
                  <th className="px-4 py-3.5">Employee</th>
                  <th className="px-4 py-3.5 text-center">Days Worked</th>
                  <th className="px-4 py-3.5 text-right">Base CTC (Mo.)</th>
                  <th className="px-4 py-3.5 text-right">Earnings</th>
                  <th className="px-4 py-3.5 text-right">Deductions</th>
                  <th className="px-5 py-3.5 text-right">Net Pay</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-800/60">
                {items.map((row, idx) => {
                  const empId = row.employeeId || idx;
                  const isExpanded = !!expandedRows[empId];
                  const lineItems = row.lineItems || [];
                  const earnings = lineItems.filter(l => l.type === 'EARNING');
                  const deductions = lineItems.filter(l => l.type === 'DEDUCTION');

                  const gross = Number(row.grossSalary || row.grossEarnings || 0);
                  const totalDed = Number(row.totalDeductions || 0);
                  const net = Number(row.netSalary || 0);
                  const baseSalary = Math.round(gross);

                  return (
                    <React.Fragment key={empId}>
                      <tr 
                        onClick={() => toggleRow(empId)}
                        className={`hover:bg-slate-800/40 cursor-pointer transition-colors ${
                          isExpanded ? 'bg-slate-800/30' : ''
                        }`}
                      >
                        <td className="px-5 py-4 text-slate-400">
                          {isExpanded ? (
                            <ChevronDown className="w-4 h-4 text-indigo-400" />
                          ) : (
                            <ChevronRight className="w-4 h-4" />
                          )}
                        </td>
                        <td className="px-4 py-4">
                          <div className="flex items-center gap-3">
                            <div className="w-8 h-8 rounded-full bg-indigo-500/20 border border-indigo-500/30 text-indigo-300 font-bold text-xs flex items-center justify-center">
                              {row.employeeName?.[0] || 'E'}
                            </div>
                            <div>
                              <p className="font-semibold text-white">{row.employeeName}</p>
                              <p className="text-xs text-slate-400">{row.employeeCode || 'EMP'} • {row.department || 'General'}</p>
                            </div>
                          </div>
                        </td>
                        <td className="px-4 py-4 text-center">
                          <span className="font-semibold text-slate-200">{row.presentDays ?? 0}</span>
                          <span className="text-xs text-slate-500"> / {row.totalWorkingDays ?? 30}</span>
                          {Number(row.absentDays) > 0 && (
                            <span className="ml-2 px-1.5 py-0.5 rounded text-[10px] bg-rose-500/20 text-rose-400 font-medium">
                              {row.absentDays} absent
                            </span>
                          )}
                        </td>
                        <td className="px-4 py-4 text-right font-medium text-slate-300">
                          ₹{baseSalary.toLocaleString('en-IN')}
                        </td>
                        <td className="px-4 py-4 text-right font-bold text-emerald-400">
                          ₹{gross.toLocaleString('en-IN')}
                        </td>
                        <td className="px-4 py-4 text-right font-bold text-rose-400">
                          -₹{totalDed.toLocaleString('en-IN')}
                        </td>
                        <td className="px-5 py-4 text-right">
                          <span className="font-black text-white bg-indigo-500/20 border border-indigo-500/30 px-2.5 py-1 rounded-lg">
                            ₹{net.toLocaleString('en-IN')}
                          </span>
                        </td>
                      </tr>

                      {/* Expandable Breakdown Drawer */}
                      {isExpanded && (
                        <tr className="bg-slate-950/60">
                          <td colSpan={7} className="p-5 border-y border-slate-800/80">
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-6 max-w-4xl mx-auto">
                              {/* Earnings Breakdown */}
                              <div className="p-4 rounded-xl bg-emerald-950/20 border border-emerald-500/20 space-y-3">
                                <div className="flex items-center justify-between pb-2 border-b border-emerald-500/20">
                                  <h4 className="text-xs font-bold uppercase text-emerald-400 flex items-center gap-1.5">
                                    <TrendingUp className="w-3.5 h-3.5" />
                                    Earnings Breakdown
                                  </h4>
                                  <span className="font-bold text-xs text-emerald-300">
                                    Total: ₹{gross.toLocaleString('en-IN')}
                                  </span>
                                </div>

                                <div className="space-y-1.5 text-xs">
                                  {earnings.length > 0 ? (
                                    earnings.map((e, ei) => (
                                      <div key={ei} className="flex justify-between text-slate-300">
                                        <span className="text-slate-400">{e.componentName}:</span>
                                        <span className="font-semibold text-slate-100">₹{Number(e.amount).toLocaleString('en-IN')}</span>
                                      </div>
                                    ))
                                  ) : (
                                    <>
                                      <div className="flex justify-between text-slate-300">
                                        <span className="text-slate-400">Basic Salary:</span>
                                        <span className="font-semibold text-slate-100">₹{(gross * 0.4).toLocaleString('en-IN')}</span>
                                      </div>
                                      <div className="flex justify-between text-slate-300">
                                        <span className="text-slate-400">House Rent Allowance (HRA):</span>
                                        <span className="font-semibold text-slate-100">₹{(gross * 0.2).toLocaleString('en-IN')}</span>
                                      </div>
                                      <div className="flex justify-between text-slate-300">
                                        <span className="text-slate-400">Special Allowance:</span>
                                        <span className="font-semibold text-slate-100">₹{(gross * 0.4).toLocaleString('en-IN')}</span>
                                      </div>
                                    </>
                                  )}

                                  {Number(row.overtimePay) > 0 && (
                                    <div className="flex justify-between text-slate-300 pt-1 border-t border-emerald-500/20">
                                      <span className="text-emerald-400">Overtime Payout:</span>
                                      <span className="font-bold text-emerald-400">+₹{Number(row.overtimePay).toLocaleString('en-IN')}</span>
                                    </div>
                                  )}

                                  {Number(row.reimbursementAmount) > 0 && (
                                    <div className="flex justify-between text-slate-300">
                                      <span className="text-teal-400">Approved Reimbursements:</span>
                                      <span className="font-bold text-teal-400">+₹{Number(row.reimbursementAmount).toLocaleString('en-IN')}</span>
                                    </div>
                                  )}
                                </div>
                              </div>

                              {/* Deductions Breakdown */}
                              <div className="p-4 rounded-xl bg-rose-950/20 border border-rose-500/20 space-y-3">
                                <div className="flex items-center justify-between pb-2 border-b border-rose-500/20">
                                  <h4 className="text-xs font-bold uppercase text-rose-400 flex items-center gap-1.5">
                                    <TrendingDown className="w-3.5 h-3.5" />
                                    Deductions Breakdown
                                  </h4>
                                  <span className="font-bold text-xs text-rose-300">
                                    Total: -₹{totalDed.toLocaleString('en-IN')}
                                  </span>
                                </div>

                                <div className="space-y-1.5 text-xs">
                                  {deductions.length > 0 ? (
                                    deductions.map((d, di) => (
                                      <div key={di} className="flex justify-between text-slate-300">
                                        <span className="text-slate-400">{d.componentName}:</span>
                                        <span className="font-semibold text-rose-400">-₹{Number(d.amount).toLocaleString('en-IN')}</span>
                                      </div>
                                    ))
                                  ) : (
                                    <div className="text-slate-500 italic">No statutory or LOP deductions applied</div>
                                  )}

                                  {Number(row.loanEMI) > 0 && (
                                    <div className="flex justify-between text-slate-300 pt-1 border-t border-rose-500/20">
                                      <span className="text-amber-400">Loan EMI Deduction:</span>
                                      <span className="font-bold text-amber-400">-₹{Number(row.loanEMI).toLocaleString('en-IN')}</span>
                                    </div>
                                  )}
                                </div>
                              </div>
                            </div>
                          </td>
                        </tr>
                      )}
                    </React.Fragment>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
}
