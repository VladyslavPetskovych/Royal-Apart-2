import React from "react";

export default function DateRangePicker({ dfrom, dto, setDfrom, setDto }) {
  return (
    <div className="flex gap-4 mb-4">
      <div>
        <label className="block text-sm mb-1">Дата заїзду</label>
        <input
          type="date"
          value={dfrom}
          onChange={(e) => setDfrom(e.target.value)}
          className="bg-gray-700 p-2 rounded-md"
        />
      </div>

      <div>
        <label className="block text-sm mb-1">Дата виїзду</label>
        <input
          type="date"
          value={dto}
          onChange={(e) => setDto(e.target.value)}
          className="bg-gray-700 p-2 rounded-md"
        />
      </div>
    </div>
  );
}
