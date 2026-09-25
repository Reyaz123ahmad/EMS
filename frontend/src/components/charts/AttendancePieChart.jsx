import React from 'react';
import {
  ResponsiveContainer,
  PieChart,
  Pie,
  Cell,
  Tooltip,
  Legend,
} from 'recharts';

const COLORS = ['#10b981', '#f59e0b', '#6366f1', '#ef4444', '#64748b'];

export const AttendancePieChart = ({ data = [] }) => {
  const chartData = data && data.length > 0 ? data : [
    { name: 'Present', value: 78 },
    { name: 'Late', value: 12 },
    { name: 'Half Day', value: 4 },
    { name: 'Absent', value: 6 },
  ];

  return (
    <div className="h-72 w-full">
      <ResponsiveContainer width="100%" height="100%">
        <PieChart>
          <Pie
            data={chartData}
            cx="50%"
            cy="50%"
            innerRadius={60}
            outerRadius={85}
            paddingAngle={4}
            dataKey="value"
          >
            {chartData.map((entry, index) => (
              <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
            ))}
          </Pie>
          <Tooltip
            contentStyle={{
              backgroundColor: '#0f172a',
              borderColor: '#334155',
              borderRadius: '0.75rem',
              color: '#f8fafc',
              fontSize: '12px',
            }}
          />
          <Legend
            verticalAlign="bottom"
            height={36}
            iconType="circle"
            formatter={(val) => <span className="text-xs text-slate-300 ml-1">{val}</span>}
          />
        </PieChart>
      </ResponsiveContainer>
    </div>
  );
};
