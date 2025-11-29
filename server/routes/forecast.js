const express = require("express");
const router = express.Router();
const { exec } = require("child_process");
const { promisify } = require("util");
const axios = require("axios");
const { parseStringPromise } = require("xml2js");
const mongoose = require("../db");
const path = require("path");
const fs = require("fs");

const execAsync = promisify(exec);

const WUBOOK_TOKEN = "wr_9fd536d9-2894-441a-85eb-4b1a670e2ff2";
const WUBOOK_LCODE = 1638349860;
const WUBOOK_PID = 0;

// Функція для форматування дати в DD/MM/YYYY
function formatDate(date) {
  const d = new Date(date);
  return `${String(d.getDate()).padStart(2, "0")}/${String(
    d.getMonth() + 1
  ).padStart(2, "0")}/${d.getFullYear()}`;
}

// Функція для форматування дати в YYYY-MM-DD
function formatDateISO(date) {
  return date.toISOString().slice(0, 10);
}

// Функція для форматування дати в DD/MM/YYYY для predict_api.py
function formatDateForAPI(date) {
  const d = new Date(date);
  return `${String(d.getDate()).padStart(2, "0")}/${String(
    d.getMonth() + 1
  ).padStart(2, "0")}/${d.getFullYear()}`;
}

// Функція для виклику моделі передбачення через виконання Python команди
// Використовує child_process.exec для виконання: python predict_api.py "room" "date" price
// Приймає: roomName, price (ціна з WuBook), date (вже в форматі DD/MM/YYYY)
function predictPrice(roomName, price, date) {
  return new Promise(async (resolve, reject) => {
    const startTime = Date.now();
    console.log(
      `  📊 Запуск передбачення для: ${roomName} (ціна: ${price}, дата: ${date})`
    );

    try {
      // Формуємо команду: python predict_api.py "room" "date" price
      // python тепер в корені проекту (або /python в Docker)
      let scriptPath = path.join(
        __dirname,
        "..",
        "..",
        "python",
        "predict_api.py"
      );
      // Якщо в Docker, python може бути в /python
      if (!fs.existsSync(scriptPath)) {
        scriptPath = "/python/predict_api.py";
      }

      // Екрануємо лапки в назві кімнати для безпечного виконання команди
      const escapedRoom = roomName.replace(/"/g, '\\"');
      const escapedDate = date.replace(/"/g, '\\"');

      // Спробуємо різні варіанти Python команди
      const pythonCommands = ["python", "python3", "py"];
      let command = "";
      let stdout = "";
      let stderr = "";
      let lastError = null;

      // Пробуємо кожну команду поки не знайдемо працюючу
      for (const pythonCmd of pythonCommands) {
        command = `${pythonCmd} "${scriptPath}" "${escapedRoom}" "${escapedDate}" ${price}`;
        console.log(`  🔧 Спробуємо команду: ${command}`);

        try {
          // Визначаємо робочу директорію
          // Якщо python в корені проекту - використовуємо корінь
          // Якщо в Docker (/python) - використовуємо /python
          let cwdPath = path.join(__dirname, "..", "..");
          if (scriptPath.startsWith("/python")) {
            cwdPath = "/python";
          }

          const result = await execAsync(command, {
            cwd: cwdPath,
            maxBuffer: 10 * 1024 * 1024, // 10MB буфер
            encoding: "utf8",
            timeout: 10000, // 10 секунд таймаут
          });
          stdout = result.stdout;
          stderr = result.stderr;
          break; // Якщо успішно, виходимо з циклу
        } catch (err) {
          lastError = err;
          // Якщо це не остання команда, продовжуємо спробувати
          if (pythonCmd !== pythonCommands[pythonCommands.length - 1]) {
            continue;
          }
          // Якщо це остання команда, викидаємо помилку
          throw new Error(
            `Python не знайдено на сервері. Спробовано: ${pythonCommands.join(
              ", "
            )}. ` +
              `Помилка: ${err.message}. ` +
              `Переконайтеся, що Python встановлено і доступний в PATH.`
          );
        }
      }

      // Парсимо JSON з stdout
      const lines = stdout.trim().split("\n");
      let jsonLine = "";

      // Шукаємо рядок, який починається з { (JSON)
      for (const line of lines) {
        const trimmed = line.trim();
        if (trimmed.startsWith("{")) {
          jsonLine = trimmed;
          break;
        }
      }

      if (!jsonLine) {
        throw new Error(`Не знайдено JSON у відповіді. Stdout: ${stdout}`);
      }

      const result = JSON.parse(jsonLine);

      const duration = Date.now() - startTime;
      console.log(
        `  ✅ Передбачення завершено для ${roomName} (${duration}ms)`
      );

      resolve(result);
    } catch (err) {
      const duration = Date.now() - startTime;
      console.log(
        `  ❌ Помилка передбачення для ${roomName} (${duration}ms):`,
        err.message
      );
      reject(err);
    }
  });
}

router.get("/get", async (req, res) => {
  const room = req.query.room;
  const price = parseFloat(req.query.price);
  const date = req.query.date || new Date().toISOString().slice(0, 10); // YYYY-MM-DD

  if (!room || isNaN(price)) {
    return res.status(400).json({ error: "room and price are required" });
  }

  let options = {
    mode: "json",
    pythonOptions: ["-u"],
    scriptPath: "../../python", // шлях до python (тепер в корені проекту)
    args: [room, price, date],
  };

  PythonShell.run("predict_price.py", options, function (err, results) {
    if (err) return res.status(500).json({ error: err.message });
    // results повертає масив об'єктів JSON, беремо перший
    res.json(results[0]);
  });
});

// Endpoint для перевірки цін ВСІХ квартир з WuBook на сьогодні
router.get("/checkToday", async (req, res) => {
  const requestStartTime = Date.now();

  try {
    const today = new Date();
    const todayStr = formatDate(today);
    const todayISO = formatDateISO(today);

    console.log(`\n=== 🔍 Перевірка цін ВСІХ квартир на ${todayStr} ===`);
    console.log(`⏰ Час початку: ${new Date().toISOString()}`);

    // --- XML запит до WuBook ---
    console.log(`\n[1/5] 📡 Запит до WuBook API...`);
    const wubookStartTime = Date.now();

    const xml = `<?xml version="1.0"?>
<methodCall>
  <methodName>fetch_plan_prices</methodName>
  <params>
    <param><value><string>${WUBOOK_TOKEN}</string></value></param>
    <param><value><int>${WUBOOK_LCODE}</int></value></param>
    <param><value><int>${WUBOOK_PID}</int></value></param>
    <param><value><string>${todayStr}</string></value></param>
    <param><value><string>${todayStr}</string></value></param>
  </params>
</methodCall>`;

    const response = await axios.post("https://wired.wubook.net/xrws/", xml, {
      headers: { "Content-Type": "text/xml" },
    });

    const wubookDuration = Date.now() - wubookStartTime;
    console.log(`✅ WuBook відповів за ${wubookDuration}ms`);

    // --- Парсинг XML ---
    console.log(`\n[2/5] 🔄 Парсинг XML відповіді...`);
    const parseStartTime = Date.now();

    const json = await parseStringPromise(response.data, {
      explicitArray: false,
    });

    const root = json?.methodResponse?.params?.param?.value?.array?.data?.value;

    if (!root) {
      console.log(`❌ WuBook повернув порожні дані`);
      return res.status(404).json({
        error: "WuBook повернув порожні дані",
        date: todayStr,
      });
    }

    const arr = Array.isArray(root) ? root : [root];
    const struct = arr[1]?.struct;

    if (!struct || !struct.member) {
      console.log(`❌ Немає квартир у відповіді WuBook`);
      return res.status(404).json({
        error: "Немає квартир у відповіді WuBook",
        date: todayStr,
      });
    }

    let members = struct.member;
    if (!Array.isArray(members)) members = [members];

    const parseDuration = Date.now() - parseStartTime;
    console.log(
      `✅ Знайдено ${members.length} квартир у відповіді WuBook (${parseDuration}ms)`
    );

    // --- Отримуємо назви квартир з MongoDB ---
    console.log(`\n[3/5] 🗄️ Завантаження назв квартир з MongoDB...`);
    const mongoStartTime = Date.now();

    const db = mongoose.connection.useDb("apartments");
    const allRooms = await db.collection("wodoo_aparts").find({}).toArray();

    const mongoDuration = Date.now() - mongoStartTime;
    console.log(
      `✅ Завантажено ${allRooms.length} квартир з MongoDB за ${mongoDuration}ms`
    );

    const mapByWdid = {};
    allRooms.forEach((r) => {
      if (r.wdid) mapByWdid[String(r.wdid).trim()] = r.name;
    });

    // --- Підготовка даних для обробки ---
    console.log(`\n[4/5] 📊 Підготовка даних для обробки...`);
    const prepareStartTime = Date.now();

    const roomsToProcess = [];

    for (const m of members) {
      let raw = typeof m.name === "object" ? m.name._ : m.name;
      const wdid = String(raw).trim();
      const roomName = mapByWdid[wdid] || wdid;

      const values = m?.value?.array?.data?.value;
      if (!values) {
        continue;
      }

      const priceNodes = Array.isArray(values) ? values : [values];
      const prices = priceNodes.map((v) => Number(v.double));
      const todayPrice = prices[0];

      if (!todayPrice || isNaN(todayPrice)) {
        continue;
      }

      roomsToProcess.push({
        wdid,
        roomName,
        wubookPrice: todayPrice,
      });
    }

    const prepareDuration = Date.now() - prepareStartTime;
    console.log(
      `✅ Підготовлено ${roomsToProcess.length} квартир для обробки (${prepareDuration}ms)`
    );

    // --- Передбачення для всіх квартир ---
    console.log(
      `\n[5/5] 🤖 Запуск передбачень для ${roomsToProcess.length} квартир...`
    );
    console.log(`═══════════════════════════════════════════════════════`);
    const predictionStartTime = Date.now();

    const results = [];
    let processedCount = 0;
    let errorCount = 0;

    // Обробляємо всі квартири послідовно
    for (let i = 0; i < roomsToProcess.length; i++) {
      const room = roomsToProcess[i];
      const itemStartTime = Date.now();

      try {
        const prediction = await predictPrice(
          room.roomName,
          room.wubookPrice,
          todayStr
        );
        processedCount++;

        results.push({
          wdid: room.wdid,
          roomName: room.roomName,
          date: todayStr,
          wubookPrice: room.wubookPrice,
          prediction: prediction,
        });

        const itemDuration = Date.now() - itemStartTime;
        console.log(
          `  ✓ [${i + 1}/${roomsToProcess.length}] ${room.roomName}: WuBook=${
            room.wubookPrice
          }, Прогноз=${
            prediction.predicted_price?.toFixed(2) || "N/A"
          } (${itemDuration}ms)`
        );
      } catch (err) {
        errorCount++;
        const itemDuration = Date.now() - itemStartTime;
        console.error(
          `  ✗ [${i + 1}/${roomsToProcess.length}] Помилка для ${
            room.roomName
          } (${itemDuration}ms):`,
          err.message
        );
        results.push({
          wdid: room.wdid,
          roomName: room.roomName,
          date: todayStr,
          wubookPrice: room.wubookPrice,
          error: err.message,
        });
      }
    }

    const predictionDuration = Date.now() - predictionStartTime;
    console.log(`═══════════════════════════════════════════════════════`);
    console.log(`✅ Передбачення завершено:`);
    console.log(`   - Оброблено: ${processedCount}`);
    console.log(`   - Помилок: ${errorCount}`);
    console.log(
      `   - Час виконання: ${predictionDuration}ms (${(
        predictionDuration / 1000
      ).toFixed(2)}с)`
    );

    const totalDuration = Date.now() - requestStartTime;

    const responseData = {
      success: true,
      date: todayStr,
      totalRooms: results.length,
      processed: processedCount,
      errors: errorCount,
      timing: {
        wubook: wubookDuration,
        parsing: parseDuration,
        mongo: mongoDuration,
        preparation: prepareDuration,
        predictions: predictionDuration,
        total: totalDuration,
      },
      results: results,
    };

    console.log(
      `\n=== ✅ ЗАВЕРШЕНО за ${totalDuration}ms (${(
        totalDuration / 1000
      ).toFixed(2)}с) ===`
    );
    console.log(`⏰ Час завершення: ${new Date().toISOString()}\n`);

    res.json(responseData);
  } catch (err) {
    const totalDuration = Date.now() - requestStartTime;
    console.error(`\n❌ КРИТИЧНА ПОМИЛКА після ${totalDuration}ms:`, err);
    console.error(`Stack:`, err.stack);
    res.status(500).json({
      success: false,
      error: err.message,
      timing: {
        total: totalDuration,
      },
    });
  }
});

module.exports = router;
