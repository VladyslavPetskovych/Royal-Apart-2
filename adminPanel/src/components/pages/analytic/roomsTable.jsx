import React, { useMemo } from "react";

export default function RoomsTable({ rooms, dfrom, dto }) {
  const dates = useMemo(() => {
    const arr = [];
    const start = new Date(dfrom);
    const end = new Date(dto);

    while (start <= end) {
      arr.push(start.toISOString().slice(0, 10));
      start.setDate(start.getDate() + 1);
    }
    return arr;
  }, [dfrom, dto]);

  const getCellPrice = (room, date) => {
    // Показуємо тільки тарифні ціни з CSV
    if (!room.pricesCsv || room.pricesCsv.length === 0) {
      return (
        <div className="text-xs leading-tight">
          <div className="text-gray-500">-</div>
        </div>
      );
    }

    const csvEntry = room.pricesCsv.find((p) => {
      if (!p.date) return false;
      // Формат дати в CSV: DD/MM/YYYY
      const parts = p.date.split("/");
      if (parts.length !== 3) return false;
      const [d, m, y] = parts;
      const csvDate = `${y}-${m.padStart(2, "0")}-${d.padStart(2, "0")}`;
      return csvDate === date;
    });

    const csvPrice = csvEntry ? Math.round(csvEntry.price) : null;

    return (
      <div className="text-xs leading-tight">
        <div className="text-orange-400 font-semibold">
          {csvPrice && csvPrice > 0 ? csvPrice : "-"}
        </div>
      </div>
    );
  };

  // Діагностика
  console.log("📊 RoomsTable render:", {
    roomsCount: rooms.length,
    datesCount: dates.length,
    firstRoom: rooms[0]
      ? {
          name: rooms[0].name,
          pricesCsvCount: rooms[0].pricesCsv?.length || 0,
          firstPrice: rooms[0].pricesCsv?.[0],
        }
      : null,
  });

  return (
    <table className="w-full bg-gray-800 rounded-lg text-sm border-collapse">
      <thead>
        <tr className="bg-gray-700">
          <th className="px-3 py-2 text-left">Квартира</th>
          {dates.map((d) => (
            <th key={d} className="px-3 py-2 text-center">
              {d}
            </th>
          ))}
        </tr>
      </thead>

      <tbody>
        {rooms.map((room, idx) => (
          <tr
            key={`${room.id}-${room.name}-${idx}`}
            className="border-b border-gray-700"
          >
            <td className="px-3 py-2 font-medium">{room.name}</td>
            {dates.map((day) => (
              <td
                key={`${room.id}-${day}`}
                className="border px-2 py-1 text-center"
              >
                {getCellPrice(room, day)}
              </td>
            ))}
          </tr>
        ))}
      </tbody>
    </table>
  );
}
