import { getWebsiteActivity } from '@/lib/actions';

const getCategoryColor = (category: string | null) => {
  switch (category?.toLowerCase()) {
    case 'productive':
      return 'bg-green-500/20 text-green-400';
    case 'distracting':
      return 'bg-red-500/20 text-red-400';
    case 'neutral':
      return 'bg-blue-500/20 text-blue-400';
    default:
      return 'bg-gray-500/20 text-gray-400';
  }
};

export async function BehaviorTable() {
  const websiteActivity = await getWebsiteActivity();
  const sortedData = [...(websiteActivity || [])].sort((a, b) => (b.time_spent_seconds || 0) - (a.time_spent_seconds || 0));

  const formatTime = (seconds: number) => {
    const hours = Math.floor(seconds / 3600);
    const minutes = Math.floor((seconds % 3600) / 60);
    if (hours > 0) return `${hours}h ${minutes}m`;
    return `${minutes}m`;
  };

  return (
    <div className="bg-card border border-border rounded-lg p-6">
      <h3 className="text-lg font-semibold text-foreground mb-4">Website Activity</h3>

      <div className="overflow-x-auto">
        <table className="w-full text-sm">
          <thead>
            <tr className="border-b border-border">
              <th className="text-left py-3 px-4 font-semibold text-muted-foreground">Website</th>
              <th className="text-left py-3 px-4 font-semibold text-muted-foreground">Time Spent</th>
              <th className="text-left py-3 px-4 font-semibold text-muted-foreground">Category</th>
              <th className="text-left py-3 px-4 font-semibold text-muted-foreground">Last Visited</th>
            </tr>
          </thead>
          <tbody>
            {sortedData.map((site, idx) => (
              <tr key={idx} className="border-b border-border hover:bg-secondary/50 transition-colors">
                <td className="py-3 px-4 text-foreground font-medium">{site.domain}</td>
                <td className="py-3 px-4 text-muted-foreground">{formatTime(site.time_spent_seconds || 0)}</td>
                <td className="py-3 px-4">
                  <span className={`px-3 py-1 rounded-full text-xs font-medium ${getCategoryColor(site.category)}`}>
                    {site.category || 'Uncategorized'}
                  </span>
                </td>
                <td className="py-3 px-4 text-muted-foreground">
                  {site.last_visited ? new Date(site.last_visited).toLocaleTimeString() : 'N/A'}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
