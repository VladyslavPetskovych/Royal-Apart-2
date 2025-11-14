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

    const rows = XLSX.utils.sheet_to_json(sheet, { defval: "" });

    // === ГРУПУВАННЯ ПО ДНЯХ ===
    const result = {};

    rows.forEach((row) => {
      const from = row.From;
      const to = row.To;

      if (!from || !to) return;

      // Конвертуємо дати
      const start = new Date(from.split(".").reverse().join("-"));
      const end = new Date(to.split(".").reverse().join("-"));

      // Проходимо всі дні між From і To
      for (let d = new Date(start); d <= end; d.setDate(d.getDate() + 1)) {
        const day = d.toISOString().slice(0, 10);

        if (!result[day]) result[day] = [];
        result[day].push(row);
      }
    });

    res.json({ success: true, days: result });
  } catch (error) {
    console.error("❌ Excel read error:", error);
    res.status(500).json({ success: false, error: "Failed to read Excel" });
  }
});

module.exports = router;
