import React from 'react';
import {
  ResponsiveContainer,
  AreaChart,
  Area,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
} from 'recharts';

export const AttendanceTrendChart = ({ data = [], period = 'daily' }) => {
  // Sample fallback trend if empty
  const chartData = data && data.length > 0 ? data : [
    { date: 'Mon', present: 45, late: 4, absent: 3 },
    { date: 'Tue', present: 48, late: 2, absent: 2 },
    { date: 'Wed', present: 47, late: 3, absent: 2 },
    { date: 'Thu', present: 49, late: 1, absent: 2 },
    { date: 'Fri', present: 46, late: 5, absent: 1 },
    { date: 'Sat', present: 42, late: 2, absent: 8 },
    { date: 'Sun', present: 20, late: 0, absent: 32 },
  ];

  return (
    <div className="h-72 w-full">
      <ResponsiveContainer width="100%" height="100%">
        <AreaChart data={chartData} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
          <defs>
            <linearGradient id="presentGrad" x1="0" y1="0" x2="0" y2="1">
              <stop offset="5%" stopColor="#10b981" stopOpacity={0.4} />
              <stop offset="95%" stopColor="#10b981" stopOpacity={0.0} />
            </linearGradient>
            <linearGradient id="lateGrad" x1="0" y1="0" x2="0" y2="1">
              <stop offset="5%" stopColor="#f59e0b" stopOpacity={0.4} />
              <stop offset="95%" stopColor="#f59e0b" stopOpacity={0.0} />
            </linearGradient>
          </defs>
          <CartesianGrid strokeDasharray="3 3" stroke="#334155" opacity={0.5} />
          <XAxis dataKey="date" stroke="#94a3b8" fontSize={11} tickLine={false} />
          <YAxis stroke="#94a3b8" fontSize={11} tickLine={false} />
          <Tooltip
            contentStyle={{
              backgroundColor: '#0f172a',
              borderColor: '#334155',
              borderRadius: '0.75rem',
              color: '#f8fafc',
              fontSize: '12px',
            }}
          />
          <Area
            type="monotone"
            dataKey="present"
            stroke="#10b981"
            strokeWidth={2.5}
            fillOpacity={1}
            fill="url(#presentGrad)"
            name="Present"
          />
          <Area
            type="monotone"
            dataKey="late"
            stroke="#f59e0b"
            strokeWidth={2}
            fillOpacity={1}
            fill="url(#lateGrad)"
            name="Late"
          />
        </AreaChart>
      </ResponsiveContainer>
    </div>
  );
};
