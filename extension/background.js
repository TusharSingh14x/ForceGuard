import {
  initialState,
  cleanSettings,
  hostFromUrl,
  trustedDashboard,
  today,
  flushTime,
  startSession,
  stopSession,
  advancePhase,
  decision,
  recordSwitch,
  prune,
} from "./core.mjs";
import { checkUrl } from "./view.mjs";
let state;
const ready = (async () => {
  const saved = await chrome.storage.local.get(["focusguardV2", "settings"]);
  state =
    saved.focusguardV2?.version === 2 ? saved.focusguardV2 : initialState();
  try {
    state.settings = cleanSettings(
      saved.focusguardV2?.settings ?? saved.settings ?? state.settings,
    );
  } catch {
    state.settings = initialState().settings;
  }
  // Restore the last accounting checkpoint; flushTime caps suspension gaps.
  state.deniedUntil ??= {};
  state.sessionIntent ??= "";
  await chrome.storage.local.setAccessLevel({
    accessLevel: "TRUSTED_CONTEXTS",
  });
  await chrome.alarms.create("focusguard-tick", { periodInMinutes: 0.5 });
})();
let queue = Promise.resolve();
function run(fn) {
  const task = queue.then(async () => {
    await ready;
    return fn();
  });
  queue = task.catch(() => {});
  return task;
}
async function persist() {
  prune(state, Date.now());
  await chrome.storage.local.set({ focusguardV2: state });
  await chrome.action.setBadgeText({
    text: state.active ? (state.phase === "break" ? "REST" : "ON") : "",
  });
  await chrome.action.setBadgeBackgroundColor({
    color: state.phase === "break" ? "#a06b31" : "#25252a",
  });
}
function status(full = false) {
  return {
    isSessionActive: state.active,
    sessionStartMs: state.sessionStartMs,

    phase: state.phase,
    phaseEndsAt: state.phaseEndsAt,
    hardMode: state.settings.hardMode,
    ...(full
      ? {
          sessionIntent: state.sessionIntent,
          extensionVersion: chrome.runtime.getManifest?.().version || "2.3.0",
          settings: state.settings,
          domain: state.tracking.host,
          today: today(state),
          days: state.days,
          sessions: state.sessions,
          timeByHostSeconds: today(state).byHost,
        }
      : {}),
  };
}
async function tell(tabId, payload) {
  if (tabId !== undefined)
    try {
      await chrome.tabs.sendMessage(tabId, payload);
    } catch {
      /* Restricted pages and tabs without the content script are expected. */
    }
}
async function broadcast() {
  const tabs = await chrome.tabs.query({});
  await Promise.all(
    tabs.map((tab) =>
      tell(tab.id, {
        type: "SESSION_STATUS",
        ...status(),
        active: state.active,
      }),
    ),
  );
}
async function notify(message) {
  if (state.settings.notifications)
    try {
      await chrome.notifications.create({
        type: "basic",
        iconUrl: "icon.png",
        title: "FocusGuard",
        message,
      });
    } catch {}
}
async function enforce(tab, rapid = false) {
  if (!tab?.id) return;
  const host = hostFromUrl(tab.url);
  const kind = decision(state, host, Date.now());
  await tell(tab.id, {
    type: "FG_STATE",
    ...status(),
    kind: kind ?? (rapid ? "pause" : null),
    host,
  });
}
async function refresh(activation = false) {
  const now = Date.now();
  flushTime(state, now);
  const changed = advancePhase(state, now);
  const focused = await chrome.windows.getLastFocused();
  const idle = await chrome.idle.queryState(60);
  const [tab] = await chrome.tabs.query({
    active: true,
    lastFocusedWindow: true,
  });
  const rapid = Boolean(
    activation && focused.focused && tab && recordSwitch(state, tab.id, now),
  );
  state.tracking = {
    host: focused.focused && idle === "active" ? hostFromUrl(tab?.url) : null,
    tabId: tab?.id ?? null,
    at: now,
  };
  await persist();
  if (changed) {
    await broadcast();
    await notify(
      state.phase === "break"
        ? "Focus complete. Take a break."
        : "Break complete. Time to focus.",
    );
  }
  await enforce(tab, rapid);
}
function extensionPage(sender) {
  return (
    sender.id === chrome.runtime.id &&
    sender.url?.startsWith(chrome.runtime.getURL(""))
  );
}
function dashboard(sender) {
  return (
    sender.id === chrome.runtime.id &&
    sender.frameId === 0 &&
    trustedDashboard(sender.url)
  );
}
async function handle(message, sender) {
  const full = extensionPage(sender) || dashboard(sender);
  if (!message || typeof message.type !== "string")
    throw new Error("Invalid request");
  if (message.type === "GET_STATUS") {
    await refresh();
    return status(full);
  }
  if (message.type === "GET_ACTIVE_DOMAIN") {
    if (!extensionPage(sender))
      throw new Error("Open the extension popup to inspect the current site");
    const [tab] = await chrome.tabs.query({
      active: true,
      lastFocusedWindow: true,
    });
    const host = hostFromUrl(tab?.url);
    if (!host)
      throw new Error(
        "The current tab does not have a supported website address",
      );
    return { domain: host };
  }
  if (message.type === "GET_ACTIVE_SITE_AUDIT") {
    if (!extensionPage(sender))
      throw new Error("Open the extension popup to check a website");
    const [tab] = await chrome.tabs.query({
      active: true,
      lastFocusedWindow: true,
    });
    return { siteAudit: await checkUrl(tab?.url) };
  }
  if (message.type === "OPEN_DASHBOARD") {
    if (!full) throw new Error("This page cannot open extension controls");
    await chrome.tabs.create({ url: chrome.runtime.getURL("dashboard.html") });
    return { opened: true };
  }
  if (message.type === "CS_READY") {
    const tab = sender.tab;
    if (tab) await enforce(tab);
    return status(false);
  }
  if (
    message.type === "SET_SESSION_STATUS_INTERNAL" ||
    message.type === "SET_SESSION_STATUS"
  ) {
    if (!full) throw new Error("This page cannot control focus sessions");
    if (typeof message.active !== "boolean")
      throw new Error("Invalid session state");
    if (message.active) startSession(state, Date.now(), message.intent);
    else stopSession(state, Date.now());
    await persist();
    await broadcast();
    await refresh();
    return status(true);
  }
  if (message.type === "SET_SETTINGS") {
    if (!full) throw new Error("This page cannot change settings");
    flushTime(state, Date.now());
    const next = cleanSettings(message.settings);
    const phaseChanged =
      JSON.stringify(next.pomodoro) !== JSON.stringify(state.settings.pomodoro);
    state.settings = next;
    if (state.active && phaseChanged)
      state.phaseEndsAt = state.settings.pomodoro.enabled
        ? Date.now() +
          (state.phase === "focus"
            ? state.settings.pomodoro.focusMin
            : state.settings.pomodoro.breakMin) *
            60000
        : null;
    await persist();
    await broadcast();
    await refresh();
    return status(true);
  }
  if (message.type === "WORK_CHECK_RESPONSE" || message.type === "ALLOW_HOST") {
    const host = hostFromUrl(sender.url);
    if (!sender.tab || !host || sender.frameId !== 0)
      throw new Error("Invalid tab");
    const rule = decision(state, host, Date.now());
    const allow = message.type === "ALLOW_HOST" || message.doingWork === true;
    if (allow && rule === "block" && state.settings.hardMode)
      throw new Error(
        "Strict blocking is enabled. Stop the session from the extension.",
      );
    if (allow && rule) {
      delete state.deniedUntil[host];
      state.allowUntil[host] = Date.now() + state.settings.allowMinutes * 60000;
      await persist();
      await enforce(sender.tab);
    } else if (!allow) {
      state.deniedUntil[host] =
        Date.now() + state.settings.allowMinutes * 60000;
      await persist();
      await enforce(sender.tab);
    }
    return { success: true };
  }
  if (message.type === "CLEAR_HISTORY") {
    if (!extensionPage(sender))
      throw new Error("Open the extension dashboard to clear history");
    state.days = {};
    state.sessions = [];
    state.sessionFocusSeconds = 0;
    state.tracking.at = Date.now();
    await persist();
    return status(true);
  }
  throw new Error("Unsupported request");
}
chrome.runtime.onMessage.addListener((message, sender, reply) => {
  run(() => handle(message, sender))
    .then((data) => reply({ success: true, ...data }))
    .catch((error) => reply({ success: false, error: error.message }));
  return true;
});
chrome.tabs.onActivated.addListener(() => {
  run(() => refresh(true)).catch(() => {});
});
chrome.tabs.onUpdated.addListener((_id, change, tab) => {
  if (tab.active && (change.url || change.status === "complete"))
    run(() => refresh()).catch(() => {});
});
chrome.windows.onFocusChanged.addListener(() => {
  run(() => refresh()).catch(() => {});
});
chrome.idle.onStateChanged.addListener(() => {
  run(() => refresh()).catch(() => {});
});
chrome.alarms.onAlarm.addListener((alarm) => {
  if (alarm.name === "focusguard-tick") run(() => refresh()).catch(() => {});
});
chrome.runtime.onStartup.addListener(() => {
  run(() => refresh()).catch(() => {});
});
chrome.runtime.onInstalled.addListener(() => {
  run(() => refresh()).catch(() => {});
});
run(() => refresh()).catch(() => {});
