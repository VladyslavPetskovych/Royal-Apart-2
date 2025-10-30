import React, { useEffect, useState } from "react";
import axios from "axios";

import WuBookPanel from "./wuBookPanel";
import ForecastPanel from "./forecastPanel";
import StatsPanel from "./statsPanel";
import ForecastChart from "./forecastChart";

function Analis() {
  const [rooms, setRooms] = useState([]);
  const [averagePrice, setAveragePrice] = useState(0);
  const [predictedData, setPredictedData] = useState([]);
  const [isLoading, setIsLoading] = useState(false);

  const fetchRooms = async () => {
    setIsLoading(true);
    try {
      const res = await axios.get("https://royalapart.online/api/aparts");
      setRooms(res.data.data || []);
    } catch (e) {
      console.error("API Error", e);
    }
    setIsLoading(false);
  };

  useEffect(() => {
    fetchRooms();
  }, []);

  return (
    <div className="p-6 text-white bg-gray-900 min-h-screen">
      <h1 className="text-2xl font-semibold mb-6">Аналіз</h1>

      <WuBookPanel rooms={rooms} setRooms={setRooms} />

      <StatsPanel rooms={rooms} averagePrice={averagePrice} />

      <ForecastPanel
        rooms={rooms}
        setRooms={setRooms}
        averagePrice={averagePrice}
        setAveragePrice={setAveragePrice}
        predictedData={predictedData}
        setPredictedData={setPredictedData}
        isLoading={isLoading}
        fetchRooms={fetchRooms}
      />

      <ForecastChart predictedData={predictedData} />
    </div>
  );
}

export default Analis;
