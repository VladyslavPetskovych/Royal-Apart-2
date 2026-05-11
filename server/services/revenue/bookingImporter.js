const fs = require("fs");
const path = require("path");
const XLSX = require("xlsx");
const Booking = require("../../models/booking");
const { parseFlexibleDate } = require("./dateUtils");

const SUPPORTED_EXT = new Set([".csv", ".xlsx", ".xls"]);

function buildKeyIndex(row) {
  const index = {};
  Object.keys(row || {}).forEach((k) => {
    index[String(k).trim().toLowerCase()] = k;
  });
  return index;
}

function pickField(row, aliases = []) {
  const keyIndex = buildKeyIndex(row);
  for (const alias of aliases) {
    const direct = row?.[alias];
    if (direct !== undefined) return direct;
    const found = keyIndex[String(alias).trim().toLowerCase()];
    if (found !== undefined) return row[found];
  }
  return "";
}

function toNumber(value, fallback = 0) {
  if (value === null || value === undefined || value === "") return fallback;
  const normalized = String(value).replace(",", ".").trim();
  const n = Number(normalized);
  return Number.isFinite(n) ? n : fallback;
}

function normalizeBookingRow(row, sourceFile = "") {
  const fromRaw = pickField(row, ["From", "CheckIn", "Arrival", "Date From"]);
  const toRaw = pickField(row, ["To", "CheckOut", "Departure", "Date To"]);
  const createdRaw = pickField(row, ["Created", "Creation", "Booked At"]);
  const cancelledRaw = pickField(row, ["Cancellation", "Cancelled", "Canceled"]);

  const fromDate = parseFlexibleDate(fromRaw);
  const toDate = parseFlexibleDate(toRaw);
  const createdAt = parseFlexibleDate(createdRaw);
  const cancelledAt = parseFlexibleDate(cancelledRaw);

  return {
    code: pickField(row, ["Code", "Booking Code"])
      ? String(pickField(row, ["Code", "Booking Code"])).trim()
      : "",
    wubook_id: pickField(row, ["Id Wubook", "Id Wuboo", "Wubook Id", "ID WuBook"])
      ? String(
          pickField(row, ["Id Wubook", "Id Wuboo", "Wubook Id", "ID WuBook"])
        ).trim()
      : "",
    status: pickField(row, ["Status"]) ? String(pickField(row, ["Status"])).trim() : "",
    created_at: createdAt,
    cancelled_at: cancelledAt,
    from_date: fromDate,
    to_date: toDate,
    nights: toNumber(pickField(row, ["Nights"]), 0),
    room_code: pickField(row, ["Room Code", "RoomCode"])
      ? String(pickField(row, ["Room Code", "RoomCode"])).trim()
      : "",
    room_name: pickField(row, ["Room Name", "RoomName"])
      ? String(pickField(row, ["Room Name", "RoomName"])).trim()
      : "",
    room_type_code: pickField(row, ["Type Code", "TypeCode"])
      ? String(pickField(row, ["Type Code", "TypeCode"])).trim()
      : "",
    room_type_name: pickField(row, ["Type Name", "TypeName"])
      ? String(pickField(row, ["Type Name", "TypeName"])).trim()
      : "",
    row_type: pickField(row, ["Row Type", "RowType"])
      ? String(pickField(row, ["Row Type", "RowType"])).trim()
      : "",
    total_price: toNumber(pickField(row, ["Price", "Total", "TOTAL"]), 0),
    room_daily_price: toNumber(
      pickField(row, ["Room daily price", "Room Daily Price", "Daily Price"]),
      0
    ),
    adults: toNumber(pickField(row, ["Adults"]), 0),
    teens: toNumber(pickField(row, ["Teens"]), 0),
    children: toNumber(pickField(row, ["Children"]), 0),
    board: pickField(row, ["Board"]) ? String(pickField(row, ["Board"])).trim() : "",
    policy: pickField(row, ["Policy"]) ? String(pickField(row, ["Policy"])).trim() : "",
    agency: pickField(row, ["Agency"]) ? String(pickField(row, ["Agency"])).trim() : "",
    country: pickField(row, ["Country"]) ? String(pickField(row, ["Country"])).trim() : "",
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

  const invalidReasons = {
    missing_code: 0,
    missing_from_date: 0,
    missing_to_date: 0,
    missing_room_code: 0,
    missing_row_type: 0,
  };
  const valid = [];
  normalized.forEach((b) => {
    let isValid = true;
    if (!b.code) {
      invalidReasons.missing_code++;
      isValid = false;
    }
    if (!b.from_date) {
      invalidReasons.missing_from_date++;
      isValid = false;
    }
    if (!b.to_date) {
      invalidReasons.missing_to_date++;
      isValid = false;
    }
    if (!b.room_code) {
      invalidReasons.missing_room_code++;
      isValid = false;
    }
    if (!b.row_type) {
      invalidReasons.missing_row_type++;
      isValid = false;
    }
    if (isValid) valid.push(b);
  });

  if (!valid.length) {
    return {
      imported: 0,
      skipped: normalized.length,
      totalRows: normalized.length,
      invalid_reasons: invalidReasons,
      detected_columns: rows?.[0] ? Object.keys(rows[0]) : [],
    };
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
    invalid_reasons: invalidReasons,
    detected_columns: rows?.[0] ? Object.keys(rows[0]) : [],
  };
}

module.exports = {
  normalizeBookingRow,
  parseBookingFile,
  importBookingsFromFile,
};
