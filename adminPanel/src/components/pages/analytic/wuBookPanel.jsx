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
  //                LOAD REAL PRICES from XLSX
  //                GET /wubook/realPrices/data
  // =====================================================
  useEffect(() => {
    const fetchExcel = async () => {
      try {
        console.log("====== 📊 FETCH /realPrices/data ======");

        const res = await axios.get(
          "https://royalapart.online/api/wubook/realPrices/data",
          { params: { dfrom, dto } }
        );

        console.log("📁 SERVER realPrices →", res.data);

        const days = res.data?.days || {};
        setExcelData(days);
      } catch (err) {
        console.error("❌ Excel ERROR:", err.message);
      }
    };

    fetchExcel();
  }, [dfrom, dto]);

  // =====================================================
  //               LOAD TARIF PRICES (CSV)
  //               GET /wubook/tarifPrices/get
  // =====================================================
  const fetchCsvPrices = async () => {
    try {
      console.log("====== 💰 FETCH /tarifPrices/get ======");

      const res = await axios.get(
        "https://royalapart.online/api/wubook/tarifPrices/get"
      );

      console.log("📁 SERVER tarifPrices CSV →", res.data);

      const prices = res.data?.prices || [];
      setCsvPrices(prices);

      return prices;
    } catch (err) {
      console.error("❌ CSV ERROR:", err.message);
      return [];
    }
  };

  // =====================================================
  //      MATCH CSV PRICES WITH OUR ROOMS
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
      const csvForRoom = csv.filter(
        (p) => String(p.roomId) === String(room.id)
      );

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
