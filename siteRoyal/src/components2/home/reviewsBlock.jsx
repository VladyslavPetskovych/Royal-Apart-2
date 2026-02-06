import React, { useEffect, useMemo, useRef, useState } from "react";
import { useTranslation } from "react-i18next";
import { Link } from "react-router-dom";
import flowerLeft from "../../assets/newDesign/home/flowerLeft.png";
import flowerRight from "../../assets/newDesign/home/flowerRight.png";

/** ✅ Add / edit reviews here */
const REVIEW_KEYS = [
  {
    text: "review_1_text",
    author: "review_1_author"
  },
  {
    text: "review_2_text",
    author: "review_2_author"
  },
  {
    text: "review_3_text",
    author: "review_3_author"
  }
];

function ArrowIcon({ direction = "left", className = "" }) {
  const isLeft = direction === "left";
  return (
    <svg
      viewBox="0 0 72 16"
      fill="none"
      aria-hidden="true"
      className={className}
    >
      <path
        d={isLeft ? "M70 8H10" : "M2 8H62"}
        stroke="currentColor"
        strokeWidth="1.5"
        strokeLinecap="round"
      />
      <path
        d={isLeft ? "M10 8L16 2M10 8L16 14" : "M62 8L56 2M62 8L56 14"}
        stroke="currentColor"
        strokeWidth="1.5"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  );
}

