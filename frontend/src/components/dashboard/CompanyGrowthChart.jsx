import React from 'react';
import {
  ResponsiveContainer,
  LineChart,
  Line,
  XAxis,
  YAxis,
  Tooltip,
  CartesianGrid
} from 'recharts';

export const CompanyGrowthChart = ({
  data = [
    { month: 'Jan', companies: 12, users: 180 },
    { month: 'Feb', companies: 19, users: 320 },
    { month: 'Mar', companies: 28, users: 490 },
    { month: 'Apr', companies: 42, users: 780 },
    { month: 'May', companies: 58, users: 1240 },
    { month: 'Jun', companies: 75, users: 1850 }
  ]
}) => {
  return (
    <div className="w-full h-72">
      <ResponsiveContainer width="100%" height="100%">
        <LineChart data={data} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
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
          />
          <Tooltip
            contentStyle={{
              backgroundColor: 'rgba(15, 23, 42, 0.9)',
              borderColor: 'transparent',
              borderRadius: '12px',
              color: '#fff',
              fontSize: '12px'
            }}
          />
          <Line
            type="monotone"
            dataKey="companies"
            name="Active Tenants"
            stroke="#6366f1"
            strokeWidth={3}
            dot={{ r: 4, fill: '#6366f1' }}
            activeDot={{ r: 6 }}
          />
        </LineChart>
      </ResponsiveContainer>
    </div>
  );
};

export default CompanyGrowthChart;
