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

  const gaugeData = [
    { name: 'Score', value: metricsData.focus_score },
    { name: 'Remaining', value: 100 - metricsData.focus_score },
  ];

  const displayMetrics = [
    {
      label: 'Focus Time',
      value: `${metricsData.focus_time_minutes}m`,
      icon: Zap,
      color: 'from-purple-500 to-purple-600',
    },
    {
      label: 'Distraction Time',
      value: `${metricsData.distraction_time_minutes}m`,
      icon: TrendingUp,
      color: 'from-red-500 to-red-600',
    },
    {
      label: 'Longest Streak',
      value: `${metricsData.longest_streak_minutes}m`,
      icon: Target,
      color: 'from-cyan-500 to-cyan-600',
    },
    {
      label: 'Sessions Today',
      value: metricsData.sessions_today,
      icon: Clock,
      color: 'from-orange-500 to-orange-600',
    },
  ];

  return (
    <div className="grid gap-4 md:gap-6">
      {/* Metrics Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3 md:gap-4">
        {displayMetrics.map((metric) => {
          const Icon = metric.icon;
          return (
            <Card key={metric.label} className="p-4 md:p-6 backdrop-blur-sm border-border/50">
              <div className="flex items-start justify-between">
                <div>
                  <p className="text-sm text-muted-foreground mb-1">{metric.label}</p>
                  <p className="text-2xl md:text-3xl font-bold text-foreground">
                    {metric.value}
                  </p>
                </div>
                <div className={`p-2 rounded-lg bg-gradient-to-br ${metric.color}`}>
                  <Icon className="h-5 w-5 text-white" />
                </div>
              </div>
            </Card>
          );
        })}
      </div>

      {/* Focus Score Gauge and Status */}
      <Card className="p-6 md:p-8 backdrop-blur-sm border-border/50">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 md:gap-8">
          {/* Left: Gauge */}
          <div className="flex flex-col items-center justify-center">
            <div className="relative h-56 w-56 flex items-center justify-center">
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie
                    data={gaugeData}
                    cx="50%"
                    cy="50%"
                    innerRadius={70}
                    outerRadius={100}
                    startAngle={180}
                    endAngle={0}
                    dataKey="value"
                  >
                    <Cell fill="url(#scoreGradient)" />
                    <Cell fill="#1f2937" />
                  </Pie>
                  <defs>
                    <linearGradient id="scoreGradient" x1="0%" y1="0%" x2="100%" y2="0%">
                      <stop offset="0%" stopColor="#a855f7" />
                      <stop offset="100%" stopColor="#06b6d4" />
                    </linearGradient>
                  </defs>
                </PieChart>
              </ResponsiveContainer>
              <div className="absolute inset-0 flex flex-col items-center justify-center">
                <div className="text-5xl font-bold text-foreground">
                  {metricsData.focus_score}
                </div>
                <div className="text-sm text-muted-foreground">Focus Score</div>
              </div>
            </div>
          </div>

          {/* Right: Status and Details */}
          <div className="md:col-span-2 flex flex-col justify-center gap-6">
            <div>
              <h3 className="text-lg font-semibold text-foreground mb-3">Today's Performance</h3>
              <div className="space-y-3">
                <div className="flex items-center justify-between p-3 rounded-lg bg-card/50 border border-border/30">
                  <div>
                    <p className="text-sm text-muted-foreground">Focus Sessions</p>
                    <p className="text-xl font-semibold text-foreground">
                      {metricsData.sessions_today}
                    </p>
                  </div>
                  <Badge className="bg-green-600/20 text-green-300 border-green-600/30">
                    +15% vs avg
                  </Badge>
                </div>

                <div className="flex items-center justify-between p-3 rounded-lg bg-card/50 border border-border/30">
                  <div>
                    <p className="text-sm text-muted-foreground">Streak</p>
                    <p className="text-xl font-semibold text-foreground">
                      {metricsData.longest_streak_minutes} min
                    </p>
                  </div>
                  <Badge className="bg-purple-600/20 text-purple-300 border-purple-600/30">
                    Personal Best
                  </Badge>
                </div>
              </div>
            </div>

            <div>
              <p className="text-sm text-muted-foreground mb-2">Focus Breakdown</p>
              <div className="space-y-2">
                <div className="flex items-center gap-2">
                  <div className="flex-1 h-2 bg-card rounded-full overflow-hidden">
                    <div
                      className="h-full bg-gradient-to-r from-purple-500 to-cyan-500"
                      style={{
                        width: `${(metricsData.focus_time_minutes / (metricsData.focus_time_minutes + metricsData.distraction_time_minutes || 1)) * 100}%`,
                      }}
                    />
                  </div>
                  <span className="text-sm font-medium text-foreground">
                    {Math.round((metricsData.focus_time_minutes / (metricsData.focus_time_minutes + metricsData.distraction_time_minutes || 1)) * 100)}%
                  </span>
                </div>
                <div className="flex gap-4 text-xs text-muted-foreground">
                  <span>Focus: {metricsData.focus_time_minutes}m</span>
                  <span>Distracted: {metricsData.distraction_time_minutes}m</span>
                </div>
              </div>
            </div>
          </div>
        </div>
      </Card>
    </div>
  );
}
