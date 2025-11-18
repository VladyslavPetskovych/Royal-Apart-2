import React, { useState, useEffect } from "react";
import axios from "axios";
import DateRangePicker from "./dateRangePicker";
import RoomsTable from "./roomsTable";

export default function WuBookPanel({ rooms, setRooms }) {
  const formatDate = (d) => d.toISOString().split("T")[0];

  const today = new Date();
  const nextWeek = new Date();
  nextWeek.setDate(today.getDate() + 7);

  const [dfrom, setDfrom] = useState(formatDate(today));
  const [dto, setDto] = useState(formatDate(nextWeek));
  const [loading, setLoading] = useState(false);

  const [excelData, setExcelData] = useState({});
  const [csvPrices, setCsvPrices] = useState([]);

  // =====================================================
  //                 LOAD EXCEL (/data)
  // =====================================================
  useEffect(() => {
    const fetchExcel = async () => {
      try {
        console.log("====== 📊 FETCH /data (Excel) ======");

        const res = await axios.get(
          "https://royalapart.online/api/analis/data",
          { params: { dfrom, dto } }
        );

        console.log("📁 SERVER /data →", res.data);

        const days = res.data?.days || {};
        console.log("📅 Excel days:", days);

        setExcelData(days);
      } catch (err) {
        console.error("❌ Excel ERROR:", err.message);
      }
    };

    fetchExcel();
  }, [dfrom, dto]);

  // =====================================================
  //                 LOAD CSV (/prices/get)
  // =====================================================
  const fetchCsvPrices = async () => {
    try {
      console.log("====== 💰 FETCH /prices/get (CSV) ======");

      const res = await axios.get(
        "https://royalapart.online/api/analis/prices/get"
      );

      console.log("📁 SERVER /prices/get →", res.data);

      const prices = res.data?.prices || [];
      console.log("💵 CSV prices:", prices);

      setCsvPrices(prices);
      return prices;
    } catch (err) {
      console.error("❌ CSV ERROR:", err.message);
      return [];
    }
  };

  // =====================================================
  //                 MAIN FETCH — BOTH SOURCES
  // =====================================================
  const fetchPrices = async () => {
    const diffDays = (new Date(dto) - new Date(dfrom)) / 86400000;
    if (diffDays > 31) {
      alert("Максимальний період — 31 день");
      return;
    }

    setLoading(true);

    console.log("====== 🚀 START PRICE SYNC ======");
    const csv = await fetchCsvPrices();

    const updatedRooms = [];
    const summary = [];

    for (const room of rooms) {
      // фільтруємо CSV по roomId
      const csvForRoom = csv.filter(
        (p) => String(p.roomId) === String(room.id)
      );

      console.log(`🏠 CSV for room ${room.name} (${room.id}):`, csvForRoom);

      updatedRooms.push({
        ...room,
        pricesCsv: csvForRoom,
      });

      summary.push({
        room: room.name,
        rows: csvForRoom.length,
      });
    }

    console.log("====== 📌 SUMMARY (CSV MATCHING) ======");
    console.table(summary);

    setRooms(updatedRooms);
    setLoading(false);
  };

  // =====================================================

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
