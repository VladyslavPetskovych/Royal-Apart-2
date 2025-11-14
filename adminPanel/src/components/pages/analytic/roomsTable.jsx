import React, { useEffect, useMemo } from "react";

export default function RoomsTable({ rooms, dfrom, dto, excelData }) {
  useEffect(() => {
    console.log("📄 Excel Data in table:", excelData);
  }, [excelData]);

  // ==== ДАТИ ДЛЯ ТАБЛИЦІ ====
  const getDateRange = () => {
    const start = new Date(dfrom);
    const end = new Date(dto);
    const dates = [];

    while (start <= end) {
      const iso = start.toISOString().slice(0, 10); // YYYY-MM-DD
      dates.push(iso);
      start.setDate(start.getDate() + 1);
    }
    return dates;
  };

  const dates = getDateRange();

  // ==== 🔥 Будуємо структуру: квартира → дата → броні ====
  const calendarMap = useMemo(() => {
    if (!excelData || !excelData.days) return {};

    const map = {};

    Object.entries(excelData.days).forEach(([day, bookings]) => {
      bookings.forEach((b) => {
        const roomCode = b["Room Code"]; // fr14, mos4, b23…

        if (!map[roomCode]) map[roomCode] = {};
        if (!map[roomCode][day]) map[roomCode][day] = [];

        map[roomCode][day].push(b);
      });
    });

    console.log("📌 CALENDAR MAP:", map);
    return map;
  }, [excelData]);

  return (
    <table className="w-full bg-gray-800 rounded-lg text-sm">
      <thead>
        <tr className="bg-gray-700">
          <th className="px-3 py-2 text-left">Квартира</th>

          {dates.map((d, i) => (
            <th key={i} className="px-3 py-2 text-center">
              {d}
            </th>
          ))}
        </tr>
      </thead>

      <tbody>
        {rooms.map((room) => {
          const rCode = room.code; // наприклад "fr14"

          return (
            <tr key={room._id} className="border-b border-gray-700">
              <td className="px-3 py-2 font-medium">{room.name}</td>

              {dates.map((day, i) => {
                const hasBooking =
                  calendarMap[rCode] &&
                  calendarMap[rCode][day] &&
                  calendarMap[rCode][day].length > 0;

                return (
                  <td
                    key={i}
                    className="border px-2 py-1 text-center"
                    style={{
                      background: hasBooking ? "#22c55e55" : "transparent",
                      color: hasBooking ? "white" : "#ccc",
                    }}
                  >
                    {hasBooking ? "🟩" : "—"}
                  </td>
                );
              })}
            </tr>
          );
        })}
      </tbody>
    </table>
  );
}
