import React, { useState } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import { useEmployee, useRoles, useUpdateEmployeeRole } from '../../hooks/useEmployee.js';
import { useAttendanceLogs } from '../../hooks/useAttendance.js';
import { useEmployeeLeaveBalances } from '../../hooks/useLeave.js';
import { useAuthStore } from '../../store/auth.store.js';
import { Card } from '../../components/ui/Card.jsx';
import { Button } from '../../components/ui/Button.jsx';
import { Spinner } from '../../components/ui/Spinner.jsx';
import { Tabs } from '../../components/ui/Tabs.jsx';

export function EmployeeDetailPage() {
  const { id } = useParams();
  const navigate = useNavigate();
  const { user } = useAuthStore();
  const { data, isLoading } = useEmployee(id);
  const { data: rolesData } = useRoles();
  const { data: attendanceData, isLoading: isAttendanceLoading } = useAttendanceLogs({ employeeId: id, limit: 30 });
  const { data: leaveData, isLoading: isLeaveLoading } = useEmployeeLeaveBalances(id);
  const updateRoleMutation = useUpdateEmployeeRole();

  const [showRoleModal, setShowRoleModal] = useState(false);
  const [selectedRoleId, setSelectedRoleId] = useState('');
  const [roleChangeSuccess, setRoleChangeSuccess] = useState('');
  const [roleChangeError, setRoleChangeError] = useState('');

  const employee = data?.data?.employee;

  const currentRole =
    employee?.user?.userRoles?.[0]?.role?.name ||
    employee?.user?.userRoles?.[0]?.role?.displayName ||
    'EMPLOYEE';
  const currentRoleId = employee?.user?.userRoles?.[0]?.role?.id;

  const userRoles = Array.isArray(user?.roles)
    ? user.roles
    : user?.role
    ? [user.role]
    : ['EMPLOYEE'];
  const canManageRoles =
    userRoles.includes('SUPER_ADMIN') ||
    userRoles.includes('COMPANY_ADMIN') ||
    userRoles.includes('HR_ADMIN');

  const rawRoles = Array.isArray(rolesData)
    ? rolesData
    : Array.isArray(rolesData?.data)
    ? rolesData.data
    : [];

  const allowedRoleNames =
    userRoles.includes('SUPER_ADMIN') || userRoles.includes('COMPANY_ADMIN')
      ? ['HR_ADMIN', 'HR_MANAGER', 'MANAGER', 'EMPLOYEE']
      : userRoles.includes('HR_ADMIN')
      ? ['HR_MANAGER', 'MANAGER', 'EMPLOYEE']
      : ['EMPLOYEE'];

  const allowedRoles = rawRoles.filter((r) => allowedRoleNames.includes(r.name));

  const handleOpenRoleModal = () => {
    setSelectedRoleId(currentRoleId || allowedRoles[0]?.id || '');
    setRoleChangeSuccess('');
    setRoleChangeError('');
    setShowRoleModal(true);
  };

  const handleSaveRole = async () => {
    setRoleChangeError('');
    setRoleChangeSuccess('');
    try {
      if (!selectedRoleId) {
        setRoleChangeError('Please select a valid role.');
        return;
      }
      await updateRoleMutation.mutateAsync({
        id,
        data: { roleId: selectedRoleId }
      });
      setRoleChangeSuccess('Employee role updated successfully!');
      setTimeout(() => {
        setShowRoleModal(false);
        setRoleChangeSuccess('');
      }, 1200);
    } catch (err) {
      setRoleChangeError(err.response?.data?.message || err.message || 'Failed to update role.');
    }
  };

  if (isLoading) {
    return (
      <div className="flex h-96 items-center justify-center">
        <Spinner size="lg" className="text-blue-500" />
      </div>
    );
  }

  if (!employee) {
    return (
      <div className="p-8 text-center text-slate-400">
        <p>Employee record not found.</p>
        <Link to="/employees">
          <Button variant="outline" className="mt-4">Back to Employees</Button>
        </Link>
      </div>
    );
  }

  const tabs = [
    { id: 'overview', label: 'Overview' },
    { id: 'attendance', label: 'Attendance' },
    { id: 'leave', label: 'Leave Balances' },
    { id: 'payroll', label: 'Payroll' }
  ];

  return (
    <div className="p-6 max-w-7xl mx-auto space-y-6">
      {/* Profile Header */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 bg-slate-900/60 border border-slate-800 p-6 rounded-2xl backdrop-blur-md">
        <div className="flex items-center gap-4">
          <div className="w-16 h-16 rounded-2xl bg-gradient-to-br from-indigo-600 to-purple-600 text-white font-bold flex items-center justify-center text-2xl shadow-xl shadow-indigo-500/20 overflow-hidden">
            {employee.facePhotoUrl ? (
              <img src={employee.facePhotoUrl} alt="" className="w-full h-full object-cover" />
            ) : (
              `${employee.firstName?.[0] || ''}${employee.lastName?.[0] || ''}`
            )}
          </div>
          <div>
            <div className="flex items-center gap-3">
              <h1 className="text-2xl font-bold text-white">
                {employee.firstName} {employee.lastName}
              </h1>
              <span className="px-2.5 py-0.5 rounded-full text-xs font-semibold bg-emerald-500/10 text-emerald-400 border border-emerald-500/30">
                {employee.status}
              </span>
              <span className="px-2.5 py-0.5 rounded-full text-xs font-semibold bg-indigo-500/10 text-indigo-400 border border-indigo-500/30">
                {currentRole}
              </span>
            </div>
            <p className="text-sm text-slate-400 mt-1 font-mono">
              {employee.employeeCode} • {employee.department?.name || 'General Dept'} • {employee.employmentType}
            </p>
          </div>
        </div>

        <div className="flex items-center gap-3 flex-wrap">
          {canManageRoles && (
            <Button
              variant="outline"
              onClick={handleOpenRoleModal}
              className="border-indigo-500/30 text-indigo-300 hover:bg-indigo-500/10"
            >
              <svg className="w-4 h-4 mr-1.5 text-indigo-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z" />
              </svg>
              Change Role
            </Button>
          )}
          <Button
            variant="outline"
            onClick={() => navigate(`/employees/${id}/face`)}
            className="border-slate-700"
          >
            <svg className="w-4 h-4 mr-2 text-indigo-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M14.828 14.828a4 4 0 01-5.656 0M9 10h.01M15 10h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
            Register Face Biometrics
          </Button>
          <Button variant="ghost" onClick={() => navigate('/employees')}>
            Back to Directory
          </Button>
        </div>
      </div>

      {/* Change Role Modal */}
      {showRoleModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/70 backdrop-blur-sm">
          <div className="w-full max-w-md bg-slate-900 border border-slate-800 rounded-2xl p-6 shadow-2xl space-y-4">
            <div className="flex items-center justify-between">
              <h3 className="text-lg font-bold text-white">Change Employee System Role</h3>
              <button
                onClick={() => setShowRoleModal(false)}
                className="text-slate-400 hover:text-slate-200 text-lg"
              >
                ✕
              </button>
            </div>

            <p className="text-xs text-slate-400">
              Update portal permissions and operational capabilities for{' '}
              <span className="font-semibold text-slate-200">
                {employee.firstName} {employee.lastName}
              </span>.
            </p>

            {roleChangeError && (
              <div className="p-3 rounded-lg bg-red-500/10 border border-red-500/30 text-red-400 text-xs">
                {roleChangeError}
              </div>
            )}

            {roleChangeSuccess && (
              <div className="p-3 rounded-lg bg-emerald-500/10 border border-emerald-500/30 text-emerald-400 text-xs">
                {roleChangeSuccess}
              </div>
            )}

            <div className="space-y-1.5">
              <label className="block text-xs font-semibold text-slate-300">Assign New Role</label>
              <select
                value={selectedRoleId}
                onChange={(e) => setSelectedRoleId(e.target.value)}
                className="w-full h-11 px-3 rounded-lg bg-slate-950 border border-slate-800 text-sm text-slate-200 focus:outline-none focus:border-indigo-500"
              >
                {allowedRoles.map((r) => (
                  <option key={r.id} value={r.id}>
                    {r.displayName || r.name} ({r.name})
                  </option>
                ))}
              </select>
            </div>

            <div className="flex justify-end gap-3 pt-3 border-t border-slate-800">
              <Button
                variant="ghost"
                onClick={() => setShowRoleModal(false)}
                disabled={updateRoleMutation.isPending}
              >
                Cancel
              </Button>
              <Button
                variant="primary"
                onClick={handleSaveRole}
                disabled={updateRoleMutation.isPending}
              >
                {updateRoleMutation.isPending ? 'Updating...' : 'Save Role Change'}
              </Button>
            </div>
          </div>
        </div>
      )}

      {/* Tabs */}
      <Tabs tabs={tabs}>
        {(currentTab) => (
          <div className="bg-slate-900/40 border border-slate-800 rounded-2xl p-6">
            {currentTab === 'overview' && (
              <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-6 text-sm">
                <div>
                  <span className="text-slate-400 text-xs uppercase font-semibold">Official Email</span>
                  <p className="font-mono font-medium text-slate-200 mt-1">{employee.email}</p>
                </div>
                <div>
                  <span className="text-slate-400 text-xs uppercase font-semibold">Phone</span>
                  <p className="font-medium text-slate-200 mt-1">{employee.phone || 'Not provided'}</p>
                </div>
                <div>
                  <span className="text-slate-400 text-xs uppercase font-semibold">Joining Date</span>
                  <p className="font-medium text-slate-200 mt-1">{new Date(employee.joiningDate).toLocaleDateString()}</p>
                </div>
                <div>
                  <span className="text-slate-400 text-xs uppercase font-semibold">Branch Office</span>
                  <p className="font-medium text-slate-200 mt-1">{employee.branch?.name || 'Main Campus'}</p>
                </div>
                <div>
                  <span className="text-slate-400 text-xs uppercase font-semibold">Face Biometric Status</span>
                  <p className="font-medium text-slate-200 mt-1">
                    {employee.faceRegisteredAt ? (
                      <span className="text-emerald-400">Registered on {new Date(employee.faceRegisteredAt).toLocaleDateString()}</span>
                    ) : (
                      <span className="text-amber-400">Not yet enrolled</span>
                    )}
                  </p>
                </div>
                <div>
                  <span className="text-slate-400 text-xs uppercase font-semibold">Employee Code</span>
                  <p className="font-mono text-xs text-indigo-400 font-bold mt-1">{employee.employeeCode || 'MIND-EMP-0001'}</p>
                </div>
              </div>
            )}

            {currentTab === 'attendance' && (
              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <h3 className="text-sm font-semibold text-slate-200">Attendance History</h3>
                  <span className="text-xs text-slate-400">Recent records</span>
                </div>

                {isAttendanceLoading ? (
                  <div className="flex justify-center py-12">
                    <Spinner size="md" className="text-blue-500" />
                  </div>
                ) : (() => {
                  const logs = Array.isArray(attendanceData?.data?.logs)
                    ? attendanceData.data.logs
                    : Array.isArray(attendanceData?.logs)
                    ? attendanceData.logs
                    : [];

                  if (logs.length === 0) {
                    return (
                      <div className="text-center py-12 text-slate-400 border border-dashed border-slate-800 rounded-xl">
                        <svg className="w-10 h-10 mx-auto text-slate-600 mb-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="1.5" d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                        </svg>
                        <p className="font-semibold text-slate-300">No attendance records found for this employee.</p>
                        <p className="text-xs text-slate-500 mt-1">Punch logs and biometric records will appear here once registered.</p>
                      </div>
                    );
                  }

                  return (
                    <div className="overflow-x-auto rounded-xl border border-slate-800">
                      <table className="w-full text-left text-xs text-slate-300">
                        <thead className="bg-slate-950/80 text-slate-400 font-semibold uppercase border-b border-slate-800">
                          <tr>
                            <th className="p-3">Date</th>
                            <th className="p-3">Check-In</th>
                            <th className="p-3">Check-Out</th>
                            <th className="p-3">Hours</th>
                            <th className="p-3">Status</th>
                          </tr>
                        </thead>
                        <tbody className="divide-y divide-slate-800/60 bg-slate-900/30">
                          {logs.map((log) => {
                            const dateStr = log.attendanceDate ? new Date(log.attendanceDate).toLocaleDateString(undefined, { weekday: 'short', year: 'numeric', month: 'short', day: 'numeric' }) : '—';
                            const inStr = log.checkInAt ? new Date(log.checkInAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) : '—';
                            const outStr = log.checkOutAt ? new Date(log.checkOutAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) : '—';
                            const hoursStr = log.totalWorkHours !== undefined && log.totalWorkHours !== null
                              ? `${log.totalWorkHours} hrs`
                              : log.totalWorkMinutes !== undefined && log.totalWorkMinutes !== null
                              ? `${(log.totalWorkMinutes / 60).toFixed(1)} hrs`
                              : '—';
                            const status = log.status || (log.checkInAt ? 'PRESENT' : 'ABSENT');

                            return (
                              <tr key={log.id || log.attendanceDate} className="hover:bg-slate-800/40 transition-colors">
                                <td className="p-3 font-medium text-slate-200">{dateStr}</td>
                                <td className="p-3 font-mono text-emerald-400">{inStr}</td>
                                <td className="p-3 font-mono text-blue-400">{outStr}</td>
                                <td className="p-3 font-mono text-slate-300">{hoursStr}</td>
                                <td className="p-3">
                                  <span className={`inline-flex items-center px-2 py-0.5 rounded-full text-[11px] font-semibold border ${
                                    status === 'PRESENT' ? 'bg-emerald-500/10 text-emerald-400 border-emerald-500/30' :
                                    status === 'LATE' ? 'bg-amber-500/10 text-amber-400 border-amber-500/30' :
                                    status === 'HALF_DAY' ? 'bg-purple-500/10 text-purple-400 border-purple-500/30' :
                                    'bg-slate-500/10 text-slate-400 border-slate-500/30'
                                  }`}>
                                    {status}
                                  </span>
                                </td>
                              </tr>
                            );
                          })}
                        </tbody>
                      </table>
                    </div>
                  );
                })()}
              </div>
            )}

            {currentTab === 'leave' && (
              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <h3 className="text-sm font-semibold text-slate-200">Current Year Leave Balances</h3>
                  <span className="text-xs text-slate-400">Year {new Date().getFullYear()}</span>
                </div>

                {isLeaveLoading ? (
                  <div className="flex justify-center py-12">
                    <Spinner size="md" className="text-blue-500" />
                  </div>
                ) : (() => {
                  const balances = Array.isArray(leaveData?.data?.balances)
                    ? leaveData.data.balances
                    : Array.isArray(leaveData?.balances)
                    ? leaveData.balances
                    : Array.isArray(leaveData)
                    ? leaveData
                    : [];

                  if (balances.length === 0) {
                    return (
                      <div className="text-center py-12 text-slate-400 border border-dashed border-slate-800 rounded-xl">
                        <p className="font-semibold text-slate-300">No leave policy assigned.</p>
                        <p className="text-xs text-slate-500 mt-1">Leave balances will automatically generate once a policy is assigned.</p>
                      </div>
                    );
                  }

                  return (
                    <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                      {balances.map((bal) => (
                        <Card key={bal.id || bal.leaveTypeId} className="p-4 bg-slate-950/60 border-slate-800">
                          <span className="text-xs text-slate-400">{bal.leaveType?.name || bal.name || 'Leave'}</span>
                          <div className="text-2xl font-bold text-white mt-1">
                            {bal.remainingDays !== undefined && bal.remainingDays !== null ? `${bal.remainingDays} Days` : '—'}
                          </div>
                          <div className="text-xs text-slate-500 mt-1">
                            Used: {bal.usedDays ?? 0} / Total: {bal.totalDays ?? '—'} days
                          </div>
                        </Card>
                      ))}
                    </div>
                  );
                })()}
              </div>
            )}

            {currentTab === 'payroll' && (
              <div className="text-center py-12 text-slate-400">
                <p className="font-semibold text-slate-300">Salary & Compensation</p>
                <p className="text-xs text-slate-500 mt-1">Automated payroll slips generated at end of pay cycle.</p>
              </div>
            )}
          </div>
        )}
      </Tabs>
    </div>
  );
}

export default EmployeeDetailPage;
