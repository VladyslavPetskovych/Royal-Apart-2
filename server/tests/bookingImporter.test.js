const test = require("node:test");
const assert = require("node:assert/strict");
const fs = require("fs");
const os = require("os");
const path = require("path");
const {
  normalizeBookingRow,
  parseBookingFile,
} = require("../services/revenue/bookingImporter");

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

test("normalizes row with alternative header aliases", () => {
  const row = {
    Code: "PV-0028",
    "Id Wuboo": "17455551",
    Status: "Cancelled",
    Created: "01/04/2025",
    CheckIn: "10/04/2025",
    To: "12/04/2025",
    "Room Code": "Ricarda",
    RowType: "ROOM",
    Price: "5500",
  };
  const normalized = normalizeBookingRow(row, "aliases.csv");
  assert.equal(normalized.wubook_id, "17455551");
  assert.equal(normalized.from_date instanceof Date, true);
  assert.equal(normalized.row_type, "ROOM");
});

test("maps BOM+quoted Code header", () => {
  const row = {
    '\uFEFF"Code"': "PV-0028",
    From: "01.04.2025",
    To: "02.04.2025",
    "Row Type": "TOTAL",
    "Type Code": "kt16",
  };
  const normalized = normalizeBookingRow(row, "bom.csv");
  assert.equal(normalized.code, "PV-0028");
});

test("parses csv by original filename even when temp file has no extension", () => {
  const tempPath = path.join(os.tmpdir(), `booking-upload-${Date.now()}`);
  const csvContent = "Code,From,To,Room Code,Row Type\nA1,01.04.2025,02.04.2025,RM1,ROOM\n";
  fs.writeFileSync(tempPath, csvContent, "utf8");
  try {
    const rows = parseBookingFile(tempPath, "bookings.csv");
    assert.equal(rows.length, 1);
    assert.equal(rows[0].Code, "A1");
  } finally {
    fs.unlinkSync(tempPath);
  }
});
