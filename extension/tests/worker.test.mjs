import { test } from "node:test";
import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import { initialState, startSession } from "../core.mjs";
const event = () => ({
  listeners: [],
  addListener(fn) {
    this.listeners.push(fn);
  },
});
const stored = {};
const sent = [];
const opened = [];
const now = Date.now();
const saved = initialState(now - 10000);
startSession(saved, now - 10000);
saved.tracking = { host: "example.com", tabId: 1, at: now - 10000 };
stored.focusguardV2 = saved;
const active = { id: 1, url: "https://example.com", active: true };
globalThis.chrome = {
  runtime: {
    id: "test-extension",
    getURL: (p) => "chrome-extension://test-extension/" + p,
    onMessage: event(),
    onStartup: event(),
    onInstalled: event(),
  },
  storage: {
    local: {
      get: async () => structuredClone(stored),
      set: async (values) => Object.assign(stored, structuredClone(values)),
      setAccessLevel: async () => {},
    },
  },
  alarms: { create: async () => {}, onAlarm: event() },
  action: {
    setBadgeText: async () => {},
    setBadgeBackgroundColor: async () => {},
  },
  notifications: { create: async () => {} },
  tabs: {
    create: async (data) => opened.push(data),
    query: async () => [active],
    sendMessage: async (id, data) => {
      sent.push({ id, data });
    },
    onActivated: event(),
    onUpdated: event(),
  },
  windows: {
    getLastFocused: async () => ({ focused: true }),
    onFocusChanged: event(),
  },
  idle: { queryState: async () => "active", onStateChanged: event() },
};
await import("../background.js");
const extension = {
  id: "test-extension",
  url: "chrome-extension://test-extension/dashboard.html",
};
const page = {
  id: "test-extension",
  url: "https://example.com",
  frameId: 0,
  tab: active,
};
function message(data, sender = extension) {
  return new Promise((resolve) =>
    chrome.runtime.onMessage.listeners[0](data, sender, resolve),
  );
}
test("cold worker restores active session and accounts checkpoint", async () => {
  const res = await message({ type: "GET_STATUS" });
  assert.equal(res.isSessionActive, true);
  assert.ok(res.today.focusSeconds >= 9);
});
test("ordinary pages cannot read history or control sessions", async () => {
  const res = await message({ type: "GET_STATUS" }, page);
  assert.equal(res.sessions, undefined);
  assert.equal(res.days, undefined);
  assert.equal(
    (
      await message(
        { type: "SET_SESSION_STATUS_INTERNAL", active: false },
        page,
      )
    ).success,
    false,
  );
  assert.equal((await message({ type: "CLEAR_HISTORY" }, page)).success, false);
});
test("supported localhost companion can control a session", async () => {
  const sender = { ...page, url: "http://localhost:3000/protected" };
  const res = await message(
    { type: "SET_SESSION_STATUS", active: false },
    sender,
  );
  assert.equal(res.isSessionActive, false);
  assert.ok(
    sent.some((s) => s.data.type === "SESSION_STATUS" && !s.data.active),
  );
});
test("rules remain removed after persistence and malformed rules are rejected", async () => {
  const settings = { ...stored.focusguardV2.settings, siteRules: {} };
  assert.equal(
    (await message({ type: "SET_SETTINGS", settings })).success,
    true,
  );
  assert.deepEqual(stored.focusguardV2.settings.siteRules, {});
  assert.equal(
    (
      await message({
        type: "SET_SETTINGS",
        settings: { ...settings, siteRules: { "bad/path": "block" } },
      })
    ).success,
    false,
  );
});
test("strict blocking cannot be bypassed by the content response", async () => {
  await message({
    type: "SET_SETTINGS",
    settings: {
      ...stored.focusguardV2.settings,
      hardMode: true,
      siteRules: { "example.com": "block" },
    },
  });
  await message({ type: "SET_SESSION_STATUS_INTERNAL", active: true });
  assert.equal((await message({ type: "ALLOW_HOST" }, page)).success, false);
});
test("all declared extension entrypoints exist", async () => {
  const manifest = JSON.parse(
    await readFile(new URL("../manifest.json", import.meta.url), "utf8"),
  );
  for (const file of [
    manifest.background.service_worker,
    manifest.action.default_popup,
    manifest.options_page,
    manifest.icons["128"],
    ...manifest.content_scripts.flatMap((s) => s.js),
  ])
    assert.ok(
      (await readFile(new URL("../" + file, import.meta.url))).length > 0,
    );
  assert.equal(manifest.permissions.includes("scripting"), false);
});

test("rule changes preserve the active phase deadline", async () => {
  const before = await message({ type: "GET_STATUS" });
  const result = await message({
    type: "SET_SETTINGS",
    settings: { ...before.settings, siteRules: { "example.com": "ask" } },
  });
  assert.equal(result.success, true);
  assert.equal(result.phaseEndsAt, before.phaseEndsAt);
});
test("session labels are private and retained in the journal", async () => {
  await message({ type: "SET_SESSION_STATUS", active: false });
  await message({
    type: "SET_SESSION_STATUS",
    active: true,
    intent: "Authentication module",
  });
  assert.equal(
    (await message({ type: "GET_STATUS" })).sessionIntent,
    "Authentication module",
  );
  assert.equal(
    (await message({ type: "GET_STATUS" }, page)).sessionIntent,
    undefined,
  );
  const done = await message({ type: "SET_SESSION_STATUS", active: false });
  assert.equal(done.sessions[0].intent, "Authentication module");
});
test("website controls require an extension context", async () => {
  assert.equal(
    (await message({ type: "GET_ACTIVE_DOMAIN" })).domain,
    "example.com",
  );
  assert.equal(
    (await message({ type: "GET_ACTIVE_DOMAIN" }, page)).success,
    false,
  );
  assert.equal(
    (await message({ type: "GET_ACTIVE_SITE_AUDIT" }, page)).success,
    false,
  );
  assert.equal(
    (await message({ type: "OPEN_DASHBOARD" }, page)).success,
    false,
  );
  assert.equal((await message({ type: "OPEN_DASHBOARD" })).success, true);
  assert.equal(
    opened.at(-1).url,
    "chrome-extension://test-extension/dashboard.html",
  );
});

test("active-site ML check is extension-only and fetches only its bundled model", async () => {
  const requests = [];
  const originalFetch = globalThis.fetch;
  globalThis.fetch = async (path) => {
    requests.push(path);
    assert.equal(path, "chrome-extension://test-extension/models/url-forest.json");
    return { ok: true, json: async () => JSON.parse(await readFile(new URL("../models/url-forest.json", import.meta.url), "utf8")) };
  };
  try {
    assert.equal((await message({ type: "GET_ACTIVE_SITE_AUDIT" }, page)).success, false);
    assert.equal(requests.length, 0);
    const result = await message({ type: "GET_ACTIVE_SITE_AUDIT" });
    assert.equal(result.success, true);
    assert.equal(result.siteAudit.host, "example.com");
    assert.equal(result.siteAudit.model.status, "experimental");
    assert.equal(result.siteAudit.model.trees, 128);
    assert.equal(requests.length, 1);
  } finally { globalThis.fetch = originalFetch; }
});
