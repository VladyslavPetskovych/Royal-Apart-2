const test = require("node:test");
const assert = require("node:assert/strict");
const { toISODate, toWuBookDate } = require("../services/revenue/dateUtils");

test("parses DD.MM.YYYY into ISO", () => {
  assert.equal(toISODate("15.03.2025"), "2025-03-15");
});

test("parses DD/MM/YYYY into WuBook format", () => {
  assert.equal(toWuBookDate("15/03/2025"), "15/03/2025");
});
