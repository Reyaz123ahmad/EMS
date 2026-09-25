import React from 'react';
import {
  ResponsiveContainer,
  PieChart,
  Pie,
  Cell,
  Tooltip,
  Legend
} from 'recharts';

export const AttendancePieChart = ({
  data = [
    { name: 'Present', value: 142, color: '#10b981' },
    { name: 'Absent', value: 8, color: '#f43f5e' },
    { name: 'Late', value: 12, color: '#f59e0b' },
    { name: 'On Leave', value: 6, color: '#6366f1' }
  ]
}) => {
  return (
    <div className="w-full h-72">
      <ResponsiveContainer width="100%" height="100%">
        <PieChart>
          <Pie
            data={data}
            cx="50%"
            cy="45%"
            innerRadius={60}
            outerRadius={85}
            paddingAngle={4}
            dataKey="value"
          >
            {data.map((entry, index) => (
              <Cell key={`cell-${index}`} fill={entry.color} stroke="transparent" />
            ))}
          </Pie>
          <Tooltip
            contentStyle={{
              backgroundColor: 'rgba(15, 23, 42, 0.9)',
              borderColor: 'transparent',
              borderRadius: '12px',
              color: '#fff',
              fontSize: '12px'
            }}
          />
          <Legend
            verticalAlign="bottom"
            height={36}
            formatter={(value) => (
              <span className="text-xs font-medium text-slate-700 dark:text-slate-300">{value}</span>
            )}
          />
        </PieChart>
      </ResponsiveContainer>
    </div>
  );
};

export default AttendancePieChart;
