import React from 'react';
import {
  ResponsiveContainer,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip
} from 'recharts';

export function ChurnChart({ data = [] }) {
  const chartData =
    data.length > 0
      ? data
      : [
          { month: 'Apr', churnRate: 3.2 },
          { month: 'May', churnRate: 2.8 },
          { month: 'Jun', churnRate: 2.1 },
          { month: 'Jul', churnRate: 1.9 },
          { month: 'Aug', churnRate: 1.4 },
          { month: 'Sep', churnRate: 1.2 }
        ];

  return (
    <div className="w-full h-72">
      <ResponsiveContainer width="100%" height="100%">
        <BarChart data={chartData} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
          <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#e2e8f0" opacity={0.5} />
          <XAxis
            dataKey="month"
            axisLine={false}
            tickLine={false}
            tick={{ fill: '#94a3b8', fontSize: 12 }}
          />
          <YAxis
            axisLine={false}
            tickLine={false}
            tick={{ fill: '#94a3b8', fontSize: 12 }}
            tickFormatter={(val) => `${val}%`}
          />
          <Tooltip
            formatter={(value) => [`${value}%`, 'Churn Rate']}
            contentStyle={{
              backgroundColor: '#0f172a',
              borderRadius: '12px',
              border: 'none',
              color: '#fff',
              fontSize: '12px'
            }}
          />
          <Bar dataKey="churnRate" fill="#f43f5e" radius={[6, 6, 0, 0]} />
        </BarChart>
      </ResponsiveContainer>
    </div>
  );
}

export default ChurnChart;
