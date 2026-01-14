import React, { useMemo, useState } from "react";

export default function ApartmentsHeader({
  roomsOptions = [],
  floorsOptions = [],
  guestsOptions = [],
  filter,
  setFilter,
}) {
  const [open, setOpen] = useState(false);

  const rooms = useMemo(() => ["Усі", ...roomsOptions], [roomsOptions]);
  const floors = useMemo(() => ["Усі", ...floorsOptions], [floorsOptions]);
  const guests = useMemo(() => ["Усі", ...guestsOptions], [guestsOptions]);

  return (
    <div className="mb-10">
      {/* row */}
      <div className="flex items-center justify-between">
        <h2 className="font-finlandica flex justify-start text-[18px] font-semibold uppercase tracking-[0.8px] text-brand-black">
          УСІ АПАРТАМЕНТИ
        </h2>

        <button
          type="button"
          onClick={() => setOpen((v) => !v)}
          className="flex items-center gap-2 text-sm text-gray-600 hover:text-black"
        >
          <span>Фільтр</span>
          <svg width="18" height="18" fill="none">
            <path
              d="M3 5h12M6 9h6M8 13h2"
              stroke="currentColor"
              strokeWidth="1.5"
            />
          </svg>
        </button>
      </div>

      {/* panel (pushes content down) */}
      {open && (
        <div className="mt-6 rounded-xl border border-black/10 bg-white p-5">
          <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
            {/* rooms */}
            <div>
              <div className="font-finlandica text-[12px] font-semibold uppercase tracking-[0.12em] text-black/70">
                Кімнати
              </div>
              <select
                value={String(filter.rooms)}
                onChange={(e) =>
                  setFilter((p) => ({ ...p, rooms: e.target.value }))
                }
                className="mt-2 w-full rounded-lg border border-black/10 bg-white px-3 py-2 text-[14px] text-black/80 outline-none"
              >
                {rooms.map((v) => (
                  <option key={String(v)} value={String(v)}>
                    {v === "Усі" ? "Усі" : `${v} кімн.`}
                  </option>
                ))}
              </select>
            </div>

            {/* floor */}
            <div>
              <div className="font-finlandica text-[12px] font-semibold uppercase tracking-[0.12em] text-black/70">
                Поверх
              </div>
              <select
                value={String(filter.floor)}
                onChange={(e) =>
                  setFilter((p) => ({ ...p, floor: e.target.value }))
                }
                className="mt-2 w-full rounded-lg border border-black/10 bg-white px-3 py-2 text-[14px] text-black/80 outline-none"
              >
                {floors.map((v) => (
                  <option key={String(v)} value={String(v)}>
                    {v === "Усі" ? "Усі" : `${v} поверх`}
                  </option>
                ))}
              </select>
            </div>

            {/* guests */}
            <div>
              <div className="font-finlandica text-[12px] font-semibold uppercase tracking-[0.12em] text-black/70">
                Гостей (до)
              </div>
              <select
                value={String(filter.guests)}
                onChange={(e) =>
                  setFilter((p) => ({ ...p, guests: e.target.value }))
                }
                className="mt-2 w-full rounded-lg border border-black/10 bg-white px-3 py-2 text-[14px] text-black/80 outline-none"
              >
                {guests.map((v) => (
                  <option key={String(v)} value={String(v)}>
                    {v === "Усі" ? "Усі" : `${v} гостей`}
                  </option>
                ))}
              </select>
            </div>
          </div>

          <div className="mt-6 flex items-center justify-between gap-4">
            <button
              type="button"
              onClick={() =>
                setFilter({ rooms: "Усі", floor: "Усі", guests: "Усі" })
              }
              className="font-finlandica text-[12px] font-semibold uppercase tracking-[0.12em] text-black/60 hover:text-black"
            >
              Скинути
            </button>

            <button
              type="button"
              onClick={() => setOpen(false)}
              className="rounded-lg bg-black px-4 py-2 font-finlandica text-[12px] font-semibold uppercase tracking-[0.12em] text-white hover:opacity-90"
            >
              Готово
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
