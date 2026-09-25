import React from 'react';
import { useFingerPunches } from '../../hooks/useFingerAttendance';
import { Fingerprint, CheckCircle2, XCircle, Clock } from 'lucide-react';

export default function FingerPunchesPage() {
  const { data: punchesData, isLoading } = useFingerPunches({ limit: 50 });
  const punches = punchesData?.data?.punches || [];

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-black text-white flex items-center gap-2.5">
          <Fingerprint className="w-7 h-7 text-indigo-400" />
          Hardware Biometric Punches
        </h1>
        <p className="text-sm text-slate-400 mt-1">
          Audit trail of raw device push punches ingested from physical biometric terminals.
        </p>
      </div>

      <div className="bg-slate-900/60 border border-slate-800 rounded-2xl overflow-hidden backdrop-blur-xl">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead className="bg-slate-800/60 text-slate-400 uppercase tracking-wider font-semibold">
              <tr>
                <th className="px-6 py-4">Employee</th>
                <th className="px-6 py-4">Device</th>
                <th className="px-6 py-4">Punch Type</th>
                <th className="px-6 py-4">Time</th>
                <th className="px-6 py-4">Status</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-800/60">
              {isLoading ? (
                <tr>
                  <td colSpan="5" className="p-8 text-center text-slate-400">Loading device punches...</td>
                </tr>
              ) : punches.length === 0 ? (
                <tr>
                  <td colSpan="5" className="p-8 text-center text-slate-500">No hardware punches recorded yet.</td>
                </tr>
              ) : (
                punches.map((p) => (
                  <tr key={p.id} className="hover:bg-slate-800/30 transition">
                    <td className="px-6 py-4 font-bold text-white">
                      {p.employee ? `${p.employee.firstName} ${p.employee.lastName}` : (p.cardNumber || 'Direct Punch')}
                    </td>
                    <td className="px-6 py-4 text-slate-300">
                      {p.device?.name || 'Biometric Terminal'}
                    </td>
                    <td className="px-6 py-4 font-mono text-[10px] text-indigo-300">
                      {p.punchType}
                    </td>
                    <td className="px-6 py-4 text-slate-400 flex items-center gap-1.5">
                      <Clock className="w-3.5 h-3.5 text-slate-500" />
                      {new Date(p.punchedAt).toLocaleTimeString()}
                    </td>
                    <td className="px-6 py-4">
                      <span
                        className={`inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-[10px] font-bold ${
                          p.processed
                            ? 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/20'
                            : 'bg-rose-500/10 text-rose-400 border border-rose-500/20'
                        }`}
                      >
                        {p.processed ? <CheckCircle2 className="w-3 h-3" /> : <XCircle className="w-3 h-3" />}
                        {p.processed ? 'Processed' : 'Error / Flagged'}
                      </span>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
