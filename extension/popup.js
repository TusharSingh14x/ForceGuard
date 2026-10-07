import {
  normalizeStatus,
  duration,
  week,
  csvHistory,
  checkUrl,
  downloadText,
} from "./view.mjs";
const $ = (id) => document.getElementById(id);
let current = null,
  busy = false,
  ruleSnapshot = "";
const notice = (text) => {
  $("message").textContent = text;
};
async function send(message) {
  const res = await chrome.runtime.sendMessage(message);
  if (!res?.success)
    throw new Error(
      res?.error ||
        "FocusGuard did not respond. Reload the extension in chrome://extensions.",
    );
  return res;
}
function availability() {
  for (const field of document.querySelectorAll(
    "#settingsForm input, #ruleList select, #addRuleForm input, #addRuleForm select",
  ))
    field.disabled = busy || !current;
  $("intention").disabled = busy || !current || current.isSessionActive;
  for (const button of document.querySelectorAll("button:not([data-view])"))
    button.disabled = busy || !current;
  for (const button of document.querySelectorAll("[data-preset]"))
    button.disabled = busy || !current || current.isSessionActive;
  document.querySelector("#auditForm button").disabled = busy;
  $("auditUrl").disabled = busy;
  for (const button of document.querySelectorAll("[data-audit-example]")) button.disabled = busy;
}
async function action(fn) {
  if (busy) return;
  busy = true;
  availability();
  try {
    await fn();
  } catch (error) {
    notice(error.message);
  } finally {
    busy = false;
    availability();
  }
}
function clock() {
  if (!current) return;
  const seconds = current.isSessionActive
    ? current.phaseEndsAt
      ? Math.max(0, Math.ceil((current.phaseEndsAt - Date.now()) / 1000))
      : Math.max(0, Math.floor((Date.now() - current.sessionStartMs) / 1000))
    : current.settings.pomodoro.focusMin * 60;
  $("clock").textContent =
    `${String(Math.floor(seconds / 60)).padStart(2, "0")}:${String(seconds % 60).padStart(2, "0")}`;
}
function list(id, rows, empty) {
  const root = $(id);
  root.replaceChildren();
  for (const [left, right] of rows) {
    const item = document.createElement("li"),
      label = document.createElement("span"),
      value = document.createElement("strong");
    label.textContent = left;
    value.textContent = right;
    item.append(label, value);
    root.append(item);
  }
  if (!rows.length) {
    const item = document.createElement("li");
    item.textContent = empty;
    root.append(item);
  }
}
function render(raw, fill = false) {
  current = normalizeStatus(raw);
  const c = current;
  $("badge").textContent = c.isSessionActive
    ? c.phase === "break"
      ? "Break"
      : "Focusing"
    : "Connected";
  $("toggleSession").textContent = c.isSessionActive
    ? "Finish session →"
    : "Start focus session →";
  $("status").textContent = c.isSessionActive
    ? c.phase === "break"
      ? "Break time · site rules paused"
      : "Focus time · site rules active"
    : "READY WHEN YOU ARE";
  $("intention").disabled = c.isSessionActive;
  if (fill || c.isSessionActive) $("intention").value = c.sessionIntent;
  $("focused").textContent = duration(c.today.focusSeconds);
  $("switches").textContent = c.today.tabSwitches;
  $("interruptions").textContent = c.today.interruptions;
  $("goalLabel").textContent =
    `${c.goalProgress}% of your ${c.settings.dailyGoalMinutes}-minute daily target`;
  $("goalProgress").value = c.goalProgress;
  const points = week(c.days),
    max = Math.max(
      c.settings.dailyGoalMinutes * 60,
      ...points.map((p) => p.seconds),
      1,
    ),
    chart = $("weeklyChart");
  chart.replaceChildren();
  chart.setAttribute(
    "aria-label",
    points
      .map((p) => `${p.label}: ${Math.round(p.seconds / 60)} minutes`)
      .join(", "),
  );
  for (const point of points) {
    const day = document.createElement("div");
    day.className = "day";
    const number = document.createElement("span");
    number.className = "minutes";
    number.textContent = Math.round(point.seconds / 60);
    const track = document.createElement("div");
    track.className = "barTrack";
    const bar = document.createElement("div");
    bar.className = "bar";
    bar.style.height = `${Math.max(2, (point.seconds / max) * 100)}%`;
    if (!point.seconds) bar.style.background = "#e7dfd3";
    const label = document.createElement("small");
    label.textContent = point.label;
    track.append(bar);
    day.append(number, track, label);
    chart.append(day);
  }
  list(
    "analytics",
    Object.entries(c.today.byHost)
      .sort((a, b) => b[1] - a[1])
      .map(([host, time]) => [host, duration(time)]),
    "Start a focus session to record activity.",
  );
  list(
    "sessions",
    c.sessions.map((session) => [
      session.intent || new Date(session.start).toLocaleString(),
      `${duration(session.focusSeconds)} · ${new Date(session.start).toLocaleDateString()}`,
    ]),
    "Finish a session to add it to the journal.",
  );
  if (ruleSnapshot !== JSON.stringify(c.settings.siteRules)) {
    renderRules(c.settings.siteRules);
    ruleSnapshot = JSON.stringify(c.settings.siteRules);
  }
  if (fill) {
    const settings = c.settings;
    $("dailyGoal").value = settings.dailyGoalMinutes;
    $("allowMinutes").value = settings.allowMinutes;
    $("rapidThreshold").value = settings.rapidSwitchThreshold;
    $("focusMin").value = settings.pomodoro.focusMin;
    $("breakMin").value = settings.pomodoro.breakMin;
    $("hardMode").checked = settings.hardMode;
    $("notifications").checked = settings.notifications;
    $("pomodoroEnabled").checked = settings.pomodoro.enabled;
  }
  availability();
  clock();
}
async function saveRules(rules, message) {
  render(
    await send({
      type: "SET_SETTINGS",
      settings: { ...current.settings, siteRules: rules },
    }),
  );
  notice(message);
}
function renderRules(rules) {
  const root = $("ruleList");
  root.replaceChildren();
  for (const [host, mode] of Object.entries(rules)) {
    const row = document.createElement("div");
    row.className = "ruleRow";
    const name = document.createElement("span");
    name.textContent = host;
    const select = document.createElement("select");
    select.setAttribute("aria-label", `Rule mode for ${host}`);
    for (const [value, label] of [
      ["block", "Block"],
      ["ask", "Ask first"],
      ["allow", "Allow"],
    ]) {
      const option = document.createElement("option");
      option.value = value;
      option.textContent = label;
      select.append(option);
    }
    select.value = mode;
    select.onchange = () =>
      action(() =>
        saveRules(
          { ...current.settings.siteRules, [host]: select.value },
          `Updated ${host}.`,
        ),
      );
    const remove = document.createElement("button");
    remove.textContent = "Remove";
    remove.setAttribute("aria-label", `Remove ${host}`);
    remove.onclick = () =>
      action(async () => {
        const next = { ...current.settings.siteRules };
        delete next[host];
        await saveRules(next, `Removed ${host}.`);
      });
    row.append(name, select, remove);
    root.append(row);
  }
}
for (const button of document.querySelectorAll("[data-view]"))
  button.onclick = () => {
    for (const b of document.querySelectorAll("[data-view]"))
      b.setAttribute("aria-pressed", String(b === button));
    for (const panel of document.querySelectorAll("[data-panel]"))
      panel.hidden = panel.dataset.panel !== button.dataset.view;
  };
