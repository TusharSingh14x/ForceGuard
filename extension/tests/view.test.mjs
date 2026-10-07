import { test } from "node:test";
import assert from "node:assert/strict";
import { normalizeStatus, csvHistory, auditUrl, week } from "../view.mjs";
test("older and invalid states always produce finite progress", () => {
  for (const input of [
    {},
    { settings: { dailyGoalMinutes: undefined } },
    { settings: { dailyGoalMinutes: 0 }, today: { focusSeconds: Infinity } },
    { settings: { dailyGoalMinutes: 90 }, today: { focusSeconds: NaN } },
  ]) {
    const status = normalizeStatus(input);
    assert.ok(Number.isFinite(status.goalProgress));
    assert.ok(status.goalProgress >= 0 && status.goalProgress <= 100);
    assert.equal(status.settings.dailyGoalMinutes, 90);
  }
});
test("daily goals use actual focused seconds and clamp at 100 percent", () => {
  assert.equal(
    normalizeStatus({
      settings: { dailyGoalMinutes: 60 },
      today: { focusSeconds: 1800 },
    }).goalProgress,
    50,
  );
  assert.equal(
    normalizeStatus({
      settings: { dailyGoalMinutes: 60 },
      today: { focusSeconds: 9000 },
    }).goalProgress,
    100,
  );
});
test("exports quote labels and neutralize spreadsheet formulas", () => {
  const csv = csvHistory({
    sessions: [{ start: 0, intent: '=HYPERLINK("x")', focusSeconds: 30 }],
    days: { "2026-10-07": { byHost: { "example.com": 50 } } },
  });
  assert.ok(csv.includes('"\'=HYPERLINK(""x"")"'));
  assert.ok(csv.includes('"Website","2026-10-07","example.com","50"'));
});
test("URL review rejects executable schemes and never includes credential text in output", () => {
  assert.throws(() => auditUrl("javascript:alert(1)"));
  const result = auditUrl(
    "http://user:secret@127.0.0.1:8080/private?token=secret",
  );
  assert.equal(result.encrypted, false);
  assert.equal(result.host, "127.0.0.1");
  assert.equal(result.flags.length, 4);
  assert.ok(!JSON.stringify(result).includes("secret"));
});
test("week series includes empty days and uses local dates", () => {
  const now = new Date(2026, 9, 7, 12).getTime();
  const points = week({ "2026-10-07": { focusSeconds: 120 } }, now);
  assert.equal(points.length, 7);
  assert.equal(points.at(-1).seconds, 120);
  assert.equal(points[0].key, "2026-10-01");
});
