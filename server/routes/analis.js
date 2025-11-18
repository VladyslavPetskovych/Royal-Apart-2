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
    console.log("=== 🌍 START /prices/update ===");

    let { lcode, pid, dfrom, dto } = req.body;
    console.log("📥 Request body:", req.body);

    if (!lcode || pid === undefined || !dfrom || !dto) {
      console.log("❌ Missing parameters");
      return res.status(400).json({
        error: "lcode, pid, dfrom, dto are required",
      });
    }

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

    console.log("\n\n==============================");
    console.log("📤 XML SENT TO WUBOOK:");
    console.log(xml);
    console.log("==============================\n\n");

    const response = await axios.post("https://wired.wubook.net/xrws/", xml, {
      headers: { "Content-Type": "text/xml" },
    });

    console.log("\n\n==============================");
    console.log("📥 RAW XML RESPONSE FROM WUBOOK:");
    console.log(response.data);
    console.log("==============================\n\n");

    const json = await parseStringPromise(response.data, {
      explicitArray: false,
    });

    console.log("\n\n==============================");
    console.log("📦 PARSED JSON FROM WUBOOK:");
    console.dir(json, { depth: 15 });
    console.log("==============================\n\n");

    const root = json?.methodResponse?.params?.param?.value?.array?.data?.value;

    if (!root) {
      console.log("❌ ERROR: root array missing in WuBook response");
      return res.status(500).json({
        success: false,
        message: "Invalid WuBook structure (no root)",
      });
    }

    const arr = Array.isArray(root) ? root : [root];
    const struct = arr[1]?.struct;

    if (!struct || !struct.member) {
      console.log("❌ ERROR: WuBook returned no prices (empty struct)");
      return res.json({ success: false, message: "No prices returned" });
    }

    let members = struct.member;
    if (!Array.isArray(members)) members = [members];

    console.log("\n=== 🏢 WUBOOK MEMBERS (rooms returned): ===");
    members.forEach((m, i) => {
      console.log(
        `#${i + 1} → RAW m.name:`,
        m.name,
        "| typeof:",
        typeof m.name
      );
    });
    console.log("==========================================\n");

    const db = mongoose.connection.useDb("apartments");
    const allRooms = await db.collection("wodoo_aparts").find({}).toArray();

    console.log(
      "\n=== 🏠 ALL ROOMS FROM MONGO (count:",
      allRooms.length,
      ") ==="
    );
    allRooms.forEach((r) => {
      console.log(
        `Mongo: name=${r.name} | wdid=${r.wdid} | globalId=${r.globalId} | wubid=${r.wubid}`
      );
    });
    console.log("==============================================\n");

    const mapByWdid = {};
    const mapByGlobalId = {};
    const mapByWubid = {};

    allRooms.forEach((r) => {
      if (r.wdid) mapByWdid[String(r.wdid).trim()] = r.name;
      if (r.globalId) mapByGlobalId[String(r.globalId).trim()] = r.name;
      if (r.wubid) mapByWubid[String(r.wubid).trim()] = r.name;
    });

    console.log("\n=== 🗂️ MAPPING TABLES BUILT ===");
    console.log("mapByWdid:", mapByWdid);
    console.log("mapByGlobalId:", mapByGlobalId);
    console.log("mapByWubid:", mapByWubid);
    console.log("================================\n");

    function generateDatesDDMMYYYY(startStr, count) {
      const [day, month, year] = startStr.split("/");
      let d = new Date(`${year}-${month}-${day}T00:00:00`);

      const dates = [];
      for (let i = 0; i < count; i++) {
        dates.push(
          `${String(d.getDate()).padStart(2, "0")}/${String(
            d.getMonth() + 1
          ).padStart(2, "0")}/${d.getFullYear()}`
        );
        d.setDate(d.getDate() + 1);
      }
      return dates;
    }

    const rows = [];

    console.log("\n=== 🔍 MATCHING ROOMS (WuBook → Mongo) ===");

    members.forEach((m, index) => {
      let wubookIdRaw;
      if (typeof m.name === "object" && m.name._ !== undefined) {
        wubookIdRaw = m.name._;
      } else {
        wubookIdRaw = m.name;
      }

      const wdid = String(wubookIdRaw).trim();

      console.log(`\n[ROOM ${index + 1}]`);
      console.log("  → WuBook ID RAW:", wubookIdRaw);
      console.log("  → Normalized WDID:", wdid);

      // 🔥 Три спроби знайти назву
      const roomName =
        mapByWdid[wdid] || mapByGlobalId[wdid] || mapByWubid[wdid] || "";

      console.log("  → MATCHED NAME:", roomName || "(EMPTY)");
      console.log("-------------------------------------");

      const values = m?.value?.array?.data?.value;
      if (!values) return;

      const priceNodes = Array.isArray(values) ? values : [values];
      const priceNums = priceNodes.map((v) => Number(v.double));

      const dates = generateDatesDDMMYYYY(dfrom, priceNums.length);

      dates.forEach((date, i) => {
        rows.push({
          roomId: wdid,
          roomName,
          date,
          price: priceNums[i] ?? null,
        });
      });
    });

    console.log("\n=== 📊 TOTAL ROWS TO SAVE:", rows.length, " ===");

    const fs = require("fs");
    const dir = path.join(__dirname, "../data2025");
    if (!fs.existsSync(dir)) fs.mkdirSync(dir, { recursive: true });

    const csvPath = path.join(dir, "tarifPrice.csv");

    const header = "roomId,roomName,date,price\n";
    const body = rows
      .map((r) => `${r.roomId},"${r.roomName}",${r.date},${r.price}`)
      .join("\n");

    fs.writeFileSync(csvPath, header + body, "utf8");

    console.log("\n=== ✅ CSV SAVED TO:", csvPath, " ===");

    res.json({
      success: true,
      message: "All apartment prices saved to CSV",
      file: csvPath,
      rows: rows.length,
      apartments: members.length,
    });
  } catch (err) {
    console.error("❌ ERROR in /prices/update:", err);
    res.status(500).json({
      error: "Internal error",
      details: err.message,
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