$("toggleSession").onclick = () =>
  action(async () => {
    const active = !current.isSessionActive;
    render(
      await send({
        type: "SET_SESSION_STATUS_INTERNAL",
        active,
        intent: $("intention").value,
      }),
    );
    notice(
      active ? "Focus session started." : "Session saved in your journal.",
    );
  });
$("addRuleForm").onsubmit = (event) => {
  event.preventDefault();
  action(async () => {
    const host = $("ruleHost")
      .value.trim()
      .toLowerCase()
      .replace(/^www\./, "");
    await saveRules(
      { ...current.settings.siteRules, [host]: $("ruleMode").value },
      `Saved rule for ${host}.`,
    );
    $("ruleHost").value = "";
  });
};
$("addCurrentSite").onclick = () =>
  action(async () => {
    const res = await send({ type: "GET_ACTIVE_DOMAIN" });
    const host = res.domain.replace(/^www\./, "");
    $("ruleHost").value = host;
    notice("Domain filled in. Choose a mode and click Add.");
  });
$("settingsForm").onsubmit = (event) => {
  event.preventDefault();
  action(async () => {
    const settings = {
      ...current.settings,
      dailyGoalMinutes: Number($("dailyGoal").value),
      allowMinutes: Number($("allowMinutes").value),
      rapidSwitchThreshold: Number($("rapidThreshold").value),
      hardMode: $("hardMode").checked,
      notifications: $("notifications").checked,
      pomodoro: {
        enabled: $("pomodoroEnabled").checked,
        focusMin: Number($("focusMin").value),
        breakMin: Number($("breakMin").value),
      },
    };
    render(await send({ type: "SET_SETTINGS", settings }), true);
    notice("Preferences saved.");
  });
};
const presets = {
  deep: {
    hardMode: true,
    pomodoro: { enabled: true, focusMin: 50, breakMin: 10 },
  },
  study: {
    hardMode: false,
    pomodoro: { enabled: true, focusMin: 25, breakMin: 5 },
  },
  sprint: {
    hardMode: false,
    pomodoro: { enabled: true, focusMin: 15, breakMin: 3 },
  },
};
for (const button of document.querySelectorAll("[data-preset]"))
  button.onclick = () =>
    action(async () => {
      if (current.isSessionActive)
        throw new Error("Finish your session before choosing a preset.");
      render(
        await send({
          type: "SET_SETTINGS",
          settings: { ...current.settings, ...presets[button.dataset.preset] },
        }),
        true,
      );
      notice("Preset applied. Start whenever you are ready.");
    });
