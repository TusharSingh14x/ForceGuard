'use client';

import { Card } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { PieChart, Pie, Cell, ResponsiveContainer } from 'recharts';
import { Zap, Target, TrendingUp, Clock } from 'lucide-react';

interface FocusMetrics {
  focus_time_minutes: number;
  distraction_time_minutes: number;
  longest_streak_minutes: number;
  focus_score: number;
  sessions_today: number;
}

export function FocusSummary({ metrics: initialMetrics }: { metrics: FocusMetrics }) {
  const metricsData = initialMetrics || {
    focus_time_minutes: 0,
    distraction_time_minutes: 0,
    longest_streak_minutes: 0,
    focus_score: 0,
    sessions_today: 0,
  };

  const displayMetrics = [
    {
      label: 'Focus Time',
      value: `${metricsData.focus_time_minutes}m`,
      icon: Zap,
      color: 'from-primary to-primary/60',
    },
    {
      label: 'Distraction',
      value: `${metricsData.distraction_time_minutes}m`,
      icon: TrendingUp,
      color: 'from-red-500 to-red-400',
    },
    {
      label: 'Flow Streak',
      value: `${metricsData.longest_streak_minutes}m`,
      icon: Target,
      color: 'from-cyan-500 to-blue-500',
    },
    {
      label: 'Daily Sessions',
      value: metricsData.sessions_today,
      icon: Clock,
      color: 'from-amber-500 to-orange-500',
    },
  ];

  return (
    <div className="space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-700">
      {/* Metrics Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 md:gap-6">
        {displayMetrics.map((metric) => {
          const Icon = metric.icon;
          return (
            <div key={metric.label} className="group relative">
              <div className={`absolute inset-0 bg-gradient-to-br ${metric.color} opacity-0 group-hover:opacity-10 blur-xl transition-opacity duration-500 rounded-3xl`} />
              <Card className="relative p-6 md:p-8 bg-card/40 backdrop-blur-xl border-white/5 hover:border-primary/20 transition-all duration-500 rounded-[2rem] overflow-hidden group">
                <div className="flex items-start justify-between relative z-10">
                  <div className="space-y-2">
                    <p className="text-[10px] font-black text-muted-foreground uppercase tracking-[0.2em]">{metric.label}</p>
                    <p className="text-3xl md:text-4xl font-black text-foreground tracking-tighter italic">
                      {metric.value}
                    </p>
                  </div>
                  <div className={`p-4 rounded-2xl bg-gradient-to-br ${metric.color} shadow-lg shadow-black/20 group-hover:scale-110 transition-transform duration-500`}>
                    <Icon className="h-6 w-6 text-white" />
                  </div>
                </div>
                {/* Decorative background element */}
                <div className={`absolute -right-4 -bottom-4 w-24 h-24 bg-gradient-to-br ${metric.color} opacity-[0.03] rounded-full blur-2xl group-hover:scale-150 transition-transform duration-700`} />
              </Card>
            </div>
          );
        })}
      </div>

      {/* Focus Architecture Section */}
      <Card className="p-8 md:p-12 bg-card/40 backdrop-blur-3xl border-white/5 rounded-[3rem] overflow-hidden relative group">
        <div className="absolute inset-0 bg-gradient-to-br from-primary/5 via-transparent to-transparent opacity-50" />
        <div className="absolute -right-24 -top-24 w-96 h-96 bg-primary/10 blur-[120px] rounded-full group-hover:scale-110 transition-transform duration-1000" />
        
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-12 relative z-10">
          {/* Left: Enhanced Score Display */}
          <div className="lg:col-span-4 flex flex-col items-center justify-center space-y-6">
            <div className="relative w-64 h-64 flex items-center justify-center">
              {/* Outer ring */}
              <div className="absolute inset-0 rounded-full border-4 border-white/5" />
              {/* Score Arc Simulation using CSS because Recharts can be finicky in walkthroughs */}
              <svg className="w-full h-full -rotate-90">
                <circle
                  cx="50%"
                  cy="50%"
                  r="110"
                  className="fill-none stroke-white/5"
                  strokeWidth="12"
                />
                <circle
                  cx="50%"
                  cy="50%"
                  r="110"
                  className="fill-none stroke-primary"
                  strokeWidth="12"
                  strokeDasharray={`${(metricsData.focus_score / 100) * 691} 691`}
                  strokeLinecap="round"
                />
              </svg>
              <div className="absolute inset-0 flex flex-col items-center justify-center">
                <span className="text-7xl font-black text-foreground tracking-tighter animate-pulse">{metricsData.focus_score}</span>
                <span className="text-[10px] font-black text-primary uppercase tracking-[0.3em] mt-2">Flow Integrity</span>
              </div>
            </div>
          </div>

          {/* Right: Insights & Progress */}
          <div className="lg:col-span-8 flex flex-col justify-center space-y-10">
            <div className="space-y-4">
              <div className="flex items-center gap-3">
                <div className="h-px flex-1 bg-gradient-to-r from-transparent via-white/10 to-transparent" />
                <h3 className="text-xs font-black text-muted-foreground uppercase tracking-[0.4em]">NEURAL INSIGHTS</h3>
                <div className="h-px flex-1 bg-gradient-to-r from-transparent via-white/10 to-transparent" />
              </div>
              
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div className="p-6 rounded-3xl bg-secondary/20 border border-white/5 space-y-4">
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-bold text-muted-foreground uppercase tracking-widest">Growth Retention</span>
                    <Badge className="bg-green-500/10 text-green-400 border-green-500/20 px-3 py-1 font-black">+15.4%</Badge>
                  </div>
                  <p className="text-xl font-bold text-foreground italic">You're hitting deep flow 22min faster than last week.</p>
                </div>
                
                <div className="p-6 rounded-3xl bg-secondary/20 border border-white/5 space-y-4">
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-bold text-muted-foreground uppercase tracking-widest">Consistency Arc</span>
                    <Badge className="bg-primary/10 text-primary border-primary/20 px-3 py-1 font-black">Elite Level</Badge>
                  </div>
                  <p className="text-xl font-bold text-foreground italic">9th consecutive session without a neural breach.</p>
                </div>
              </div>
            </div>

            <div className="space-y-6">
              <div className="flex items-center justify-between">
                <p className="text-xs font-black text-muted-foreground uppercase tracking-[0.2em]">Efficiency Balance</p>
                <div className="flex gap-4 text-[10px] font-black uppercase tracking-widest">
                  <span className="text-primary flex items-center gap-1.5">
                    <div className="w-1.5 h-1.5 rounded-full bg-primary" />
                    Deep Work: {metricsData.focus_time_minutes}m
                  </span>
                  <span className="text-red-400 flex items-center gap-1.5">
                    <div className="w-1.5 h-1.5 rounded-full bg-red-400" />
                    Breach: {metricsData.distraction_time_minutes}m
                  </span>
                </div>
              </div>
              
              <div className="relative h-4 bg-black/40 rounded-full overflow-hidden border border-white/10 p-1">
                <div
                  className="h-full bg-gradient-to-r from-primary via-cyan-400 to-primary rounded-full shadow-[0_0_20px_rgba(99,102,241,0.5)] transition-all duration-1000 ease-out"
                  style={{
                    width: `${(metricsData.focus_time_minutes / (metricsData.focus_time_minutes + metricsData.distraction_time_minutes || 1)) * 100}%`,
                  }}
                />
              </div>
            </div>
          </div>
        </div>
      </Card>
    </div>
  );
}
