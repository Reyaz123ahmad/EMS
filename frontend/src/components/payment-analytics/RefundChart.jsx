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

export function RefundChart({ data = [] }) {
  const chartData =
    data.length > 0
      ? data
      : [
          { reason: 'Service Issue', count: 12 },
          { reason: 'Duplicate', count: 4 },
          { reason: 'Billing Error', count: 6 },
          { reason: 'Other', count: 2 }
        ];

  return (
    <div className="w-full h-72">
      <ResponsiveContainer width="100%" height="100%">
        <BarChart
          layout="vertical"
          data={chartData}
          margin={{ top: 10, right: 20, left: 30, bottom: 0 }}
        >
          <CartesianGrid strokeDasharray="3 3" horizontal={false} stroke="#e2e8f0" opacity={0.5} />
          <XAxis
            type="number"
            axisLine={false}
            tickLine={false}
            tick={{ fill: '#94a3b8', fontSize: 12 }}
          />
          <YAxis
            type="category"
            dataKey="reason"
            axisLine={false}
            tickLine={false}
            tick={{ fill: '#94a3b8', fontSize: 12 }}
          />
          <Tooltip
            formatter={(value) => [value, 'Refund Tickets']}
            contentStyle={{
              backgroundColor: '#0f172a',
              borderRadius: '12px',
              border: 'none',
              color: '#fff',
              fontSize: '12px'
            }}
          />
          <Bar dataKey="count" fill="#8b5cf6" radius={[0, 6, 6, 0]} />
        </BarChart>
      </ResponsiveContainer>
    </div>
  );
}

export default RefundChart;
