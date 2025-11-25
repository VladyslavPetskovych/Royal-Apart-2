// routes/wubook.js
const express = require("express");
const axios = require("axios");
const router = express.Router();
const path = require("path");
const XLSX = require("xlsx");
const mongoose = require("../db");
const { parseStringPromise } = require("xml2js");

const WUBOOK_TOKEN = "wr_9fd536d9-2894-441a-85eb-4b1a670e2ff2";

router.post("/tarifPrices/update", async (req, res) => {
  try {
    console.log("=== 🚀 START FULL YEAR PRICE FETCH ===");

    const startDate = "01/09/2024";
    const endDate = "01/09/2025";

    let { lcode, pid } = req.body;

    if (!lcode || pid === undefined) {
      return res.status(400).json({
        error: "lcode and pid are required",
      });
    }

    const fs = require("fs");
    const path = require("path");
    const mongoose = require("mongoose");
    const { parseStringPromise } = require("xml2js");

    const dir = path.join(__dirname, "../data2025");
    if (!fs.existsSync(dir)) fs.mkdirSync(dir, { recursive: true });

    const csvPath = path.join(dir, "tarifPrice.csv");

    // якщо файл НЕ існує – створюємо заголовки
    if (!fs.existsSync(csvPath)) {
      fs.writeFileSync(csvPath, "roomId,roomName,date,price\n", "utf8");
    }

    // --- функції -------------------------------------------------

    function toDate(str) {
      const [d, m, y] = str.split("/");
      return new Date(`${y}-${m}-${d}T00:00:00`);
    }

    function addDays(date, days) {
      const d = new Date(date);
      d.setDate(d.getDate() + days);
      return d;
    }

    function format(d) {
      return `${String(d.getDate()).padStart(2, "0")}/${String(
        d.getMonth() + 1
      ).padStart(2, "0")}/${d.getFullYear()}`;
    }

    // --- головний цикл -------------------------------------------

    let current = toDate(startDate);
    const finish = toDate(endDate);

    let totalRows = 0;
    let requestCount = 0;

    while (current < finish) {
      const dfrom = format(current);
      const dto = format(addDays(current, 6)); // 7 днів

      requestCount++;
      console.log(
        `\n===== 📅 REQUEST #${requestCount} | ${dfrom} → ${dto} =====`
      );

      // --- 🔥 XML запит до WuBook ---
      const xml = `<?xml version="1.0"?>
        <methodCall>
          <methodName>fetch_plan_prices</methodName>
          <params>
            <param><value><string>${WUBOOK_TOKEN}</string></value></param>
            <param><value><int>${lcode}</int></value></param>
            <param><value><int>${pid}</int></value></param>
            <param><value><string>${dfrom}</string></value></param>
            <param><value><string>${dto}</string></value></param>
          </params>
        </methodCall>`;

      const response = await axios.post("https://wired.wubook.net/xrws/", xml, {
        headers: { "Content-Type": "text/xml" },
      });

      const json = await parseStringPromise(response.data, {
        explicitArray: false,
      });

      const root =
        json?.methodResponse?.params?.param?.value?.array?.data?.value;

      if (!root) {
        console.log("❌ WuBook returned empty root");
        current = addDays(current, 7);
        continue;
      }

      const arr = Array.isArray(root) ? root : [root];
      const struct = arr[1]?.struct;

      if (!struct || !struct.member) {
        console.log("❌ No rooms returned this week");
        current = addDays(current, 7);
        continue;
      }

      let members = struct.member;
      if (!Array.isArray(members)) members = [members];

      // --- читаємо дані з Mongo один раз -------------------------
      const db = mongoose.connection.useDb("apartments");
      const allRooms = await db.collection("wodoo_aparts").find({}).toArray();

      const mapByWdid = {};
      allRooms.forEach((r) => {
        if (r.wdid) mapByWdid[String(r.wdid).trim()] = r.name;
      });

      const rowsToAppend = [];

      // --- парсимо ціни ------------------------------------------
      members.forEach((m) => {
        let raw = typeof m.name === "object" ? m.name._ : m.name;
        const wdid = String(raw).trim();
        const roomName = mapByWdid[wdid] || "";

        const values = m?.value?.array?.data?.value;
        if (!values) return;

        const priceNodes = Array.isArray(values) ? values : [values];
        const prices = priceNodes.map((v) => Number(v.double));

        for (let i = 0; i < prices.length; i++) {
          const date = format(addDays(current, i));
          let price = prices[i] ?? null;

          const [d, mth] = date.split("/").map(Number);

          const isNewYearPeriod =
            (mth === 12 && d >= 27) || 
            (mth === 1 && d <= 5); 

          if (price > 9000 && !isNewYearPeriod) {
            console.log(`⚠️ Завищена ціна ${price} на ${date} → записуємо ""`);
            price = ""; // <===== ТЕПЕР ТУТ ПУСТЕ ЗНАЧЕННЯ
          }

          rowsToAppend.push(`${wdid},"${roomName}",${date},${price}`);
        }
      });

      // --- запис у CSV -------------------------------------------
      fs.appendFileSync(csvPath, rowsToAppend.join("\n") + "\n", "utf8");

      totalRows += rowsToAppend.length;

      console.log(
        `✓ Week saved: ${dfrom} → ${dto} | +${rowsToAppend.length} rows`
      );

      // рухаємося вперед на 7 днів
      current = addDays(current, 7);
    }

    res.json({
      success: true,
      message: "Full year price sync complete",
      weeks: requestCount,
      rows: totalRows,
      file: csvPath,
    });
  } catch (err) {
    console.error(err);
    res.status(500).json({
      success: false,
      error: err.message,
    });
  }
});

