import React from 'react';
import {
  ResponsiveContainer,
  AreaChart,
  Area,
  XAxis,
  YAxis,
  Tooltip,
  CartesianGrid
} from 'recharts';

export const AttendanceTrendChart = ({
  data = [
    { day: 'Mon', present: 88, absent: 8, late: 4 },
    { day: 'Tue', present: 92, absent: 5, late: 3 },
    { day: 'Wed', present: 90, absent: 7, late: 3 },
    { day: 'Thu', present: 95, absent: 3, late: 2 },
    { day: 'Fri', present: 89, absent: 6, late: 5 },
    { day: 'Sat', present: 45, absent: 2, late: 1 }
  ]
}) => {
  return (
    <div className="w-full h-72">
      <ResponsiveContainer width="100%" height="100%">
        <AreaChart data={data} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
          <defs>
            <linearGradient id="presentGradient" x1="0" y1="0" x2="0" y2="1">
              <stop offset="5%" stopColor="#4f46e5" stopOpacity={0.35} />
              <stop offset="95%" stopColor="#4f46e5" stopOpacity={0.0} />
            </linearGradient>
            <linearGradient id="lateGradient" x1="0" y1="0" x2="0" y2="1">
              <stop offset="5%" stopColor="#f59e0b" stopOpacity={0.3} />
              <stop offset="95%" stopColor="#f59e0b" stopOpacity={0.0} />
            </linearGradient>
          </defs>
          <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" vertical={false} opacity={0.5} />
          <XAxis
            dataKey="day"
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
              fontSize: '12px',
              boxShadow: '0 10px 25px -5px rgba(0, 0, 0, 0.3)'
            }}
          />
          <Area
            type="monotone"
            dataKey="present"
            name="Present (%)"
            stroke="#4f46e5"
            strokeWidth={3}
            fillOpacity={1}
            fill="url(#presentGradient)"
          />
          <Area
            type="monotone"
            dataKey="late"
            name="Late (%)"
            stroke="#f59e0b"
            strokeWidth={2}
            fillOpacity={1}
            fill="url(#lateGradient)"
          />
        </AreaChart>
      </ResponsiveContainer>
    </div>
  );
};

export default AttendanceTrendChart;
