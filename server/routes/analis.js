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
            (mth === 12 && d >= 27) || (mth === 1 && d <= 5);

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

// Новий ендпоінт для отримання актуальних цін з WuBook API
router.get("/tarifPrices/current", async (req, res) => {
  try {
    const { parseStringPromise } = require("xml2js");

    // Обчислюємо дати: 2 дні до сьогодні і 4 дні після
    const today = new Date();
    const startDate = new Date(today);
    startDate.setDate(today.getDate() - 2);
    const endDate = new Date(today);
    endDate.setDate(today.getDate() + 4);

    // Форматуємо дати для WuBook (DD/MM/YYYY)
    const formatDate = (date) => {
      const day = String(date.getDate()).padStart(2, "0");
      const month = String(date.getMonth() + 1).padStart(2, "0");
      const year = date.getFullYear();
      return `${day}/${month}/${year}`;
    };

    const dfrom = formatDate(startDate);
    const dto = formatDate(endDate);

    console.log(`📅 Запит актуальних цін: ${dfrom} → ${dto}`);

    // Отримуємо lcode та pid з бази або використовуємо значення за замовчуванням
    const db = mongoose.connection.useDb("apartments");
    const sampleRoom = await db.collection("wodoo_aparts").findOne({
      lcode: { $exists: true },
      pid: { $exists: true },
    });

    const lcode = sampleRoom?.lcode || 1638349860; // Значення за замовчуванням з forecast.js
    const pid = sampleRoom?.pid ?? 0;

    // XML запит до WuBook
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

    const root = json?.methodResponse?.params?.param?.value?.array?.data?.value;
    if (!root) {
      return res.status(500).json({
        success: false,
        error: "WuBook returned empty response",
      });
    }

    const arr = Array.isArray(root) ? root : [root];
    const struct = arr[1]?.struct;
    if (!struct || !struct.member) {
      return res.json({
        success: true,
        rows: 0,
        prices: [],
        dateRange: { from: dfrom, to: dto },
      });
    }

    let members = struct.member;
    if (!Array.isArray(members)) members = [members];

    // Отримуємо всі кімнати з бази для зіставлення
    const allRooms = await db.collection("wodoo_aparts").find({}).toArray();
    const mapByWdid = {};
    allRooms.forEach((r) => {
      if (r.wdid) mapByWdid[String(r.wdid)] = r;
    });

    // Обробляємо дані з WuBook
    const prices = [];
    const dates = [];
    const currentDate = new Date(startDate);
    while (currentDate <= endDate) {
      dates.push(formatDate(currentDate));
      currentDate.setDate(currentDate.getDate() + 1);
    }

    // Парсимо дані з WuBook (структура така ж як в /tarifPrices/update)
    members.forEach((m) => {
      // Отримуємо wdid з name (може бути об'єкт або рядок)
      let raw = typeof m.name === "object" ? m.name._ : m.name;
      const wdid = String(raw).trim();

      const room = mapByWdid[wdid];
      if (!room) return;

      // Отримуємо масив цін
      const values = m?.value?.array?.data?.value;
      if (!values) return;

      const priceNodes = Array.isArray(values) ? values : [values];
      const pricesArray = priceNodes.map((v) => Number(v.double || v || 0));

      // Створюємо записи для кожної дати
      for (let i = 0; i < pricesArray.length && i < dates.length; i++) {
        prices.push({
          roomId: wdid,
          roomName: room.name || "",
          date: dates[i],
          price: pricesArray[i],
        });
      }
    });

    console.log(`✅ Отримано ${prices.length} актуальних цін з WuBook`);

    return res.json({
      success: true,
      rows: prices.length,
      prices: prices,
      dateRange: { from: dfrom, to: dto },
    });
  } catch (err) {
    console.error("❌ WuBook API Error:", err.message);
    res.status(500).json({
      success: false,
      error: "Failed to fetch prices from WuBook",
      message: err.message,
    });
  }
});

router.get("/tarifPrices/get", async (req, res) => {
  try {
    const fs = require("fs");
    const path = require("path");
    const { dfrom, dto } = req.query;

    // Обов'язкові параметри дат
    if (!dfrom || !dto) {
      return res.status(400).json({
        success: false,
        error: "Missing required parameters: dfrom and dto",
      });
    }

    const csvPath = path.join(__dirname, "../data2025/tarifPrice.csv");
    if (!fs.existsSync(csvPath)) {
      return res.status(404).json({
        success: false,
        error: "Price CSV file not found",
      });
    }

    // Парсимо дати з запиту (формат YYYY-MM-DD)
    const startDate = new Date(dfrom + "T00:00:00");
    const endDate = new Date(dto + "T23:59:59");

    if (isNaN(startDate.getTime()) || isNaN(endDate.getTime())) {
      return res.status(400).json({
        success: false,
        error: "Invalid date format. Use YYYY-MM-DD",
      });
    }

    const csv = fs.readFileSync(csvPath, "utf8").trim();
    const lines = csv.split("\n");

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

    // Конвертація дати з DD/MM/YYYY в Date
    const parseCSVDate = (dateStr) => {
      if (!dateStr) return null;
      const parts = dateStr.split("/");
      if (parts.length !== 3) return null;
      const [day, month, year] = parts;
      return new Date(
        `${year}-${month.padStart(2, "0")}-${day.padStart(2, "0")}T00:00:00`
      );
    };

    // Фільтруємо дані за датами
    const filteredItems = [];

    for (let i = 1; i < lines.length; i++) {
      const line = lines[i].trim();
      if (!line) continue;

      const cols = parseCSVLine(line);
      if (cols.length < 4) continue;

      const csvDate = parseCSVDate(cols[2].trim());
      if (!csvDate || isNaN(csvDate.getTime())) continue;

      // Перевіряємо чи дата в діапазоні
      if (csvDate >= startDate && csvDate <= endDate) {
        filteredItems.push({
          roomId: cols[0].trim(),
          roomName: cols[1].trim(),
          date: cols[2].trim(),
          price: Number(cols[3]) || 0,
        });
      }
    }

    console.log(`📊 Запит: ${dfrom} → ${dto}`);
    console.log(
      `📊 Знайдено: ${filteredItems.length} рядків з ${
        lines.length - 1
      } загалом`
    );

    return res.json({
      success: true,
      rows: filteredItems.length,
      prices: filteredItems,
      dateRange: { from: dfrom, to: dto },
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
