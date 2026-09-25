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
  const chartData = data && data.length > 0 ? data : [
    { department: 'Engineering', presentPct: 94 },
    { department: 'Design', presentPct: 90 },
    { department: 'Marketing', presentPct: 86 },
    { department: 'Operations', presentPct: 92 },
    { department: 'HR & Legal', presentPct: 96 },
  ];

  return (
    <div className="h-72 w-full">
      <ResponsiveContainer width="100%" height="100%">
        <BarChart data={chartData} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
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
