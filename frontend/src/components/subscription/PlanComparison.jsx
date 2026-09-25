import React from 'react';
import { Check, X } from 'lucide-react';

export function PlanComparison({ plans = [] }) {
  const featureRows = [
    { label: 'Face Recognition Attendance', key: 'attendance.face' },
    { label: 'Card / QR Attendance Scan', key: 'attendance.card' },
    { label: 'Fingerprint Biometrics & Sync', key: 'attendance.finger' },
    { label: 'Geo-fencing & Spoof Detection', key: 'attendance.geoFencing' },
    { label: 'Leave Management & Balances', key: 'leave' },
    { label: 'Payroll & Salary Slips', key: 'payroll' },
    { label: 'Overtime Engine & Requests', key: 'overtime' },
    { label: 'Shift Rosters & Break Rules', key: 'shifts' },
    { label: 'Asset Management Register', key: 'assets' },
    { label: 'Audit Logs & Fraud Detection', key: 'audit_logs' },
    { label: 'Max Employees', key: 'maxEmployees', format: (val) => (val === -1 ? 'Unlimited' : val) },
    { label: 'Max Branches', key: 'maxBranches', format: (val) => (val === -1 ? 'Unlimited' : val) },
    { label: 'Max Devices', key: 'maxDevices', format: (val) => (val === -1 ? 'Unlimited' : val) },
  ];

  const getFeatureValue = (plan, key) => {
    if (key.startsWith('attendance.')) {
      const subKey = key.split('.')[1];
      return plan.features?.attendance?.[subKey];
    }
    if (key in plan) return plan[key];
    return plan.features?.[key];
  };

  return (
    <div className="overflow-x-auto rounded-2xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 shadow-sm">
      <table className="w-full text-left text-sm">
        <thead>
          <tr className="border-b border-slate-200 dark:border-slate-800 bg-slate-50/75 dark:bg-slate-800/50">
            <th className="py-4 px-6 font-semibold text-slate-900 dark:text-white">Features & Limits</th>
            {plans.map((p) => (
              <th key={p.id} className="py-4 px-6 font-semibold text-slate-900 dark:text-white text-center">
                <div>{p.name}</div>
                <div className="text-xs font-normal text-slate-500 dark:text-slate-400 mt-0.5">
                  ₹{Number(p.price).toLocaleString()} / {p.billingCycle}
                </div>
              </th>
            ))}
          </tr>
        </thead>
        <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
          {featureRows.map((row, idx) => (
            <tr key={idx} className="hover:bg-slate-50/50 dark:hover:bg-slate-800/30">
              <td className="py-3.5 px-6 font-medium text-slate-700 dark:text-slate-300">
                {row.label}
              </td>
              {plans.map((p) => {
                const val = getFeatureValue(p, row.key);
                return (
                  <td key={p.id} className="py-3.5 px-6 text-center">
                    {row.format ? (
                      <span className="font-semibold text-slate-900 dark:text-white">
                        {row.format(val)}
                      </span>
                    ) : val ? (
                      <Check className="inline-block h-5 w-5 text-emerald-500" />
                    ) : (
                      <X className="inline-block h-5 w-5 text-slate-300 dark:text-slate-600" />
                    )}
                  </td>
                );
              })}
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

export default PlanComparison;
