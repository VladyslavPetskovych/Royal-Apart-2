import React, { useEffect } from "react";

export default function RoomsTable({ rooms, dfrom, dto, excelData }) {
  // 🟩 Вивід у консоль
  useEffect(() => {
    console.log("📄 Отримані Excel дані у RoomsTable:", excelData);
  }, [excelData]);

  const getDateRange = () => {
    const start = new Date(dfrom);
    const end = new Date(dto);
    const dates = [];

    while (start <= end) {
      dates.push(start.toLocaleDateString("en-GB"));
      start.setDate(start.getDate() + 1);
    }
    return dates;
  };

  const dates = getDateRange();

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
        {rooms.map((room) => (
          <tr key={room._id} className="border-b border-gray-700">
            <td className="px-3 py-2 font-medium">{room.name}</td>

            {dates.map((_, i) => (
              <td key={i} className="border px-2 py-1 text-center">
                {room.prices && room.prices[i]
                  ? Math.round(room.prices[i])
                  : "—"}
              </td>
            ))}
          </tr>
        ))}
      </tbody>
    </table>
  );
}
