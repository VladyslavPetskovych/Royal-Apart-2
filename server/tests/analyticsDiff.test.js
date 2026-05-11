const test = require("node:test");
const assert = require("node:assert/strict");
const { calculateDiff } = require("../services/revenue/analyticsService");

test("calculates diff percent correctly", () => {
  const result = calculateDiff(90, 100);
  assert.equal(result.diff_amount, -10);
  assert.equal(result.diff_percent, -10);
  assert.equal(result.is_below_tariff, true);
  assert.equal(result.is_above_tariff, false);
});
