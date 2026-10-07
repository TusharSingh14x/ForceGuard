import { test } from "node:test";
import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import { auditUrl, checkUrl, extractModelFeatures, forestBounds, predictForest, validateForest } from "../url-check.mjs";
const model = validateForest(JSON.parse(await readFile(new URL("../models/url-forest.json", import.meta.url), "utf8")));
const fixture = JSON.parse(await readFile(new URL("./fixtures/forest-parity.json", import.meta.url), "utf8"));
const urlFixture = JSON.parse(await readFile(new URL("./fixtures/url-features-parity.json", import.meta.url), "utf8"));

test("accepts bare domains and ports but rejects malformed and executable inputs", () => {
  assert.equal(auditUrl(" example.com ").host, "example.com");
  assert.equal(auditUrl("example.com:8080/path").host, "example.com");
  assert.equal(auditUrl("//example.com/path").encrypted, true);
  for (const bad of ["", "https:///example.com", "http:example.com", "javascript:alert(1)", "javascript:1234", "mailto:1234", "data:text/html,x", "file:///etc/passwd", "chrome://settings", "https://bad_host.com", "https://example.com:99999", "https://exa mple.com", "https://example.com\\@evil.com", "x".repeat(2049)])
    assert.throws(() => auditUrl(bad), bad);
});
test("reports actual destination, credentials and shorteners without disclosing path/query secrets", () => {
  const result = auditUrl("https://accounts.example.com:secret@evil.test/login?token=private");
  assert.equal(result.host, "evil.test");
  assert.equal(result.level, "high");
  assert.ok(!JSON.stringify(result).includes("secret"));
  assert.ok(!JSON.stringify(result).includes("private"));
  assert.equal(auditUrl("https://bit.ly/demo").level, "medium");
  assert.equal(auditUrl("https://notbit.ly/demo").level, "none");
  assert.ok(auditUrl("https://xn--pple-43d.com").flags.some((flag) => flag.text.includes("lookalike")));
});
test("HTTPS alone is never treated as a safety verdict and internal sites skip ML", async () => {
  const result = await checkUrl("https://127.0.0.1:3000", () => { throw new Error("Must not load"); });
  assert.equal(result.model.status, "skipped");
  assert.equal(result.encrypted, true);
  const normal = await checkUrl("example.com", async () => model);
  assert.equal(normal.model.status, "experimental");
  assert.equal(normal.model.observed, 8);
  assert.equal(normal.model.total, 30);
  assert.ok(!JSON.stringify(normal).includes('"safe"'));
});
test("browser forest matches sklearn predictions on 128 varied feature vectors", () => {
  assert.equal(model.sourceSha256, fixture.sourceSha256);
  assert.equal(fixture.inputs.length, 128);
  fixture.inputs.forEach((values, index) => {
    assert.ok(Math.abs(predictForest(model, values) - fixture.phishingScores[index]) < 1e-12);
    const complete = forestBounds(model, Object.fromEntries(values.map((value, i) => [i, value])));
    assert.ok(Math.abs(complete.lower - fixture.phishingScores[index]) < 1e-12);
    assert.ok(Math.abs(complete.upper - complete.lower) < 1e-12);
  });
});
test("URL feature port matches the supplied Python extractor on accepted inputs", () => {
  for (const row of urlFixture) assert.deepEqual(extractModelFeatures(row.url), row.features, row.url);
});
test("unknown-feature bounds contain all compatible complete predictions", () => {
  const selected = [0, 1, 2, 3, 4, 5, 6, 11];
  const features = extractModelFeatures("https://example.com");
  const observed = Object.fromEntries(selected.map((index) => [index, features[index]]));
  const bounds = forestBounds(model, observed);
  assert.ok(bounds.lower >= 0 && bounds.upper <= 1 && bounds.upper >= bounds.lower);
  for (const sample of fixture.inputs) {
    const values = [...sample];
    selected.forEach((index) => { values[index] = features[index]; });
    const score = predictForest(model, values);
    assert.ok(score >= bounds.lower - 1e-12 && score <= bounds.upper + 1e-12);
  }
});
test("tree bounds respect repeated tests of the same unknown feature", () => {
  const forest = { trees: [[
    [1, 4, 0, 0, 0],
    [2, 3, 0, 0.5, 0],
    [-1, -1, -2, -2, 0.2],
    [-1, -1, -2, -2, 1], // Cannot be reached after feature <= 0.
    [-1, -1, -2, -2, 0.3],
  ]] };
  assert.deepEqual(forestBounds(forest, {}), { lower: 0.2, upper: 0.3 });
});
test("model failure preserves address findings and explicitly reports missing inference", async () => {
  const result = await checkUrl("http://example.com", async () => { throw new Error("offline"); });
  assert.equal(result.model.status, "unavailable");
  assert.equal(result.flags[0].level, "medium");
  assert.equal(result.model.lower, undefined);
});
test("rejects unsupported, non-finite and cyclic model data", () => {
  assert.throws(() => validateForest({ ...model, classes: [1, 0] }));
  assert.throws(() => validateForest({ ...model, trees: [[[0, 0, 0, 0, 0.5]]] }));
  assert.throws(() => predictForest(model, Array(30).fill(NaN)));
});
