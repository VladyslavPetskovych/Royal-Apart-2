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

    let json = XLSX.utils.sheet_to_json(sheet, { defval: "" });

    // 🔥 Конвертація Excel-дат → нормальні дати
    const excelDateToJS = (serial) => {
      if (!serial || typeof serial !== "number") return "";
      const utc_days = serial - 25569;
      const utc_value = utc_days * 86400;
      const date_info = new Date(utc_value * 1000);
      return date_info.toISOString().split("T")[0];
    };

    // 🔥 Нормалізація даних
    json = json.map((row) => ({
      code: row["Code"] || "",
      created: excelDateToJS(row["Created"]),
      cancellation: row["Cancellation"] || "",
      agency: row["Agency"] || "",
      country: row["Country"] || "",
      policy: row["Policy"] || "",
      price: Number(row["Price"]) || 0,
      from: excelDateToJS(row["From"]),
      to: excelDateToJS(row["To"]),
      nights: Number(row["Nights"]) || 0,
      roomDailyPrice: Number(row["Room daily price"]) || 0,
      typeCode: row["Type Code"] || "",
      typeName: row["Type Name"] || "",
      roomCode: row["Room Code"] || "",
      roomName: row["Room Name"] || "",
    }));

    res.json({ success: true, data: json });
  } catch (error) {
    console.error("❌ Excel read error:", error);
    res.status(500).json({ success: false, error: "Failed to read Excel" });
  }
});

module.exports = router;
