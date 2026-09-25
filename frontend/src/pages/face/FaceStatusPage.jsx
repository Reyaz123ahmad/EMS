import React, { useState } from 'react';
import { useEmployeesWithFace, useEmployeesWithoutFace, useDeleteFace, useFaceStats } from '../../hooks/useFaceRegistration';
import { UserCheck, ShieldAlert, Trash2, Search, PlusCircle, Sparkles, CheckCircle2 } from 'lucide-react';
import { Link } from 'react-router-dom';

export default function FaceStatusPage() {
  const [tab, setTab] = useState('enrolled'); // 'enrolled' or 'pending'
  const [search, setSearch] = useState('');

  const { data: statsData } = useFaceStats();
  const { data: enrolledData, isLoading: loadingEnrolled } = useEmployeesWithFace({ search, limit: 50 });
  const { data: pendingData, isLoading: loadingPending } = useEmployeesWithoutFace({ search, limit: 50 });
  const deleteFaceMutation = useDeleteFace();

  const stats = statsData?.data || { totalEmployees: 0, registeredCount: 0, pendingCount: 0, percentage: 0 };
  const enrolledList = enrolledData?.data?.employees || [];
  const pendingList = pendingData?.data?.employees || [];

  const handleDelete = async (employeeId, name) => {
    if (window.confirm(`Are you sure you want to reset face biometric data for ${name}?`)) {
      await deleteFaceMutation.mutateAsync({ employeeId, reason: 'Manual reset from admin console' });
    }
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-black text-white flex items-center gap-2.5">
            <UserCheck className="w-7 h-7 text-indigo-400" />
            Face Biometric Registry
          </h1>
          <p className="text-sm text-slate-400 mt-1">
            Overview of tenant facial enrollment coverage and biometric profile management.
          </p>
        </div>

        <div className="flex items-center gap-3">
          <Link
            to="/face/bulk-register"
            className="flex items-center gap-2 px-4 py-2.5 rounded-xl text-xs font-bold bg-slate-800 hover:bg-slate-700 text-slate-200 border border-slate-700 transition"
          >
            <Sparkles className="w-4 h-4 text-indigo-400" />
            Bulk Enrollment
          </Link>
          <Link
            to="/face/register"
            className="flex items-center gap-2 px-5 py-2.5 rounded-xl text-xs font-bold bg-indigo-600 hover:bg-indigo-500 text-white shadow-lg shadow-indigo-600/30 transition"
          >
            <PlusCircle className="w-4 h-4" />
            Enroll Single Face
          </Link>
        </div>
      </div>

      {/* KPI Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <div className="bg-slate-900/60 border border-slate-800 p-5 rounded-2xl">
          <span className="text-xs text-slate-400 uppercase font-bold tracking-wider">Total Active Staff</span>
          <div className="text-2xl font-black text-white mt-1">{stats.totalEmployees}</div>
        </div>
        <div className="bg-slate-900/60 border border-slate-800 p-5 rounded-2xl">
          <span className="text-xs text-emerald-400 uppercase font-bold tracking-wider">Face Enrolled</span>
          <div className="text-2xl font-black text-emerald-400 mt-1">{stats.registeredCount}</div>
        </div>
        <div className="bg-slate-900/60 border border-slate-800 p-5 rounded-2xl">
          <span className="text-xs text-amber-400 uppercase font-bold tracking-wider">Pending Setup</span>
          <div className="text-2xl font-black text-amber-400 mt-1">{stats.pendingCount}</div>
        </div>
        <div className="bg-slate-900/60 border border-slate-800 p-5 rounded-2xl">
          <span className="text-xs text-indigo-400 uppercase font-bold tracking-wider">Enrollment Rate</span>
          <div className="text-2xl font-black text-indigo-400 mt-1">{stats.percentage}%</div>
        </div>
      </div>

      {/* Search & Tabs */}
      <div className="flex flex-col md:flex-row items-center justify-between gap-4 bg-slate-900/60 border border-slate-800 p-4 rounded-2xl">
        <div className="flex items-center gap-2">
          <button
            type="button"
            onClick={() => setTab('enrolled')}
            className={`px-4 py-2 rounded-xl text-xs font-bold transition ${
              tab === 'enrolled'
                ? 'bg-indigo-600 text-white shadow-md shadow-indigo-600/30'
                : 'text-slate-400 hover:text-white'
            }`}
          >
            Enrolled ({enrolledList.length})
          </button>
          <button
            type="button"
            onClick={() => setTab('pending')}
            className={`px-4 py-2 rounded-xl text-xs font-bold transition ${
              tab === 'pending'
                ? 'bg-amber-600 text-white shadow-md shadow-amber-600/30'
                : 'text-slate-400 hover:text-white'
            }`}
          >
            Pending ({pendingList.length})
          </button>
        </div>

        <div className="relative w-full md:w-64">
          <Search className="absolute left-3.5 top-3 w-4 h-4 text-slate-500" />
          <input
            type="text"
            placeholder="Search employee..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full bg-slate-800 border border-slate-700 rounded-xl pl-10 pr-4 py-2 text-xs text-white focus:outline-none focus:border-indigo-500"
          />
        </div>
      </div>

      {/* Table List */}
      <div className="bg-slate-900/60 border border-slate-800 rounded-2xl overflow-hidden backdrop-blur-xl">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead className="bg-slate-800/60 text-slate-400 uppercase tracking-wider font-semibold">
              <tr>
                <th className="px-6 py-4">Employee</th>
                <th className="px-6 py-4">Department / Branch</th>
                <th className="px-6 py-4">Status</th>
                <th className="px-6 py-4">Enrolled At</th>
                <th className="px-6 py-4 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-800/60">
              {tab === 'enrolled' ? (
                loadingEnrolled ? (
                  <tr>
                    <td colSpan="5" className="p-8 text-center text-slate-400">Loading enrolled employees...</td>
                  </tr>
                ) : enrolledList.length === 0 ? (
                  <tr>
                    <td colSpan="5" className="p-8 text-center text-slate-500">No enrolled employees match your search.</td>
                  </tr>
                ) : (
                  enrolledList.map((emp) => (
                    <tr key={emp.id} className="hover:bg-slate-800/30 transition">
                      <td className="px-6 py-4">
                        <div className="flex items-center gap-3">
                          {emp.facePhotoUrl || emp.photoUrl ? (
                            <img src={emp.facePhotoUrl || emp.photoUrl} alt="Face" className="w-9 h-9 rounded-full object-cover border border-slate-700" />
                          ) : (
                            <div className="w-9 h-9 rounded-full bg-slate-800 flex items-center justify-center font-bold text-slate-400">
                              {emp.firstName[0]}
                            </div>
                          )}
                          <div>
                            <div className="font-bold text-white">{emp.firstName} {emp.lastName}</div>
                            <div className="font-mono text-[10px] text-slate-400">{emp.employeeCode}</div>
                          </div>
                        </div>
                      </td>
                      <td className="px-6 py-4 text-slate-300">
                        <div>{emp.department?.name || 'General'}</div>
                        <div className="text-[10px] text-slate-500">{emp.branch?.name || 'Main HQ'}</div>
                      </td>
                      <td className="px-6 py-4">
                        <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[10px] font-bold bg-emerald-500/10 text-emerald-400 border border-emerald-500/20">
                          <CheckCircle2 className="w-3 h-3" />
                          Enrolled
                        </span>
                      </td>
                      <td className="px-6 py-4 text-slate-400">
                        {emp.faceRegisteredAt ? new Date(emp.faceRegisteredAt).toLocaleDateString() : 'N/A'}
                      </td>
                      <td className="px-6 py-4 text-right">
                        <button
                          type="button"
                          onClick={() => handleDelete(emp.id, `${emp.firstName} ${emp.lastName}`)}
                          className="p-2 rounded-lg text-rose-400 hover:bg-rose-500/10 transition"
                          title="Reset Face Biometric"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </td>
                    </tr>
                  ))
                )
              ) : (
                loadingPending ? (
                  <tr>
                    <td colSpan="5" className="p-8 text-center text-slate-400">Loading pending employees...</td>
                  </tr>
                ) : pendingList.length === 0 ? (
                  <tr>
                    <td colSpan="5" className="p-8 text-center text-slate-500">No pending employees found.</td>
                  </tr>
                ) : (
                  pendingList.map((emp) => (
                    <tr key={emp.id} className="hover:bg-slate-800/30 transition">
                      <td className="px-6 py-4 font-bold text-white">
                        {emp.firstName} {emp.lastName} ({emp.employeeCode})
                      </td>
                      <td className="px-6 py-4 text-slate-300">
                        {emp.department?.name || 'General'} • {emp.branch?.name || 'Main HQ'}
                      </td>
                      <td className="px-6 py-4">
                        <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-[10px] font-bold bg-amber-500/10 text-amber-400 border border-amber-500/20">
                          Pending Setup
                        </span>
                      </td>
                      <td className="px-6 py-4 text-slate-500">Not registered</td>
                      <td className="px-6 py-4 text-right">
                        <Link
                          to="/face/register"
                          className="px-3 py-1.5 rounded-lg text-xs font-bold bg-indigo-600 hover:bg-indigo-500 text-white transition inline-block"
                        >
                          Enroll Face
                        </Link>
                      </td>
                    </tr>
                  ))
                )
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
