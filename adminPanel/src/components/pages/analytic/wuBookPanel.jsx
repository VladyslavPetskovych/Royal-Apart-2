import React, { useState } from "react";
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

  const fetchPrices = async () => {
    console.log("▶ Fetching WuBook prices...");

    const diffDays = (new Date(dto) - new Date(dfrom)) / (1000 * 60 * 60 * 24);
    if (diffDays > 31) {
      alert("Максимальний період — 31 день");
      return;
    }

    setLoading(true);

    const df = new Date(dfrom).toLocaleDateString("en-GB");
    const dt = new Date(dto).toLocaleDateString("en-GB");

    const updatedRooms = [];
    const parser = new XMLParser();

    for (const room of rooms) {
      if (!room.wdid) {
        updatedRooms.push(room);
        continue;
      }

      const body = {
        lcode: 1638349860,
        pid: 0,
        globalId: room.wdid,
        dfrom: df,
        dto: dt,
      };

      try {
        const res = await axios.post(
          "https://royalapart.online/api/analis/prices",
          body,
          { headers: { "Content-Type": "application/json" } }
        );

        const parsed = parser.parse(res.data);

        const priceArray =
          parsed.methodResponse.params.param.value.array.data.value[1].struct
            .member.value.array.data.value;

        const prices = priceArray.map((v) => Number(v.double));

        updatedRooms.push({
          ...room,
          prices,
        });
      } catch (err) {
        console.error(`❌ Error for room: ${room.name}`, err);
        updatedRooms.push(room);
      }
    }

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