function showAudit(audit) {
  const root = $("auditResult");
  root.replaceChildren();
  const assessment = document.createElement("p");
  assessment.textContent = audit.assessment;
  const host = document.createElement("strong");
  host.textContent = audit.host;
  const transport = document.createElement("p");
  transport.textContent = `${audit.encrypted ? "HTTPS" : "HTTP"} · ${audit.metrics.length} characters · ${audit.metrics.pathSegments} path segments. This is the actual hostname.`;
  const list = document.createElement("ul");
  for (const flag of audit.flags) {
    const row = document.createElement("li");
    row.textContent = `${flag.level.toUpperCase()}: ${flag.text}`;
    list.append(row);
  }
  if (!audit.flags.length) {
    const row = document.createElement("li");
    row.textContent = "No obvious address warnings. HTTPS and a clean URL do not establish that a site is safe.";
    list.append(row);
  }
  root.append(assessment, host, transport, list);
  if (audit.model) {
    const model = document.createElement("div");
    model.className = "modelResult";
    const title = document.createElement("strong");
    title.textContent = audit.model.summary;
    const info = document.createElement("p");
    info.textContent = audit.model.lower === undefined ? ""
      : `Possible phishing score ${Math.floor(audit.model.lower * 100)}–${Math.ceil(audit.model.upper * 100)}%. ${audit.model.trees} trees; ${audit.model.observed}/${audit.model.total} observed input features.`;
    const detail = document.createElement("p");
    detail.textContent = audit.model.detail;
    model.append(title, info, detail);
    root.append(model);
  }
  const exportButton = document.createElement("button");
  exportButton.className = "secondary";
  exportButton.textContent = "Download check report ↓";
  exportButton.onclick = () => downloadText(JSON.stringify({ checkedAt: new Date().toISOString(), ...audit }, null, 2), "focusguard-url-check.json", "application/json");
  root.append(exportButton);
}
async function runAudit(value) {
  $("auditResult").textContent = "Checking address and loading the local model…";
  try {
    showAudit(await checkUrl(value));
    notice("Check completed in this browser.");
  } catch (error) {
    $("auditResult").textContent = error.message;
    throw error;
  }
}
$("auditForm").onsubmit = (event) => {
  event.preventDefault();
  void action(() => runAudit($("auditUrl").value));
};
for (const button of document.querySelectorAll("[data-audit-example]"))
  button.onclick = () => action(async () => {
    $("auditUrl").value = button.dataset.auditExample;
    await runAudit(button.dataset.auditExample);
  });
$("auditSite").onclick = () => action(async () => {
  $("auditResult").textContent = "Checking the active website…";
  try {
    const result = await send({ type: "GET_ACTIVE_SITE_AUDIT" });
    showAudit(result.siteAudit);
    notice("Current website checked locally.");
  } catch (error) {
    $("auditResult").textContent = error.message;
    throw error;
  }
});
$("openDashboard").onclick = () =>
  action(async () => {
    await send({ type: "OPEN_DASHBOARD" });
    notice("Workspace opened.");
  });
$("export").onclick = () =>
  action(async () => {
    const result = await send({ type: "GET_STATUS" });
    downloadText(
      JSON.stringify(
        {
          exportedAt: new Date().toISOString(),
          days: result.days,
          sessions: result.sessions,
        },
        null,
        2,
      ),
      "focusguard-report.json",
      "application/json",
    );
    notice("JSON report downloaded.");
  });
$("exportCsv").onclick = () =>
  action(async () => {
    const result = await send({ type: "GET_STATUS" });
    downloadText(csvHistory(result), "focusguard-report.csv", "text/csv");
    notice("CSV report downloaded.");
  });
$("clear").onclick = () => {
  if (
    confirm(
      "Permanently delete local activity and sessions? Your rules and preferences stay saved.",
    )
  )
    action(async () => {
      render(await send({ type: "CLEAR_HISTORY" }));
      notice("Local history cleared.");
    });
};
async function refresh(fill = false) {
  try {
    render(await send({ type: "GET_STATUS" }), fill);
  } catch (error) {
    current = null;
    availability();
    notice(error.message);
  }
}
void refresh(true);
setInterval(clock, 1000);
setInterval(() => {
  if (!busy) void refresh(!current);
}, 5000);
