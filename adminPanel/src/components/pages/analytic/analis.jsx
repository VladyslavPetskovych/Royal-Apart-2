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
  const [averagePrice, setAveragePrice] = useState(0);
  const [isLoading, setIsLoading] = useState(false);
  const [uploadedData, setUploadedData] = useState(null);

  // Fetch data from API
  const fetchData = async () => {
    try {
      setIsLoading(true);
      const res = await axios.get("https://royalapart.online/api/aparts");
      const data = res.data.data || [];
      setRooms(data);
      calculateForecast(data);
    } catch (error) {
      console.error("Помилка при отриманні даних:", error);
    } finally {
      setIsLoading(false);
    }
  };

  // Calculate forecast from rooms data
  const calculateForecast = (data) => {
    const prices = data.map((r) => Number(r.price) || 0);
    const avg =
      prices.length > 0
        ? prices.reduce((a, b) => a + b, 0) / prices.length
        : 0;
    setAveragePrice(Math.round(avg));

    // Simple trend forecast +2% per day for 3 days
    const forecast = [1, 2, 3].map((day, i) => ({
      name: `День +${day}`,
      price: Math.round(avg * (1 + (i + 1) * 0.02)),
    }));
    setPredictedData(forecast);
  };

  // Handle local file upload (CSV or JSON)
  const handleFileUpload = (e) => {
    const file = e.target.files[0];
    if (!file) return;

    const reader = new FileReader();

    reader.onload = (event) => {
      try {
        const content = event.target.result;
        let parsedData = [];

        if (file.name.endsWith(".json")) {
          parsedData = JSON.parse(content);
        } else if (file.name.endsWith(".csv")) {
          const lines = content.split("\n").filter((l) => l.trim());
          parsedData = lines.map((line) => {
            const [name, price] = line.split(",");
            return { name: name.trim(), price: Number(price) };
          });
        }

        setUploadedData(parsedData);
        setRooms(parsedData);
        calculateForecast(parsedData);
      } catch (err) {
        console.error("Помилка при обробці файлу:", err);
        alert("Невірний формат файлу");
      }
    };

    reader.readAsText(file);
  };

  // Initial auto-fetch
  useEffect(() => {
    fetchData();
  }, []);

  return (
    <div className="p-6 text-white bg-gray-900 min-h-screen">
      {/* Header */}
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

      {/* Controls */}
      <div className="bg-gray-800 rounded-xl p-4 mb-6 shadow-lg">
        <h2 className="text-lg font-semibold mb-3">Керування даними</h2>
        <div className="flex flex-col sm:flex-row items-start sm:items-center gap-4">
          <button
            onClick={fetchData}
            disabled={isLoading}
            className="bg-orange-500 hover:bg-orange-600 px-4 py-2 rounded-lg font-medium disabled:opacity-50"
          >
            {isLoading ? "Завантаження..." : "Отримати дані з API"}
          </button>

          <button
            onClick={() => calculateForecast(rooms)}
            className="bg-blue-500 hover:bg-blue-600 px-4 py-2 rounded-lg font-medium"
          >
            Перерахувати прогноз
          </button>

          <label className="cursor-pointer bg-gray-700 hover:bg-gray-600 px-4 py-2 rounded-lg font-medium">
            Завантажити файл (CSV/JSON)
            <input
              type="file"
              accept=".csv,.json"
              onChange={handleFileUpload}
              className="hidden"
            />
          </label>
        </div>
        {uploadedData && (
          <p className="mt-3 text-sm text-green-400">
            Завантажено {uploadedData.length} записів із файлу
          </p>
        )}
      </div>

      {/* Current Stats */}
      <div className="bg-gray-800 rounded-xl p-4 mb-6 shadow-lg">
        <h2 className="text-lg font-semibold mb-2">Поточні дані</h2>
        <p>Кількість квартир: {rooms.length}</p>
        <p>Середня ціна: {averagePrice} грн</p>
      </div>

      {/* Forecast Chart */}
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
          <p>Немає даних для відображення.</p>
        )}
      </div>
    </div>
  );
}

export default Analis;
