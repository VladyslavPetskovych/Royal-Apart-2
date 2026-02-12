import { useEffect, useMemo, useState } from "react";

const sortNum = (arr) => arr.sort((a, b) => a - b);

export function useApartmentsFiltering(apartments = []) {
  const [perPage, setPerPage] = useState(18);
  const [page, setPage] = useState(1);

  const [filter, setFilter] = useState({
    rooms: "all",
    floor: "all",
    guests: "all",
  });

  const [query, setQuery] = useState("");

  // responsive perPage
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

  // options for selects
  const { roomsOptions, floorsOptions, guestsOptions } = useMemo(() => {
    const r = new Set();
    const f = new Set();
    const g = new Set();

    apartments.forEach((a) => {
      if (Number.isFinite(a?.numrooms)) r.add(a.numrooms);
      if (Number.isFinite(a?.floor)) f.add(a.floor);
      if (Number.isFinite(a?.guests)) g.add(a.guests);
    });

    return {
      roomsOptions: sortNum(Array.from(r)),
      floorsOptions: sortNum(Array.from(f)),
      guestsOptions: sortNum(Array.from(g)),
    };
  }, [apartments]);

  // filtered list
  const filtered = useMemo(() => {
    const roomsVal = filter.rooms === "all" ? null : Number(filter.rooms);
    const floorVal = filter.floor === "all" ? null : Number(filter.floor);
    const guestsVal = filter.guests === "all" ? null : Number(filter.guests);

    const q = query.trim().toLowerCase();

    return apartments.filter((a) => {
      if (roomsVal !== null && Number(a?.numrooms) !== roomsVal) return false;
      if (floorVal !== null && Number(a?.floor) !== floorVal) return false;
      if (guestsVal !== null && Number(a?.guests) < guestsVal) return false;

      if (q) {
        const name = String(a?.name ?? "").toLowerCase();
        if (!name.includes(q)) return false;
      }

      return true;
    });
  }, [apartments, filter.rooms, filter.floor, filter.guests, query]);

  // reset page when filters/search change
  useEffect(() => {
    setPage(1);
  }, [filter.rooms, filter.floor, filter.guests, query]);
  // scroll to top when page changes
  useEffect(() => {
    window.scrollTo({
      top: 0,
      behavior: "smooth",
    });
  }, [page]);

  const totalPages = useMemo(
    () => Math.max(1, Math.ceil(filtered.length / perPage)),
    [filtered.length, perPage],
  );

  const safePage = Math.min(page, totalPages);

  const visible = useMemo(() => {
    const start = (safePage - 1) * perPage;
    return filtered.slice(start, start + perPage);
  }, [filtered, safePage, perPage]);

  return {
    // data
    roomsOptions,
    floorsOptions,
    guestsOptions,
    filtered,
    visible,

    // paging
    page: safePage,
    totalPages,
    setPage,
    perPage,

    // filters + search
    filter,
    setFilter,
    query,
    setQuery,
    clearQuery: () => setQuery(""),
    resetFilter: () => setFilter({ rooms: "all", floor: "all", guests: "all" }),
  };
}
