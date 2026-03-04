'use client';

import { useState, useEffect } from 'react';
import { Header } from '@/components/dashboard/header';
import { FocusSummary } from '@/components/dashboard/focus-summary';
import { BehaviorCharts } from '@/components/dashboard/behavior-charts';
import { AlertsPanel } from '@/components/dashboard/alerts-panel';
import { SettingsPanel } from '@/components/dashboard/settings-panel';
import { ActivityGraph } from '@/components/dashboard/activity-graph';
import { BlockingOverlay } from '@/components/dashboard/blocking-overlay';
import { Timer, BarChart3, Settings as SettingsIcon, Shield, Play, Square, Loader2 } from 'lucide-react';
import {
  getDailyMetrics,
  getWeeklyMetrics,
  getTopDistractions,
  getAlerts,
  getUserSettings
} from '@/lib/actions';

export default function Dashboard() {
  const [activeTab, setActiveTab] = useState<'focus' | 'stats' | 'settings'>('focus');
  const [data, setData] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [isSessionActive, setIsSessionActive] = useState(false);
  const [sessionStartTime, setSessionStartTime] = useState<number | null>(null);
  const [forceBlock, setForceBlock] = useState(false);

  useEffect(() => {
    async function fetchData() {
      try {
        const [metrics, weekly, distractions, alerts, settings] = await Promise.all([
          getDailyMetrics(),
          getWeeklyMetrics(),
          getTopDistractions(),
          getAlerts(),
          getUserSettings(),
        ]);
        setData({ metrics, weekly, distractions, alerts, settings });
      } catch (error) {
        console.error('Error fetching dashboard data:', error);
      } finally {
        setLoading(false);
      }
    }
    fetchData();

    // Load session state from localStorage if exists
    const savedSession = localStorage.getItem('focus_session_active');
    const savedStartTime = localStorage.getItem('focus_session_start');
    if (savedSession === 'true' && savedStartTime) {
      setIsSessionActive(true);
      setSessionStartTime(parseInt(savedStartTime));
    }
  }, []);

  const handleToggleSession = () => {
    const newState = !isSessionActive;
    setIsSessionActive(newState);

    // Notify browser extension if it exists
    const extensionId = "YOUR_EXTENSION_ID"; // We will tell the user to get this ID
    const chrome = (window as any).chrome;
    if (typeof chrome !== 'undefined' && chrome.runtime && chrome.runtime.sendMessage) {
      chrome.runtime.sendMessage(extensionId, { type: 'SET_SESSION_STATUS', active: newState }, (response: any) => {
        if (chrome.runtime.lastError) {
          console.log('Extension not found or not loaded');
        } else {
          console.log('Extension notified:', response);
        }
      });
    }

    if (newState) {
      const now = Date.now();
      setSessionStartTime(now);
      localStorage.setItem('focus_session_active', 'true');
      localStorage.setItem('focus_session_start', now.toString());
    } else {
      setSessionStartTime(null);
      setForceBlock(false);
      localStorage.removeItem('focus_session_active');
      localStorage.removeItem('focus_session_start');
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <Loader2 className="animate-spin h-12 w-12 text-primary" />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background flex flex-col">
      <BlockingOverlay
        isSessionActive={isSessionActive}
        forceBlock={forceBlock}
        onDismiss={() => setForceBlock(false)}
      />

      <Header
        isSessionActive={isSessionActive}
        onToggleSession={handleToggleSession}
        sessionStartTime={sessionStartTime}
      />

      <main className="flex-1 max-w-7xl mx-auto w-full px-4 sm:px-6 py-8">
        {/* Navigation Tabs - Desktop Side / Mobile Bottom */}
        <div className="flex flex-col md:flex-row gap-8">
          <aside className="md:w-64 space-y-2">
            <button
              onClick={() => setActiveTab('focus')}
              className={`w-full flex items-center gap-3 px-4 py-3 rounded-2xl transition-all ${activeTab === 'focus' ? 'bg-primary text-primary-foreground shadow-lg shadow-primary/20' : 'text-muted-foreground hover:bg-secondary hover:text-foreground'}`}
            >
              <Timer className="w-5 h-5" />
              <span className="font-bold">Focus Mode</span>
            </button>
            <button
              onClick={() => setActiveTab('stats')}
              className={`w-full flex items-center gap-3 px-4 py-3 rounded-2xl transition-all ${activeTab === 'stats' ? 'bg-primary text-primary-foreground shadow-lg shadow-primary/20' : 'text-muted-foreground hover:bg-secondary hover:text-foreground'}`}
            >
              <BarChart3 className="w-5 h-5" />
              <span className="font-bold">Analytics</span>
            </button>
            <button
              onClick={() => setActiveTab('settings')}
              className={`w-full flex items-center gap-3 px-4 py-3 rounded-2xl transition-all ${activeTab === 'settings' ? 'bg-primary text-primary-foreground shadow-lg shadow-primary/20' : 'text-muted-foreground hover:bg-secondary hover:text-foreground'}`}
            >
              <SettingsIcon className="w-5 h-5" />
              <span className="font-bold">Preferences</span>
            </button>

            <div className="mt-8 p-6 bg-secondary/30 rounded-3xl border border-border/50 space-y-4">
              <Shield className="w-8 h-8 text-primary mb-4" />
              <h4 className="font-black text-xs uppercase tracking-widest mb-2 text-foreground">Status</h4>
              <p className="text-xs text-muted-foreground leading-relaxed">
                {isSessionActive
                  ? "Distraction blocking is currently ACTIVE. Any frequent switching will trigger a block."
                  : "Session is inactive. Start a session to enable intelligent guarding."}
              </p>

              {isSessionActive && (
                <button
                  onClick={() => setForceBlock(true)}
                  className="w-full py-3 bg-primary/10 border border-primary/20 text-primary text-xs font-black uppercase tracking-widest rounded-xl hover:bg-primary hover:text-white transition-all active:scale-95"
                >
                  Simulate Distraction
                </button>
              )}
            </div>
          </aside>

          {/* Main Content Area */}
          <section className="flex-1 space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-500">
            {activeTab === 'focus' && (
              <div className="space-y-8">
                <div className="flex items-center justify-between">
                  <h2 className="text-3xl font-black tracking-tightest uppercase">Session Summary</h2>
                  {isSessionActive && (
                    <div className="flex items-center gap-2 px-3 py-1 bg-green-500/10 border border-green-500/20 rounded-full">
                      <div className="w-2 h-2 rounded-full bg-green-500 animate-pulse" />
                      <span className="text-[10px] font-black uppercase text-green-500 tracking-widest">Live Guarding Enabled</span>
                    </div>
                  )}
                </div>

                <FocusSummary metrics={data.metrics} />
                <AlertsPanel initialAlerts={data.alerts} />
              </div>
            )}

            {activeTab === 'stats' && (
              <div className="space-y-8">
                <h2 className="text-3xl font-black tracking-tightest uppercase">Deep Analytics</h2>
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
                  <ActivityGraph />
                  <BehaviorCharts
                    distractions={data.distractions}
                    metrics={data.metrics}
                    weekly={data.weekly}
                  />
                </div>
              </div>
            )}

            {activeTab === 'settings' && (
              <div className="space-y-8">
                <h2 className="text-3xl font-black tracking-tightest uppercase">Guard Settings</h2>
                <SettingsPanel initialSettings={data.settings} />
              </div>
            )}
          </section>
        </div>
      </main>

      {/* Mobile Navigation */}
      <nav className="md:hidden fixed bottom-0 left-0 right-0 border-t border-border bg-background/80 backdrop-blur-xl p-4 flex items-center justify-around z-40">
        <button onClick={() => setActiveTab('focus')} className={activeTab === 'focus' ? 'text-primary' : 'text-muted-foreground'}>
          <Timer className="w-6 h-6" />
        </button>
        <button onClick={() => setActiveTab('stats')} className={activeTab === 'stats' ? 'text-primary' : 'text-muted-foreground'}>
          <BarChart3 className="w-6 h-6" />
        </button>
        <button onClick={() => setActiveTab('settings')} className={activeTab === 'settings' ? 'text-primary' : 'text-muted-foreground'}>
          <SettingsIcon className="w-6 h-6" />
        </button>
      </nav>
    </div>
  );
}