export default function ReviewsBlock({
  reviews: reviewsProp,
  autoplay = true,
  intervalMs = 6500,
}) {
  const { t } = useTranslation();
  const reviews = reviewsProp ?? REVIEW_KEYS.map((r) => ({
    text: t(r.text),
    author: t(r.author),
  }));
  const [idx, setIdx] = useState(0);
  const [dir, setDir] = useState(1); // 1 next, -1 prev
  const timerRef = useRef(null);

  const count = reviews?.length || 0;

  const current = useMemo(() => {
    if (!count) return null;
    return reviews[Math.min(idx, count - 1)];
  }, [reviews, idx, count]);

  const go = (nextIndex, direction) => {
    if (!count) return;
    setDir(direction);
    setIdx(nextIndex);
  };

  const prev = () => go(idx === 0 ? count - 1 : idx - 1, -1);
  const next = () => go(idx === count - 1 ? 0 : idx + 1, 1);

  const stopAuto = () => {
    if (timerRef.current) clearInterval(timerRef.current);
  };

  const startAuto = () => {
    if (!autoplay || count <= 1) return;
    stopAuto();
    timerRef.current = setInterval(() => {
      setDir(1);
      setIdx((i) => (i === count - 1 ? 0 : i + 1));
    }, intervalMs);
  };

  // autoplay
  useEffect(() => {
    startAuto();
    return () => stopAuto();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [autoplay, intervalMs, count]);

  // keyboard arrows (desktop)
  useEffect(() => {
    const onKey = (e) => {
      if (count <= 1) return;
      if (e.key === "ArrowLeft") prev();
      if (e.key === "ArrowRight") next();
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [count, idx]);

  if (!count) return null;

  return (
    <section className="bg-white">
      {/* BUTTON (mobile like screenshot: narrower + centered) */}
      <div className="mx-auto w-full px-4 sm:px-6">
        <div className="flex justify-center">
          <Link
            to="/aparts"
            className="group inline-flex w-full max-w-[360px] items-center justify-center gap-4 bg-brand-bordo px-6 py-4 font-finlandica text-[14px] font-medium text-brand-beige sm:w-auto sm:max-w-none sm:px-10"
          >
            {t("view_all_apartments")}
            <span className="text-brand-beige transition-transform duration-200 group-hover:translate-x-[2px]">
              →
            </span>
          </Link>
        </div>
      </div>

      {/* FULL-WIDTH WRAPPER */}
      <div className="relative mt-10 w-full pb-12 sm:pb-16">
        {/* flowers (mobile: smaller + visible, desktop: big on edges) */}
        <img
          src={flowerLeft}
          alt=""
          className="pointer-events-none absolute left-0 top-[110px] w-[160px] opacity-60 sm:top-1/2 sm:w-[260px] sm:-translate-y-1/2 lg:w-[320px]"
          draggable="false"
        />
        <img
          src={flowerRight}
          alt=""
          className="pointer-events-none absolute right-0 bottom-[60px] w-[140px] opacity-60 sm:bottom-auto sm:top-1/2 sm:w-[290px] sm:-translate-y-1/2 lg:w-[360px]"
          draggable="false"
        />

        {/* CONTENT CONTAINER */}
        <div className="mx-auto w-full max-w-[1320px] px-4 sm:px-6">
          <div
            className="mx-auto flex min-h-[520px] max-w-[760px] flex-col items-center justify-center text-center"
            onMouseEnter={stopAuto}
            onMouseLeave={startAuto}
          >
            {/* titles responsive */}
            <h3 className="font-oranienbaum text-[28px] uppercase tracking-[0.6px] text-brand-black sm:text-[34px]">
              {t("reviews_our")}
            </h3>
            <h4 className="mt-1 font-oranienbaum text-[22px] uppercase tracking-[0.6px] text-brand-black/80 sm:text-[28px]">
              {t("reviews_clients")}
            </h4>

            {/* SLIDER */}
            <div className="mt-8 w-full sm:mt-10">
              <div className="relative mx-auto max-w-[620px] px-4 sm:px-0">
                {/* big quotes responsive (mobile smaller + inside) */}
                <span className="absolute left-0 top-0 -translate-x-[6px] -translate-y-[6px] font-oranienbaum text-[44px] leading-none text-brand-black sm:-left-10 sm:-top-6 sm:translate-x-0 sm:translate-y-0 sm:text-[64px]">
                  “
                </span>
                <span className="absolute right-0 bottom-0 translate-x-[6px] translate-y-[10px] font-oranienbaum text-[44px] leading-none text-brand-black sm:-right-10 sm:-bottom-10 sm:translate-x-0 sm:translate-y-0 sm:text-[64px]">
                  ”
                </span>

                {/* animated content */}
                <div
                  key={idx}
                  className={[
                    "opacity-0",
                    dir === 1
                      ? "animate-[revInR_.35s_ease-out_forwards]"
                      : "animate-[revInL_.35s_ease-out_forwards]",
                  ].join(" ")}
                >
                  <p className="font-finlandica text-[14px] leading-[1.9] text-brand-black/55 sm:text-[15px]">
                    {current.text}
                  </p>

                  <div className="mt-8 font-finlandica text-[13px] font-semibold tracking-[0.8px] text-brand-black/60 sm:mt-10 sm:text-[14px]">
                    {current.author}
                  </div>
                </div>
              </div>

              {/* dots */}
              {count > 1 && (
                <div className="mt-7 flex justify-center gap-2 sm:mt-8">
                  {reviews.map((_, i) => (
                    <button
                      key={i}
                      type="button"
                      aria-label={`Review ${i + 1}`}
                      onClick={() => go(i, i > idx ? 1 : -1)}
                      className={`h-2 w-2 rounded-full transition-opacity ${
                        i === idx
                          ? "bg-brand-bordo opacity-100"
                          : "bg-brand-black/20 opacity-70"
                      }`}
                    />
                  ))}
                </div>
              )}
            </div>

            {/* arrows like screenshot (mobile same size, centered) */}
            {count > 1 && (
              <div className="mt-8 flex items-center justify-center gap-14 sm:mt-10">
                <button
                  type="button"
                  onClick={prev}
                  aria-label="Previous review"
                  className="group text-brand-black/35 transition-colors hover:text-brand-black/55"
                >
                  <ArrowIcon
                    direction="left"
                    className="h-[14px] w-[64px] transition-transform duration-200 group-hover:-translate-x-[2px]"
                  />
                </button>

                <button
                  type="button"
                  onClick={next}
                  aria-label="Next review"
                  className="group text-brand-black/35 transition-colors hover:text-brand-black/55"
                >
                  <ArrowIcon
                    direction="right"
                    className="h-[14px] w-[64px] transition-transform duration-200 group-hover:translate-x-[2px]"
                  />
                </button>
              </div>
            )}
          </div>
        </div>

        {/* keyframes */}
        <style>{`
          @keyframes revInR { from { opacity: 0; transform: translateX(10px); } to { opacity: 1; transform: translateX(0); } }
          @keyframes revInL { from { opacity: 0; transform: translateX(-10px); } to { opacity: 1; transform: translateX(0); } }
        `}</style>
      </div>
    </section>
  );
}
