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

router.get("/data", (req, res) => {
  try {
    const filePath = path.join(__dirname, "../data2025/export_14_11_2025.csv");

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

    console.log("📘 Parsed rows example:", rows[0]);

    // 🔥 ТУТ ГОЛОВНА ЗМІНА — ГРУПУЄМО ЛИШЕ ПО From
    const days = {};

    rows.forEach((row) => {
      const day = row.From; // день заїзду

      if (!day) return; // немає From — пропускаємо

      if (!days[day]) days[day] = [];
      days[day].push(row);
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
