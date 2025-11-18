import React, { useState, useEffect } from "react";
import axios from "axios";
import DateRangePicker from "./dateRangePicker";
import RoomsTable from "./roomsTable";
import { XMLParser } from "fast-xml-parser";

export default function WuBookPanel({ rooms, setRooms }) {
  const formatDate = (d) => d.toISOString().split("T")[0];

  const today = new Date();
  const nextWeek = new Date();
  nextWeek.setDate(today.getDate() + 7);

  const [dfrom, setDfrom] = useState(formatDate(today));
  const [dto, setDto] = useState(formatDate(nextWeek));
  const [loading, setLoading] = useState(false);

  const [excelData, setExcelData] = useState([]);

  // ============================================================
  //  1) EXCEL DATA LOGS — Тільки ключове
  // ============================================================
  useEffect(() => {
    const fetchExcel = async () => {
      try {
        console.log("====== 📊 EXCEL FETCH ======");

        const res = await axios.get(
          "https://royalapart.online/api/analis/data",
          { params: { dfrom, dto } }
        );

        const days = res.data?.days || {};

        console.log("📅 Дати (Excel):", days);
        //console.log("📁 Приклад першої дати:", days[Object.keys(days)[0]]);

        setExcelData(days);
      } catch (err) {
        console.error("❌ Excel ERROR:", err.message);
      }
    };

    fetchExcel();
  }, [dfrom, dto]);

  const fetchPrices = async () => {

    const diffDays = (new Date(dto) - new Date(dfrom)) / 86400000;
    if (diffDays > 31) {
      alert("Максимальний період — 31 день");
      return;
    }

    setLoading(true);

    const df = new Date(dfrom).toLocaleDateString("en-GB");
    const dt = new Date(dto).toLocaleDateString("en-GB");

    const parser = new XMLParser();
    const updatedRooms = [];

    // Лише ПІДСУМОК для кінця
    const summary = [];

    for (const room of rooms) {
      if (!room.wdid) {
        updatedRooms.push(room);
        continue;
      }

      try {
        const res = await axios.post(
          "https://royalapart.online/api/analis/prices/get",
          {
            lcode: 1638349860,
            pid: 0,
            globalId: room.wdid,
            dfrom: df,
            dto: dt,
          },
          { headers: { "Content-Type": "application/json" } }
        );

        const parsed = parser.parse(res.data);

        const root = parsed?.methodResponse?.params?.param?.value?.array?.data;

        if (!root) {
          summary.push({
            room: room.name,
            status: "error",
            reason: "Invalid XML",
          });
          updatedRooms.push(room);
          continue;
        }

        // Якщо помилка WuBook (-21)
        if (root.value?.[0]?.int < 0) {
          summary.push({
            room: room.name,
            status: "error",
            reason: root.value?.[1]?.string || "WuBook error",
          });
          updatedRooms.push(room);
          continue;
        }

        const priceStruct =
          root.value?.[1]?.struct?.member?.value?.array?.data?.value;

        if (!Array.isArray(priceStruct)) {
          summary.push({
            room: room.name,
            status: "error",
            reason: "No prices",
          });
          updatedRooms.push(room);
          continue;
        }

        const prices = priceStruct.map((v) => Number(v.double));

        summary.push({
          room: room.name,
          status: "ok",
          days: prices.length,
        });

        updatedRooms.push({
          ...room,
          prices,
        });
      } catch (err) {
        summary.push({
          room: room.name,
          status: "error",
          reason: err.message,
        });
        updatedRooms.push(room);
      }
    }

    console.log("====== 📌 WUBOOK SUMMARY ======");
    console.table(summary);

    setRooms(updatedRooms);
    setLoading(false);
  };

  // ============================================================

  return (
    <div className="bg-gray-800 p-4 rounded-xl mb-6">
      <h2 className="text-lg font-semibold mb-3">WuBook Ціни</h2>

      <DateRangePicker
        dfrom={dfrom}
        dto={dto}
        setDfrom={setDfrom}
        setDto={setDto}
      />

      <button
        onClick={fetchPrices}
        className="bg-orange-500 hover:bg-orange-600 px-4 py-2 rounded-lg mb-4"
      >
        {loading ? "Завантаження..." : "Отримати ціни"}
      </button>

      <RoomsTable rooms={rooms} dfrom={dfrom} dto={dto} excelData={excelData} />
    </div>
  );
}
