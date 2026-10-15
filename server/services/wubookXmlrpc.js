// Minimal WuBook XML-RPC client (read-only methods used by /adminStats)
// https://tdocs.wubook.net/wired/
const axios = require("axios");
const { parseStringPromise } = require("xml2js");

const XMLRPC_URL = process.env.WUBOOK_XMLRPC_URL || "https://wired.wubook.net/xrws/";
// Same resolution as routes/revenue.js (legacy token kept as fallback until it is rotated)
const TOKEN =
  process.env.WUBOOK_TOKEN ||
  process.env.WUBOOK_XMLRPC_TOKEN ||
  process.env.WUBOOK_WR_TOKEN ||
  "wr_9fd536d9-2894-441a-85eb-4b1a670e2ff2";
const LCODE = Number(process.env.WUBOOK_LCODE || process.env.WUBOOK_PROPERTY_LCODE || 1638349860);

const escapeXml = (s) =>
  String(s).replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;");

const encodeParam = (value) =>
  Number.isInteger(value)
    ? `<param><value><int>${value}</int></value></param>`
    : `<param><value><string>${escapeXml(value)}</string></value></param>`;

// xml2js (explicitArray: false) node -> plain JS value
const decode = (node) => {
  if (node === undefined || node === null) return null;
  if (typeof node !== "object") return node;
  const type = Object.keys(node)[0];
  const inner = node[type];
  switch (type) {
    case "struct": {
      const members = inner && inner.member ? [].concat(inner.member) : [];
      return Object.fromEntries(members.map((m) => [m.name, decode(m.value)]));
    }
    case "array": {
      const values = inner && inner.data && inner.data.value;
      return values === undefined ? [] : [].concat(values).map(decode);
    }
    case "int":
    case "i4":
    case "double":
      return Number(inner);
    case "boolean":
      return inner === "1";
    default:
      return typeof inner === "object" ? "" : inner;
  }
};

const call = async (method, ...params) => {
  const body = `<?xml version="1.0"?><methodCall><methodName>${method}</methodName><params>${params
    .map(encodeParam)
    .join("")}</params></methodCall>`;
  const response = await axios.post(XMLRPC_URL, body, {
    headers: { "Content-Type": "text/xml" },
    timeout: 60000,
  });
  const json = await parseStringPromise(response.data, { explicitArray: false });
  if (json?.methodResponse?.fault) throw new Error(`WuBook ${method}: fault`);
  return decode(json?.methodResponse?.params?.param?.value);
};

// Most methods return [code, payload]; code 0 = success
const callChecked = async (method, ...params) => {
  const result = await call(method, ...params);
  if (!Array.isArray(result)) throw new Error(`WuBook ${method}: unexpected response`);
  const [code, payload] = result;
  if (Number(code) !== 0) throw new Error(`WuBook ${method}: error ${code} ${String(payload).slice(0, 200)}`);
  return payload;
};

// { roomId: [ { avail, booked, closed, price, ... } per day ] }
const fetchRoomsValues = (dfrom, dto) => callChecked("fetch_rooms_values", TOKEN, LCODE, dfrom, dto);

// Reservations (max 120 per call per WuBook docs). oncreated=1 -> filter by creation date
const fetchBookings = async (dfrom, dto, oncreated = 1) => {
  const result = await callChecked("fetch_bookings", TOKEN, LCODE, dfrom, dto, oncreated, 0);
  return Array.isArray(result) ? result : [];
};

// { ctype: { name, ... } } — global catalogue, not property specific
const getChannelsInfo = async () => {
  const result = await call("get_channels_info", TOKEN);
  if (Array.isArray(result)) {
    if (Number(result[0]) !== 0) throw new Error("WuBook get_channels_info failed");
    return result[1] || {};
  }
  return result || {};
};

module.exports = { fetchRoomsValues, fetchBookings, getChannelsInfo, decode, LCODE };
