'use client';

import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';

export function ProductivityTrend({ data }: { data: any[] }) {
  // Map daily_metrics to chart format
  const chartData = data.map(item => ({
    day: new Date(item.date).toLocaleDateString('en-US', { weekday: 'short' }),
    focusHours: (item.focus_time_minutes || 0) / 60
  }));

  return (
    <div className="bg-card border border-border rounded-lg p-6">
      <h3 className="text-lg font-semibold text-foreground mb-4">Weekly Productivity Trend</h3>

      <ResponsiveContainer width="100%" height={300}>
        <LineChart data={chartData}>
          <defs>
            <linearGradient id="productivityGradient" x1="0" y1="0" x2="0" y2="1">
              <stop offset="5%" stopColor="rgb(147, 112, 219)" stopOpacity={0.3} />
              <stop offset="95%" stopColor="rgb(147, 112, 219)" stopOpacity={0} />
            </linearGradient>
          </defs>
          <CartesianGrid strokeDasharray="3 3" stroke="var(--color-border)" />
          <XAxis
            dataKey="day"
            stroke="var(--color-muted-foreground)"
            style={{ fontSize: '12px' }}
          />
          <YAxis
            stroke="var(--color-muted-foreground)"
            style={{ fontSize: '12px' }}
            label={{ value: 'Hours', angle: -90, position: 'insideLeft' }}
          />
          <Tooltip
            contentStyle={{
              backgroundColor: 'var(--color-card)',
              border: '1px solid var(--color-border)',
              borderRadius: '8px',
            }}
            labelStyle={{ color: 'var(--color-foreground)' }}
            formatter={(value: number) => [`${value.toFixed(1)}h`, 'Focus Time']}
          />
          <Line
            type="monotone"
            dataKey="focusHours"
            stroke="rgb(147, 112, 219)"
            dot={{ fill: 'rgb(147, 112, 219)', r: 4 }}
            activeDot={{ r: 6 }}
            strokeWidth={2}
            name="Focus Hours"
          />
        </LineChart>
      </ResponsiveContainer>
    </div>
  );
}
