import React, { useState, useEffect, useRef } from "react";
import axios from "axios";

export default function PredictionTable() {
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const hasLoadedRef = useRef(false); // Відстежуємо, чи вже завантажили дані

  const fetchPredictions = async (forceRefresh = false) => {
    // Якщо дані вже завантажені і не потрібно примусове оновлення, не завантажуємо знову
    if (!forceRefresh && hasLoadedRef.current && data !== null) {
      return;
    }

    setLoading(true);
    setError(null);
    try {
      // Спробуємо спочатку localhost, якщо не працює - production
      let res;
      try {
        res = await axios.get("http://localhost:3000/forecast/checkToday");
      } catch (localErr) {
        // Якщо localhost не працює, спробуємо production
        res = await axios.get(
          "https://royalapart.online/api/forecast/checkToday"
        );
      }
      setData(res.data);
      hasLoadedRef.current = true; // Позначаємо, що дані завантажені
    } catch (err) {
      console.error("Error fetching predictions:", err);
      setError(err.message || "Не вдалося завантажити дані");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    // Завантажуємо дані лише один раз при монтуванні компонента
    if (!hasLoadedRef.current) {
      fetchPredictions(false);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []); // Порожній масив залежностей - викликається лише один раз

  const getStatusColor = (statusCode) => {
    switch (statusCode) {
      case 2:
        return "text-red-400 font-semibold"; // Висока
      case 1:
        return "text-yellow-400"; // Нормальна
      case 0:
        return "text-green-400"; // Низька
      default:
        return "text-gray-400";
    }
  };

  const getStatusBgColor = (statusCode) => {
    switch (statusCode) {
      case 2:
        return "bg-red-900/30 border-red-500/50";
      case 1:
        return "bg-yellow-900/30 border-yellow-500/50";
      case 0:
        return "bg-green-900/30 border-green-500/50";
      default:
        return "bg-gray-800 border-gray-600";
    }
  };

  const formatPrice = (price) => {
    if (price === null || price === undefined) return "-";
    return Math.round(price).toLocaleString("uk-UA");
  };

  const formatPercent = (value) => {
    if (value === null || value === undefined) return "-";
    return `${value.toFixed(2)}%`;
  };

  const getDayOfWeekName = (dayName) => {
    const dayMap = {
      Monday: "Понеділок",
      Tuesday: "Вівторок",
      Wednesday: "Середа",
      Thursday: "Четвер",
      Friday: "П'ятниця",
      Saturday: "Субота",
      Sunday: "Неділя",
    };
    return dayMap[dayName] || dayName || "-";
  };

  // Функція для перевірки, чи є корисні дані для квартири
  const hasUsefulData = (item) => {
    const pred = item.prediction || {};

    // Перевіряємо, чи є хоча б якісь корисні дані для аналізу
    const hasPredictedPrice =
      pred.predicted_price !== null &&
      pred.predicted_price !== undefined &&
      pred.predicted_price > 0;
    const hasSimilarBookings =
      pred.similar_bookings_count !== null &&
      pred.similar_bookings_count !== undefined &&
      pred.similar_bookings_count > 0;
    const hasOptimalPrice =
      pred.optimal_price !== null &&
      pred.optimal_price !== undefined &&
      pred.optimal_price > 0;
    const hasOccupancyData =
      pred.occupancy_metrics &&
      ((pred.occupancy_metrics.occupancy_rate !== undefined &&
        pred.occupancy_metrics.occupancy_rate > 0) ||
        (pred.occupancy_metrics.total_booked_days !== undefined &&
          pred.occupancy_metrics.total_booked_days > 0));
    const hasDemandData =
      pred.demand_metrics &&
      ((pred.demand_metrics.demand_count !== undefined &&
        pred.demand_metrics.demand_count > 0) ||
        (pred.demand_metrics.demand_intensity !== undefined &&
          pred.demand_metrics.demand_intensity > 0));
    const hasPriceRange =
      pred.price_range &&
      ((pred.price_range.min !== null && pred.price_range.min !== undefined) ||
        (pred.price_range.max !== null && pred.price_range.max !== undefined));

    // Квартира має корисні дані, якщо є хоча б одна з цих метрик
    // Або якщо є прогнозована ціна (навіть якщо інших даних немає)
    return (
      hasPredictedPrice ||
      hasSimilarBookings ||
      hasOptimalPrice ||
      hasOccupancyData ||
      hasDemandData ||
      hasPriceRange
    );
  };

  if (loading && !data) {
    return (
      <div className="bg-gray-800 p-6 rounded-xl mb-6">
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-xl font-semibold">
            Детальний аналіз цін на сьогодні
          </h2>
          <button
            onClick={() => fetchPredictions(true)}
            className="bg-blue-500 hover:bg-blue-600 px-4 py-2 rounded-lg transition"
          >
            Оновити
          </button>
        </div>
        <div className="text-center py-8 text-gray-400">Завантаження...</div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="bg-gray-800 p-6 rounded-xl mb-6">
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-xl font-semibold">
            Детальний аналіз цін на сьогодні
          </h2>
          <button
            onClick={fetchPredictions}
            className="bg-blue-500 hover:bg-blue-600 px-4 py-2 rounded-lg transition"
          >
            Спробувати знову
          </button>
        </div>
        <div className="text-center py-8 text-red-400">Помилка: {error}</div>
      </div>
    );
  }

  if (!data || !data.results || data.results.length === 0) {
    return (
      <div className="bg-gray-800 p-6 rounded-xl mb-6">
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-xl font-semibold">
            Детальний аналіз цін на сьогодні
          </h2>
          <button
            onClick={() => fetchPredictions(true)}
            className="bg-blue-500 hover:bg-blue-600 px-4 py-2 rounded-lg transition"
          >
            Оновити
          </button>
        </div>
        <div className="text-center py-8 text-gray-400">Немає даних</div>
      </div>
    );
  }

  return (
    <div className="bg-gray-800 p-6 rounded-xl mb-6">
      <div className="flex items-center justify-between mb-4">
        <div>
          <h2 className="text-xl font-semibold mb-2">
            Детальний аналіз цін на сьогодні
          </h2>
          <div className="text-sm text-gray-400">
            Дата: {data.date} | Всього квартир: {data.totalRooms} | Оброблено:{" "}
            {data.processed} | Помилки: {data.errors} | Показано:{" "}
            {data.results
              ? data.results.filter((item) => hasUsefulData(item)).length
              : 0}
          </div>
          {data.results &&
            data.results.length > 0 &&
            data.results[0]?.prediction?.is_high_demand_day && (
              <div className="mt-2 text-sm text-orange-400 bg-orange-900/20 px-3 py-1 rounded inline-block">
                🔥 Сьогодні п'ятниця або субота - очікується високий попит, ціни
                зазвичай вищі
              </div>
            )}
        </div>
        <button
          onClick={() => fetchPredictions(true)}
          disabled={loading}
          className="bg-blue-500 hover:bg-blue-600 disabled:bg-gray-600 disabled:cursor-not-allowed px-4 py-2 rounded-lg transition"
        >
          {loading ? "Оновлення..." : "Оновити"}
        </button>
      </div>

      <div className="overflow-x-auto">
        <table className="w-full bg-gray-900 rounded-lg text-sm border-collapse">
          <thead>
            <tr className="bg-gray-700">
              <th className="px-4 py-3 text-left sticky left-0 bg-gray-700 z-10">
                Квартира
              </th>
              <th className="px-4 py-3 text-center">День тижня</th>
              <th className="px-4 py-3 text-center">Ціна WuBook</th>
              <th className="px-4 py-3 text-center">Прогнозована ціна</th>
              <th className="px-4 py-3 text-center">Рекомендована ціна</th>
              <th className="px-4 py-3 text-center">Різниця</th>
              <th className="px-4 py-3 text-center">Статус</th>
              <th className="px-4 py-3 text-center">Впевненість</th>
              <th className="px-4 py-3 text-center">Частота здачі</th>
              <th className="px-4 py-3 text-center">Попит</th>
              <th className="px-4 py-3 text-center">Втрачений дохід</th>
              <th className="px-4 py-3 text-center">Діапазон цін</th>
              <th className="px-4 py-3 text-center">Схожі бронювання</th>
            </tr>
          </thead>
          <tbody>
            {data.results.filter((item) => hasUsefulData(item)).length === 0 ? (
              <tr>
                <td
                  colSpan="13"
                  className="px-4 py-8 text-center text-gray-400"
                >
                  Немає квартир з доступними даними для відображення
                </td>
              </tr>
            ) : (
              data.results
                .filter((item) => hasUsefulData(item)) // Фільтруємо квартири без даних
                .map((item, idx) => {
                  const pred = item.prediction || {};
                  const priceDiff = pred.optimal_price
                    ? item.wubookPrice - pred.optimal_price
                    : null;
                  const priceDiffPercent =
                    pred.optimal_price && item.wubookPrice
                      ? ((priceDiff / pred.optimal_price) * 100).toFixed(1)
                      : null;

                  // Визначаємо день тижня та чи це високий попит
                  const dayOfWeek = pred.day_of_week || "";
                  const isHighDemandDay = pred.is_high_demand_day || false;
                  const isWeekend = pred.is_weekend || false;

                  // Отримуємо метрики
                  const occupancy = pred.occupancy_metrics || {};
                  const demand = pred.demand_metrics || {};

                  return (
                    <tr
                      key={`${item.wdid}-${idx}`}
                      className={`border-b border-gray-700 hover:bg-gray-700/50 transition ${getStatusBgColor(
                        pred.status_code
                      )}`}
                    >
                      <td className="px-4 py-3 font-medium sticky left-0 bg-gray-800 z-10 border-r border-gray-700">
                        {item.roomName || pred.room}
                      </td>
                      <td className="px-4 py-3 text-center">
                        <div className="flex flex-col items-center">
                          <span
                            className={`text-sm font-semibold ${
                              isHighDemandDay
                                ? "text-orange-400"
                                : isWeekend
                                ? "text-yellow-400"
                                : "text-gray-300"
                            }`}
                          >
                            {getDayOfWeekName(dayOfWeek)}
                          </span>
                          {isHighDemandDay && (
                            <span
                              className="text-xs text-orange-400 mt-1"
                              title="П'ятниця або Субота - високий попит, ціни зазвичай вищі"
                            >
                              🔥 Високий попит
                            </span>
                          )}
                          {isWeekend && !isHighDemandDay && (
                            <span
                              className="text-xs text-yellow-400 mt-1"
                              title="Вихідний день"
                            >
                              📅 Вихідний
                            </span>
                          )}
                        </div>
                      </td>
                      <td className="px-4 py-3 text-center">
                        <span className="text-blue-400 font-semibold">
                          {formatPrice(item.wubookPrice)} ₴
                        </span>
                      </td>
                      <td className="px-4 py-3 text-center">
                        <span className="text-purple-400">
                          {formatPrice(pred.predicted_price)} ₴
                        </span>
                      </td>
                      <td className="px-4 py-3 text-center">
                        {pred.optimal_price ? (
                          <span className="text-green-400 font-semibold">
                            {formatPrice(pred.optimal_price)} ₴
                          </span>
                        ) : (
                          <span className="text-gray-500">-</span>
                        )}
                      </td>
                      <td className="px-4 py-3 text-center">
                        {priceDiff !== null && pred.optimal_price ? (
                          <div>
                            <div
                              className={`${
                                priceDiff > 0
                                  ? "text-red-400"
                                  : priceDiff < 0
                                  ? "text-green-400"
                                  : "text-gray-400"
                              } font-semibold`}
                            >
                              {priceDiff > 0 ? "+" : ""}
                              {formatPrice(priceDiff)} ₴
                            </div>
                            {priceDiffPercent && (
                              <div
                                className={`text-xs ${
                                  priceDiff > 0
                                    ? "text-red-400"
                                    : priceDiff < 0
                                    ? "text-green-400"
                                    : "text-gray-400"
                                }`}
                              >
                                {priceDiff > 0 ? "+" : ""}
                                {priceDiffPercent}%
                              </div>
                            )}
                          </div>
                        ) : (
                          <span className="text-gray-500">-</span>
                        )}
                      </td>
                      <td className="px-4 py-3 text-center">
                        <span className={getStatusColor(pred.status_code)}>
                          {pred.status || "-"}
                        </span>
                      </td>
                      <td className="px-4 py-3 text-center">
                        {pred.confidence ? (
                          <div className="space-y-1">
                            <div className="text-xs">
                              <span className="text-red-400">Низька: </span>
                              {formatPercent(pred.confidence.low)}
                            </div>
                            <div className="text-xs">
                              <span className="text-yellow-400">
                                Нормальна:{" "}
                              </span>
                              {formatPercent(pred.confidence.normal)}
                            </div>
                            <div className="text-xs">
                              <span className="text-green-400">Висока: </span>
                              {formatPercent(pred.confidence.high)}
                            </div>
                          </div>
                        ) : (
                          <span className="text-gray-500">-</span>
                        )}
                      </td>
                      <td className="px-4 py-3 text-center">
                        {occupancy.occupancy_rate !== undefined ? (
                          <div className="text-xs space-y-1">
                            <div>
                              <span className="text-cyan-400">
                                Зайнятість:{" "}
                              </span>
                              <span className="font-semibold">
                                {occupancy.occupancy_rate?.toFixed(1) || 0}%
                              </span>
                            </div>
                            <div className="text-gray-400">
                              Днів: {occupancy.total_booked_days || 0}
                            </div>
                            <div className="text-gray-400">
                              Середня тривалість:{" "}
                              {occupancy.avg_booking_duration?.toFixed(1) || 0}{" "}
                              дн.
                            </div>
                            <div className="text-gray-400">
                              Бронювань/міс:{" "}
                              {occupancy.bookings_per_month?.toFixed(1) || 0}
                            </div>
                          </div>
                        ) : (
                          <span className="text-gray-500">-</span>
                        )}
                      </td>
                      <td className="px-4 py-3 text-center">
                        {demand.demand_intensity !== undefined ? (
                          <div className="text-xs space-y-1">
                            <div>
                              <span className="text-purple-400">
                                Інтенсивність:{" "}
                              </span>
                              <span className="font-semibold">
                                {demand.demand_intensity?.toFixed(1) || 0}%
                              </span>
                            </div>
                            <div className="text-gray-400">
                              Днів з попитом: {demand.demand_count || 0}
                            </div>
                            {demand.price_trend !== undefined &&
                              demand.price_trend !== 0 && (
                                <div
                                  className={
                                    demand.price_trend > 0
                                      ? "text-green-400"
                                      : "text-red-400"
                                  }
                                >
                                  Тренд: {demand.price_trend > 0 ? "+" : ""}
                                  {demand.price_trend?.toFixed(1) || 0}%
                                </div>
                              )}
                            {demand.recent_demand_ratio !== undefined &&
                              demand.recent_demand_ratio > 0 && (
                                <div className="text-gray-400">
                                  Співвідношення:{" "}
                                  {demand.recent_demand_ratio?.toFixed(2) || 0}x
                                </div>
                              )}
                          </div>
                        ) : (
                          <span className="text-gray-500">-</span>
                        )}
                      </td>
                      <td className="px-4 py-3 text-center">
                        {pred.lost_revenue !== null &&
                        pred.lost_revenue !== undefined ? (
                          <div>
                            <div
                              className={`${
                                pred.lost_revenue > 0
                                  ? "text-red-400"
                                  : "text-green-400"
                              }`}
                            >
                              {formatPrice(pred.lost_revenue)} ₴
                            </div>
                            {pred.lost_revenue_pct !== null && (
                              <div className="text-xs text-gray-400">
                                {formatPercent(pred.lost_revenue_pct)}
                              </div>
                            )}
                          </div>
                        ) : (
                          <span className="text-gray-500">-</span>
                        )}
                      </td>
                      <td className="px-4 py-3 text-center">
                        {pred.price_range &&
                        (pred.price_range.min !== null ||
                          pred.price_range.max !== null) ? (
                          <div className="text-xs">
                            <div>
                              Мін: {formatPrice(pred.price_range.min)} ₴
                            </div>
                            <div>
                              Макс: {formatPrice(pred.price_range.max)} ₴
                            </div>
                          </div>
                        ) : (
                          <span className="text-gray-500">-</span>
                        )}
                      </td>
                      <td className="px-4 py-3 text-center">
                        {pred.similar_bookings_count !== null &&
                        pred.similar_bookings_count !== undefined ? (
                          <div>
                            <span className="text-blue-400">
                              {pred.similar_bookings_count}
                            </span>
                            {pred.avg_similar_price && (
                              <div className="text-xs text-gray-400 mt-1">
                                Середня: {formatPrice(pred.avg_similar_price)} ₴
                              </div>
                            )}
                          </div>
                        ) : (
                          <span className="text-gray-500">-</span>
                        )}
                      </td>
                    </tr>
                  );
                })
            )}
          </tbody>
        </table>
      </div>

      {data.timing && (
        <div className="mt-4 text-xs text-gray-400 space-y-1">
          <div>Час виконання: Загальний - {data.timing.total}мс</div>
          <div className="flex gap-4">
            <span>WuBook: {data.timing.wubook}мс</span>
            <span>Парсинг: {data.timing.parsing}мс</span>
            <span>MongoDB: {data.timing.mongo}мс</span>
            <span>Прогнози: {data.timing.predictions}мс</span>
          </div>
        </div>
      )}
    </div>
  );
}
