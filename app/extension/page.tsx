"use client";
import Link from "next/link";
import { useCallback, useEffect, useRef, useState } from "react";
import {
  checkUrl,
  csvHistory,
  downloadText,
  duration,
  normalizeStatus,
  week,
  type Settings,
  type SiteAudit,
  type Status,
} from "../../extension/view.mjs";
import s from "./workspace.module.css";
type View = "overview" | "rules" | "reports" | "check";
const views: [View, string, string][] = [
  ["overview", "Overview", "01"],
  ["rules", "Site rules", "02"],
  ["reports", "Activity reports", "03"],
  ["check", "URL check", "04"],
];
const presets = [
  {
    name: "Deep work",
    detail: "50 min focus · 10 min break",
    focus: 50,
    rest: 10,
    strict: true,
  },
  {
    name: "Study",
    detail: "25 min focus · 5 min break",
    focus: 25,
    rest: 5,
    strict: false,
  },
  {
    name: "Quick sprint",
    detail: "15 min focus · 3 min break",
    focus: 15,
    rest: 3,
    strict: false,
  },
];
export default function ExtensionCompanion() {
  const [view, setView] = useState<View>("overview");
  const [status, setStatus] = useState<Status | null>(null);
  const [draft, setDraft] = useState<Settings>(normalizeStatus().settings);
  const [intent, setIntent] = useState("");
  const [error, setError] = useState("");
  const [notice, setNotice] = useState("");
  const [busy, setBusy] = useState(false);
  const [now, setNow] = useState(0);
  const [ruleHost, setRuleHost] = useState("");
  const [ruleMode, setRuleMode] = useState<"block" | "ask" | "allow">("block");
  const [url, setUrl] = useState("https://example.com");
  const [audit, setAudit] = useState<SiteAudit | null>(null);
  const [auditBusy, setAuditBusy] = useState(false);
  const [auditError, setAuditError] = useState("");
  const urlChecking = useRef(false);
  async function runUrlCheck(value: string) {
    if (urlChecking.current) return;
    urlChecking.current = true;
    setAuditBusy(true);
    setAudit(null);
    setAuditError("");
    try { setAudit(await checkUrl(value)); }
    catch (err) { setAuditError((err as Error).message); }
    finally { urlChecking.current = false; setAuditBusy(false); }
  }
  const inflight = useRef(
    new Map<
      string,
      {
        resolve: (data: Status) => void;
        reject: (error: Error) => void;
        timeout: ReturnType<typeof setTimeout>;
      }
    >(),
  );
  const locked = useRef(false);
  const initialized = useRef(false);
  const send = useCallback(
    (type: string, payload: Record<string, unknown> = {}) =>
      new Promise<Status>((resolve, reject) => {
        const requestId = crypto.randomUUID();
        const timeout = setTimeout(() => {
          inflight.current.delete(requestId);
          reject(
            new Error(
              "No response from FocusGuard. Open this page in Chrome, reload the extension, and allow site access for 127.0.0.1.",
            ),
          );
        }, 6000);
        inflight.current.set(requestId, { resolve, reject, timeout });
        window.postMessage(
          { source: "focusguard", type, requestId, ...payload },
          window.location.origin,
        );
      }),
    [],
  );
  const refresh = useCallback(async () => {
    try {
      const data = normalizeStatus(await send("GET_STATUS"));
      setStatus(data);
      setError("");
      if (!initialized.current) {
        setDraft(data.settings);
        setIntent(data.sessionIntent);
        initialized.current = true;
      }
    } catch (e) {
      setStatus(null);
      setError((e as Error).message);
    }
  }, [send]);
  useEffect(() => {
    const requests = inflight.current;
    const receive = (event: MessageEvent) => {
      if (
        event.source !== window ||
        event.origin !== location.origin ||
        event.data?.source !== "focusguard-extension"
      )
        return;
      const pending = requests.get(event.data.requestId);
      if (!pending) return;
      clearTimeout(pending.timeout);
      requests.delete(event.data.requestId);
      if (event.data.data?.success) pending.resolve(event.data.data);
      else
        pending.reject(
          new Error(
            event.data.data?.error ||
              "Extension not connected. Reload FocusGuard in Chrome.",
          ),
        );
    };
    window.addEventListener("message", receive);
    const initial = setTimeout(() => {
      setNow(Date.now());
      void refresh();
    }, 0);
    const timer = setInterval(() => setNow(Date.now()), 1000);
    const poll = setInterval(() => {
      if (
        !locked.current &&
        document.visibilityState === "visible" &&
        requests.size === 0
      )
        void refresh();
    }, 5000);
    return () => {
      window.removeEventListener("message", receive);
      clearTimeout(initial);
      clearInterval(timer);
      clearInterval(poll);
      for (const r of requests.values()) {
        clearTimeout(r.timeout);
        r.reject(new Error("Page closed"));
      }
      requests.clear();
    };
  }, [refresh]);
  async function perform(
    type: string,
    payload: Record<string, unknown>,
    message: string,
  ) {
    if (locked.current) return;
    locked.current = true;
    setBusy(true);
    setError("");
    setNotice("");
    try {
      const result = await send(type, payload);
      if (type !== "OPEN_DASHBOARD") {
        const data = normalizeStatus(result);
        setStatus(data);
        setDraft(data.settings);
      }
      setNotice(message);
    } catch (e) {
      setError((e as Error).message);
    } finally {
      locked.current = false;
      setBusy(false);
    }
  }
  const data = status || normalizeStatus();
  const active = data.isSessionActive;
  const connected = Boolean(status);
  const disabled = busy || !connected;
  const seconds =
    now && active
      ? data.phaseEndsAt
        ? Math.max(0, Math.ceil((data.phaseEndsAt - now) / 1000))
        : Math.max(0, Math.floor((now - (data.sessionStartMs || now)) / 1000))
      : 0;
  const chart = week(data.days, now || undefined);
  const chartMax = Math.max(
    data.settings.dailyGoalMinutes * 60,
    ...chart.map((d) => d.seconds),
    1,
  );
  const hostRows = Object.entries(data.today.byHost).sort(
    (a, b) => b[1] - a[1],
  );
  function exportReport(format: "csv" | "json") {
    if (!status) return;
    downloadText(
      format === "csv"
        ? csvHistory(status)
        : JSON.stringify(
            {
              exportedAt: new Date().toISOString(),
              days: status.days,
              sessions: status.sessions,
            },
            null,
            2,
          ),
      `focusguard-report.${format}`,
      format === "csv" ? "text/csv" : "application/json",
    );
    setNotice(`${format.toUpperCase()} report downloaded.`);
  }
  return (
    <div className={s.workspace}>
      <aside className={s.sidebar}>
        <Link className={s.brand} href="/">
          <span className={s.mark}>f.</span>FocusGuard
          <span className={s.version}>2.3</span>
        </Link>
        <p className={s.navLabel}>YOUR WORKSPACE</p>
        <nav aria-label="Workspace navigation">
          {views.map(([id, label, index]) => (
            <button
              key={id}
              className={`${s.navItem} ${view === id ? s.selected : ""}`}
              onClick={() => setView(id)}
              aria-current={view === id ? "page" : undefined}
            >
              <span>{index}</span>
              {label}
            </button>
          ))}
        </nav>
        <div className={s.sidebarBottom}>
          <span className={s.privacyIcon}>◎</span>
          <strong>Your data stays here.</strong>
          <p>Activity lives in this browser. Export it whenever you need.</p>
          <button
            disabled={disabled}
            onClick={() =>
              void perform("OPEN_DASHBOARD", {}, "Extension dashboard opened.")
            }
          >
            Open extension controls ↗
          </button>
        </div>
      </aside>
      <main className={s.main}>
        <div className={s.topbar}>
          <span>Personal browser workspace</span>
          <span className={s.connection}>
            <i className={connected ? s.online : ""} />
            {connected
              ? `Chrome connected${data.extensionVersion ? ` · v${data.extensionVersion}` : ""}`
              : "Waiting for Chrome"}
          </span>
        </div>
        <header className={s.heading}>
          <div>
            <p className={s.eyebrow}>
              {view === "overview"
                ? "A LITTLE LESS DISTRACTION"
                : "YOUR BROWSER, YOUR RULES"}
            </p>
            <h1>
              {view === "overview"
                ? "Make room for good work."
                : views.find((v) => v[0] === view)?.[1]}
            </h1>
            <p>
              {view === "overview"
                ? "Choose your task. Set your boundaries. Get on with it."
                : view === "rules"
                  ? "Decide which websites deserve your attention during a session."
                  : view === "reports"
                    ? "An honest record of your foreground browsing during focus sessions."
                    : "Inspect an address before opening it. All checks happen locally."}
            </p>
          </div>
          <span className={s.date}>
            {now
              ? new Date(now).toLocaleDateString(undefined, {
                  month: "short",
                  day: "numeric",
                  weekday: "short",
                })
              : "Your local day"}
          </span>
        </header>
        {connected && data.extensionVersion !== "2.3.0" && (
          <section className={s.connect}>
            <div>
              <strong>One update is ready for your installed extension.</strong>
              <p>
                Reload FocusGuard in <code>chrome://extensions</code>, then
                reload this page. Version 2.3.0 includes the offline URL model, task labels and
                extension controls.
              </p>
            </div>
          </section>
        )}
        {error && (
          <div className={s.alert} role="alert">
            {error}
          </div>
        )}
        {notice && (
          <div className={s.notice} role="status">
            {notice}
          </div>
        )}
        {!connected && (
          <section className={s.connect}>
            <div>
              <strong>Connect once, then work locally.</strong>
              <p>
                Load <code>Desktop/mj1/extension</code> in Chrome, grant site
                access for <code>127.0.0.1</code>, and open this page in that
                browser.
              </p>
            </div>
            <div className={s.buttonRow}>
              <a href="/focusguard-extension.zip" download>
                Download extension ↓
              </a>
              <button onClick={() => void refresh()} disabled={busy}>
                Reconnect ↻
              </button>
            </div>
          </section>
        )}
        {view === "overview" && (
          <>
            <section className={s.session}>
              <div className={s.sessionContent}>
                <p className={s.eyebrow}>
                  {active
                    ? data.phase === "break"
                      ? "TAKE A BREATH"
                      : "SESSION IN PROGRESS"
                    : "NEXT UP"}
                </p>
                <h2>
                  {active
                    ? data.sessionIntent || "A little uninterrupted time."
                    : "What will you work on?"}
                </h2>
                <label className={s.srOnly} htmlFor="task">
                  Session intention
                </label>
                <input
                  id="task"
                  value={active ? data.sessionIntent : intent}
                  onChange={(e) => setIntent(e.target.value)}
                  disabled={active}
                  maxLength={120}
                  placeholder="e.g. Finish the authentication module"
                />
                <div className={s.buttonRow}>
                  <button
                    className={s.primary}
                    disabled={disabled}
                    onClick={() =>
                      void perform(
                        "SET_SESSION_STATUS",
                        { active: !active, intent },
                        active
                          ? "Session saved to your reports."
                          : "Focus session started.",
                      )
                    }
                  >
                    {busy
                      ? "Updating…"
                      : active
                        ? "Finish session"
                        : "Start focus session"}
                    <span>→</span>
                  </button>
                  <span className={s.caption}>
                    {data.settings.pomodoro.enabled
                      ? `${data.settings.pomodoro.focusMin} min focus / ${data.settings.pomodoro.breakMin} min break`
                      : "Open-ended session"}
                  </span>
                </div>
              </div>
              <div className={s.timer}>
                <span>
                  {active
                    ? data.phase === "break"
                      ? "BREAK REMAINING"
                      : data.phaseEndsAt
                        ? "FOCUS REMAINING"
                        : "ELAPSED"
                    : "READY WHEN YOU ARE"}
                </span>
                <strong>
                  {active
                    ? `${String(Math.floor(seconds / 60)).padStart(2, "0")}:${String(seconds % 60).padStart(2, "0")}`
                    : `${String(data.settings.pomodoro.focusMin).padStart(2, "0")}:00`}
                </strong>
                <small>
                  {active
                    ? "Site rules follow the current phase"
                    : "One task. One session."}
                </small>
              </div>
            </section>
            <div className={s.presets}>
              {presets.map((p) => (
                <button
                  key={p.name}
                  disabled={disabled || active}
                  onClick={() =>
                    void perform(
                      "SET_SETTINGS",
                      {
                        settings: {
                          ...data.settings,
                          hardMode: p.strict,
                          pomodoro: {
                            enabled: true,
                            focusMin: p.focus,
                            breakMin: p.rest,
                          },
                        },
                      },
                      `${p.name} settings applied.`,
                    )
                  }
                >
                  <strong>
                    {p.name}
                    <span>↗</span>
                  </strong>
                  <span>{p.detail}</span>
                </button>
              ))}
            </div>
            <div className={s.metrics}>
              <section>
                <span>Active focus today</span>
                <strong>{duration(data.today.focusSeconds)}</strong>
                <small>Foreground browsing only</small>
              </section>
              <section>
                <span>Daily target</span>
                <strong>
                  {data.goalProgress}
                  <em>%</em>
                </strong>
                <progress
                  value={data.goalProgress}
                  max={100}
                  aria-label="Daily goal progress"
                />
                <small>{data.settings.dailyGoalMinutes} minutes planned</small>
              </section>
              <section>
                <span>Tab switches</span>
                <strong>{data.today.tabSwitches}</strong>
                <small>{data.today.interruptions} rapid-switch reminders</small>
              </section>
            </div>
            <div className={s.split}>
              <section className={s.panel}>
                <div className={s.panelHeader}>
                  <h2>This week</h2>
                  <span>FOCUS MINUTES</span>
                </div>
                <div
                  className={s.chart}
                  role="img"
                  aria-label={chart
                    .map(
                      (d) =>
                        `${d.label}: ${Math.round(d.seconds / 60)} minutes`,
                    )
                    .join(", ")}
                >
                  {chart.map((d) => (
                    <div className={s.barColumn} key={d.key}>
                      <span>{Math.round(d.seconds / 60)}</span>
                      <div className={s.barTrack}>
                        <div
                          style={{
                            height: `${Math.max(2, (d.seconds / chartMax) * 100)}%`,
                            background: d.seconds ? undefined : "#ebe8e2",
                          }}
                        />
                      </div>
                      <small>{d.label}</small>
                    </div>
                  ))}
                </div>
                <p className={s.footnote}>
                  Counts active focus browsing; breaks and idle time are
                  excluded.
                </p>
              </section>
              <section className={s.panel}>
                <div className={s.panelHeader}>
                  <h2>Today by site</h2>
                  <button onClick={() => setView("reports")}>
                    Full report →
                  </button>
                </div>
                {hostRows.length ? (
                  hostRows.slice(0, 5).map(([host, time]) => (
                    <div className={s.listRow} key={host}>
                      <span>{host}</span>
                      <strong>{duration(time)}</strong>
                    </div>
                  ))
                ) : (
                  <p className={s.empty}>
                    Your first session will tell a story here.
                    <br />
                    Start a session and browse to record activity.
                  </p>
                )}
              </section>
            </div>
          </>
        )}
        {view === "rules" && (
          <>
            <section className={s.panel}>
              <div className={s.panelHeader}>
                <h2>Website boundaries</h2>
                <span>{Object.keys(data.settings.siteRules).length} RULES</span>
              </div>
              <form
                className={s.ruleForm}
                onSubmit={(e) => {
                  e.preventDefault();
                  const host = ruleHost
                    .trim()
                    .toLowerCase()
                    .replace(/^www\./, "");
                  void perform(
                    "SET_SETTINGS",
                    {
                      settings: {
                        ...data.settings,
                        siteRules: {
                          ...data.settings.siteRules,
                          [host]: ruleMode,
                        },
                      },
                    },
                    `Rule saved for ${host}.`,
                  );
                }}
              >
                <label className={s.srOnly} htmlFor="host">
                  Website domain
                </label>
                <input
                  id="host"
                  placeholder="youtube.com"
                  value={ruleHost}
                  onChange={(e) => setRuleHost(e.target.value)}
                  required
                />
                <label className={s.srOnly} htmlFor="mode">
                  Rule mode
                </label>
                <select
                  id="mode"
                  value={ruleMode}
                  onChange={(e) =>
                    setRuleMode(e.target.value as typeof ruleMode)
                  }
                >
                  <option value="block">Block</option>
                  <option value="ask">Ask first</option>
                  <option value="allow">Allow</option>
                </select>
                <button className={s.primary} disabled={disabled}>
                  Add rule +
                </button>
              </form>
              {Object.entries(data.settings.siteRules).map(([host, mode]) => (
                <div className={s.ruleRow} key={host}>
                  <strong>{host}</strong>
                  <select
                    aria-label={`Mode for ${host}`}
                    disabled={disabled}
                    value={mode}
                    onChange={(e) =>
                      void perform(
                        "SET_SETTINGS",
                        {
                          settings: {
                            ...data.settings,
                            siteRules: {
                              ...data.settings.siteRules,
                              [host]: e.target.value,
                            },
                          },
                        },
                        `Updated ${host}.`,
                      )
                    }
                  >
                    <option value="block">Block</option>
                    <option value="ask">Ask first</option>
                    <option value="allow">Allow</option>
                  </select>
                  <button
                    disabled={disabled}
                    aria-label={`Remove ${host}`}
                    onClick={() => {
                      const rules = { ...data.settings.siteRules };
                      delete rules[host];
                      void perform(
                        "SET_SETTINGS",
                        { settings: { ...data.settings, siteRules: rules } },
                        `Removed ${host}.`,
                      );
                    }}
                  >
                    Remove
                  </button>
                </div>
              ))}
              <p className={s.footnote}>
                Rules include subdomains. A more specific rule wins. Rule edits
                apply immediately without restarting your session.
              </p>
            </section>
            <form
              className={s.panel}
              onSubmit={(e) => {
                e.preventDefault();
                void perform(
                  "SET_SETTINGS",
                  { settings: draft },
                  "Preferences saved.",
                );
              }}
            >
              <h2>Session preferences</h2>
              <div className={s.fields}>
                {(
                  [
                    ["dailyGoalMinutes", "Daily goal (minutes)", 15, 600],
                    ["allowMinutes", "Temporary access (minutes)", 1, 240],
                    ["rapidSwitchThreshold", "Switches in 10 seconds", 2, 50],
                  ] as const
                ).map(([key, label, min, max]) => (
                  <label key={key}>
                    {label}
                    <input
                      type="number"
                      min={min}
                      max={max}
                      required
                      value={draft[key]}
                      onChange={(e) =>
                        setDraft({ ...draft, [key]: Number(e.target.value) })
                      }
                    />
                  </label>
                ))}
                <label>
                  Focus length
                  <input
                    type="number"
                    min={1}
                    max={180}
                    required
                    value={draft.pomodoro.focusMin}
                    onChange={(e) =>
                      setDraft({
                        ...draft,
                        pomodoro: {
                          ...draft.pomodoro,
                          focusMin: Number(e.target.value),
                        },
                      })
                    }
                  />
                </label>
                <label>
                  Break length
                  <input
                    type="number"
                    min={1}
                    max={60}
                    required
                    value={draft.pomodoro.breakMin}
                    onChange={(e) =>
                      setDraft({
                        ...draft,
                        pomodoro: {
                          ...draft.pomodoro,
                          breakMin: Number(e.target.value),
                        },
                      })
                    }
                  />
                </label>
              </div>
              {(
                [
                  ["hardMode", "Strict blocking: disable temporary bypass"],
                  ["notifications", "Show focus / break notifications"],
                ] as const
              ).map(([key, label]) => (
                <label className={s.checkbox} key={key}>
                  <input
                    type="checkbox"
                    checked={draft[key]}
                    onChange={(e) =>
                      setDraft({ ...draft, [key]: e.target.checked })
                    }
                  />
                  {label}
                </label>
              ))}
              <label className={s.checkbox}>
                <input
                  type="checkbox"
                  checked={draft.pomodoro.enabled}
                  onChange={(e) =>
                    setDraft({
                      ...draft,
                      pomodoro: {
                        ...draft.pomodoro,
                        enabled: e.target.checked,
                      },
                    })
                  }
                />
                Cycle automatically between focus and break
              </label>
              <button className={s.primary} disabled={disabled}>
                Save preferences
              </button>
              <p className={s.footnote}>
                Changing cycle lengths restarts the current phase. Other
                preferences keep the timer running.
              </p>
            </form>
          </>
        )}
        {view === "reports" && (
          <>
            <section className={s.panel}>
              <div className={s.panelHeader}>
                <h2>Session journal</h2>
                <div className={s.buttonRow}>
                  <button
                    disabled={disabled}
                    onClick={() => exportReport("csv")}
                  >
                    Download CSV ↓
                  </button>
                  <button
                    disabled={disabled}
                    onClick={() => exportReport("json")}
                  >
                    Download JSON ↓
                  </button>
                </div>
              </div>
              {data.sessions.length ? (
                data.sessions.map((session) => (
                  <div
                    className={s.historyRow}
                    key={`${session.start}-${session.end}`}
                  >
                    <div>
                      <strong>{session.intent || "Focus session"}</strong>
                      <span>{new Date(session.start).toLocaleString()}</span>
                    </div>
                    <strong>{duration(session.focusSeconds)}</strong>
                  </div>
                ))
              ) : (
                <p className={s.empty}>
                  No completed sessions yet. Finish a session to add it to the
                  journal.
                </p>
              )}
            </section>
            <section className={s.panel}>
              <h2>Browsing breakdown</h2>
              {hostRows.map(([host, time]) => (
                <div className={s.listRow} key={host}>
                  <span>{host}</span>
                  <strong>{duration(time)}</strong>
                </div>
              ))}
              <p className={s.footnote}>
                30 days of local activity and the latest 100 completed sessions.
                Exports contain domain totals and session labels, never full
                browsing URLs.
              </p>
              <button
                disabled={disabled}
                onClick={() =>
                  void perform(
                    "OPEN_DASHBOARD",
                    {},
                    "Extension dashboard opened.",
                  )
                }
              >
                Manage local history ↗
              </button>
            </section>
          </>
        )}
        {view === "check" && (
          <section className={s.panel}>
            <p className={s.eyebrow}>LOOK BEFORE YOU CLICK</p>
            <h2>A closer look at the link.</h2>
            <p className={s.footnote}>
              Inspect the destination and run your local phishing model. No site
              is opened, and the address stays in this browser.
            </p>
            <form className={s.ruleForm} onSubmit={(event) => {
              event.preventDefault();
              void runUrlCheck(url);
            }}>
              <label className={s.srOnly} htmlFor="url">Website address to check</label>
              <input id="url" type="text" inputMode="url" autoCapitalize="none"
                spellCheck={false} required maxLength={2048} value={url} disabled={auditBusy}
                onChange={(event) => { setUrl(event.target.value); setAudit(null); setAuditError(""); }}
                placeholder="example.com or https://example.com" />
              <button className={s.primary} disabled={auditBusy}>
                {auditBusy ? "Checking…" : "Check address →"}
              </button>
            </form>
            <div className={s.checkExamples} aria-label="Example addresses">
              <span>Try a sample</span>
              {[
                ["Ordinary link", "https://example.com"],
                ["Hidden destination", "https://accounts.example.com@203.0.113.15/login"],
                ["Shortened link", "https://bit.ly/demo"],
              ].map(([label, value]) => (
                <button key={label} disabled={auditBusy} onClick={() => { setUrl(value); void runUrlCheck(value); }}>{label}</button>
              ))}
            </div>
            {auditError && <div className={s.alert} role="alert">{auditError}</div>}
            {audit && (
              <div className={s.audit} aria-live="polite">
                <p className={s.eyebrow}>{audit.assessment}</p>
                <h3>{audit.host}</h3>
                <p>This is the actual hostname in the address.</p>
                <div className={s.checkStats}>
                  <div><span>Connection</span><strong>{audit.encrypted ? "HTTPS" : "HTTP"}</strong></div>
                  <div><span>Address length</span><strong>{audit.metrics.length} characters</strong></div>
                  <div><span>Path depth</span><strong>{audit.metrics.pathSegments} segments</strong></div>
                </div>
                {audit.flags.length ? audit.flags.map((flag) => (
                  <div className={s.signal} key={flag.text}><span>{flag.level}</span>{flag.text}</div>
                )) : <p>No warning signals found in the address. HTTPS and a clean URL do not establish that a site is safe.</p>}
                {audit.model && (
                  <div className={s.modelResult}>
                    <p className={s.eyebrow}>OFFLINE PHISHING MODEL · EXPERIMENTAL</p>
                    <h4>{audit.model.summary}</h4>
                    {audit.model.lower !== undefined && audit.model.upper !== undefined && (
                      <>
                        <p className={s.scoreRange}>Possible phishing score <strong>{Math.floor(audit.model.lower * 100)}–{Math.ceil(audit.model.upper * 100)}%</strong></p>
                        <p>{audit.model.trees} decision trees · {audit.model.observed} of {audit.model.total} input features observed from the address.</p>
                      </>
                    )}
                    <p>{audit.model.detail}</p>
                  </div>
                )}
                <div className={s.buttonRow}>
                  <button onClick={() => downloadText(JSON.stringify({ checkedAt: new Date().toISOString(), ...audit }, null, 2), "focusguard-url-check.json", "application/json")}>Download check report ↓</button>
                  <button disabled={disabled} onClick={() => { setRuleHost(audit.host); setRuleMode("block"); setView("rules"); }}>Use this domain in a rule →</button>
                </div>
              </div>
            )}
            <p className={s.footnote}>
              Uses the random forest from your mlp02 project. Only lexical
              features are observed; website content, certificate validation,
              redirects and reputation are not checked. Model scores have not
              been validated for live URLs. No API key is needed.
            </p>
          </section>
        )}
        <footer className={s.footer}>
          <span>FocusGuard / personal browser workspace</span>
          <span>Built around your attention. Stored in your browser.</span>
        </footer>
      </main>
    </div>
  );
}
