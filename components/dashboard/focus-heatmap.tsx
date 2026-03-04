const getIntensityColor = (intensity: number) => {
  if (intensity === 0) return 'bg-gray-700';
  if (intensity < 3) return 'bg-blue-900';
  if (intensity < 6) return 'bg-blue-700';
  if (intensity < 9) return 'bg-blue-500';
  return 'bg-blue-400';
};

export function FocusHeatmap({ data }: { data?: number[] }) {
  const heatmapData = data || Array.from({ length: 7 * 24 }, () => 0);
  const days = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];
  const hours = Array.from({ length: 24 }, (_, i) => i);

  return (
    <div className="bg-card border border-border rounded-lg p-6">
      <h3 className="text-lg font-semibold text-foreground mb-4">Weekly Focus Heatmap</h3>

      <div className="flex gap-4 overflow-x-auto pb-4">
        {days.map((day, dayIdx) => (
          <div key={day} className="flex-shrink-0">
            {/* Day label */}
            <div className="text-xs font-medium text-muted-foreground text-center mb-2 w-8">
              {day}
            </div>

            {/* Hour blocks */}
            <div className="flex flex-col gap-1">
              {hours.map((hour) => {
                const cellValue = heatmapData[dayIdx * 24 + hour] || 0;
                return (
                  <div
                    key={`${day}-${hour}`}
                    className={`w-6 h-6 rounded ${getIntensityColor(cellValue)} hover:ring-2 ring-accent transition-all cursor-pointer`}
                    title={`${day} ${hour}:00 - Focus level: ${cellValue}/10`}
                  />
                );
              })}
            </div>
          </div>
        ))}
      </div>

      {/* Legend */}
      <div className="flex items-center gap-3 pt-4 border-t border-border">
        <span className="text-xs text-muted-foreground">Less</span>
        <div className="flex gap-1">
          {[0, 1, 2, 3].map((intensity) => (
            <div
              key={intensity}
              className={`w-3 h-3 rounded ${intensity === 0
                  ? 'bg-gray-700'
                  : intensity === 1
                    ? 'bg-blue-900'
                    : intensity === 2
                      ? 'bg-blue-700'
                      : 'bg-blue-500'
                }`}
            />
          ))}
        </div>
        <span className="text-xs text-muted-foreground">More</span>
      </div>
    </div>
  );
}
