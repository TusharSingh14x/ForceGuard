'use client';

import { useState } from 'react';
import { Settings, ChevronDown, Loader2, ShieldCheck, MonitorOff, MousePointerClick, Clock } from 'lucide-react';
import { updateUserSettings } from '@/lib/actions';
import { toast } from 'sonner';

export function SettingsPanel({ initialSettings }: { initialSettings: any }) {
  const [isOpen, setIsOpen] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [settings, setSettings] = useState({
    focus_duration: initialSettings?.focus_duration || 25,
    break_duration: initialSettings?.break_duration || 5,
    notifications_enabled: initialSettings?.notifications_enabled ?? true,
    focus_mode_enabled: initialSettings?.focus_mode_enabled ?? false,
    tab_switch_limit: initialSettings?.tab_switch_limit || 10,
    distraction_time_limit_minutes: initialSettings?.distraction_time_limit_minutes || 5,
  });

  const handleToggle = (key: string) => {
    setSettings(prev => ({
      ...prev,
      [key]: !prev[key as keyof typeof prev]
    }));
  };

  const handleChange = (key: string, value: any) => {
    setSettings(prev => ({
      ...prev,
      [key]: value
    }));
  };

  const handleSave = async () => {
    setIsSaving(true);
    try {
      await updateUserSettings(settings);
      toast.success('Settings updated successfully');
    } catch (error) {
      toast.error('Failed to update settings');
      console.error(error);
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <div className="bg-card border border-border rounded-xl overflow-hidden shadow-lg transition-all hover:shadow-accent/5">
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="w-full flex items-center justify-between p-6 bg-secondary/20 hover:bg-secondary/40 transition-colors"
      >
        <div className="flex items-center gap-3">
          <div className="p-2 bg-accent/10 rounded-lg">
            <Settings className="w-5 h-5 text-accent" />
          </div>
          <div className="text-left">
            <h3 className="text-lg font-bold text-foreground">Advanced Settings</h3>
            <p className="text-xs text-muted-foreground mt-0.5">Configure distraction thresholds & focus behavior</p>
          </div>
        </div>
        <ChevronDown
          className={`w-5 h-5 text-muted-foreground transition-transform duration-300 ${isOpen ? 'rotate-180' : ''}`}
        />
      </button>

      {isOpen && (
        <div className="border-t border-border p-6 space-y-8 animate-in slide-in-from-top-4 duration-300">
          {/* Core Behavior Section */}
          <div className="space-y-4">
            <h4 className="text-xs font-bold text-accent uppercase tracking-widest flex items-center gap-2">
              <ShieldCheck className="w-4 h-4" /> Core Behavior
            </h4>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div className="flex items-center justify-between p-4 rounded-xl bg-secondary/10 border border-border/50">
                <div>
                  <label className="text-sm font-semibold text-foreground">Focus Mode</label>
                  <p className="text-[10px] text-muted-foreground">Auto-block distractions</p>
                </div>
                <button
                  onClick={() => handleToggle('focus_mode_enabled')}
                  className={`w-10 h-5 rounded-full transition-all relative ${settings.focus_mode_enabled ? 'bg-accent' : 'bg-muted'}`}
                >
                  <div className={`absolute top-1 w-3 h-3 rounded-full bg-white transition-all ${settings.focus_mode_enabled ? 'left-6' : 'left-1'}`} />
                </button>
              </div>

              <div className="flex items-center justify-between p-4 rounded-xl bg-secondary/10 border border-border/50">
                <div>
                  <label className="text-sm font-semibold text-foreground">Notifications</label>
                  <p className="text-[10px] text-muted-foreground">Browser alerts</p>
                </div>
                <button
                  onClick={() => handleToggle('notifications_enabled')}
                  className={`w-10 h-5 rounded-full transition-all relative ${settings.notifications_enabled ? 'bg-accent' : 'bg-muted'}`}
                >
                  <div className={`absolute top-1 w-3 h-3 rounded-full bg-white transition-all ${settings.notifications_enabled ? 'left-6' : 'left-1'}`} />
                </button>
              </div>
            </div>
          </div>

          {/* Distraction Thresholds Section */}
          <div className="space-y-4">
            <h4 className="text-xs font-bold text-red-400 uppercase tracking-widest flex items-center gap-2">
              <MonitorOff className="w-4 h-4" /> Distraction Thresholds
            </h4>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
              <div className="space-y-2">
                <div className="flex items-center gap-2 text-sm text-foreground font-medium">
                  <MousePointerClick className="w-4 h-4 text-muted-foreground" />
                  Tab Switch Limit
                </div>
                <div className="flex items-center gap-3">
                  <input
                    type="range" min="3" max="50" step="1"
                    value={settings.tab_switch_limit}
                    onChange={(e) => handleChange('tab_switch_limit', parseInt(e.target.value))}
                    className="flex-1 accent-accent"
                  />
                  <span className="text-sm font-mono bg-secondary px-2 py-1 rounded min-w-[3ch] text-center">
                    {settings.tab_switch_limit}
                  </span>
                </div>
                <p className="text-[10px] text-muted-foreground italic">Block screen after this many switches</p>
              </div>

              <div className="space-y-2">
                <div className="flex items-center gap-2 text-sm text-foreground font-medium">
                  <Clock className="w-4 h-4 text-muted-foreground" />
                  Distraction Time (min)
                </div>
                <div className="flex items-center gap-3">
                  <input
                    type="range" min="1" max="60" step="1"
                    value={settings.distraction_time_limit_minutes}
                    onChange={(e) => handleChange('distraction_time_limit_minutes', parseInt(e.target.value))}
                    className="flex-1 accent-accent"
                  />
                  <span className="text-sm font-mono bg-secondary px-2 py-1 rounded min-w-[3ch] text-center">
                    {settings.distraction_time_limit_minutes}
                  </span>
                </div>
                <p className="text-[10px] text-muted-foreground italic">Max time on distracting sites before block</p>
              </div>
            </div>
          </div>

          {/* Save Button */}
          <button
            onClick={handleSave}
            disabled={isSaving}
            className="w-full bg-accent text-accent-foreground py-4 rounded-xl font-bold text-sm hover:opacity-90 
              active:scale-95 transition-all flex items-center justify-center gap-2 shadow-lg shadow-accent/20 disabled:grayscale"
          >
            {isSaving && <Loader2 className="w-5 h-5 animate-spin" />}
            {isSaving ? 'Synchronizing...' : 'Save Configuration'}
          </button>
        </div>
      )}
    </div>
  );
}
