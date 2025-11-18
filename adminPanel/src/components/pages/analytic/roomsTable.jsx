import React, { useMemo } from "react";

/* ========== Алгоритм Fuzzy Match ========== */

function similarity(a, b) {
  let longer = a,
    shorter = b;
  if (a.length < b.length) {
    longer = b;
    shorter = a;
  }

  const longerLength = longer.length;
  if (longerLength === 0) return 1.0;

  return (longerLength - editDistance(longer, shorter)) / longerLength;
}

function editDistance(a, b) {
  a = a.toLowerCase();
  b = b.toLowerCase();
  const costs = [];

  for (let i = 0; i <= a.length; i++) {
    let lastValue = i;
    for (let j = 0; j <= b.length; j++) {
      if (i === 0) costs[j] = j;
      else if (j > 0) {
        let newValue = costs[j - 1];
        if (a[i - 1] !== b[j - 1])
          newValue = Math.min(Math.min(newValue, lastValue), costs[j]) + 1;
        costs[j - 1] = lastValue;
        lastValue = newValue;
      }
    }
    if (i > 0) costs[b.length] = lastValue;
  }

  return costs[b.length];
}

function normalize(str) {
  if (!str) return "";
  return str
    .toLowerCase()
    .replace(/[^\p{L}\p{N}]/gu, "")
    .replace(/і/g, "i")
    .replace(/ї/g, "i")
    .replace(/є/g, "e");
}

function findClosestRoom(excelRooms, roomName) {
  const target = normalize(roomName);

  let best = null;
  let bestScore = 0;

  excelRooms.forEach((b) => {
    const excelName = normalize(b["Room Name"]);
    const score = similarity(target, excelName);

    if (score > bestScore) {
      bestScore = score;
      best = b["Room Name"];
    }
  });

  if (bestScore >= 0.55) return best;
  return null;
}

/* ========== Таблиця ========== */

export default function RoomsTable({ rooms, dfrom, dto, excelData }) {
  console.log("📌 excelData in RoomsTable:", excelData);

  /* --- Генеруємо діапазон дат --- */
  const dates = useMemo(() => {
    const start = new Date(dfrom);
    const end = new Date(dto);
    const arr = [];

    while (start <= end) {
      arr.push(start.toISOString().slice(0, 10));
      start.setDate(start.getDate() + 1);
    }
    return arr;
  }, [dfrom, dto]);

  /* --- Перетворюємо excelData.days у Map: roomName → date → booking --- */
  const bookingMap = useMemo(() => {
    const map = {};

    if (!excelData || Object.keys(excelData).length === 0) {
      console.warn("⚠️ bookingMap empty, excelData:", excelData);
      return map;
    }

    for (const [day, bookings] of Object.entries(excelData)) {
      bookings.forEach((b) => {
        const name = b["Room Name"];
        if (!map[name]) map[name] = {};
        map[name][day] = b;
      });
    }

    console.log("🟦 bookingMap:", map);
    return map;
  }, [excelData]);

  const allExcelRooms = useMemo(
    () => Object.values(excelData).flat(),
    [excelData]
  );

  return (
    <table className="w-full bg-gray-800 rounded-lg text-sm">
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
        {rooms.map((room) => {
          /* 🔥 fuzzy match */
          const matchedName = findClosestRoom(allExcelRooms, room.name);

          return (
            <tr key={room._id} className="border-b border-gray-700">
              <td className="px-3 py-2 font-medium">
                {room.name}

                {matchedName && matchedName !== room.name && (
                  <div className="text-xs text-gray-400">→ {matchedName}</div>
                )}
              </td>

              {dates.map((day, i) => {
                const tariff = room.prices?.[i] || null;

                const book =
                  matchedName && bookingMap[matchedName]
                    ? bookingMap[matchedName][day]
                    : null;

                const factPrice = book ? book["Room daily price"] : null;

                return (
                  <td
                    key={day}
                    className="border px-2 py-1 text-center"
                    style={{
                      backgroundColor: factPrice ? "#22c55e55" : "transparent",
                    }}
                  >
                    {/* Тариф */}
                    <div>{tariff ? Math.round(tariff) : "—"}</div>

                    {/* Фактична ціна */}
                    {factPrice && (
                      <div className="text-xs text-green-300">
                        ({Math.round(factPrice)})
                      </div>
                    )}
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
