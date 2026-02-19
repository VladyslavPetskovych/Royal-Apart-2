import React, { useMemo, useState } from "react";
import { useTranslation } from "react-i18next";
import SearchBar from "../../../components2/home/apartmentsBlock/SearchBar";
import RoomsIconFilter from "../../../components2/home/apartmentsBlock/RoomsIconFilter";

export default function ApartmentsHeader({
  floorsOptions = [],
  guestsOptions = [],
  filter,
  setFilter,

  showSearch = false,
  searchValue = "",
  onSearchChange,
  onSearchClear,
  searchPlaceholder = "Пошук апартаментів... ",
}) {
  const { t } = useTranslation();
  const [open, setOpen] = useState(false);

  const floors = useMemo(() => ["all", ...floorsOptions], [floorsOptions]);
  const guests = useMemo(() => ["all", ...guestsOptions], [guestsOptions]);

  return (
    <div className="mb-10">
      {/* row */}
      <div className="flex items-center justify-between">
        <h2 className="font-finlandica flex justify-start text-[18px] font-semibold uppercase tracking-[0.8px] text-brand-black">
          {t("all_apartments")}
        </h2>

        <button
          type="button"
          onClick={() => setOpen((v) => !v)}
          className="flex items-center gap-2 text-sm text-gray-600 hover:text-black"
        >
          <span>{t("filter")}</span>
          <svg width="18" height="18" fill="none">
            <path
              d="M3 5h12M6 9h6M8 13h2"
              stroke="currentColor"
              strokeWidth="1.5"
            />
          </svg>
        </button>
      </div>

      {/* ✅ optional search */}
      {showSearch && (
        <SearchBar
          value={searchValue}
          onChange={onSearchChange}
          onClear={onSearchClear}
          placeholder={searchPlaceholder}
        />
      )}

      {/* ✅ ROOMS ICON FILTER (this is the “new filtering”) */}
      <div className="mt-6">
        <RoomsIconFilter
          value={filter.rooms}
          onChange={(roomsKey) => setFilter((p) => ({ ...p, rooms: roomsKey }))}
          filter={filter}
          setFilter={setFilter}
        />
      </div>

      {/* panel: floor + guests + additional filters */}
      {open && (
        <div className="mt-6 rounded-xl border border-black/10 bg-white p-5">
          <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
            {/* floor */}
            <div>
              <div className="font-finlandica text-[12px] font-semibold uppercase tracking-[0.12em] text-black/70">
                {t("floor")}
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
                    {v === "all" ? t("all") : `${v} ${t("floor_unit")}`}
                  </option>
                ))}
              </select>
            </div>

            {/* guests */}
            <div>
              <div className="font-finlandica text-[12px] font-semibold uppercase tracking-[0.12em] text-black/70">
                {t("guests_up_to")}
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
                    {v === "all" ? t("all") : `${v} ${t("guests_unit")}`}
                  </option>
                ))}
              </select>
            </div>

            {/* bathroom type */}
            <div>
              <div className="font-finlandica text-[12px] font-semibold uppercase tracking-[0.12em] text-black/70">
                Тип ванної
              </div>
              <select
                value={String(filter.bathroomType ?? "all")}
                onChange={(e) =>
                  setFilter((p) => ({ ...p, bathroomType: e.target.value }))
                }
                className="mt-2 w-full rounded-lg border border-black/10 bg-white px-3 py-2 text-[14px] text-black/80 outline-none"
              >
                <option value="all">{t("all")}</option>
                <option value="душ">Душ</option>
                <option value="джакузі">Джакузі</option>
                <option value="ванна">Ванна</option>
              </select>
            </div>

            {/* air conditioning */}
            <div>
              <div className="font-finlandica text-[12px] font-semibold uppercase tracking-[0.12em] text-black/70">
                Кондиціонер
              </div>
              <select
                value={
                  filter.airConditioning === null || filter.airConditioning === undefined
                    ? "all"
                    : filter.airConditioning
                    ? "yes"
                    : "no"
                }
                onChange={(e) => {
                  const v = e.target.value;
                  setFilter((p) => ({
                    ...p,
                    airConditioning: v === "all" ? null : v === "yes",
                  }));
                }}
                className="mt-2 w-full rounded-lg border border-black/10 bg-white px-3 py-2 text-[14px] text-black/80 outline-none"
              >
                <option value="all">{t("all")}</option>
                <option value="yes">Є</option>
                <option value="no">Немає</option>
              </select>
            </div>

            {/* elevator */}
            <div>
              <div className="font-finlandica text-[12px] font-semibold uppercase tracking-[0.12em] text-black/70">
                Ліфт
              </div>
              <select
                value={
                  filter.elevator === null || filter.elevator === undefined
                    ? "all"
                    : filter.elevator
                    ? "yes"
                    : "no"
                }
                onChange={(e) => {
                  const v = e.target.value;
                  setFilter((p) => ({
                    ...p,
                    elevator: v === "all" ? null : v === "yes",
                  }));
                }}
                className="mt-2 w-full rounded-lg border border-black/10 bg-white px-3 py-2 text-[14px] text-black/80 outline-none"
              >
                <option value="all">{t("all")}</option>
                <option value="yes">Є</option>
                <option value="no">Немає</option>
              </select>
            </div>

            {/* balcony */}
            <div>
              <div className="font-finlandica text-[12px] font-semibold uppercase tracking-[0.12em] text-black/70">
                Балкон
              </div>
              <select
                value={
                  filter.balcony === null || filter.balcony === undefined
                    ? "all"
                    : filter.balcony
                    ? "yes"
                    : "no"
                }
                onChange={(e) => {
                  const v = e.target.value;
                  setFilter((p) => ({
                    ...p,
                    balcony: v === "all" ? null : v === "yes",
                  }));
                }}
                className="mt-2 w-full rounded-lg border border-black/10 bg-white px-3 py-2 text-[14px] text-black/80 outline-none"
              >
                <option value="all">{t("all")}</option>
                <option value="yes">Є</option>
                <option value="no">Немає</option>
              </select>
            </div>
          </div>

          <div className="mt-6 flex items-center justify-between gap-4">
            <button
              type="button"
              onClick={() =>
                setFilter({
                  rooms: "all",
                  floor: "all",
                  guests: "all",
                  airConditioning: null,
                  elevator: null,
                  bathroomType: "all",
                  balcony: null,
                })
              }
              className="font-finlandica text-[12px] font-semibold uppercase tracking-[0.12em] text-black/60 hover:text-black"
            >
              {t("reset")}
            </button>

            <button
              type="button"
              onClick={() => setOpen(false)}
              className="rounded-lg bg-black px-4 py-2 font-finlandica text-[12px] font-semibold uppercase tracking-[0.12em] text-white hover:opacity-90"
            >
              {t("done")}
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
