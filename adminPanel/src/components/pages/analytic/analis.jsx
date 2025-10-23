// src/pages/Analis.jsx
import React, { useEffect, useState } from "react";
import axios from "axios";
import {
  LineChart,
  Line,
  CartesianGrid,
  XAxis,
  YAxis,
  Tooltip,
  ResponsiveContainer,
} from "recharts";

function Analis() {
  const [rooms, setRooms] = useState([]);
  const [predictedData, setPredictedData] = useState([]);

  useEffect(() => {
    const fetchData = async () => {
      try {
        const res = await axios.get("https://royalapart.online/api/aparts");
        const data = res.data.data || [];
        setRooms(data);

        // для простоти: створимо масив цін і обчислимо тренд
        const prices = data.map((r) => Number(r.price) || 0);
        const avg = prices.reduce((a, b) => a + b, 0) / (prices.length || 1);

        // згенеруємо передбачення: +3 дні, припустимо тренд +2%
        const forecast = [1, 2, 3].map((day, i) => ({
          name: `День +${day}`,
          price: Math.round(avg * (1 + (i + 1) * 0.02)),
        }));

        setPredictedData(forecast);
      } catch (error) {
        console.error("Помилка при отриманні даних:", error);
      }
    };
    fetchData();
  }, []);

  const averagePrice =
    rooms.length > 0
      ? Math.round(
          rooms.reduce((sum, r) => sum + (Number(r.price) || 0), 0) /
            rooms.length
        )
      : 0;

  return (
    <div className="p-6 text-white bg-gray-900 min-h-screen">
      <div className="flex items-center gap-3 mb-6">
        <svg
          xmlns="http://www.w3.org/2000/svg"
          width="36"
          height="36"
          fill="currentColor"
          viewBox="0 0 256 256"
          className="text-orange-400"
        >
          <path d="M224,200h-8V40a8,8,0,0,0-8-8H152a8,8,0,0,0-8,8V80H96a8,8,0,0,0-8,8v40H48a8,8,0,0,0-8,8v64H32a8,8,0,0,0,0,16H224a8,8,0,0,0,0-16ZM160,48h40V200H160ZM104,96h40V200H104ZM56,144H88v56H56Z"></path>
        </svg>
        <h1 className="text-2xl font-semibold">Сторінка Аналізу</h1>
      </div>

      <div className="bg-gray-800 rounded-xl p-4 mb-6 shadow-lg">
        <h2 className="text-lg font-semibold mb-2">Поточні дані</h2>
        <p>Кількість квартир: {rooms.length}</p>
        <p>Середня ціна: {averagePrice} грн</p>
      </div>

      <div className="bg-gray-800 rounded-xl p-4 shadow-lg">
        <h2 className="text-lg font-semibold mb-4">
          Передбачення цін (на 3 дні)
        </h2>
        {predictedData.length > 0 ? (
          <ResponsiveContainer width="100%" height={300}>
            <LineChart data={predictedData}>
              <CartesianGrid strokeDasharray="3 3" stroke="#444" />
              <XAxis dataKey="name" stroke="#ccc" />
              <YAxis stroke="#ccc" />
              <Tooltip />
              <Line
                type="monotone"
                dataKey="price"
                stroke="#f59e0b"
                strokeWidth={3}
                dot={{ r: 5 }}
              />
            </LineChart>
          </ResponsiveContainer>
        ) : (
          <p>Завантаження...</p>
        )}
      </div>
    </div>
  );
}

export default Analis;
