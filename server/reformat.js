const fs = require("fs");
const csv = require("csv-parser");
const createCsvWriter = require("csv-writer").createObjectCsvWriter;
const path = require("path");

const input = path.join(__dirname, "data2025", "export_14_11_2025.csv");
const output = path.join(__dirname, "output.csv");

// Твої заголовки
const headers = [
  "Code",
  "Created",
  "Cancellation",
  "Arrived",
  "Agency",
  "Corporate",
  "Booker",
  "Country",
  "Price",
  "From",
  "To",
  "Nights",
  "Room daily price",
  "Type Code",
  "Type Name",
  "Room Code",
  "Room Name",
];

let rawRows = [];

fs.createReadStream(input)
  .pipe(csv()) // читаємо як одну колонку
  .on("data", (data) => rawRows.push(data))
  .on("end", () => {
    console.log("Зчитано рядків:", rawRows.length);

    const key = Object.keys(rawRows[0])[0];

    // Конвертуємо кожний рядок у нормальний об'єкт
    const rows = rawRows.map((r) => {
      const parts = r[key].split(";");

      let obj = {};
      headers.forEach((h, i) => {
        obj[h] = parts[i] ?? "";
      });

      return obj;
    });

    // Унікалізація — беремо ЛИШЕ ПЕРШИЙ рядок на кожен Code
    const unique = Object.values(
      rows.reduce((acc, row) => {
        if (!acc[row.Code] && row.Code) {  
          acc[row.Code] = row; // зберігаємо тільки перший
        }
        return acc;
      }, {})
    );

    console.log("Унікальних записів:", unique.length);

    // Запис у CSV
    const writer = createCsvWriter({
      path: output,
      header: headers.map((h) => ({ id: h, title: h })),
      fieldDelimiter: ";",
    });

    writer.writeRecords(unique).then(() => {
      console.log("Готово! Дані записано в:", output);
    });
  });
