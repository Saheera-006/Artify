import test from "node:test";
import assert from "node:assert/strict";
import { getScore, sortSubmissions } from "../src/utils/scores.js";
import { getRoundState, getRoundStateLabel } from "../src/utils/rounds.js";
import { timestampToMillis, formatDate } from "../src/utils/dates.js";
import { getExtension, isValidRegisterNumber } from "../src/utils/files.js";

test("final marks override manual marks, which override AI marks", () => {
  assert.equal(getScore({ finalScore: 0, marks: 50, aiScore: 90 }), 0);
  assert.equal(getScore({ marks: 50, aiScore: 90 }), 50);
  assert.equal(getScore({ aiScore: 90 }), 90);
  assert.equal(getScore({}), null);
});
test("equal scores use earliest submission as tie breaker without mutating input", () => {
  const items = [
    { name: "late", marks: 80, submittedAt: { seconds: 20 } },
    { name: "early", marks: 80, submittedAt: { seconds: 10 } },
  ];
  assert.equal(sortSubmissions(items, "marks")[0].name, "early");
  assert.equal(items[0].name, "late");
});
test("round access is controlled by existing enabled flag, not date guesses", () => {
  assert.equal(getRoundState({ enabled: true }), "active");
  assert.equal(getRoundState({ enabled: false }), "disabled");
  assert.equal(getRoundState(null), "none");
  assert.equal(getRoundStateLabel({ enabled: true }), "OPEN");
});
test("Firebase timestamps and Dates remain supported", () => {
  assert.equal(timestampToMillis({ toMillis: () => 1234 }), 1234);
  assert.equal(timestampToMillis({ seconds: 2 }), 2000);
  assert.equal(timestampToMillis(new Date(3000)), 3000);
  assert.equal(formatDate(null), "—");
});
test("registration number requires twelve digits", () => {
  assert.equal(isValidRegisterNumber("123456789012"), true);
  for (const value of ["123", "12345678901x", "1234567890123"])
    assert.equal(isValidRegisterNumber(value), false);
});
test("upload extensions are case insensitive", () =>
  assert.equal(getExtension("design.PDF"), "pdf"));
