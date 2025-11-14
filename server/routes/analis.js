// // routes/wubook.js
// const express = require("express");
// const axios = require("axios");
// const router = express.Router();
// const path = require("path");
// const XLSX = require("xlsx");


// router.get("/ping", (req, res) => {
//   res.json({ ok: true, route: "analis works" });
// });

// router.post("/prices", async (req, res) => {
//   const { lcode, pid, globalId, dfrom, dto } = req.body; // ✅ тут змінили

//   const token = "wr_9fd536d9-2894-441a-85eb-4b1a670e2ff2";

//   const xml = `<?xml version="1.0"?>
//   <methodCall>
//     <methodName>fetch_plan_prices</methodName>
//     <params>
//       <param><value><string>${token}</string></value></param>
//       <param><value><int>${lcode}</int></value></param>
//       <param><value><int>${pid}</int></value></param>
//       <param><value><string>${dfrom}</string></value></param>
//       <param><value><string>${dto}</string></value></param>
//       <param>
//         <value>
//           <array><data>
//             <value><int>${globalId}</int></value>  
//           </data></array>
//         </value>
//       </param>
//     </params>
//   </methodCall>`;

//   try {
//     const response = await axios.post("https://wired.wubook.net/xrws/", xml, {
//       headers: { "Content-Type": "text/xml" },
//     });

//     res.send(response.data);
//   } catch (err) {
//     console.error("WuBook API Error:", err.message);
//     res.status(500).json({ error: "WuBook API request failed" });
//   }
// });

// router.get("/data", (req, res) => {
//   try {
//     // 🔥 Вкажи шлях до свого Excel-файлу
//     const filePath = path.join(__dirname, "../data2025/export_14_11_2025.csv");

//     // Читаємо Excel
//     const workbook = XLSX.readFile(filePath);

//     // Беремо перший лист
//     const sheetName = workbook.SheetNames[0];
//     const sheet = workbook.Sheets[sheetName];

//     // Конвертуємо в JSON
//     const json = XLSX.utils.sheet_to_json(sheet, { defval: "" });

//     res.json({ success: true, data: json });
//   } catch (error) {
//     console.error("Excel read error:", error);
//     res.status(500).json({ success: false, error: "Failed to read Excel" });
//   }
// });

// module.exports = router;