router.get("/tarifPrices/get", async (req, res) => {
  try {
    const fs = require("fs");
    const path = require("path");

    const csvPath = path.join(__dirname, "../data2025/tarifPrice.csv");

    if (!fs.existsSync(csvPath)) {
      return res.status(404).json({
        success: false,
        error: "Price CSV file not found",
      });
    }

    const csv = fs.readFileSync(csvPath, "utf8").trim();
    const lines = csv.split("\n");

    // заголовки
    const headers = lines[0].split(",");

    // розбір CSV з лапками
    const parseCSVLine = (line) => {
      const result = [];
      let current = "";
      let insideQuotes = false;

      for (let i = 0; i < line.length; i++) {
        const char = line[i];

        if (char === '"' && line[i + 1] === '"') {
          current += '"';
          i++;
        } else if (char === '"') {
          insideQuotes = !insideQuotes;
        } else if (char === "," && !insideQuotes) {
          result.push(current);
          current = "";
        } else {
          current += char;
        }
      }
      result.push(current);
      return result;
    };

    const items = lines.slice(1).map((line) => {
      const cols = parseCSVLine(line);

      return {
        roomId: cols[0],
        roomName: cols[1],
        date: cols[2],
        price: Number(cols[3]),
      };
    });

    return res.json({
      success: true,
      rows: items.length,
      prices: items,
    });
  } catch (err) {
    console.error("CSV Read Error:", err.message);
    res.status(500).json({ success: false, error: "Failed to read CSV file" });
  }
});

router.get("/realPrices/data", (req, res) => {
  try {
    const { dfrom, dto } = req.query;

    if (!dfrom || !dto) {
      return res.status(400).json({ error: "Missing dfrom / dto" });
    }

    const startLimit = new Date(dfrom);
    const endLimit = new Date(dto);

    const filePath = path.join(__dirname, "../data2025/realPrice.csv");

    const workbook = XLSX.readFile(filePath);
    const sheetName = workbook.SheetNames[0];
    const sheet = workbook.Sheets[sheetName];

    const rawRows = XLSX.utils.sheet_to_json(sheet, { defval: "" });

    const rows = rawRows.map((r) => ({
      ...r,
      From: excelDateToJSDate(r.From),
      To: excelDateToJSDate(r.To),
      Created: excelDateToJSDate(r.Created),
      Cancellation: excelDateToJSDate(r.Cancellation),
    }));

    const days = {};

    rows.forEach((row) => {
      if (!row.From) return;

      const f = new Date(row.From);

      // 🔥 включаємо тільки ті бронювання, де From всередині обраного періоду
      if (f < startLimit || f > endLimit) return;

      if (!days[row.From]) days[row.From] = [];

      days[row.From].push(row);
    });

    res.json({ ok: true, days });
  } catch (err) {
    console.error("❌ FULL ERROR:", err);
    res.status(500).json({ error: err.message });
  }
});

function excelDateToJSDate(serial) {
  if (!serial || isNaN(serial)) return null;

  const utc_days = serial - 25569;
  const utc_value = utc_days * 86400;
  const date_info = new Date(utc_value * 1000);

  const year = date_info.getFullYear();
  const month = String(date_info.getMonth() + 1).padStart(2, "0");
  const day = String(date_info.getDate()).padStart(2, "0");

  return `${year}-${month}-${day}`;
}

module.exports = router;
