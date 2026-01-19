import React, { useEffect, useMemo } from "react";
import { useDispatch, useSelector } from "react-redux";
import {
  fetchApartments,
  selectApartments,
  selectApartStatus,
} from "../../redux/apartSlice";
import { Link } from "react-router-dom";
import { Square, BedDouble, Users } from "lucide-react";

/** small helper */
function pickRandom(arr, n) {
  const a = [...arr];
  for (let i = a.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [a[i], a[j]] = [a[j], a[i]];
  }
  return a.slice(0, n);
}

function IconWrap({ children }) {
  return (
    <span className="inline-flex h-[16px] w-[16px] items-center justify-center text-[#1b1b1b]/60">
      {children}
    </span>
  );
}

function LikeCard({ apartment }) {
  const img =
    (Array.isArray(apartment?.imgurl) && apartment.imgurl.find(Boolean)) ||
    apartment?.img ||
    apartment?.image ||
    "";

  const surface = apartment?.surface ?? 0;
  const beds = apartment?.beds ?? apartment?.numrooms ?? 0;
  const guests = apartment?.guests ?? 0;
  const floor = apartment?.floor ?? null;

  return (
    <Link
      to={`/room/${apartment?.wubid}`}
      className="group block font-finlandica"
    >
      {/* image */}
      <div className="relative overflow-hidden rounded-[2px] bg-black/5">
        <div className="relative aspect-[3/4] w-full">
          {img ? (
            <img
              src={img}
              alt={apartment?.name || ""}
              draggable={false}
              className="h-full w-full object-cover transition-transform duration-700 ease-out group-hover:scale-[1.03]"
            />
          ) : (
            <div className="h-full w-full bg-black/10" />
          )}
        </div>

        {/* optional badge like "ТОП ВИБІР" if recommended */}
        {(apartment?.recommended || apartment?.isRecommended) && (
          <div className="absolute left-4 top-4 bg-[#6B5A39] px-3 py-2 text-[12px] font-semibold uppercase tracking-[0.14em] text-[#F8F5EF]">
            ТОП ВИБІР
          </div>
        )}
      </div>

      {/* title line */}
      <div className="mt-4 text-[14px] font-extrabold text-start uppercase tracking-[0.06em] text-[#1b1b1b]">
        ВУЛ. {String(apartment?.name || "").toUpperCase()}
        {floor != null ? (
          <span className="font-semibold text-[#1b1b1b]/55">
            {" "}
            | {floor} ПОВЕРХ
          </span>
        ) : null}
      </div>

      {/* meta line */}
      <div className="mt-2 flex flex-wrap items-start gap-x-5 gap-y-2 text-[12px] text-[#1b1b1b]/60">
        <span className="inline-flex items-center gap-2">
          <IconWrap>
            <Square size={16} strokeWidth={2} />
          </IconWrap>
          {surface ? `${surface} м2` : "—"}
        </span>

        <span className="inline-flex items-center gap-2">
          <IconWrap>
            <BedDouble size={16} strokeWidth={2} />
          </IconWrap>
          {beds ? `${beds} Спальні` : "—"}
        </span>

        <span className="inline-flex items-center gap-2">
          <IconWrap>
            <Users size={16} strokeWidth={2} />
          </IconWrap>
          {guests ? `${guests} Осіб` : "—"}
        </span>
      </div>
    </Link>
  );
}

export default function YouMayAlsoLike({ excludeWubid }) {
  const dispatch = useDispatch();
  const apartments = useSelector(selectApartments) || [];
  const status = useSelector(selectApartStatus);

  useEffect(() => {
    if (status === "idle") dispatch(fetchApartments());
  }, [dispatch, status]);

  const items = useMemo(() => {
    if (!Array.isArray(apartments) || apartments.length === 0) return [];

    const filtered = excludeWubid
      ? apartments.filter((a) => String(a?.wubid) !== String(excludeWubid))
      : apartments;

    // prefer recommended if exists
    const rec = filtered.filter((a) => a?.recommended || a?.isRecommended);
    const base = rec.length >= 4 ? rec : filtered;

    return pickRandom(base, 4);
  }, [apartments, excludeWubid]);

  return (
    <section className="bg-white px-6 md:px-10 lg:px-20">
      <div className="mx-auto w-full   pb-14 pt-12 sm:px-6">
        <h2 className="font-finlandica text-xl font-extrabold uppercase tracking-[0.18em] text-[#1b1b1b]">
          ВАМ ТАКОЖ МОЖЕ СПОДОБАТИСЬ
        </h2>

        {/* loading */}
        {status === "loading" && (
          <div className="mt-6 font-finlandica text-[14px] text-[#1b1b1b]/60">
            Loading…
          </div>
        )}

        {/* cards */}
        {items.length > 0 && (
          <>
            {/* MOBILE swipe */}
            <div className="mt-6 lg:hidden">
              <div className="-mx-4 flex gap-6 overflow-x-auto px-4 pb-2 scrollbar-hide">
                {items.map((a, idx) => (
                  <div
                    key={a?._id ?? idx}
                    className="shrink-0 w-[82vw] max-w-[420px]"
                  >
                    <LikeCard apartment={a} />
                  </div>
                ))}
              </div>
            </div>

            {/* DESKTOP 4 columns */}
            <div className="mt-7 hidden lg:grid lg:grid-cols-4 lg:gap-6">
              {items.map((a, idx) => (
                <div key={a?._id ?? idx}>
                  <LikeCard apartment={a} />
                </div>
              ))}
            </div>

            {/* button */}
            <div className="mt-10 flex justify-center">
              <Link
                to="/aparts"
                className="group inline-flex items-center justify-center gap-4 bg-brand-bordo px-10 py-4 font-finlandica text-[14px] font-medium text-brand-beige"
              >
                Переглянути Всі Апартаменти
                <span className="transition-transform duration-200 group-hover:translate-x-[3px]">
                  →
                </span>
              </Link>
            </div>
          </>
        )}
      </div>
    </section>
  );
}
