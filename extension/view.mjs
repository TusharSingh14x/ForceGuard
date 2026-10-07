import { DEFAULT_SETTINGS, cleanSettings } from "./core.mjs";
export const finite = (value, fallback = 0) =>
  Number.isFinite(Number(value)) && Number(value) >= 0
    ? Number(value)
    : fallback;
export const duration = (seconds) =>
  `${Math.floor(finite(seconds) / 60)}m ${Math.floor(finite(seconds) % 60)}s`;
export function normalizeStatus(data = {}) {
  let settings;
  try {
    settings = cleanSettings({ ...DEFAULT_SETTINGS, ...data.settings });
  } catch {
    settings = structuredClone(DEFAULT_SETTINGS);
  }
  const today = {
    focusSeconds: finite(data.today?.focusSeconds),
    tabSwitches: finite(data.today?.tabSwitches),
    interruptions: finite(data.today?.interruptions),
    byHost: Object.fromEntries(
      Object.entries(data.today?.byHost || {}).map(([host, seconds]) => [
        host,
        finite(seconds),
      ]),
    ),
  };
  return {
    ...data,
    settings,
    today,
    sessions: Array.isArray(data.sessions) ? data.sessions : [],
    days: data.days || {},
    isSessionActive: data.isSessionActive === true,
    sessionIntent:
      typeof data.sessionIntent === "string" ? data.sessionIntent : "",
    phase: data.phase === "break" ? "break" : "focus",
    goalProgress: Math.min(
      100,
      Math.round((today.focusSeconds / (settings.dailyGoalMinutes * 60)) * 100),
    ),
  };
}
export function week(days = {}, now = Date.now()) {
  const base = new Date(now);
  base.setHours(0, 0, 0, 0);
  return Array.from({ length: 7 }, (_, index) => {
    const date = new Date(base);
    date.setDate(base.getDate() - 6 + index);
    const key = `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, "0")}-${String(date.getDate()).padStart(2, "0")}`;
    return {
      key,
      label: date.toLocaleDateString(undefined, { weekday: "short" }),
      seconds: finite(days[key]?.focusSeconds),
    };
  });
}
export function csvHistory(data) {
  const cell = (value) => {
    let s = String(value ?? "");
    if (/^[=+@\-\t\r]/.test(s)) s = "'" + s;
    return '"' + s.replaceAll('"', '""') + '"';
  };
  const rows = [["Type", "Date", "Task or domain", "Focus seconds"]];
  for (const s of data.sessions || [])
    rows.push([
      "Session",
      new Date(s.start).toISOString(),
      s.intent || "",
      Math.round(finite(s.focusSeconds)),
    ]);
  for (const [day, value] of Object.entries(data.days || {}))
    for (const [host, seconds] of Object.entries(value.byHost || {}))
      rows.push(["Website", day, host, Math.round(finite(seconds))]);
  return rows.map((row) => row.map(cell).join(",")).join("\r\n");
}
export { auditUrl, checkUrl } from "./url-check.mjs";
export function downloadText(text, name, type) {
  const url = URL.createObjectURL(new Blob([text], { type }));
  const a = document.createElement("a");
  a.href = url;
  a.download = name;
  a.click();
  setTimeout(() => URL.revokeObjectURL(url), 1000);
}
