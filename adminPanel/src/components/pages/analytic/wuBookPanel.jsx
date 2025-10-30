import React, { useState } from "react";
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

  const fetchPrices = async () => {
    console.log("▶ Fetching prices...");
    console.log("Rooms:", rooms);
    console.log("Dates selected:", dfrom, dto);

    // Validate date range (max 31 days)
    const diffDays = (new Date(dto) - new Date(dfrom)) / (1000 * 60 * 60 * 24);
    if (diffDays > 31) {
      alert("Максимальний період — 31 день");
      return;
    }

    setLoading(true);

    const df = new Date(dfrom).toLocaleDateString("en-GB");
    const dt = new Date(dto).toLocaleDateString("en-GB");

    console.log("📅 WuBook date format:", df, dt);

    const updatedRooms = [];

    for (const room of rooms) {
      console.log(`\n🏠 Processing room: ${room.name}`);
      console.log("globalId:", room.globalId);

      if (!room.globalId) {
        console.warn("❌ No globalId → skipping");
        updatedRooms.push(room);
        continue;
      }

      try {
        const body = {
          lcode: 1638349860,
          pid: 0,
          globalId: room.globalId,
          dfrom: df,
          dto: dt,
        };

        console.log("📤 Sending body to backend:", body);

        const res = await axios.post(
          "https://royalapart.online/api/analis/prices",
          body
        );

        console.log("📥 Raw response:", res.data);

        const data = res.data;
        const priceObj = data?.[1] || {};
        const priceArr = priceObj[room.globalId] || [];

        console.log("✅ Parsed prices:", priceArr);

        updatedRooms.push({
          ...room,
          prices: priceArr,
        });
      } catch (err) {
        console.error(`❌ Error for ${room.name}`, err);
        updatedRooms.push(room);
      }
    }

    console.log("✅ Final rooms:", updatedRooms);
    setRooms(updatedRooms);
    setLoading(false);
  };

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

      <RoomsTable rooms={rooms} dfrom={dfrom} dto={dto} />
    </div>
  );
}
