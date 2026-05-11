import React, { useMemo, useState } from "react";
import axios from "axios";

function Analis() {
  const [importLoading, setImportLoading] = useState(false);
  const [syncLoading, setSyncLoading] = useState(false);
  const [dashboardLoading, setDashboardLoading] = useState(false);
  const [predictLoading, setPredictLoading] = useState(false);

  const [importResult, setImportResult] = useState(null);
  const [syncResult, setSyncResult] = useState(null);
  const [dashboardResult, setDashboardResult] = useState(null);
  const [comparisonRows, setComparisonRows] = useState([]);
  const [predictResult, setPredictResult] = useState(null);

  const [bookingFile, setBookingFile] = useState(null);
  const [syncForm, setSyncForm] = useState({
    plan_id: "",
    force_refresh: false,
  });
  const [dashboardRange, setDashboardRange] = useState({
    from: "",
    to: "",
    capacity: "",
  });
  const [predictionForm, setPredictionForm] = useState({
    stay_date: "",
    room_type_code: "",
    tariff_price: "",
    booking_window_days: "",
    occupancy_for_date: "",
  });

  const apiBase = useMemo(() => {
    const host = window.location.hostname;
    if (host === "localhost" || host === "127.0.0.1") {
      return "http://localhost:3000/revenue";
    }
    return "https://royalapart.online/api/revenue";
  }, []);

  const loadDashboardByRange = async (from, to) => {
    const safeFrom = from || dashboardRange.from;
    const safeTo = to || dashboardRange.to;
    if (!safeFrom || !safeTo) return;

    const summaryRes = await axios.get(`${apiBase}/analytics/summary`, {
      params: {
        from: safeFrom,
        to: safeTo,
        capacity: dashboardRange.capacity || undefined,
      },
    });
    setDashboardResult(summaryRes.data?.analytics || null);

    const compRes = await axios.get(`${apiBase}/comparison`, {
      params: { from: safeFrom, to: safeTo },
    });
    setComparisonRows(compRes.data?.comparisons || []);
    setDashboardRange((p) => ({ ...p, from: safeFrom, to: safeTo }));
  };

  const uploadBookings = async () => {
    if (!bookingFile) {
      alert("Оберіть CSV/XLSX файл бронювань");
      return;
    }
    setImportLoading(true);
    try {
      const formData = new FormData();
      formData.append("file", bookingFile);
      formData.append("auto_sync_rates", "true");
      if (syncForm.plan_id) formData.append("plan_id", syncForm.plan_id);
      formData.append("force_refresh", String(syncForm.force_refresh));
      const res = await axios.post(`${apiBase}/bookings/import`, formData, {
        headers: { "Content-Type": "multipart/form-data" },
      });
      setImportResult(res.data);
      if (res.data?.auto_sync) {
        setSyncResult(res.data.auto_sync);
        if (res.data.auto_sync.success && res.data.auto_sync.used_range) {
          await loadDashboardByRange(
            res.data.auto_sync.used_range.from,
            res.data.auto_sync.used_range.to
          );
        }
      }
    } catch (error) {
      alert(`Помилка імпорту: ${error.response?.data?.error || error.message}`);
    } finally {
      setImportLoading(false);
    }
  };

  const syncRates = async () => {
    setSyncLoading(true);
    try {
      const res = await axios.post(`${apiBase}/rates/sync`, syncForm);
      setSyncResult(res.data);
      if (res.data?.used_range) {
        await loadDashboardByRange(res.data.used_range.from, res.data.used_range.to);
      }
    } catch (error) {
      alert(`Помилка sync: ${error.response?.data?.error || error.message}`);
    } finally {
      setSyncLoading(false);
    }
  };

  const loadDashboard = async () => {
    if (!dashboardRange.from || !dashboardRange.to) {
      alert("Вкажіть from/to для dashboard");
      return;
    }

    setDashboardLoading(true);
    try {
      await loadDashboardByRange(dashboardRange.from, dashboardRange.to);
    } catch (error) {
      alert(
        `Помилка dashboard: ${error.response?.data?.error || error.message}`
      );
    } finally {
      setDashboardLoading(false);
    }
  };

  const exportComparison = () => {
    if (!dashboardRange.from || !dashboardRange.to) {
      alert("Вкажіть from/to для export");
      return;
    }
    const url = `${apiBase}/comparison/export?from=${dashboardRange.from}&to=${dashboardRange.to}`;
    window.open(url, "_blank");
  };

  const predictPrice = async () => {
    if (
      !predictionForm.stay_date ||
      !predictionForm.room_type_code ||
      !predictionForm.tariff_price
    ) {
      alert("Заповніть stay_date, room_type_code, tariff_price");
      return;
    }
    setPredictLoading(true);
    try {
      const payload = {
        ...predictionForm,
        tariff_price: Number(predictionForm.tariff_price),
        booking_window_days: Number(predictionForm.booking_window_days || 0),
        occupancy_for_date: Number(predictionForm.occupancy_for_date || 0),
      };
      const res = await axios.post(`${apiBase}/ml/predict`, payload);
      setPredictResult(res.data);
    } catch (error) {
      alert(
        `Помилка прогнозу: ${error.response?.data?.error || error.message}`
      );
    } finally {
      setPredictLoading(false);
    }
  };

  return (
    <div className="p-6 text-white bg-gray-900 min-h-screen">
      <h1 className="text-2xl font-semibold mb-6">Analytics / Revenue</h1>

      <div className="grid grid-cols-1 xl:grid-cols-2 gap-4 mb-6">
        <div className="bg-gray-800 p-4 rounded-xl">
          <h2 className="text-lg font-semibold mb-3">
            1) Завантаження booking-файлу
          </h2>
          <input
            type="file"
            accept=".csv,.xlsx,.xls"
            onChange={(e) => setBookingFile(e.target.files?.[0] || null)}
            className="mb-3 block w-full text-sm"
          />
          <button
            onClick={uploadBookings}
            disabled={importLoading}
            className="bg-orange-500 hover:bg-orange-600 disabled:bg-gray-600 px-4 py-2 rounded"
          >
            {importLoading ? "Імпорт..." : "Імпортувати бронювання"}
          </button>
          {importResult && (
            <div className="text-sm mt-3 text-gray-300">
              imported: {importResult.imported || 0}, skipped:{" "}
              {importResult.skipped || 0}, total: {importResult.totalRows || 0}
            </div>
          )}
        </div>

        <div className="bg-gray-800 p-4 rounded-xl">
          <h2 className="text-lg font-semibold mb-3">2) Sync тарифів</h2>
          <div className="grid grid-cols-2 gap-2 mb-3">
            <input
              placeholder="plan_id"
              value={syncForm.plan_id}
              onChange={(e) =>
                setSyncForm((p) => ({ ...p, plan_id: e.target.value }))
              }
              className="bg-gray-700 px-3 py-2 rounded"
            />
            <label className="flex items-center gap-2 text-sm">
              <input
                type="checkbox"
                checked={syncForm.force_refresh}
                onChange={(e) =>
                  setSyncForm((p) => ({
                    ...p,
                    force_refresh: e.target.checked,
                  }))
                }
              />
              force refresh
            </label>
            <div className="bg-gray-700 px-3 py-2 rounded text-xs text-gray-300 flex items-center">
              Після імпорту діапазон і WuBook credentials визначаються автоматично.
            </div>
            <div className="bg-gray-700 px-3 py-2 rounded text-xs text-gray-300 flex items-center">
              Натисни sync лише якщо потрібно перерахувати кеш.
            </div>
          </div>
          <button
            onClick={syncRates}
            disabled={syncLoading}
            className="bg-blue-500 hover:bg-blue-600 disabled:bg-gray-600 px-4 py-2 rounded"
          >
            {syncLoading ? "Sync..." : "Запустити sync"}
          </button>
          {syncResult && (
            <div className="text-sm mt-3 text-gray-300">
              fetched: {syncResult.fetchedCount || 0}, saved:{" "}
              {syncResult.saved || 0}, cache:{" "}
              {syncResult.fromCache ? "так" : "ні"}
              {syncResult.used_range
                ? `, range: ${syncResult.used_range.from} → ${syncResult.used_range.to}`
                : ""}
              {syncResult.error ? `, error: ${syncResult.error}` : ""}
            </div>
          )}
        </div>
      </div>

      <div className="bg-gray-800 p-4 rounded-xl mb-6">
        <h2 className="text-lg font-semibold mb-3">
          3) Dashboard (ADR / Occupancy / Pickup / Pace)
        </h2>
        <div className="grid grid-cols-1 md:grid-cols-4 gap-2 mb-3">
          <input
            type="date"
            value={dashboardRange.from}
            onChange={(e) =>
              setDashboardRange((p) => ({ ...p, from: e.target.value }))
            }
            className="bg-gray-700 px-3 py-2 rounded"
          />
          <input
            type="date"
            value={dashboardRange.to}
            onChange={(e) =>
              setDashboardRange((p) => ({ ...p, to: e.target.value }))
            }
            className="bg-gray-700 px-3 py-2 rounded"
          />
          <input
            placeholder="capacity (optional)"
            value={dashboardRange.capacity}
            onChange={(e) =>
              setDashboardRange((p) => ({ ...p, capacity: e.target.value }))
            }
            className="bg-gray-700 px-3 py-2 rounded"
          />
          <div className="flex gap-2">
            <button
              onClick={loadDashboard}
              disabled={dashboardLoading}
              className="bg-green-500 hover:bg-green-600 disabled:bg-gray-600 px-3 py-2 rounded"
            >
              {dashboardLoading ? "Завантаження..." : "Оновити"}
            </button>
            <button
              onClick={exportComparison}
              className="bg-purple-500 hover:bg-purple-600 px-3 py-2 rounded"
            >
              Export CSV
            </button>
          </div>
        </div>

        {dashboardResult && (
          <div className="grid grid-cols-1 md:grid-cols-4 gap-3 mb-4">
            <div className="bg-gray-700 rounded p-3">
              <div className="text-xs text-gray-300">ADR</div>
              <div className="text-xl font-semibold">{dashboardResult.adr}</div>
            </div>
            <div className="bg-gray-700 rounded p-3">
              <div className="text-xs text-gray-300">RevPAR</div>
              <div className="text-xl font-semibold">
                {dashboardResult.revpar ?? "-"}
              </div>
            </div>
            <div className="bg-gray-700 rounded p-3">
              <div className="text-xs text-gray-300">Occupancy days</div>
              <div className="text-xl font-semibold">
                {dashboardResult.occupancy?.length || 0}
              </div>
            </div>
            <div className="bg-gray-700 rounded p-3">
              <div className="text-xs text-gray-300">Comparison rows</div>
              <div className="text-xl font-semibold">
                {comparisonRows.length}
              </div>
            </div>
          </div>
        )}

        <div className="grid grid-cols-1 xl:grid-cols-3 gap-4">
          <div className="bg-gray-900 rounded p-3">
            <h3 className="font-semibold mb-2 text-sm">Occupancy</h3>
            <div className="max-h-60 overflow-auto text-xs">
              {(dashboardResult?.occupancy || []).slice(0, 25).map((row) => (
                <div key={row.date} className="flex justify-between py-1 border-b border-gray-800">
                  <span>{row.date}</span>
                  <span>
                    {row.sold_rooms} / {row.occupancy_rate ?? "-"}%
                  </span>
                </div>
              ))}
            </div>
          </div>
          <div className="bg-gray-900 rounded p-3">
            <h3 className="font-semibold mb-2 text-sm">Pickup</h3>
            <div className="max-h-60 overflow-auto text-xs">
              {(dashboardResult?.pickup || []).slice(0, 25).map((row) => (
                <div key={row.date} className="flex justify-between py-1 border-b border-gray-800">
                  <span>{row.date}</span>
                  <span>{row.pickup_rooms}</span>
                </div>
              ))}
            </div>
          </div>
          <div className="bg-gray-900 rounded p-3">
            <h3 className="font-semibold mb-2 text-sm">Pace</h3>
            <div className="max-h-60 overflow-auto text-xs">
              {(dashboardResult?.pace || []).slice(0, 25).map((row) => (
                <div key={row.date} className="flex justify-between py-1 border-b border-gray-800">
                  <span>{row.date}</span>
                  <span>{row.pace}</span>
                </div>
              ))}
            </div>
          </div>
        </div>

        <div className="mt-4 bg-gray-900 rounded p-3">
          <h3 className="font-semibold mb-2 text-sm">
            Price comparison table (tariff vs actual)
          </h3>
          <div className="max-h-80 overflow-auto">
            <table className="w-full text-xs">
              <thead className="bg-gray-800 sticky top-0">
                <tr>
                  <th className="text-left px-2 py-2">Date</th>
                  <th className="text-left px-2 py-2">Room</th>
                  <th className="text-left px-2 py-2">Type</th>
                  <th className="text-right px-2 py-2">Actual</th>
                  <th className="text-right px-2 py-2">Tariff</th>
                  <th className="text-right px-2 py-2">Diff</th>
                  <th className="text-right px-2 py-2">Diff %</th>
                </tr>
              </thead>
              <tbody>
                {comparisonRows.slice(0, 300).map((r, idx) => (
                  <tr key={`${r.booking_code}-${r.stay_date}-${idx}`} className="border-b border-gray-800">
                    <td className="px-2 py-1">{r.stay_date}</td>
                    <td className="px-2 py-1">{r.room_code || "-"}</td>
                    <td className="px-2 py-1">{r.room_type_code || "-"}</td>
                    <td className="px-2 py-1 text-right">{r.actual_daily_price}</td>
                    <td className="px-2 py-1 text-right">{r.tariff_price}</td>
                    <td
                      className={`px-2 py-1 text-right ${
                        r.diff_amount > 0
                          ? "text-green-400"
                          : r.diff_amount < 0
                          ? "text-red-400"
                          : "text-gray-300"
                      }`}
                    >
                      {r.diff_amount}
                    </td>
                    <td
                      className={`px-2 py-1 text-right ${
                        r.diff_percent > 0
                          ? "text-green-400"
                          : r.diff_percent < 0
                          ? "text-red-400"
                          : "text-gray-300"
                      }`}
                    >
                      {r.diff_percent}
                    </td>
                  </tr>
                ))}
                {!comparisonRows.length && (
                  <tr>
                    <td colSpan={7} className="px-2 py-3 text-center text-gray-400">
                      Немає даних comparison
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </div>
      </div>

      <div className="bg-gray-800 p-4 rounded-xl">
        <h2 className="text-lg font-semibold mb-3">
          4) Recommended price (rule-based baseline)
        </h2>
        <div className="grid grid-cols-1 md:grid-cols-5 gap-2 mb-3">
          <input
            type="date"
            value={predictionForm.stay_date}
            onChange={(e) =>
              setPredictionForm((p) => ({ ...p, stay_date: e.target.value }))
            }
            className="bg-gray-700 px-3 py-2 rounded"
          />
          <input
            placeholder="room_type_code"
            value={predictionForm.room_type_code}
            onChange={(e) =>
              setPredictionForm((p) => ({
                ...p,
                room_type_code: e.target.value,
              }))
            }
            className="bg-gray-700 px-3 py-2 rounded"
          />
          <input
            placeholder="tariff_price"
            value={predictionForm.tariff_price}
            onChange={(e) =>
              setPredictionForm((p) => ({ ...p, tariff_price: e.target.value }))
            }
            className="bg-gray-700 px-3 py-2 rounded"
          />
          <input
            placeholder="booking_window_days"
            value={predictionForm.booking_window_days}
            onChange={(e) =>
              setPredictionForm((p) => ({
                ...p,
                booking_window_days: e.target.value,
              }))
            }
            className="bg-gray-700 px-3 py-2 rounded"
          />
          <input
            placeholder="occupancy_for_date %"
            value={predictionForm.occupancy_for_date}
            onChange={(e) =>
              setPredictionForm((p) => ({
                ...p,
                occupancy_for_date: e.target.value,
              }))
            }
            className="bg-gray-700 px-3 py-2 rounded"
          />
        </div>
        <button
          onClick={predictPrice}
          disabled={predictLoading}
          className="bg-orange-500 hover:bg-orange-600 disabled:bg-gray-600 px-4 py-2 rounded"
        >
          {predictLoading ? "Розрахунок..." : "Отримати рекомендацію"}
        </button>

        {predictResult && (
          <div className="mt-4 grid grid-cols-1 md:grid-cols-3 gap-3">
            <div className="bg-gray-700 p-3 rounded">
              <div className="text-xs text-gray-300">Recommended</div>
              <div className="text-xl font-semibold">
                {predictResult.recommended_price}
              </div>
            </div>
            <div className="bg-gray-700 p-3 rounded">
              <div className="text-xs text-gray-300">Tariff</div>
              <div className="text-xl font-semibold">
                {predictResult.tariff_price}
              </div>
            </div>
            <div className="bg-gray-700 p-3 rounded">
              <div className="text-xs text-gray-300">Delta vs Tariff</div>
              <div className="text-xl font-semibold">
                {predictResult.delta_vs_tariff}
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

export default Analis;
