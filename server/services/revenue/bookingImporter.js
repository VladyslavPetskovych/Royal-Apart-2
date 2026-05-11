const fs = require("fs");
const path = require("path");
const XLSX = require("xlsx");
const Booking = require("../../models/booking");
const { parseFlexibleDate } = require("./dateUtils");

const SUPPORTED_EXT = new Set([".csv", ".xlsx", ".xls"]);

function toNumber(value, fallback = 0) {
  if (value === null || value === undefined || value === "") return fallback;
  const normalized = String(value).replace(",", ".").trim();
  const n = Number(normalized);
  return Number.isFinite(n) ? n : fallback;
}

function normalizeBookingRow(row, sourceFile = "") {
  const fromDate = parseFlexibleDate(row.From);
  const toDate = parseFlexibleDate(row.To);
  const createdAt = parseFlexibleDate(row.Created);
  const cancelledAt = parseFlexibleDate(row.Cancellation);

  return {
    code: row.Code ? String(row.Code).trim() : "",
    wubook_id: row["Id Wubook"] ? String(row["Id Wubook"]).trim() : "",
    status: row.Status ? String(row.Status).trim() : "",
    created_at: createdAt,
    cancelled_at: cancelledAt,
    from_date: fromDate,
    to_date: toDate,
    nights: toNumber(row.Nights, 0),
    room_code: row["Room Code"] ? String(row["Room Code"]).trim() : "",
    room_name: row["Room Name"] ? String(row["Room Name"]).trim() : "",
    room_type_code: row["Type Code"] ? String(row["Type Code"]).trim() : "",
    room_type_name: row["Type Name"] ? String(row["Type Name"]).trim() : "",
    row_type: row["Row Type"] ? String(row["Row Type"]).trim() : "",
    total_price: toNumber(row.Price, 0),
    room_daily_price: toNumber(row["Room daily price"], 0),
    adults: toNumber(row.Adults, 0),
    teens: toNumber(row.Teens, 0),
    children: toNumber(row.Children, 0),
    board: row.Board ? String(row.Board).trim() : "",
    policy: row.Policy ? String(row.Policy).trim() : "",
    agency: row.Agency ? String(row.Agency).trim() : "",
    country: row.Country ? String(row.Country).trim() : "",
    source_file: sourceFile,
    raw: row,
  };
}

function parseCsv(content) {
  const workbook = XLSX.read(content, { type: "string" });
  const sheet = workbook.Sheets[workbook.SheetNames[0]];
  return XLSX.utils.sheet_to_json(sheet, { defval: "" });
}

function parseBookingFile(filePath, originalName = filePath) {
  const ext = path.extname(originalName).toLowerCase();
  if (!SUPPORTED_EXT.has(ext)) {
    throw new Error(`Unsupported file extension: ${ext}`);
  }

  if (ext === ".csv") {
    const raw = fs.readFileSync(filePath, "utf8");
    return parseCsv(raw);
  }

  const workbook = XLSX.readFile(filePath);
  const sheet = workbook.Sheets[workbook.SheetNames[0]];
  return XLSX.utils.sheet_to_json(sheet, { defval: "" });
}

async function importBookingsFromFile(filePath, sourceName = filePath) {
  const rows = parseBookingFile(filePath, sourceName);
  const sourceFile = path.basename(sourceName);
  const normalized = rows.map((r) => normalizeBookingRow(r, sourceFile));

  const valid = normalized.filter(
    (b) => b.code && b.from_date && b.to_date && b.room_code && b.row_type
  );

  if (!valid.length) {
    return { imported: 0, skipped: normalized.length };
  }

  const ops = valid.map((doc) => ({
    updateOne: {
      filter: {
        code: doc.code,
        from_date: doc.from_date,
        to_date: doc.to_date,
        room_code: doc.room_code,
        row_type: doc.row_type,
      },
      update: { $set: doc },
      upsert: true,
    },
  }));

  await Booking.bulkWrite(ops, { ordered: false });

  return {
    imported: valid.length,
    skipped: normalized.length - valid.length,
    totalRows: normalized.length,
  };
}

module.exports = {
  normalizeBookingRow,
  parseBookingFile,
  importBookingsFromFile,
};
