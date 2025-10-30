export default function StatsPanel({ rooms, averagePrice }) {
  return (
    <div className="bg-gray-800 p-4 rounded-xl mb-6">
      <h2 className="text-lg font-semibold mb-2">Поточні дані</h2>
      <p>Кількість квартир: {rooms.length}</p>
      <p>Середня ціна: {averagePrice} грн</p>
    </div>
  );
}
