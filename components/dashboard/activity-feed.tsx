import { getActivityFeed } from '@/lib/actions';
import { formatDistanceToNow } from 'date-fns';
import { Zap, AlertCircle, Target, Clock } from 'lucide-react';

export async function ActivityFeed() {
  const activities = await getActivityFeed();

  const getActivityIcon = (type: string) => {
    switch (type) {
      case 'distraction':
        return <AlertCircle className="w-4 h-4 text-red-400" />;
      case 'focus':
        return <Target className="w-4 h-4 text-blue-400" />;
      case 'milestone':
        return <Zap className="w-4 h-4 text-yellow-400" />;
      case 'break':
        return <Clock className="w-4 h-4 text-purple-400" />;
      default:
        return null;
    }
  };

  const getTitle = (activity: any) => {
    switch (activity.type) {
      case 'focus': return 'Focus Session';
      case 'distraction': return 'Distraction Detected';
      case 'break': return 'Break Taken';
      default: return 'Activity';
    }
  };

  return (
    <div className="bg-card border border-border rounded-lg p-6">
      <h3 className="text-lg font-semibold text-foreground mb-4">Activity Feed</h3>
      <div className="space-y-3">
        {activities.length === 0 && (
          <p className="text-sm text-muted-foreground italic">No recent activity</p>
        )}
        {activities.map((activity: any, idx: number) => (
          <div key={idx} className="flex gap-3 pb-3 border-b border-border last:border-0 last:pb-0">
            <div className="flex-shrink-0 mt-1">
              {getActivityIcon(activity.type)}
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-sm font-medium text-foreground">
                {getTitle(activity)}
              </p>
              <p className="text-xs text-muted-foreground mt-1">
                {formatDistanceToNow(new Date(activity.start_time), { addSuffix: true })}
              </p>
            </div>
            {activity.duration_minutes && (
              <div className="text-xs text-muted-foreground whitespace-nowrap">
                {activity.duration_minutes}m
              </div>
            )}
          </div>
        ))}
      </div>
    </div>
  );
}
