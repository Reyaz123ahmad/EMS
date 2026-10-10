import React from 'react';
import { Check, Zap } from 'lucide-react';

export function PlanCard({ plan, isCurrent, isPopular, onSelect, actionText = 'Choose Plan', isSelected }) {
  let featureList = [];
  if (Array.isArray(plan.features)) {
    featureList = [
      ...plan.features,
      plan.maxEmployees === -1 ? 'Unlimited Employees' : `Up to ${plan.maxEmployees || 50} Employees`,
      plan.maxBranches === -1 ? 'Unlimited Branches' : `Up to ${plan.maxBranches || 1} Branches`,
    ];
  } else {
    const features = typeof plan.features === 'object' && plan.features !== null
      ? plan.features
      : {};

    featureList = [
      features.attendance?.face && 'Face Recognition Attendance',
      features.attendance?.card && 'Biometric Card & QR Scanning',
      features.attendance?.finger && 'Fingerprint Biometric Device Sync',
      features.attendance?.geoFencing && 'GPS Geo-fencing & Spoof Detection',
      features.payroll && 'Automated Payroll & Payslip Generation',
      features.leave && 'Leave Management & Approvals',
      features.overtime && 'Overtime Tracking & Multipliers',
      features.assets && 'Asset Management & Assignment',
      features.audit_logs && 'Advanced Security & Audit Logs',
      plan.maxEmployees === -1 ? 'Unlimited Employees' : `Up to ${plan.maxEmployees || 50} Employees`,
      plan.maxBranches === -1 ? 'Unlimited Branches' : `Up to ${plan.maxBranches || 1} Branches`,
    ].filter(Boolean);
  }

  return (
    <div
      className={`relative flex flex-col rounded-2xl p-6 transition-all duration-200 border ${
        isSelected
          ? 'border-indigo-600 bg-indigo-50/20 dark:bg-indigo-950/20 shadow-lg ring-2 ring-indigo-600'
          : isCurrent
          ? 'border-emerald-500 bg-emerald-50/10 dark:bg-emerald-950/10 shadow-md'
          : 'border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 shadow-sm hover:shadow-md'
      }`}
    >
      {isPopular && (
        <div className="absolute -top-3 left-1/2 -translate-x-1/2 rounded-full bg-gradient-to-r from-indigo-600 to-purple-600 px-3 py-0.5 text-xs font-semibold text-white shadow-sm">
          Most Popular
        </div>
      )}

      {isCurrent && (
        <div className="absolute -top-3 right-4 rounded-full bg-emerald-600 px-3 py-0.5 text-xs font-semibold text-white shadow-sm">
          Current Plan
        </div>
      )}

      <div className="mb-4">
        <h3 className="text-xl font-bold text-slate-900 dark:text-white">{plan.name}</h3>
        <p className="mt-1 text-sm text-slate-500 dark:text-slate-400">{plan.description}</p>
      </div>

      <div className="mb-6 flex items-baseline gap-1">
        <span className="text-4xl font-extrabold text-slate-900 dark:text-white">
          ₹{Number(plan.price).toLocaleString()}
        </span>
        <span className="text-sm font-medium text-slate-500 dark:text-slate-400">
          /{plan.billingCycle || 'month'}
        </span>
      </div>

      <div className="mb-6 flex-1 space-y-3">
        <div className="text-xs font-semibold uppercase tracking-wider text-slate-400">
          What's included:
        </div>
        <ul className="space-y-2.5">
          {featureList.map((item, idx) => (
            <li key={idx} className="flex items-start gap-2.5 text-sm text-slate-700 dark:text-slate-300">
              <Check className="h-4 w-4 shrink-0 text-emerald-500 mt-0.5" />
              <span>{item}</span>
            </li>
          ))}
        </ul>
      </div>

      <button
        onClick={() => onSelect && onSelect(plan)}
        disabled={isCurrent && actionText === 'Current Plan'}
        className={`w-full rounded-xl py-2.5 px-4 text-sm font-semibold transition-all flex items-center justify-center gap-2 ${
          isCurrent
            ? 'bg-slate-100 text-slate-700 dark:bg-slate-800 dark:text-slate-300 cursor-default'
            : isPopular || isSelected
            ? 'bg-indigo-600 text-white hover:bg-indigo-700 shadow-md hover:shadow-indigo-500/25'
            : 'bg-slate-900 text-white dark:bg-white dark:text-slate-900 hover:bg-slate-800 dark:hover:bg-slate-100'
        }`}
      >
        {!isCurrent && <Zap className="h-4 w-4" />}
        {isCurrent ? 'Active Plan' : actionText}
      </button>
    </div>
  );
}

export default PlanCard;
