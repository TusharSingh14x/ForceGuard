'use client';

import { useState } from 'react';
import { AlertCircle, TrendingUp, Award, Lightbulb, X } from 'lucide-react';
import { dismissAlert } from '@/lib/actions';

interface Alert {
  id: string;
  type: string;
  title: string;
  message: string;
  created_at: string;
}

export function AlertsPanel({ initialAlerts }: { initialAlerts: Alert[] }) {
  const [alerts, setAlerts] = useState<Alert[]>(initialAlerts || []);

  const getAlertIcon = (type: string) => {
    switch (type) {
      case 'warning': return <AlertCircle className="w-5 h-5" />;
      case 'success': return <TrendingUp className="w-5 h-5" />;
      case 'insight': return <Lightbulb className="w-5 h-5" />;
      default: return <Award className="w-5 h-5" />;
    }
  };

  const handleDismiss = async (id: string) => {
    setAlerts(prev => prev.filter(alert => alert.id !== id));
    try {
      await dismissAlert(id);
    } catch (error) {
      console.error('Failed to dismiss alert:', error);
    }
  };

  return (
    <div className="bg-card border border-border rounded-lg p-6">
      <h3 className="text-lg font-semibold text-foreground mb-4">Alerts & Insights</h3>

      <div className="space-y-3">
        {alerts.length === 0 ? (
          <div className="text-center py-8">
            <p className="text-muted-foreground text-sm">No active alerts. You're doing great!</p>
          </div>
        ) : (
          alerts.map((alert) => (
            <div
              key={alert.id}
              className={`flex gap-3 p-3 rounded-lg border ${alert.type === 'warning'
                ? 'bg-red-500/10 border-red-500/30'
                : alert.type === 'success'
                  ? 'bg-green-500/10 border-green-500/30'
                  : 'bg-blue-500/10 border-blue-500/30'
                }`}
            >
              <div
                className={`flex-shrink-0 mt-0.5 ${alert.type === 'warning'
                  ? 'text-red-400'
                  : alert.type === 'success'
                    ? 'text-green-400'
                    : 'text-blue-400'
                  }`}
              >
                {getAlertIcon(alert.type)}
              </div>

              <div className="flex-1 min-w-0">
                <h4 className="font-medium text-foreground text-sm">
                  {alert.title}
                </h4>
                <p className="text-xs text-muted-foreground mt-1">
                  {alert.message}
                </p>
              </div>

              <button
                onClick={() => handleDismiss(alert.id)}
                className="flex-shrink-0 text-muted-foreground hover:text-foreground transition-colors"
              >
                <X className="w-4 h-4" />
              </button>
            </div>
          ))
        )}
      </div>
    </div>
  );
}
