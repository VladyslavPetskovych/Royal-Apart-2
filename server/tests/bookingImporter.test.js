const test = require("node:test");
const assert = require("node:assert/strict");
const { normalizeBookingRow } = require("../services/revenue/bookingImporter");

test("normalizes booking import row", () => {
  const row = {
    Code: "ABC",
    "Id Wubook": "123",
    Status: "Confirmed",
    Created: "01.04.2025",
    From: "10.04.2025",
    To: "12.04.2025",
    Nights: "2",
    "Room Code": "RM01",
    "Room Name": "Room 1",
    "Type Code": "STD",
    "Type Name": "Standard",
    "Row Type": "ROOM",
    Price: "3200",
    "Room daily price": "1600",
    Adults: "2",
  };
  const normalized = normalizeBookingRow(row, "test.csv");

  assert.equal(normalized.code, "ABC");
  assert.equal(normalized.wubook_id, "123");
  assert.equal(normalized.room_code, "RM01");
  assert.equal(normalized.room_type_code, "STD");
  assert.equal(normalized.row_type, "ROOM");
  assert.equal(normalized.room_daily_price, 1600);
  assert.equal(normalized.total_price, 3200);
});
