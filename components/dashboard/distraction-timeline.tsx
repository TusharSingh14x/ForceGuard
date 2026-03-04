import { getDistractionTimeline } from '@/lib/actions';
import { Card } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { AlertCircle, Eye, TrendingDown } from 'lucide-react';

export async function DistractionTimeline() {
  const timeline = await getDistractionTimeline();

  const getSeverityColor = (severity: string | null) => {
    switch (severity?.toLowerCase()) {
      case 'high':
        return 'bg-red-600/20 text-red-300 border-red-600/30';
      case 'medium':
        return 'bg-orange-600/20 text-orange-300 border-orange-600/30';
      default:
        return 'bg-yellow-600/20 text-yellow-300 border-yellow-600/30';
    }
  };

  const totalTime = timeline.reduce((sum: number, e: any) => sum + (e.duration_minutes || 0), 0);
  const criticalCount = timeline.filter((e: any) => e.severity === 'high').length;

  return (
    <Card className="p-6 backdrop-blur-sm border-border/50">
      <div className="mb-6">
        <h3 className="text-lg font-semibold text-foreground flex items-center gap-2">
          <AlertCircle className="h-5 w-5 text-red-500" />
          Distraction Detected
        </h3>
        <p className="text-sm text-muted-foreground mt-1">
          Activity log showing distraction patterns
        </p>
      </div>

      <div className="space-y-3">
        {timeline.length === 0 && (
          <p className="text-sm text-muted-foreground italic text-center py-4">No recent distractions detected</p>
        )}
        {timeline.map((event: any, idx: number) => (
          <div
            key={event.id}
            className="flex gap-4 p-4 rounded-lg bg-card/40 border border-border/30 hover:bg-card/60 transition-colors"
          >
            {/* Timeline Indicator */}
            <div className="flex flex-col items-center gap-2">
              <div className="h-10 w-10 rounded-full bg-gradient-to-br from-red-500 to-orange-500 flex items-center justify-center flex-shrink-0">
                <Eye className="h-5 w-5 text-white" />
              </div>
              {idx !== timeline.length - 1 && (
                <div className="w-0.5 h-6 bg-border/50" />
              )}
            </div>

            {/* Event Content */}
            <div className="flex-1 min-w-0">
              <div className="flex items-start justify-between gap-2 mb-2">
                <div>
                  <p className="font-medium text-foreground">
                    Distraction Session
                  </p>
                  <p className="text-xs text-muted-foreground">
                    {new Date(event.start_time).toLocaleTimeString()}
                  </p>
                </div>
                <Badge className={getSeverityColor(event.severity)}>
                  {event.severity || 'Medium'}
                </Badge>
              </div>

              {/* Stats */}
              <div className="flex items-center gap-4 text-sm">
                <div className="flex items-center gap-1 text-muted-foreground">
                  <TrendingDown className="h-3.5 w-3.5" />
                  <span>{event.duration_minutes || 0} min</span>
                </div>
                {event.status && (
                  <div className="text-muted-foreground italic">
                    Status: {event.status}
                  </div>
                )}
              </div>
            </div>
          </div>
        ))}
      </div>

      {/* Footer Summary */}
      <div className="mt-6 p-4 rounded-lg bg-card/50 border border-border/30">
        <div className="grid grid-cols-3 gap-4 text-center">
          <div>
            <p className="text-2xl font-bold text-red-400">{timeline.length}</p>
            <p className="text-xs text-muted-foreground">Distractions</p>
          </div>
          <div>
            <p className="text-2xl font-bold text-orange-400">
              {totalTime} min
            </p>
            <p className="text-xs text-muted-foreground">Total Time</p>
          </div>
          <div>
            <p className="text-2xl font-bold text-yellow-400">
              {criticalCount}
            </p>
            <p className="text-xs text-muted-foreground">Critical</p>
          </div>
        </div>
      </div>
    </Card>
  );
}
