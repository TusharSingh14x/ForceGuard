export const DASHBOARD_ORIGINS = [
  "http://localhost:3000",
  "http://127.0.0.1:3000",
];
export const DEFAULT_SETTINGS = {
  hardMode: false,
  dailyGoalMinutes: 90,
  notifications: true,
  allowMinutes: 5,
  rapidSwitchThreshold: 8,
  rapidSwitchWindowMs: 10000,
  siteRules: {
    "instagram.com": "block",
    "reddit.com": "block",
    "facebook.com": "block",
    "youtube.com": "ask",
    "x.com": "ask",
  },
  pomodoro: { enabled: true, focusMin: 25, breakMin: 5 },
};
export function hostFromUrl(url) {
  try {
    const u = new URL(url);
    return ["http:", "https:"].includes(u.protocol)
      ? u.hostname.toLowerCase()
      : null;
  } catch {
    return null;
  }
}
export function trustedDashboard(url) {
  try {
    return DASHBOARD_ORIGINS.includes(new URL(url).origin);
  } catch {
    return false;
  }
}
export function dayKey(now) {
  const d = new Date(now);
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(d.getDate()).padStart(2, "0")}`;
}
export function cleanSettings(input) {
  if (!input || typeof input !== "object")
    throw new Error("Settings are required");
  const bounded = (v, min, max) => {
    if (!Number.isInteger(v) || v < min || v > max)
      throw new Error(`Use a whole number between ${min} and ${max}`);
    return v;
  };
  const source = input.siteRules ?? DEFAULT_SETTINGS.siteRules;
  if (
    typeof source !== "object" ||
    Array.isArray(source) ||
    Object.keys(source).length > 200
  )
    throw new Error("Use at most 200 site rules");
  const rules = {};
  for (const [key, mode] of Object.entries(source)) {
    const host = key
      .toLowerCase()
      .trim()
      .replace(/^www\./, "");
    if (
      !/^(?:[a-z0-9](?:[a-z0-9-]{0,61}[a-z0-9])?\.)+[a-z]{2,63}$/.test(host) ||
      !["block", "ask", "allow"].includes(mode)
    )
      throw new Error(`Invalid rule: ${key}`);
    rules[host] = mode;
  }
  const p = input.pomodoro ?? DEFAULT_SETTINGS.pomodoro;
  return {
    hardMode: input.hardMode === true,
    dailyGoalMinutes: bounded(input.dailyGoalMinutes ?? 90, 15, 600),
    notifications: input.notifications !== false,
    allowMinutes: bounded(input.allowMinutes ?? 5, 1, 240),
    rapidSwitchThreshold: bounded(input.rapidSwitchThreshold ?? 8, 2, 50),
    rapidSwitchWindowMs: 10000,
    siteRules: rules,
    pomodoro: {
      enabled: p.enabled === true,
      focusMin: bounded(p.focusMin ?? 25, 1, 180),
      breakMin: bounded(p.breakMin ?? 5, 1, 60),
    },
  };
}
export function ruleForHost(host, rules) {
  if (!host) return null;
  const match = Object.keys(rules)
    .filter((k) => host === k || host.endsWith("." + k))
    .sort((a, b) => b.length - a.length)[0];
  return match ? rules[match] : null;
}
export function initialState(now = Date.now()) {
  return {
    version: 2,
    settings: structuredClone(DEFAULT_SETTINGS),
    active: false,
    sessionStartMs: null,
    sessionIntent: "",
    phase: "focus",
    phaseEndsAt: null,
    allowUntil: {},
    deniedUntil: {},
    days: {},
    sessions: [],
    switches: [],
    lastPromptAt: 0,
    tracking: { host: null, tabId: null, at: now },
    sessionFocusSeconds: 0,
  };
}
export function today(state, now = Date.now()) {
  const key = dayKey(now);
  return (
    state.days[key] ??
    (state.days[key] = {
      byHost: {},
      focusSeconds: 0,
      tabSwitches: 0,
      interruptions: 0,
    })
  );
}
export function flushTime(state, now) {
  const t = state.tracking;
  const end = state.phaseEndsAt ? Math.min(now, state.phaseEndsAt) : now;
  const seconds = Math.max(0, Math.min(60, (end - t.at) / 1000));
  // Gaps over 60 seconds may represent suspension or sleep. Never count the whole gap.
  if (
    state.active &&
    state.phase === "focus" &&
    t.host &&
    dayKey(t.at) === dayKey(now) &&
    seconds > 0
  ) {
    const d = today(state, now);
    d.byHost[t.host] = (d.byHost[t.host] ?? 0) + seconds;
    d.focusSeconds += seconds;
    state.sessionFocusSeconds += seconds;
  }
  t.at = now;
}
export function startSession(state, now, intent = "") {
  if (state.active) return;
  state.active = true;
  state.sessionStartMs = now;
  state.sessionIntent =
    typeof intent === "string" ? intent.trim().slice(0, 120) : "";
  state.sessionFocusSeconds = 0;
  state.phase = "focus";
  state.phaseEndsAt = state.settings.pomodoro.enabled
    ? now + state.settings.pomodoro.focusMin * 60000
    : null;
  state.allowUntil = {};
  state.deniedUntil = {};
  state.switches = [];
  state.tracking.at = now;
}
export function stopSession(state, now) {
  flushTime(state, now);
  if (state.active) {
    state.sessions.unshift({
      start: state.sessionStartMs,
      end: now,
      focusSeconds: state.sessionFocusSeconds,
      intent: state.sessionIntent,
    });
    state.sessions = state.sessions.slice(0, 100);
  }
  state.active = false;
  state.sessionStartMs = null;
  state.sessionIntent = "";
  state.phaseEndsAt = null;
  state.allowUntil = {};
  state.deniedUntil = {};
  state.switches = [];
}
export function advancePhase(state, now) {
  if (
    !state.active ||
    !state.settings.pomodoro.enabled ||
    !state.phaseEndsAt ||
    now < state.phaseEndsAt
  )
    return false;
  state.phase = state.phase === "focus" ? "break" : "focus";
  state.phaseEndsAt =
    now +
    (state.phase === "focus"
      ? state.settings.pomodoro.focusMin
      : state.settings.pomodoro.breakMin) *
      60000;
  state.tracking.at = now;
  return true;
}
export function decision(state, host, now) {
  if (
    !state.active ||
    state.phase === "break" ||
    !host ||
    state.allowUntil[host] > now
  )
    return null;
  const rule =
    state.deniedUntil?.[host] > now
      ? "block"
      : ruleForHost(host, state.settings.siteRules);
  return rule === "block" || rule === "ask" ? rule : null;
}
export function recordSwitch(state, tabId, now) {
  if (
    !state.active ||
    state.phase !== "focus" ||
    state.tracking.tabId === tabId
  )
    return false;
  today(state, now).tabSwitches++;
  state.switches = state.switches.filter((t) => now - t <= 10000);
  state.switches.push(now);
  if (
    state.switches.length >= state.settings.rapidSwitchThreshold &&
    now - state.lastPromptAt > 30000
  ) {
    state.lastPromptAt = now;
    state.switches = [];
    today(state, now).interruptions++;
    return true;
  }
  return false;
}
export function prune(state, now) {
  const keys = Object.keys(state.days).sort().reverse();
  for (const key of keys.slice(30)) delete state.days[key];
  for (const [host, until] of Object.entries(state.allowUntil))
    if (until <= now) delete state.allowUntil[host];
}
