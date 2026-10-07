'use client';

import { useState } from 'react';
import { Settings, ChevronDown, Loader2, ShieldCheck, MonitorOff, MousePointerClick, Clock, Puzzle } from 'lucide-react';
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

  const defaultExtensionSettings = {
    hardMode: false,
    notifications: true,
    allowMinutes: 20,
    rapidSwitchThreshold: 8,
    rapidSwitchWindowMs: 10_000,
    siteRules: {
      'instagram.com': 'block',
      'www.instagram.com': 'block',
      'youtube.com': 'ask',
      'www.youtube.com': 'ask',
      'twitter.com': 'ask',
      'x.com': 'ask',
      'reddit.com': 'block',
      'www.reddit.com': 'block',
      'facebook.com': 'block',
      'www.facebook.com': 'block',
    } as Record<string, 'block' | 'ask' | 'allow'>,
    pomodoro: {
      enabled: false,
      focusMin: 25,
      breakMin: 5,
    },
  };

  const [extensionSettings, setExtensionSettings] = useState(() => {
    const fromDb = initialSettings?.extension_settings;
    if (fromDb && typeof fromDb === 'object') {
      return {
        ...defaultExtensionSettings,
        ...fromDb,
        siteRules: { ...defaultExtensionSettings.siteRules, ...(fromDb.siteRules ?? {}) },
        pomodoro: { ...defaultExtensionSettings.pomodoro, ...(fromDb.pomodoro ?? {}) },
      };
    }
    return defaultExtensionSettings;
  });

  const rulesToText = (rules: Record<string, string>) =>
    Object.entries(rules)
      .sort((a, b) => a[0].localeCompare(b[0]))
      .map(([host, mode]) => `${host},${mode}`)
      .join('\n');

  const parseRules = (text: string) => {
    const next: Record<string, 'block' | 'ask' | 'allow'> = {};
    text
      .split('\n')
      .map((l) => l.trim())
      .filter(Boolean)
      .forEach((line) => {
        const [host, mode] = line.split(',').map((x) => x.trim());
        if (!host) return;
        if (mode !== 'block' && mode !== 'ask' && mode !== 'allow') return;
        next[host] = mode;
      });
    return next;
  };

  const [siteRulesText, setSiteRulesText] = useState(() =>
    rulesToText(extensionSettings.siteRules),
  );

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
      const mergedExtensionSettings = {
        ...extensionSettings,
        allowMinutes: Number(extensionSettings.allowMinutes) || 20,
        rapidSwitchThreshold: Number(extensionSettings.rapidSwitchThreshold) || 8,
        siteRules: parseRules(siteRulesText),
      };

      // Push to extension immediately (works via content-script relay).
      window.postMessage(
        { source: 'focusguard', type: 'SET_SETTINGS', settings: mergedExtensionSettings },
        '*',
      );

      await updateUserSettings({
        ...settings,
        extension_settings: mergedExtensionSettings,
      });
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

          {/* Extension Rules Section */}
          <div className="space-y-4">
            <h4 className="text-xs font-bold text-primary uppercase tracking-widest flex items-center gap-2">
              <Puzzle className="w-4 h-4" /> Extension Rules
            </h4>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div className="flex items-center justify-between p-4 rounded-xl bg-secondary/10 border border-border/50">
                <div>
                  <label className="text-sm font-semibold text-foreground">Hard Mode</label>
                  <p className="text-[10px] text-muted-foreground">Disable emergency override</p>
                </div>
                <button
                  onClick={() =>
                    setExtensionSettings((p: any) => ({ ...p, hardMode: !p.hardMode }))
                  }
                  className={`w-10 h-5 rounded-full transition-all relative ${extensionSettings.hardMode ? 'bg-primary' : 'bg-muted'}`}
                >
                  <div className={`absolute top-1 w-3 h-3 rounded-full bg-white transition-all ${extensionSettings.hardMode ? 'left-6' : 'left-1'}`} />
                </button>
              </div>

              <div className="flex items-center justify-between p-4 rounded-xl bg-secondary/10 border border-border/50">
                <div>
                  <label className="text-sm font-semibold text-foreground">Extension Notifications</label>
                  <p className="text-[10px] text-muted-foreground">Blocked/allowed alerts</p>
                </div>
                <button
                  onClick={() =>
                    setExtensionSettings((p: any) => ({
                      ...p,
                      notifications: !p.notifications,
                    }))
                  }
                  className={`w-10 h-5 rounded-full transition-all relative ${extensionSettings.notifications ? 'bg-primary' : 'bg-muted'}`}
                >
                  <div className={`absolute top-1 w-3 h-3 rounded-full bg-white transition-all ${extensionSettings.notifications ? 'left-6' : 'left-1'}`} />
                </button>
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
              <div className="space-y-2">
                <div className="text-sm text-foreground font-medium">Ask-first allow (minutes)</div>
                <input
                  type="number"
                  min={1}
                  max={240}
                  value={extensionSettings.allowMinutes}
                  onChange={(e) =>
                    setExtensionSettings((p: any) => ({
                      ...p,
                      allowMinutes: parseInt(e.target.value || '20'),
                    }))
                  }
                  className="w-full bg-secondary/20 border border-border rounded-xl px-3 py-2 text-sm"
                />
              </div>

              <div className="space-y-2">
                <div className="text-sm text-foreground font-medium">Rapid switch threshold (per 10s)</div>
                <input
                  type="number"
                  min={2}
                  max={30}
                  value={extensionSettings.rapidSwitchThreshold}
                  onChange={(e) =>
                    setExtensionSettings((p: any) => ({
                      ...p,
                      rapidSwitchThreshold: parseInt(e.target.value || '8'),
                    }))
                  }
                  className="w-full bg-secondary/20 border border-border rounded-xl px-3 py-2 text-sm"
                />
              </div>
            </div>

            <div className="space-y-2">
              <div className="text-sm text-foreground font-medium">Site rules</div>
              <p className="text-[10px] text-muted-foreground">
                One per line: <span className="font-mono">host,mode</span> where mode is{' '}
                <span className="font-mono">block</span>, <span className="font-mono">ask</span>,{' '}
                <span className="font-mono">allow</span>
              </p>
              <textarea
                value={siteRulesText}
                onChange={(e) => setSiteRulesText(e.target.value)}
                rows={8}
                className="w-full bg-secondary/10 border border-border rounded-2xl p-3 font-mono text-xs"
              />
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
              <div className="space-y-2">
                <div className="text-sm text-foreground font-medium">Pomodoro focus (min)</div>
                <input
                  type="number"
                  min={1}
                  max={180}
                  value={extensionSettings.pomodoro.focusMin}
                  onChange={(e) =>
                    setExtensionSettings((p: any) => ({
                      ...p,
                      pomodoro: { ...p.pomodoro, focusMin: parseInt(e.target.value || '25') },
                    }))
                  }
                  className="w-full bg-secondary/20 border border-border rounded-xl px-3 py-2 text-sm"
                />
              </div>
              <div className="space-y-2">
                <div className="text-sm text-foreground font-medium">Pomodoro break (min)</div>
                <input
                  type="number"
                  min={1}
                  max={60}
                  value={extensionSettings.pomodoro.breakMin}
                  onChange={(e) =>
                    setExtensionSettings((p: any) => ({
                      ...p,
                      pomodoro: { ...p.pomodoro, breakMin: parseInt(e.target.value || '5') },
                    }))
                  }
                  className="w-full bg-secondary/20 border border-border rounded-xl px-3 py-2 text-sm"
                />
              </div>
              <div className="flex items-center justify-between p-4 rounded-xl bg-secondary/10 border border-border/50 sm:col-span-2">
                <div>
                  <label className="text-sm font-semibold text-foreground">Pomodoro enabled</label>
                  <p className="text-[10px] text-muted-foreground">Extension will notify on phase change</p>
                </div>
                <button
                  onClick={() =>
                    setExtensionSettings((p: any) => ({
                      ...p,
                      pomodoro: { ...p.pomodoro, enabled: !p.pomodoro.enabled },
                    }))
                  }
                  className={`w-10 h-5 rounded-full transition-all relative ${extensionSettings.pomodoro.enabled ? 'bg-primary' : 'bg-muted'}`}
                >
                  <div className={`absolute top-1 w-3 h-3 rounded-full bg-white transition-all ${extensionSettings.pomodoro.enabled ? 'left-6' : 'left-1'}`} />
                </button>
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
