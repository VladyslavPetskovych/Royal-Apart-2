const axios = require("axios");
const { parseStringPromise } = require("xml2js");
const { parseFlexibleDate, toWuBookDate, rangeDatesISO } = require("./dateUtils");

const API_BASE = process.env.WUBOOK_API_BASE || "https://kapi.wubook.net";
const XMLRPC_URL = process.env.WUBOOK_XMLRPC_URL || "https://wired.wubook.net/xrws/";

async function fetchProducts(apiKey = process.env.WUBOOK_API_KEY, http = axios) {
  if (!apiKey) {
    throw new Error("Missing WUBOOK_API_KEY");
  }

  const response = await http.post(`${API_BASE}/kp/property/fetch_products`, {}, {
    headers: {
      "x-api-key": apiKey,
      "Content-Type": "application/json",
    },
    timeout: 20000,
  });

  return response.data;
}

function buildFetchPlanPricesXML({ token, lcode, planId, dateFrom, dateTo }) {
  return `<?xml version="1.0"?>
<methodCall>
  <methodName>fetch_plan_prices</methodName>
  <params>
    <param><value><string>${token}</string></value></param>
    <param><value><int>${lcode}</int></value></param>
    <param><value><int>${planId}</int></value></param>
    <param><value><string>${dateFrom}</string></value></param>
    <param><value><string>${dateTo}</string></value></param>
  </params>
</methodCall>`;
}

function parsePlanPricesXml(xmlString, planId, dateFrom, dateTo) {
  return parseStringPromise(xmlString, { explicitArray: false }).then((json) => {
    const root = json?.methodResponse?.params?.param?.value?.array?.data?.value;
    if (!root) return [];

    const values = Array.isArray(root) ? root : [root];
    const struct = values[1]?.struct;
    if (!struct?.member) return [];

    const members = Array.isArray(struct.member) ? struct.member : [struct.member];
    const dates = rangeDatesISO(dateFrom, dateTo);
    const out = [];

    for (const member of members) {
      const roomCode = String(typeof member.name === "object" ? member.name._ : member.name || "").trim();
      const valueNodes = member?.value?.array?.data?.value;
      const priceNodes = Array.isArray(valueNodes) ? valueNodes : valueNodes ? [valueNodes] : [];
      priceNodes.forEach((node, idx) => {
        const tariff = Number(node.double ?? node.int ?? node.i4 ?? node ?? 0);
        if (!Number.isFinite(tariff)) return;
        out.push({
          date: dates[idx] || dates[0],
          room_code: roomCode,
          plan_id: Number(planId),
          tariff_price: tariff,
        });
      });
    }

    return out;
  });
}

async function fetchPlanPrices(
  { token, lcode, planId, dateFrom, dateTo },
  http = axios
) {
  if (!token) throw new Error("Missing WUBOOK_TOKEN");
  if (lcode === undefined || lcode === null) throw new Error("Missing WUBOOK_LCODE");
  if (!planId && planId !== 0) throw new Error("Missing planId");

  const from = toWuBookDate(parseFlexibleDate(dateFrom));
  const to = toWuBookDate(parseFlexibleDate(dateTo));
  if (!from || !to) throw new Error("Invalid date range");

  const xml = buildFetchPlanPricesXML({
    token,
    lcode: Number(lcode),
    planId: Number(planId),
    dateFrom: from,
    dateTo: to,
  });

  let response;
  try {
    response = await http.post(XMLRPC_URL, xml, {
      headers: { "Content-Type": "text/xml" },
      timeout: 20000,
    });
  } catch (error) {
    const message = error?.response?.data || error.message;
    throw new Error(`WuBook XML-RPC request failed: ${message}`);
  }

  const prices = await parsePlanPricesXml(response.data, Number(planId), dateFrom, dateTo);
  return prices;
}

module.exports = {
  fetchProducts,
  fetchPlanPrices,
  parsePlanPricesXml,
};
