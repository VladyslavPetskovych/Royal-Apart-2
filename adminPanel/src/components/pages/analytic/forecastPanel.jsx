import React from "react";

export default function ForecastPanel({
  rooms,
  setRooms,
  fetchRooms,
  averagePrice,
  setAveragePrice,
  predictedData,
  setPredictedData,
  isLoading
}) {
  const calc = (data) => {
    const prices = data.map(r => Number(r.price) || 0);
    const avg = prices.length ? prices.reduce((a,b)=>a+b,0) / prices.length : 0;
    setAveragePrice(Math.round(avg));

    const pred = [1,2,3].map((day,i)=>({
      name: `День +${day}`,
      price: Math.round(avg * (1 + (i+1)*0.02))
    }));
    setPredictedData(pred);
  };

  return (
    <div className="bg-gray-800 p-4 rounded-xl mb-6">
      <h2 className="text-lg font-semibold mb-3">Керування даними</h2>

      <button onClick={fetchRooms} disabled={isLoading}
              className="bg-orange-500 px-4 py-2 rounded-lg mr-2">
        {isLoading ? "Завантаження..." : "Отримати дані з API"}
      </button>

      <button onClick={()=>calc(rooms)}
              className="bg-blue-500 px-4 py-2 rounded-lg">
        Перерахувати прогноз
      </button>
    </div>
  );
}
