import React, { useEffect, useMemo, useState } from "react";
import { useSelector } from "react-redux";
import ApartmentsGrid from "../../components2/home/apartmentsBlock/ApartmentsGrid";
import ApartmentsHeader from "../../components2/home/apartmentsBlock/ApartmentsHeader";

function Pagination({ page, totalPages, onPage, windowSize = 4 }) {
  if (totalPages <= 1) return null;

  const clamp = (n) => Math.max(1, Math.min(totalPages, n));
  const safePage = clamp(page);

  const pages = [];
  if (totalPages <= windowSize + 2) {
    for (let i = 1; i <= totalPages; i++) pages.push(i);
  } else {
    if (safePage <= windowSize) {
      for (let i = 1; i <= windowSize; i++) pages.push(i);
      pages.push("dots-right");
      pages.push(totalPages);
    } else if (safePage > windowSize && safePage <= totalPages - windowSize) {
      pages.push(1);
      pages.push("dots-left");
      for (let i = safePage - 1; i <= safePage + 1; i++) pages.push(i);
      pages.push("dots-right");
      pages.push(totalPages);
    } else {
      pages.push(1);
      pages.push("dots-left");
      for (let i = totalPages - windowSize + 1; i <= totalPages; i++)
        pages.push(i);
    }
  }

  return (
    <div className="mt-10 flex items-center justify-center gap-2">
      <button
        type="button"
        onClick={() => onPage(clamp(safePage - 1))}
        disabled={safePage === 1}
        className={[
          "h-10 px-4 rounded-lg border text-sm",
          safePage === 1
            ? "border-black/10 text-black/30"
            : "border-black/15 text-black/70 hover:text-black hover:border-black/25",
        ].join(" ")}
      >
        Назад
      </button>

      <div className="flex items-center gap-2">
        {pages.map((p, idx) =>
          p === "dots-left" || p === "dots-right" ? (
            <span
              key={`${p}-${idx}`}
              className="px-1 text-black/35 select-none"
            >
              …
            </span>
          ) : (
            <button
              key={p}
              type="button"
              onClick={() => onPage(p)}
              className={[
                "h-10 min-w-[40px] px-3 rounded-lg border text-sm",
                p === safePage
                  ? "border-black bg-black text-white"
                  : "border-black/15 text-black/70 hover:text-black hover:border-black/25",
              ].join(" ")}
            >
              {p}
            </button>
          ),
        )}
      </div>

      <button
        type="button"
        onClick={() => onPage(clamp(safePage + 1))}
        disabled={safePage === totalPages}
        className={[
          "h-10 px-4 rounded-lg border text-sm",
          safePage === totalPages
            ? "border-black/10 text-black/30"
            : "border-black/15 text-black/70 hover:text-black hover:border-black/25",
        ].join(" ")}
      >
        Вперед
      </button>
    </div>
  );
}

export default function Aparts() {
  const apartments = useSelector((s) => s.apartStore.apartments) || [];

  const [perPage, setPerPage] = useState(18);
  const [page, setPage] = useState(1);

  const [filter, setFilter] = useState({
    rooms: "Усі",
    floor: "Усі",
    guests: "Усі",
  });

  // ✅ SEARCH STATE (this fixes "query is not defined")
  const [query, setQuery] = useState("");

  useEffect(() => {
    const updatePerPage = () => {
      const w = window.innerWidth;
      if (w < 768) setPerPage(10);
      else if (w < 1024) setPerPage(14);
      else setPerPage(16);
    };
    updatePerPage();
    window.addEventListener("resize", updatePerPage);
    return () => window.removeEventListener("resize", updatePerPage);
  }, []);

  const { roomsOptions, floorsOptions, guestsOptions } = useMemo(() => {
    const r = new Set();
    const f = new Set();
    const g = new Set();

    apartments.forEach((a) => {
      if (Number.isFinite(a?.numrooms)) r.add(a.numrooms);
      if (Number.isFinite(a?.floor)) f.add(a.floor);
      if (Number.isFinite(a?.guests)) g.add(a.guests);
    });

    const sortNum = (arr) => arr.sort((x, y) => x - y);

    return {
      roomsOptions: sortNum(Array.from(r)),
      floorsOptions: sortNum(Array.from(f)),
      guestsOptions: sortNum(Array.from(g)),
    };
  }, [apartments]);

  const filtered = useMemo(() => {
    const roomsVal = filter.rooms === "Усі" ? null : Number(filter.rooms);
    const floorVal = filter.floor === "Усі" ? null : Number(filter.floor);
    const guestsVal = filter.guests === "Усі" ? null : Number(filter.guests);

    const q = query.trim().toLowerCase();

    return apartments.filter((a) => {
      if (roomsVal !== null && Number(a?.numrooms) !== roomsVal) return false;
      if (floorVal !== null && Number(a?.floor) !== floorVal) return false;
      if (guestsVal !== null && Number(a?.guests) < guestsVal) return false;

      // ✅ search match
      if (q) {
        const name = String(a?.name ?? "").toLowerCase();
        if (!name.includes(q)) return false;
      }

      return true;
    });
  }, [apartments, filter.rooms, filter.floor, filter.guests, query]);

  useEffect(() => {
    setPage(1);
  }, [filter.rooms, filter.floor, filter.guests, query]);

  const totalPages = Math.max(1, Math.ceil(filtered.length / perPage));
  const safePage = Math.min(page, totalPages);

  const visible = useMemo(() => {
    const start = (safePage - 1) * perPage;
    return filtered.slice(start, start + perPage);
  }, [filtered, safePage, perPage]);

  return (
    <main className="bg-black text-brand-black">
      <div className="pt-[68px]">
        <section className="bg-white">
          <div className="mx-auto w-full max-w-[1320px] px-6 pb-16 pt-10">
            <ApartmentsHeader
              roomsOptions={roomsOptions}
              floorsOptions={floorsOptions}
              guestsOptions={guestsOptions}
              filter={filter}
              setFilter={setFilter}
              showSearch
              searchValue={query}
              onSearchChange={setQuery}
              onSearchClear={() => setQuery("")}
            />

            <ApartmentsGrid apartments={visible} />

            <Pagination
              page={safePage}
              totalPages={totalPages}
              onPage={setPage}
            />
          </div>
        </section>
      </div>
    </main>
  );
}
