import React from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import { useEmployee } from '../../hooks/useEmployee.js';
import { Card } from '../../components/ui/Card.jsx';
import { Button } from '../../components/ui/Button.jsx';
import { Spinner } from '../../components/ui/Spinner.jsx';
import { Tabs } from '../../components/ui/Tabs.jsx';

export function EmployeeDetailPage() {
  const { id } = useParams();
  const navigate = useNavigate();
  const { data, isLoading } = useEmployee(id);

  const employee = data?.data?.employee;

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
            </div>
            <p className="text-sm text-slate-400 mt-1 font-mono">
              {employee.employeeCode} • {employee.department?.name || 'General Dept'} • {employee.employmentType}
            </p>
          </div>
        </div>

        <div className="flex items-center gap-3">
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
              <div className="text-center py-12 text-slate-400">
                <svg className="w-12 h-12 mx-auto text-slate-600 mb-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="1.5" d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
                <p className="font-semibold text-slate-300">Attendance Tracker</p>
                <p className="text-xs text-slate-500 mt-1">Live punch records and Geo-fence attestation logs will show here.</p>
              </div>
            )}

            {currentTab === 'leave' && (
              <div className="space-y-4">
                <h3 className="text-sm font-semibold text-slate-200">Current Year Leave Balances</h3>
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                  {(employee.leaveBalances || []).length > 0 ? (
                    employee.leaveBalances.map((bal) => (
                      <Card key={bal.id} className="p-4 bg-slate-950/60 border-slate-800">
                        <span className="text-xs text-slate-400">{bal.leaveType?.name || 'Annual Leave'}</span>
                        <div className="text-2xl font-bold text-white mt-1">{bal.remainingDays} Days</div>
                        <div className="text-xs text-slate-500 mt-1">Total quota: {bal.totalDays} days</div>
                      </Card>
                    ))
                  ) : (
                    <>
                      <Card className="p-4 bg-slate-950/60 border-slate-800">
                        <span className="text-xs text-slate-400">Casual Leave (CL)</span>
                        <div className="text-2xl font-bold text-emerald-400 mt-1">12 Days</div>
                        <div className="text-xs text-slate-500 mt-1">Available for use</div>
                      </Card>
                      <Card className="p-4 bg-slate-950/60 border-slate-800">
                        <span className="text-xs text-slate-400">Sick Leave (SL)</span>
                        <div className="text-2xl font-bold text-blue-400 mt-1">8 Days</div>
                        <div className="text-xs text-slate-500 mt-1">Available for use</div>
                      </Card>
                      <Card className="p-4 bg-slate-950/60 border-slate-800">
                        <span className="text-xs text-slate-400">Paid Privilege Leave</span>
                        <div className="text-2xl font-bold text-purple-400 mt-1">15 Days</div>
                        <div className="text-xs text-slate-500 mt-1">Available for use</div>
                      </Card>
                    </>
                  )}
                </div>
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
