import React, { useEffect, useMemo } from "react";
import { useDispatch, useSelector } from "react-redux";
import {
  fetchApartments,
  selectApartments,
  selectApartStatus,
  selectApartError,
} from "../../redux/apartSlice";

import ApartHighlight from "../../components2/utils/ApartHighlight";
import { Link } from "react-router-dom";

export default function RecApartments() {
  const dispatch = useDispatch();

  const apartments = useSelector(selectApartments);
  const status = useSelector(selectApartStatus);
  const error = useSelector(selectApartError);

  useEffect(() => {
    if (status === "idle") dispatch(fetchApartments());
  }, [dispatch, status]);

  const recommended = useMemo(() => {
    if (!Array.isArray(apartments)) return [];

    const rec = apartments.filter((a) => a?.recommended || a?.isRecommended);
    const list = rec.length ? rec : apartments;

    // screenshot shows 7 cards
    return list.slice(0, 7);
  }, [apartments]);

  return (
    <section className="bg-white">
      <div className="mx-auto w-full max-w-[1320px] px-4 pb-10 pt-10 sm:px-6">
        {/* TITLE */}
        <h2 className="font-finlandica flex justify-start text-[18px] font-semibold uppercase tracking-[0.8px] text-brand-black">
          РЕКОМЕНДОВАНІ АПАРТАМЕНТИ
        </h2>

        {/* STATES */}
        {status === "loading" && (
          <div className="mt-6 font-finlandica text-[14px] text-brand-black/60">
            Loading…
          </div>
        )}

        {status === "failed" && (
          <div className="mt-6 font-finlandica text-[14px] text-brand-black/70">
            Failed to load apartments{error ? `: ${String(error)}` : "."}
          </div>
        )}

        {recommended.length > 0 && (
          <>
            {/* ✅ MOBILE: swipe row with "peek" like screenshot */}
            <div className="mt-6 md:hidden">
              <div className="-mx-4 flex gap-6 overflow-x-auto px-4 pb-2 scrollbar-hide">
                {recommended.map((apartment, idx) => (
                  <div
                    key={apartment?._id ?? idx}
                    className="shrink-0 w-[82vw] max-w-[420px]"
                  >
                    <ApartHighlight apartment={apartment} />
                  </div>
                ))}
              </div>
            </div>

            {/* ✅ TABLET/DESKTOP: grid */}
            <div className="mt-6 hidden md:grid md:grid-cols-2 md:gap-x-6 md:gap-y-10 lg:grid-cols-12">
              {recommended.map((apartment, idx) => {
                // On lg: first 3 big (4+4+4), next 4 small (3+3+3+3)
                const col = idx < 3 ? "lg:col-span-4" : "lg:col-span-3";

                return (
                  <div key={apartment?._id ?? idx} className={col}>
                    <ApartHighlight apartment={apartment} />
                  </div>
                );
              })}
            </div>
          </>
        )}

        {/* BUTTON (like screenshot: left-aligned, not full width) */}
        <div className="mt-10 flex justify-center">
          <Link
            to="/aparts"
            className="group inline-flex items-center justify-center gap-3 bg-brand-bordo px-8 py-4 font-finlandica text-[14px] font-medium text-brand-beige"
          >
            Переглянути Всі Апартаменти
            <span className="text-brand-beige transition-transform duration-200 group-hover:translate-x-[2px]">
              →
            </span>
          </Link>
        </div>
      </div>
    </section>
  );
}
