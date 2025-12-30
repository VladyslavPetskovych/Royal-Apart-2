import React, { useState } from "react";
import axios from "axios";
import RoomsTable from "./roomsTable";

export default function WuBookPanel({ rooms, setRooms }) {
  const [loading, setLoading] = useState(false);
  const [dateRange, setDateRange] = useState({ from: null, to: null });

  const getApiUrl = () => {
    const hostname = window.location.hostname;
    if (hostname === "localhost" || hostname === "127.0.0.1") {
      return "http://localhost:3000/analis/tarifPrices/current";
    }
    return "https://royalapart.online/api/analis/tarifPrices/current";
  };

  const fetchCurrentPrices = async () => {
    if (rooms.length === 0) {
      alert("Немає кімнат для обробки");
      return;
    }

    setLoading(true);
    try {
      console.log("📡 Запит актуальних цін з WuBook API...");

      const apiUrl = getApiUrl();
      const res = await axios.get(apiUrl);

      console.log("✅ Відповідь від сервера:", {
        success: res.data?.success,
        rows: res.data?.rows,
        pricesCount: res.data?.prices?.length,
        dateRange: res.data?.dateRange,
      });

      const prices = res.data?.prices || [];
      const range = res.data?.dateRange || {};

      if (prices.length === 0) {
        alert("Не вдалося отримати ціни з WuBook");
        setLoading(false);
        return;
      }

      // Зіставляємо дані з кімнатами за wdid
      const updatedRooms = rooms.map((room) => {
        const roomPrices = prices.filter(
          (p) =>
            String(p.roomId).trim() ===
            String(room.wdid || room.wubid || "").trim()
        );

        return {
          ...room,
          pricesCsv: roomPrices,
        };
      });

      const totalFound = updatedRooms.reduce(
        (sum, r) => sum + r.pricesCsv.length,
        0
      );

      console.log(
        `✅ Оброблено ${updatedRooms.length} кімнат, знайдено ${totalFound} записів`
      );

      setRooms(updatedRooms);
      setDateRange(range);

      if (range.from && range.to) {
        const [d1, m1, y1] = range.from.split("/");
        const [d2, m2, y2] = range.to.split("/");
        setDateRange({
          from: `${y1}-${m1.padStart(2, "0")}-${d1.padStart(2, "0")}`,
          to: `${y2}-${m2.padStart(2, "0")}-${d2.padStart(2, "0")}`,
        });
      }
    } catch (err) {
      console.error("❌ Помилка завантаження:", err.message);
      console.error("❌ Деталі помилки:", err.response?.data || err);
      alert(`Помилка: ${err.message}`);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="bg-gray-800 p-4 rounded-xl mb-6">
      <h2 className="text-lg font-semibold mb-3">WuBook Актуальні Ціни</h2>
      <p className="text-sm text-gray-400 mb-4">
        Отримує актуальні ціни з WuBook за 2 дні до сьогодні та 4 дні вперед
      </p>

      <div className="flex gap-2 mb-4">
        <button
          onClick={fetchCurrentPrices}
          disabled={loading}
          className="bg-orange-500 hover:bg-orange-600 disabled:bg-gray-600 px-6 py-2 rounded-lg font-semibold"
        >
          {loading ? "Завантаження..." : "Отримати актуальні ціни"}
        </button>
        {dateRange.from && dateRange.to && (
          <div className="px-4 py-2 text-sm text-gray-300 flex items-center">
            Період: {dateRange.from} → {dateRange.to}
          </div>
        )}
      </div>

      {dateRange.from && dateRange.to && (
        <RoomsTable rooms={rooms} dfrom={dateRange.from} dto={dateRange.to} />
      )}
    </div>
  );
}
