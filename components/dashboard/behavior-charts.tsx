'use client';

import { Card } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import {
  LineChart,
  Line,
  BarChart,
  Bar,
  PieChart,
  Pie,
  Cell,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
} from 'recharts';

export function BehaviorCharts({
  distractions,
  metrics,
  weekly
}: {
  distractions: any[],
  metrics: any,
  weekly: any[]
}) {
  const focusVsDistraction = [
    { name: 'Focus', value: metrics?.focus_score || 0, fill: '#8b5cf6' },
    { name: 'Distraction', value: 100 - (metrics?.focus_score || 0), fill: '#ef4444' },
  ];

  const weeklyTrend = weekly.map(item => ({
    day: new Date(item.date).toLocaleDateString('en-US', { weekday: 'long' }),
    score: item.focus_score || 0
  }));

  return (
    <div className="grid gap-4 md:gap-6 grid-cols-1 lg:grid-cols-2">
      {/* Top Distraction Websites */}
      <Card className="p-6 backdrop-blur-sm border-border/50">
        <div className="mb-4">
          <h3 className="text-lg font-semibold text-foreground">Top Distractions</h3>
          <p className="text-sm text-muted-foreground mt-1">Time spent on each site (min)</p>
        </div>
        <ResponsiveContainer width="100%" height={300}>
          <BarChart
            data={distractions}
            layout="vertical"
            margin={{ top: 5, right: 30, left: 100, bottom: 5 }}
          >
            <CartesianGrid strokeDasharray="3 3" stroke="#333" />
            <XAxis type="number" stroke="#666" style={{ fontSize: '12px' }} />
            <YAxis type="category" dataKey="name" stroke="#666" style={{ fontSize: '12px' }} />
            <Tooltip
              contentStyle={{
                backgroundColor: '#1f2937',
                border: '1px solid #374151',
                borderRadius: '8px',
              }}
              formatter={(value: number) => `${value} min`}
            />
            <Bar dataKey="time" fill="#ef4444" radius={[0, 8, 8, 0]} />
          </BarChart>
        </ResponsiveContainer>
      </Card>

      {/* Focus vs Distraction Breakdown */}
      <Card className="p-6 backdrop-blur-sm border-border/50">
        <div className="mb-4">
          <h3 className="text-lg font-semibold text-foreground">Activity Breakdown</h3>
          <p className="text-sm text-muted-foreground mt-1">Today's time distribution</p>
        </div>
        <div className="flex items-center justify-between">
          <ResponsiveContainer width="60%" height={250}>
            <PieChart>
              <Pie
                data={focusVsDistraction}
                cx="50%"
                cy="50%"
                innerRadius={60}
                outerRadius={90}
                dataKey="value"
                startAngle={90}
                endAngle={-270}
              >
                {focusVsDistraction.map((entry, index) => (
                  <Cell key={`cell-${index}`} fill={entry.fill} />
                ))}
              </Pie>
            </PieChart>
          </ResponsiveContainer>

          <div className="space-y-3 flex-1 px-4">
            {focusVsDistraction.map((item, idx) => (
              <div key={idx} className="flex items-center gap-3">
                <div
                  className="h-3 w-3 rounded-full"
                  style={{ backgroundColor: item.fill }}
                />
                <div>
                  <p className="text-sm text-muted-foreground">{item.name}</p>
                  <p className="text-lg font-semibold text-foreground">{item.value}%</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </Card>

      {/* Weekly Trend */}
      <Card className="p-6 backdrop-blur-sm border-border/50 lg:col-span-2">
        <div className="mb-6">
          <h3 className="text-lg font-semibold text-foreground">Weekly Focus Trend</h3>
          <p className="text-sm text-muted-foreground mt-1">Daily focus scores for the past week</p>
        </div>
        <div className="space-y-4">
          {weeklyTrend.length === 0 && (
            <p className="text-sm text-muted-foreground italic">No trend data available yet</p>
          )}
          {weeklyTrend.map((item) => (
            <div key={item.day}>
              <div className="flex justify-between text-sm mb-1">
                <span className="text-muted-foreground">{item.day}</span>
                <span className="font-semibold text-foreground">{item.score}/100</span>
              </div>
              <div className="h-2 bg-card rounded-full overflow-hidden">
                <div
                  className="h-full bg-gradient-to-r from-purple-500 to-cyan-500"
                  style={{ width: `${item.score}%` }}
                />
              </div>
            </div>
          ))}
        </div>
      </Card>
    </div>
  );
}
