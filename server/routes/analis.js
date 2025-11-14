// routes/wubook.js
const express = require("express");
const axios = require("axios");
const router = express.Router();
const path = require("path");
const XLSX = require("xlsx");

router.get("/ping", (req, res) => {
  res.json({ ok: true, route: "analis works" });
});

router.post("/prices", async (req, res) => {
  const { lcode, pid, globalId, dfrom, dto } = req.body; // ✅ тут змінили

  const token = "wr_9fd536d9-2894-441a-85eb-4b1a670e2ff2";

  const xml = `<?xml version="1.0"?>
  <methodCall>
    <methodName>fetch_plan_prices</methodName>
    <params>
      <param><value><string>${token}</string></value></param>
      <param><value><int>${lcode}</int></value></param>
      <param><value><int>${pid}</int></value></param>
      <param><value><string>${dfrom}</string></value></param>
      <param><value><string>${dto}</string></value></param>
      <param>
        <value>
          <array><data>
            <value><int>${globalId}</int></value>  
          </data></array>
        </value>
      </param>
    </params>
  </methodCall>`;

  try {
    const response = await axios.post("https://wired.wubook.net/xrws/", xml, {
      headers: { "Content-Type": "text/xml" },
    });

    res.send(response.data);
  } catch (err) {
    console.error("WuBook API Error:", err.message);
    res.status(500).json({ error: "WuBook API request failed" });
  }
});

router.get("/data", (req, res) => {
  try {
    const filePath = path.join(__dirname, "../data2025/export_14_11_2025.csv");

    const workbook = XLSX.readFile(filePath);
    const sheetName = workbook.SheetNames[0];
    const sheet = workbook.Sheets[sheetName];

    let rows = XLSX.utils.sheet_to_json(sheet, {
      defval: "",
      raw: false, // ← забороняє конвертувати дати в числа
      rawNumbers: false, // ← не переводити дати у формат Excel-серіалу
    });

    const convertDate = (str) => {
      if (!str || typeof str !== "string") return "";
      const [day, month, year] = str.split(".");
      if (!day || !month || !year) return "";
      return `${year}-${month}-${day}`;
    };

    // YYYY-MM-DD -> Date (локальна)
    const toJSDate = (iso) => {
      const [y, m, d] = iso.split("-").map(Number);
      return new Date(y, m - 1, d); // без таймзони/UTC
    };

    // Date -> YYYY-MM-DD (локальна)
    const formatDateLocal = (date) => {
      const y = date.getFullYear();
      const m = String(date.getMonth() + 1).padStart(2, "0");
      const d = String(date.getDate()).padStart(2, "0");
      return `${y}-${m}-${d}`;
    };

    const result = {};

    for (const row of rows) {
      // пропускаємо технічні дублікати
      if (!row["Room Name"] || !row["Room Code"]) continue;

      const fromStr = convertDate(row["From"]);
      const toStr = convertDate(row["To"]);
      if (!fromStr || !toStr) continue;

      const entry = {
        guestCode: row["Code"],
        created: convertDate(row["Created"]),
        cancellation: convertDate(row["Cancellation"]),
        arrived: row["Arrived"] || "",
        agency: row["Agency"] || "",
        corporate: row["Corporate"] || "",
        booker: row["Booker"] || "",
        country: row["Country"] || "",
        price: Number(row["Price"]) || 0,
        nights: Number(row["Nights"]) || 0,
        roomName: row["Room Name"],
        roomCode: row["Room Code"],
        typeCode: row["Type Code"],
        typeName: row["Type Name"],
        roomDailyPrice: Number(row["Room daily price"]) || 0,
      };

      let start = toJSDate(fromStr);
      const end = toJSDate(toStr);

      // День за днем: [from; to) – to не включно
      while (start < end) {
        const dateStr = formatDateLocal(start); // БЕЗ toISOString

        if (!result[dateStr]) result[dateStr] = [];
        result[dateStr].push({ ...entry });

        start.setDate(start.getDate() + 1);
      }
    }

    res.json({ success: true, data: result });
  } catch (error) {
    console.error("❌ Excel read error:", error);
    res.status(500).json({ success: false, error: "Failed to read Excel" });
  }
});

module.exports = router;
