import React, { useMemo } from "react";

export default function RoomsTable({ rooms, dfrom, dto, excelData }) {
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

  const bookingMap = useMemo(() => {
    const map = {};
    for (const [date, list] of Object.entries(excelData || {})) {
      list.forEach((b) => {
        const name = b["Room Name"];
        if (!map[name]) map[name] = {};
        map[name][date] = b;
      });
    }
    return map;
  }, [excelData]);

  const getCellPrice = (room, date) => {
    const excelEntry = bookingMap[room.name]?.[date] || null;
    const excelPrice = excelEntry
      ? Math.round(excelEntry["Room daily price"])
      : null;

    const csvEntry = room.pricesCsv?.find((p) => {
      const [d, m, y] = p.date.split("/");
      const csvDate = `${y}-${m.padStart(2, "0")}-${d.padStart(2, "0")}`;
      return csvDate === date;
    });
    const csvPrice = csvEntry ? Math.round(csvEntry.price) : null;

    const highlight = excelPrice && csvPrice && excelPrice !== csvPrice;

    return (
      <div className="text-xs leading-tight">
        <div className="text-blue-400">{excelPrice ?? "-"}</div>
        <div className={`text-orange-400 ${highlight ? "font-bold" : ""}`}>
          {csvPrice ?? "-"}
        </div>
      </div>
    );
  };

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
