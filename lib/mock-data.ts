// Mock data for FocusGuard dashboard

export const focusMetrics = {
  focusTime: 245, // minutes
  distractionTime: 78, // minutes
  longestStreak: 45, // minutes
  focusScore: 78, // 0-100
  sessionsToday: 5,
};

export const weeklyScores = [
  { day: 'Mon', score: 72 },
  { day: 'Tue', score: 75 },
  { day: 'Wed', score: 68 },
  { day: 'Thu', score: 82 },
  { day: 'Fri', score: 79 },
  { day: 'Sat', score: 65 },
  { day: 'Sun', score: 81 },
];

export const tabSwitchingData = [
  { time: '9:00 AM', count: 8 },
  { time: '10:00 AM', count: 5 },
  { time: '11:00 AM', count: 12 },
  { time: '12:00 PM', count: 15 },
  { time: '1:00 PM', count: 9 },
  { time: '2:00 PM', count: 18 },
  { time: '3:00 PM', count: 7 },
  { time: '4:00 PM', count: 11 },
];

export const distractionSites = [
  { name: 'YouTube', time: 45 },
  { name: 'Twitter/X', time: 38 },
  { name: 'Reddit', time: 32 },
  { name: 'Instagram', time: 28 },
  { name: 'News Sites', time: 18 },
];

export const focusVsDistraction = [
  { name: 'Focus', value: 76, fill: '#6366f1' },
  { name: 'Distracted', value: 16, fill: '#ec4899' },
  { name: 'Break', value: 8, fill: '#64748b' },
];

export const websiteBehavior = [
  { domain: 'github.com', time: 145, category: 'Productive', color: 'bg-green-600' },
  { domain: 'stackoverflow.com', time: 92, category: 'Productive', color: 'bg-green-600' },
  { domain: 'youtube.com', time: 45, category: 'Distracting', color: 'bg-red-600' },
  { domain: 'twitter.com', time: 38, category: 'Distracting', color: 'bg-red-600' },
  { domain: 'notion.so', time: 78, category: 'Productive', color: 'bg-green-600' },
  { domain: 'reddit.com', time: 32, category: 'Distracting', color: 'bg-red-600' },
  { domain: 'figma.com', time: 68, category: 'Productive', color: 'bg-green-600' },
  { domain: 'instagram.com', time: 28, category: 'Distracting', color: 'bg-red-600' },
];

export const distractionTimeline = [
  {
    id: 1,
    time: '2:34 PM',
    type: 'distraction-chain',
    sites: ['YouTube', 'Twitter', 'Reddit'],
    duration: '8 minutes',
    severity: 'high',
  },
  {
    id: 2,
    time: '1:45 PM',
    type: 'extended-distraction',
    sites: ['Instagram'],
    duration: '12 minutes',
    severity: 'high',
  },
  {
    id: 3,
    time: '12:30 PM',
    type: 'tab-switching',
    count: 18,
    duration: '5 minutes',
    severity: 'medium',
  },
  {
    id: 4,
    time: '11:15 AM',
    type: 'distraction-chain',
    sites: ['News', 'Twitter'],
    duration: '6 minutes',
    severity: 'medium',
  },
];

export const quickInsights = [
  { label: 'Most Distracting Site', value: 'YouTube', icon: '📹' },
  { label: 'Most Productive Hour', value: '10:00-11:00 AM', icon: '⏰' },
  { label: 'Longest Session', value: '45 minutes', icon: '🎯' },
  { label: 'Total Distractions', value: '12 events', icon: '⚠️' },
];

export const activityTimeline = Array.from({ length: 24 * 2 }, (_, i) => {
  const hour = (i % 24);
  const statuses = ['focused', 'distracted', 'idle', 'break'];
  const randomStatus = statuses[Math.floor(Math.random() * statuses.length)];
  return {
    timeRange: `${hour}:00`,
    status: randomStatus,
  };
});

export const activityFeed = [
  {
    title: 'Focus session started',
    type: 'focus',
    timestamp: new Date().toISOString(),
    duration: 'Ongoing',
  },
  {
    title: 'Achieved 50min focus streak',
    type: 'milestone',
    timestamp: new Date(Date.now() - 1000 * 60 * 60).toISOString(),
  },
  {
    title: 'Distraction detected: YouTube',
    type: 'distraction',
    timestamp: new Date(Date.now() - 1000 * 60 * 120).toISOString(),
    duration: '15m',
  },
  {
    title: 'Planned break',
    type: 'break',
    timestamp: new Date(Date.now() - 1000 * 60 * 180).toISOString(),
    duration: '5m',
  },
];

export const weeklyHeatmap = Array.from({ length: 7 }, (_, dayIdx) => {
  const days = ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday', 'Sunday'];
  return {
    day: days[dayIdx],
    hours: Array.from({ length: 24 }, (_, hourIdx) => {
      const intensity = Math.floor(Math.random() * 10);
      return { hour: hourIdx, intensity };
    }),
  };
});

export const focusHeatmap = Array.from({ length: 7 * 24 }, () => Math.floor(Math.random() * 10));

export const productivityTrend = [
  { day: 'Mon', focusHours: 6.5 },
  { day: 'Tue', focusHours: 7.2 },
  { day: 'Wed', focusHours: 5.8 },
  { day: 'Thu', focusHours: 8.1 },
  { day: 'Fri', focusHours: 7.5 },
  { day: 'Sat', focusHours: 4.2 },
  { day: 'Sun', focusHours: 3.8 },
];

export const alerts = [
  {
    id: 1,
    type: 'warning',
    title: 'High Distraction Alert',
    message: 'You spent 12 minutes on Instagram. Consider taking a planned break instead.',
    dismissible: true,
  },
  {
    id: 2,
    type: 'info',
    title: 'Good Job!',
    message: 'You maintained focus for 45 minutes! Keep up the great work.',
    dismissible: true,
  },
];

export const recommendations = [
  'Take a 5-minute break every 25 minutes (Pomodoro technique)',
  'Block YouTube during work hours for better focus',
  'Schedule social media breaks for 3:00-3:15 PM daily',
  'Try the \"Do Not Disturb\" mode from 9-12 AM for deep work',
];

export const settings = {
  focusDuration: 60,
  breakDuration: 5,
  distractingSites: ['youtube.com', 'twitter.com', 'reddit.com', 'instagram.com'],
  notificationsEnabled: true,
  focusModeEnabled: false,
};
