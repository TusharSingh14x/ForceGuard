import { Header } from '@/components/dashboard/header';
import { FocusSummary } from '@/components/dashboard/focus-summary';
import { BehaviorCharts } from '@/components/dashboard/behavior-charts';
import { SessionControls } from '@/components/dashboard/session-controls';
import { DistractionTimeline } from '@/components/dashboard/distraction-timeline';
import { ActivityFeed } from '@/components/dashboard/activity-feed';
import { ActivityTimeline } from '@/components/dashboard/activity-timeline';
import { BehaviorTable } from '@/components/dashboard/behavior-table';
import { FocusHeatmap } from '@/components/dashboard/focus-heatmap';
import { AlertsPanel } from '@/components/dashboard/alerts-panel';
import { SettingsPanel } from '@/components/dashboard/settings-panel';
import { ProductivityTrend } from '@/components/dashboard/productivity-trend';
import {
  getDailyMetrics,
  getWeeklyMetrics,
  getTopDistractions,
  getTodaySessions,
  getAlerts,
  getUserSettings
} from '@/lib/actions';

export const dynamic = 'force-dynamic';

export default async function Dashboard() {
  const [metrics, weekly, distractions, todaySessions, alerts, settings] = await Promise.all([
    getDailyMetrics(),
    getWeeklyMetrics(),
    getTopDistractions(),
    getTodaySessions(),
    getAlerts(),
    getUserSettings(),
  ]);

  return (
    <main className="min-h-screen bg-background text-foreground">
      <Header />

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-8">
        <div>
          <h2 className="text-3xl font-bold mb-6">Focus Summary</h2>
          <FocusSummary metrics={metrics} />
        </div>

        <div>
          <h2 className="text-3xl font-bold mb-6">Session Controls</h2>
          <SessionControls />
        </div>

        <div>
          <h2 className="text-3xl font-bold mb-6">Behavior Analytics</h2>
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <BehaviorCharts
              distractions={distractions}
              metrics={metrics}
              weekly={weekly}
            />
            <ProductivityTrend data={weekly} />
          </div>
        </div>

        <div>
          <h2 className="text-3xl font-bold mb-6">Activity Timeline</h2>
          <ActivityTimeline sessions={todaySessions} />
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          <div className="lg:col-span-2">
            <h2 className="text-3xl font-bold mb-6">Distraction Timeline</h2>
            <DistractionTimeline />
          </div>
          <div>
            <h2 className="text-3xl font-bold mb-6">Activity Feed</h2>
            <ActivityFeed />
          </div>
        </div>

        <div>
          <h2 className="text-3xl font-bold mb-6">Focus Heatmap</h2>
          <FocusHeatmap />
        </div>

        <div>
          <h2 className="text-3xl font-bold mb-6">Website Activity</h2>
          <BehaviorTable />
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          <div>
            <h2 className="text-3xl font-bold mb-6">Alerts</h2>
            <AlertsPanel initialAlerts={alerts} />
          </div>
          <div>
            <h2 className="text-3xl font-bold mb-6">Settings</h2>
            <SettingsPanel initialSettings={settings} />
          </div>
        </div>
      </div>
    </main>
  );
}
