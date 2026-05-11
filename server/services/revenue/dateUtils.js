function pad2(value) {
  return String(value).padStart(2, "0");
}

function excelSerialToDate(value) {
  const serial = Number(value);
  if (!Number.isFinite(serial)) return null;
  const utcDays = serial - 25569;
  const utcValue = utcDays * 86400;
  const parsed = new Date(utcValue * 1000);
  return Number.isNaN(parsed.getTime()) ? null : parsed;
}

function parseFlexibleDate(input) {
  if (!input && input !== 0) return null;

  if (input instanceof Date) {
    return Number.isNaN(input.getTime()) ? null : input;
  }

  if (typeof input === "number") {
    return excelSerialToDate(input);
  }

  const raw = String(input).trim();
  if (!raw) return null;

  if (/^\d+$/.test(raw) && raw.length >= 5) {
    return excelSerialToDate(Number(raw));
  }

  const dotOrSlashMatch = raw.match(/^(\d{1,2})[./](\d{1,2})[./](\d{4})$/);
  if (dotOrSlashMatch) {
    const day = Number(dotOrSlashMatch[1]);
    const month = Number(dotOrSlashMatch[2]);
    const year = Number(dotOrSlashMatch[3]);
    const d = new Date(Date.UTC(year, month - 1, day));
    return Number.isNaN(d.getTime()) ? null : d;
  }

  const iso = new Date(raw);
  return Number.isNaN(iso.getTime()) ? null : iso;
}

function toISODate(input) {
  const d = parseFlexibleDate(input);
  if (!d) return null;
  return d.toISOString().slice(0, 10);
}

function toWuBookDate(input) {
  const d = parseFlexibleDate(input);
  if (!d) return null;
  return `${pad2(d.getUTCDate())}/${pad2(d.getUTCMonth() + 1)}/${d.getUTCFullYear()}`;
}

function rangeDatesISO(fromInput, toInput) {
  const from = parseFlexibleDate(fromInput);
  const to = parseFlexibleDate(toInput);
  if (!from || !to) return [];
  const cursor = new Date(Date.UTC(from.getUTCFullYear(), from.getUTCMonth(), from.getUTCDate()));
  const end = new Date(Date.UTC(to.getUTCFullYear(), to.getUTCMonth(), to.getUTCDate()));
  const items = [];
  while (cursor <= end) {
    items.push(cursor.toISOString().slice(0, 10));
    cursor.setUTCDate(cursor.getUTCDate() + 1);
  }
  return items;
}

module.exports = {
  parseFlexibleDate,
  toISODate,
  toWuBookDate,
  rangeDatesISO,
};
