'use client';

import { Card } from '@/components/ui/card';
import { TrendingUp } from 'lucide-react';
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
    { name: 'Focus', value: metrics?.focus_score || 0, fill: '#6366f1' },
    { name: 'Distraction', value: 100 - (metrics?.focus_score || 0), fill: '#ef4444' },
  ];

  const weeklyTrend = weekly.map(item => ({
    day: new Date(item.date).toLocaleDateString('en-US', { weekday: 'short' }),
    score: item.focus_score || 0
  }));

  return (
    <div className="grid gap-6 md:gap-8 grid-cols-1 lg:grid-cols-2">
      {/* Top Distraction Websites */}
      <Card className="p-8 bg-card/40 backdrop-blur-3xl border-white/5 rounded-[2.5rem] overflow-hidden relative group">
        <div className="absolute inset-0 bg-gradient-to-br from-red-500/5 via-transparent to-transparent opacity-50" />
        <div className="relative z-10">
          <div className="mb-8 flex items-center justify-between">
            <div>
              <h3 className="text-xl font-black text-foreground tracking-tight">VULNERABILITY NODES</h3>
              <p className="text-[10px] font-black text-muted-foreground uppercase tracking-[0.2em] mt-1">High-impact distractions</p>
            </div>
            <TrendingUp className="w-5 h-5 text-red-400 opacity-50" />
          </div>
          <ResponsiveContainer width="100%" height={280}>
            <BarChart
              data={distractions}
              layout="vertical"
              margin={{ top: 0, right: 30, left: 40, bottom: 0 }}
            >
              <XAxis type="number" hide />
              <YAxis
                type="category"
                dataKey="name"
                stroke="#64748b"
                fontSize={10}
                fontWeight={900}
                tickLine={false}
                axisLine={false}
                width={80}
              />
              <Tooltip
                cursor={{ fill: 'rgba(255,255,255,0.03)' }}
                contentStyle={{
                  backgroundColor: 'rgba(0,0,0,0.8)',
                  backdropFilter: 'blur(10px)',
                  border: '1px solid rgba(255,255,255,0.1)',
                  borderRadius: '16px',
                  boxShadow: '0 20px 40px rgba(0,0,0,0.5)',
                  fontSize: '12px',
                  fontWeight: 'bold',
                }}
                formatter={(value: number) => [`${value} min`, 'Exposure Time']}
              />
              <Bar
                dataKey="time"
                fill="url(#barGradient)"
                radius={[0, 20, 20, 0]}
                barSize={12}
              >
                <defs>
                  <linearGradient id="barGradient" x1="0%" y1="0%" x2="100%" y2="0%">
                    <stop offset="0%" stopColor="#ef4444" />
                    <stop offset="100%" stopColor="#f87171" />
                  </linearGradient>
                </defs>
              </Bar>
            </BarChart>
          </ResponsiveContainer>
        </div>
      </Card>

      {/* Focus vs Distraction Breakdown */}
      <Card className="p-8 bg-card/40 backdrop-blur-3xl border-white/5 rounded-[2.5rem] overflow-hidden relative group">
        <div className="absolute inset-0 bg-gradient-to-br from-primary/5 via-transparent to-transparent opacity-50" />
        <div className="relative z-10 h-full flex flex-col">
          <div className="mb-4">
            <h3 className="text-xl font-black text-foreground tracking-tight">NEURAL COMPOSITION</h3>
            <p className="text-[10px] font-black text-muted-foreground uppercase tracking-[0.2em] mt-1">Distribution of focus vs drift</p>
          </div>
          <div className="flex flex-col sm:flex-row items-center justify-between flex-1 gap-8">
            <div className="relative w-full aspect-square max-w-[200px]">
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie
                    data={focusVsDistraction}
                    cx="50%"
                    cy="50%"
                    innerRadius={65}
                    outerRadius={85}
                    paddingAngle={8}
                    dataKey="value"
                    stroke="none"
                  >
                    {focusVsDistraction.map((entry, index) => (
                      <Cell
                        key={`cell-${index}`}
                        fill={entry.fill}
                        className="hover:opacity-80 transition-opacity cursor-pointer"
                        style={{ filter: `drop-shadow(0 0 8px ${entry.fill}44)` }}
                      />
                    ))}
                  </Pie>
                </PieChart>
              </ResponsiveContainer>
              <div className="absolute inset-0 flex flex-col items-center justify-center pointer-events-none">
                <span className="text-3xl font-black text-foreground tracking-tighter italic">{metrics?.focus_score || 0}%</span>
                <span className="text-[8px] font-black text-primary uppercase tracking-[0.2em]">Efficiency</span>
              </div>
            </div>

            <div className="space-y-4 flex-1 w-full">
              {focusVsDistraction.map((item, idx) => (
                <div key={idx} className="p-4 rounded-2xl bg-white/5 border border-white/5 flex items-center justify-between group hover:bg-white/10 transition-colors">
                  <div className="flex items-center gap-3">
                    <div className="h-2 w-2 rounded-full shadow-lg" style={{ backgroundColor: item.fill, boxShadow: `0 0 10px ${item.fill}` }} />
                    <span className="text-xs font-black text-muted-foreground uppercase tracking-wider">{item.name}</span>
                  </div>
                  <span className="text-lg font-black text-foreground italic">{item.value}%</span>
                </div>
              ))}
            </div>
          </div>
        </div>
      </Card>

      {/* Weekly Trend */}
      <Card className="p-10 bg-card/40 backdrop-blur-3xl border-white/5 rounded-[3rem] overflow-hidden lg:col-span-2 relative">
        <div className="absolute -left-24 -bottom-24 w-96 h-96 bg-primary/5 blur-[120px] rounded-full" />
        <div className="relative z-10">
          <div className="mb-10 flex items-end justify-between">
            <div>
              <h3 className="text-2xl font-black text-foreground tracking-tight">TRAJECTORY ANALYSIS</h3>
              <p className="text-[10px] font-black text-muted-foreground uppercase tracking-[0.2em] mt-1">7-Day focus velocity trend</p>
            </div>
            <div className="flex gap-2">
              {[1, 2, 3, 4, 5, 6, 7].map(i => (
                <div key={i} className="w-1 h-3 rounded-full bg-primary/20" />
              ))}
            </div>
          </div>

          <div className="space-y-6">
            {weeklyTrend.length === 0 ? (
              <div className="h-[200px] flex items-center justify-center border-2 border-dashed border-white/5 rounded-3xl">
                <p className="text-xs font-black text-muted-foreground uppercase tracking-[0.3em] italic">Awaiting more session data...</p>
              </div>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-7 gap-4">
                {weeklyTrend.map((item) => (
                  <div key={item.day} className="p-6 rounded-[2rem] bg-secondary/20 border border-white/5 flex flex-col items-center gap-4 group hover:bg-primary/10 hover:border-primary/20 transition-all duration-500">
                    <span className="text-[10px] font-black text-muted-foreground uppercase tracking-widest">{item.day}</span>
                    <div className="relative w-12 h-32 bg-black/40 rounded-full overflow-hidden border border-white/5">
                      <div
                        className="absolute bottom-0 w-full bg-gradient-to-t from-primary to-cyan-400 transition-all duration-1000 ease-out group-hover:shadow-[0_0_20px_rgba(99,102,241,0.5)]"
                        style={{ height: `${item.score}%` }}
                      />
                    </div>
                    <span className="text-xl font-black text-foreground italic">{item.score}</span>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      </Card>
    </div>
  );
}
