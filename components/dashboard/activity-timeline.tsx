const getColorForStatus = (status: string) => {
  switch (status.toLowerCase()) {
    case 'focused':
    case 'focus':
      return 'bg-blue-500';
    case 'distracted':
    case 'distraction':
      return 'bg-red-500';
    case 'idle':
      return 'bg-gray-600';
    case 'break':
      return 'bg-purple-500';
    default:
      return 'bg-gray-700';
  }
};

export function ActivityTimeline({ sessions }: { sessions: any[] }) {
  const hours = Array.from({ length: 24 }, (_, i) => i);

  return (
    <div className="bg-card border border-border rounded-lg p-6">
      <h3 className="text-lg font-semibold text-foreground mb-4">24-Hour Activity Timeline</h3>

      <div className="space-y-4">
        {/* Timeline hours */}
        <div className="flex gap-1 overflow-x-auto pb-2">
          {hours.map((hour) => (
            <div key={hour} className="flex-shrink-0 w-10 h-20 flex flex-col gap-0.5">
              {/* Hour label */}
              <div className="text-xs text-muted-foreground text-center font-medium">
                {hour === 0 ? '12A' : hour < 12 ? `${hour}A` : hour === 12 ? '12P' : `${hour - 12}P`}
              </div>

              {/* Activity blocks */}
              <div className="flex-1 grid grid-cols-1 gap-0.5">
                {(sessions || [])
                  .filter(item => {
                    const itemHour = new Date(item.start_time).getHours();
                    return itemHour === hour;
                  })
                  .slice(0, 3)
                  .map((item, idx) => (
                    <div
                      key={idx}
                      className={`rounded h-full min-h-1 ${getColorForStatus(item.type)} opacity-80 hover:opacity-100 transition-opacity`}
                      title={`${item.type} - ${new Date(item.start_time).toLocaleTimeString()}`}
                    />
                  ))}
              </div>
            </div>
          ))}
        </div>

        {/* Legend */}
        <div className="flex flex-wrap gap-4 pt-4 border-t border-border">
          <div className="flex items-center gap-2">
            <div className="w-3 h-3 rounded bg-blue-500" />
            <span className="text-xs text-muted-foreground">Focused</span>
          </div>
          <div className="flex items-center gap-2">
            <div className="w-3 h-3 rounded bg-red-500" />
            <span className="text-xs text-muted-foreground">Distracted</span>
          </div>
          <div className="flex items-center gap-2">
            <div className="w-3 h-3 rounded bg-purple-500" />
            <span className="text-xs text-muted-foreground">Break</span>
          </div>
          <div className="flex items-center gap-2">
            <div className="w-3 h-3 rounded bg-gray-600" />
            <span className="text-xs text-muted-foreground">Idle</span>
          </div>
        </div>
      </div>
    </div>
  );
}
