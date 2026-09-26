import React from 'react';
import {
  ResponsiveContainer,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
} from 'recharts';

export const AttendanceBarChart = ({ data = [] }) => {
  if (!data || data.length === 0) {
    return (
      <div className="flex h-72 w-full items-center justify-center rounded-2xl border border-dashed border-slate-800 bg-slate-900/50 text-xs text-slate-400">
        No departmental attendance data logged
      </div>
    );
  }

  return (
    <div className="h-72 w-full">
      <ResponsiveContainer width="100%" height="100%">
        <BarChart data={data} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
          <CartesianGrid strokeDasharray="3 3" stroke="#334155" opacity={0.5} />
          <XAxis dataKey="department" stroke="#94a3b8" fontSize={11} tickLine={false} />
          <YAxis stroke="#94a3b8" fontSize={11} tickLine={false} unit="%" />
          <Tooltip
            contentStyle={{
              backgroundColor: '#0f172a',
              borderColor: '#334155',
              borderRadius: '0.75rem',
              color: '#f8fafc',
              fontSize: '12px',
            }}
            formatter={(value) => [`${value}%`, 'Attendance Rate']}
          />
          <Bar
            dataKey="presentPct"
            fill="#6366f1"
            radius={[6, 6, 0, 0]}
            name="Attendance %"
          />
        </BarChart>
      </ResponsiveContainer>
    </div>
  );
};

export default AttendanceBarChart;
