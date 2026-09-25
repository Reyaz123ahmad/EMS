import React from 'react';
import {
  ResponsiveContainer,
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip
} from 'recharts';

export function SuccessRateChart({ data = [] }) {
  const chartData =
    data.length > 0
      ? data
      : [
          { date: 'Mon', successRate: 98.4 },
          { date: 'Tue', successRate: 99.1 },
          { date: 'Wed', successRate: 97.8 },
          { date: 'Thu', successRate: 99.5 },
          { date: 'Fri', successRate: 99.2 },
          { date: 'Sat', successRate: 100 },
          { date: 'Sun', successRate: 99.8 }
        ];

  return (
    <div className="w-full h-72">
      <ResponsiveContainer width="100%" height="100%">
        <LineChart data={chartData} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
          <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#e2e8f0" opacity={0.5} />
          <XAxis
            dataKey="date"
            axisLine={false}
            tickLine={false}
            tick={{ fill: '#94a3b8', fontSize: 12 }}
          />
          <YAxis
            domain={[95, 100]}
            axisLine={false}
            tickLine={false}
            tick={{ fill: '#94a3b8', fontSize: 12 }}
            tickFormatter={(val) => `${val}%`}
          />
          <Tooltip
            formatter={(value) => [`${value}%`, 'Success Rate']}
            contentStyle={{
              backgroundColor: '#0f172a',
              borderRadius: '12px',
              border: 'none',
              color: '#fff',
              fontSize: '12px'
            }}
          />
          <Line
            type="monotone"
            dataKey="successRate"
            stroke="#10b981"
            strokeWidth={3}
            dot={{ r: 4, fill: '#10b981', strokeWidth: 2, stroke: '#fff' }}
            activeDot={{ r: 6 }}
          />
        </LineChart>
      </ResponsiveContainer>
    </div>
  );
}

export default SuccessRateChart;
