'use client';

import { useState } from 'react';
import { Settings, ChevronDown, Loader2 } from 'lucide-react';
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
    <div className="bg-card border border-border rounded-lg overflow-hidden">
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="w-full flex items-center justify-between p-6 hover:bg-secondary/50 transition-colors"
      >
        <div className="flex items-center gap-3">
          <Settings className="w-5 h-5 text-accent" />
          <h3 className="text-lg font-semibold text-foreground">Settings</h3>
        </div>
        <ChevronDown
          className={`w-5 h-5 text-muted-foreground transition-transform ${isOpen ? 'rotate-180' : ''}`}
        />
      </button>

      {isOpen && (
        <div className="border-t border-border p-6 space-y-6">
          {/* Focus Mode */}
          <div className="flex items-center justify-between">
            <div>
              <label className="text-sm font-medium text-foreground">
                Focus Mode
              </label>
              <p className="text-xs text-muted-foreground mt-1">
                Enable automatic distraction blocking
              </p>
            </div>
            <button
              onClick={() => handleToggle('focus_mode_enabled')}
              className={`w-11 h-6 rounded-full transition-colors flex items-center ${settings.focus_mode_enabled ? 'bg-accent' : 'bg-muted'
                }`}
            >
              <div
                className={`w-5 h-5 rounded-full bg-white transition-transform ${settings.focus_mode_enabled ? 'translate-x-5' : 'translate-x-0.5'
                  }`}
              />
            </button>
          </div>

          {/* Notifications */}
          <div className="flex items-center justify-between">
            <div>
              <label className="text-sm font-medium text-foreground">
                Notifications
              </label>
              <p className="text-xs text-muted-foreground mt-1">
                Enable browser notifications
              </p>
            </div>
            <button
              onClick={() => handleToggle('notifications_enabled')}
              className={`w-11 h-6 rounded-full transition-colors flex items-center ${settings.notifications_enabled ? 'bg-accent' : 'bg-muted'
                }`}
            >
              <div
                className={`w-5 h-5 rounded-full bg-white transition-transform ${settings.notifications_enabled ? 'translate-x-5' : 'translate-x-0.5'
                  }`}
              />
            </button>
          </div>

          {/* Durations */}
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="text-sm font-medium text-foreground block mb-2">
                Focus (min)
              </label>
              <input
                type="number"
                value={settings.focus_duration}
                onChange={(e) => handleChange('focus_duration', parseInt(e.target.value))}
                className="w-full bg-input border border-border rounded px-3 py-2 text-sm text-foreground"
              />
            </div>
            <div>
              <label className="text-sm font-medium text-foreground block mb-2">
                Break (min)
              </label>
              <input
                type="number"
                value={settings.break_duration}
                onChange={(e) => handleChange('break_duration', parseInt(e.target.value))}
                className="w-full bg-input border border-border rounded px-3 py-2 text-sm text-foreground"
              />
            </div>
          </div>

          {/* Save Button */}
          <button
            onClick={handleSave}
            disabled={isSaving}
            className="w-full bg-accent text-accent-foreground py-2 rounded font-medium text-sm hover:opacity-90 transition-opacity flex items-center justify-center gap-2"
          >
            {isSaving && <Loader2 className="w-4 h-4 animate-spin" />}
            {isSaving ? 'Saving...' : 'Save Settings'}
          </button>
        </div>
      )}
    </div>
  );
}
