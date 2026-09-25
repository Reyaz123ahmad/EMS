import React from 'react';
import {
  ResponsiveContainer,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  Tooltip,
  CartesianGrid
} from 'recharts';

export const RevenueChart = ({
  data = [
    { month: 'Jan', revenue: 12400, target: 10000 },
    { month: 'Feb', revenue: 15600, target: 12000 },
    { month: 'Mar', revenue: 18900, target: 15000 },
    { month: 'Apr', revenue: 22400, target: 18000 },
    { month: 'May', revenue: 27800, target: 20000 },
    { month: 'Jun', revenue: 34500, target: 25000 }
  ]
}) => {
  return (
    <div className="w-full h-72">
      <ResponsiveContainer width="100%" height="100%">
        <BarChart data={data} margin={{ top: 10, right: 10, left: -10, bottom: 0 }}>
          <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" vertical={false} opacity={0.5} />
          <XAxis
            dataKey="month"
            stroke="#94a3b8"
            fontSize={12}
            tickLine={false}
            axisLine={false}
          />
          <YAxis
            stroke="#94a3b8"
            fontSize={12}
            tickLine={false}
            axisLine={false}
            tickFormatter={(val) => `₹${val / 1000}k`}
          />
          <Tooltip
            contentStyle={{
              backgroundColor: 'rgba(15, 23, 42, 0.9)',
              borderColor: 'transparent',
              borderRadius: '12px',
              color: '#fff',
              fontSize: '12px'
            }}
            formatter={(value) => [`₹${value.toLocaleString()}`, 'Revenue']}
          />
          <Bar
            dataKey="revenue"
            fill="#4f46e5"
            radius={[6, 6, 0, 0]}
            maxBarSize={36}
          />
        </BarChart>
      </ResponsiveContainer>
    </div>
  );
};

export default RevenueChart;
