import { test } from "node:test";
import assert from "node:assert/strict";
import {
  initialState,
  cleanSettings,
  ruleForHost,
  startSession,
  stopSession,
  flushTime,
  advancePhase,
  decision,
  today,
  recordSwitch,
  trustedDashboard,
  prune,
} from "../core.mjs";
test("removed default rules stay removed", () =>
  assert.deepEqual(
    cleanSettings({ ...initialState().settings, siteRules: {} }).siteRules,
    {},
  ));
test("host rules match subdomains without suffix spoofing", () => {
  const rules = { "youtube.com": "block", "studio.youtube.com": "allow" };
  assert.equal(ruleForHost("www.youtube.com", rules), "block");
  assert.equal(ruleForHost("studio.youtube.com", rules), "allow");
  assert.equal(ruleForHost("notyoutube.com", rules), null);
});
test("settings reject malformed hosts and unbounded durations", () => {
  assert.throws(() => cleanSettings({ allowMinutes: Infinity }));
  assert.throws(() =>
    cleanSettings({ siteRules: { "youtube.com/path": "block" } }),
  );
});
test("only exact localhost companion origins are trusted", () => {
  assert.equal(trustedDashboard("http://localhost:3000/extension"), true);
  assert.equal(trustedDashboard("http://localhost:3000.evil.com"), false);
  assert.equal(trustedDashboard("https://example.com"), false);
});
test("temporary allows expire and break phases bypass blocking", () => {
  const s = initialState();
  startSession(s, 1000);
  s.allowUntil["reddit.com"] = 2000;
  assert.equal(decision(s, "reddit.com", 1500), null);
  assert.equal(decision(s, "reddit.com", 2100), "block");
  s.phase = "break";
  assert.equal(decision(s, "reddit.com", 2100), null);
});
test("foreground time is counted once and suspension gaps are capped", () => {
  const n = new Date(2026, 9, 7, 10).getTime();
  const s = initialState(n);
  startSession(s, n);
  s.tracking.host = "example.com";
  flushTime(s, n + 10000);
  assert.equal(today(s, n).focusSeconds, 10);
  flushTime(s, n + 10000);
  assert.equal(today(s, n).focusSeconds, 10);
  flushTime(s, n + 300000);
  assert.equal(today(s, n).focusSeconds, 70);
});
test("idle and break time are not recorded", () => {
  const n = new Date(2026, 9, 7, 10).getTime();
  const s = initialState(n);
  startSession(s, n);
  flushTime(s, n + 30000);
  s.tracking.host = "example.com";
  s.phase = "break";
  flushTime(s, n + 60000);
  assert.equal(today(s, n).focusSeconds, 0);
});
test("pomodoro ends focus at deadline and resumes one phase after sleep", () => {
  const n = new Date(2026, 9, 7, 10).getTime();
  const s = initialState(n);
  s.settings.pomodoro.focusMin = 1;
  startSession(s, n);
  s.tracking.host = "example.com";
  flushTime(s, n + 90000);
  assert.equal(today(s, n).focusSeconds, 60);
  assert.equal(advancePhase(s, n + 90000), true);
  assert.equal(s.phase, "break");
  assert.equal(advancePhase(s, n + 90000), false);
});
test("duplicate start is idempotent and stop records a session once", () => {
  const n = Date.now();
  const s = initialState(n);
  startSession(s, n);
  startSession(s, n + 1000);
  assert.equal(s.sessionStartMs, n);
  stopSession(s, n + 2000);
  stopSession(s, n + 3000);
  assert.equal(s.sessions.length, 1);
});
test("reloads do not count as tab switches and history is bounded", () => {
  const s = initialState();
  s.tracking.tabId = 1;
  startSession(s, Date.now());
  assert.equal(recordSwitch(s, 1, Date.now()), false);
  assert.equal(today(s).tabSwitches, 0);
  for (let i = 1; i <= 31; i++) s.days[String(i).padStart(2, "0")] = {};
  prune(s, Date.now());
  assert.equal(Object.keys(s.days).length, 30);
});
