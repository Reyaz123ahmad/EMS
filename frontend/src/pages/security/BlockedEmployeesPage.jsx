import React from 'react';
import { useBlockedEmployees, useUnblockEmployee } from '../../hooks/useAdvancedSecurity.js';
import { UserX, ShieldCheck, Unlock } from 'lucide-react';
import { toast } from 'sonner';

export function BlockedEmployeesPage() {
  const { data: employees = [], isLoading } = useBlockedEmployees();
  const { mutateAsync: unblockEmp, isPending: isUnblocking } = useUnblockEmployee();

  const handleUnblock = async (empId) => {
    try {
      await unblockEmp({ employeeId: empId });
      toast.success('Employee account unblocked successfully');
    } catch (err) {
      toast.error(err.message || 'Failed to unblock employee');
    }
  };

  return (
    <div className="max-w-5xl mx-auto space-y-8 py-6 px-4 sm:px-6">
      <div>
        <h1 className="text-2xl sm:text-3xl font-bold text-slate-900 dark:text-white">
          Blocked & Suspended Employees
        </h1>
        <p className="text-sm text-slate-500 dark:text-slate-400 mt-1">
          Employees flagged for severe biometric spoofing or security policy violations.
        </p>
      </div>

      {isLoading ? (
        <div className="space-y-3 animate-pulse">
          {[1, 2, 3].map((i) => (
            <div key={i} className="h-20 rounded-xl bg-slate-100 dark:bg-slate-800" />
          ))}
        </div>
      ) : employees.length === 0 ? (
        <div className="p-12 text-center rounded-2xl border border-dashed border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 space-y-3">
          <ShieldCheck className="mx-auto h-8 w-8 text-emerald-500" />
          <h3 className="font-bold text-slate-900 dark:text-white">No Blocked Employees</h3>
          <p className="text-xs text-slate-400 max-w-sm mx-auto">
            All active staff members currently have full biometric punch and portal access.
          </p>
        </div>
      ) : (
        <div className="space-y-3">
          {employees.map((emp) => (
            <div
              key={emp.id}
              className="flex items-center justify-between p-4 rounded-2xl border border-rose-100 dark:border-rose-950/30 bg-white dark:bg-slate-900 shadow-sm"
            >
              <div className="flex items-center gap-3.5">
                <div className="p-2.5 rounded-xl bg-rose-50 dark:bg-rose-950/40 text-rose-600">
                  <UserX className="h-5 w-5" />
                </div>
                <div>
                  <h4 className="font-bold text-sm text-slate-900 dark:text-white">
                    {emp.firstName} {emp.lastName}
                  </h4>
                  <p className="text-xs text-slate-400">
                    {emp.employeeCode} • {emp.workEmail || emp.email || 'Employee'}
                  </p>
                </div>
              </div>

              <button
                disabled={isUnblocking}
                onClick={() => handleUnblock(emp.id)}
                className="inline-flex items-center gap-1.5 px-3.5 py-1.5 rounded-xl bg-emerald-50 dark:bg-emerald-950/40 text-emerald-600 dark:text-emerald-400 hover:bg-emerald-100 text-xs font-bold transition-colors"
              >
                <Unlock className="h-3.5 w-3.5" /> Unblock
              </button>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

export default BlockedEmployeesPage;
