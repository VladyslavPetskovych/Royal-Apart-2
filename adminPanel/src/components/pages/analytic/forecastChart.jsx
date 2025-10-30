import {
  LineChart, Line, CartesianGrid, XAxis, YAxis, Tooltip, ResponsiveContainer
} from "recharts";

export default function ForecastChart({ predictedData }) {
  if (!predictedData?.length) return null;

  return (
    <div className="bg-gray-800 p-4 rounded-xl">
      <h2 className="text-lg font-semibold mb-4">Передбачення цін (3 дні)</h2>

      <ResponsiveContainer width="100%" height={300}>
        <LineChart data={predictedData}>
          <CartesianGrid strokeDasharray="3 3" stroke="#444" />
          <XAxis dataKey="name" stroke="#ccc" />
          <YAxis stroke="#ccc" />
          <Tooltip />
          <Line type="monotone" dataKey="price" stroke="#f59e0b" strokeWidth={3} />
        </LineChart>
      </ResponsiveContainer>
    </div>
  );
}
