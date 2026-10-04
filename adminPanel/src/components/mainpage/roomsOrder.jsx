/* eslint-disable react/prop-types */
import { useEffect, useState } from "react";
import axios from "axios";

const API_BASE = "https://royalapart.online/api";

// Drag & drop list to change the order of rooms on the site.
// Saves via POST /aparts/reorder (updates aparts, copy_aparts and wodoo_aparts).
function RoomsOrder({ rooms, onSaved }) {
  const [isOpen, setIsOpen] = useState(false);
  const [list, setList] = useState([]);
  const [dragIndex, setDragIndex] = useState(null);
  const [overIndex, setOverIndex] = useState(null);
  const [isSaving, setIsSaving] = useState(false);
  const [isDirty, setIsDirty] = useState(false);

  useEffect(() => {
    if (!isDirty) setList(Array.isArray(rooms) ? rooms : []);
  }, [rooms, isDirty]);

  function move(from, to) {
    if (from === to || from == null || to < 0 || to >= list.length) return;
    setList((prev) => {
      const next = [...prev];
      const [item] = next.splice(from, 1);
      next.splice(to, 0, item);
      return next;
    });
    setIsDirty(true);
  }

  function handleDrop(e, index) {
    e.preventDefault();
    move(dragIndex, index);
    setDragIndex(null);
    setOverIndex(null);
  }

  function reset() {
    setIsDirty(false);
    setList(Array.isArray(rooms) ? rooms : []);
  }

  async function save() {
    setIsSaving(true);
    try {
      await axios.post(`${API_BASE}/aparts/reorder`, {
        order: list.map((room) => room._id),
      });
      setIsDirty(false);
      alert("Порядок кімнат збережено! На сайті він вже оновлений.");
      if (onSaved) onSaved();
    } catch (error) {
      console.error("Error saving rooms order:", error);
      alert("Помилка при збереженні порядку. Спробуйте ще раз.");
    } finally {
      setIsSaving(false);
    }
  }

  return (
    <div className="w-full px-4 py-2">
      <button
        onClick={() => setIsOpen((v) => !v)}
        className="bg-purple-700 h-8 w-[170px] px-3 text-sm font-semibold text-zinc-50 hover:bg-purple-800 rounded-lg transition duration-200"
      >
        {isOpen ? "Сховати порядок" : "Порядок кімнат"}
      </button>

      {isOpen && (
        <div className="mt-3 max-w-2xl rounded-lg bg-zinc-900 p-3 text-white">
          <p className="mb-2 text-sm text-zinc-400">
            Перетягніть кімнати (або використайте ↑ ↓), потім натисніть
            «Зберегти порядок». Перша в списку — перша на сайті.
          </p>

          <ul className="flex flex-col gap-1">
            {list.map((room, index) => (
              <li
                key={room._id}
                draggable
                onDragStart={(e) => {
                  setDragIndex(index);
                  e.dataTransfer.effectAllowed = "move";
                }}
                onDragOver={(e) => {
                  e.preventDefault();
                  if (overIndex !== index) setOverIndex(index);
                }}
                onDragLeave={() => setOverIndex(null)}
                onDrop={(e) => handleDrop(e, index)}
                onDragEnd={() => {
                  setDragIndex(null);
                  setOverIndex(null);
                }}
                className={`flex items-center gap-3 rounded-md border px-3 py-2 cursor-move select-none ${
                  dragIndex === index
                    ? "opacity-40 border-zinc-600"
                    : overIndex === index
                    ? "border-purple-400 bg-zinc-800"
                    : "border-zinc-700 bg-zinc-800/60"
                }`}
              >
                <span className="text-zinc-500">⋮⋮</span>
                <span className="w-6 text-right text-sm text-zinc-400">
                  {index + 1}
                </span>
                <span className="flex-1 truncate text-sm">{room.name}</span>
                <span className="text-xs text-zinc-500">{room.wubid}</span>
                <button
                  onClick={() => move(index, index - 1)}
                  disabled={index === 0}
                  className="h-7 w-7 rounded bg-zinc-700 text-sm hover:bg-zinc-600 disabled:opacity-30"
                >
                  ↑
                </button>
                <button
                  onClick={() => move(index, index + 1)}
                  disabled={index === list.length - 1}
                  className="h-7 w-7 rounded bg-zinc-700 text-sm hover:bg-zinc-600 disabled:opacity-30"
                >
                  ↓
                </button>
              </li>
            ))}
          </ul>

          <div className="mt-3 flex gap-2">
            <button
              onClick={save}
              disabled={!isDirty || isSaving}
              className="bg-green-600 h-8 px-4 text-sm font-semibold rounded-lg hover:bg-green-700 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {isSaving ? "Збереження…" : "Зберегти порядок"}
            </button>
            <button
              onClick={reset}
              disabled={!isDirty || isSaving}
              className="bg-zinc-600 h-8 px-4 text-sm font-semibold rounded-lg hover:bg-zinc-700 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              Скасувати
            </button>
          </div>
        </div>
      )}
    </div>
  );
}

export default RoomsOrder;
