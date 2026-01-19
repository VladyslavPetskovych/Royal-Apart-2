import React, { useEffect, useMemo, useRef, useState } from "react";
import { ChevronLeft, ChevronRight } from "lucide-react";

function ArrowBtn({ onClick, disabled, children, className = "" }) {
  return (
    <button
      type="button"
      onClick={onClick}
      disabled={disabled}
      className={[
        "inline-flex h-9 w-9 items-center justify-center",
        "text-[#1b1b1b]/60 hover:text-[#1b1b1b]",
        "transition-colors",
        "disabled:opacity-30 disabled:cursor-not-allowed",
        className,
      ].join(" ")}
      aria-label="gallery navigation"
    >
      {children}
    </button>
  );
}

export default function ApartmentGallery({ apartment, status }) {
  if (status !== "succeeded" || !apartment) return null;

  const images = useMemo(() => {
    const arr = Array.isArray(apartment?.imgurl) ? apartment.imgurl : [];
    return arr.filter(Boolean);
  }, [apartment]);

  const [index, setIndex] = useState(0);
  const touchRef = useRef({ x: 0, y: 0, active: false });

  const total = images.length;
  const current = images[index];

  useEffect(() => setIndex(0), [total]);

  const prev = () => setIndex((i) => (i - 1 + total) % total);
  const next = () => setIndex((i) => (i + 1) % total);

  // keyboard support
  useEffect(() => {
    if (total <= 1) return;
    const onKeyDown = (e) => {
      if (e.key === "ArrowLeft") prev();
      if (e.key === "ArrowRight") next();
    };
    window.addEventListener("keydown", onKeyDown);
    return () => window.removeEventListener("keydown", onKeyDown);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [total]);

  // swipe support
  const onTouchStart = (e) => {
    const t = e.touches?.[0];
    if (!t) return;
    touchRef.current = { x: t.clientX, y: t.clientY, active: true };
  };
  const onTouchEnd = (e) => {
    if (!touchRef.current.active || total <= 1) return;
    const t = e.changedTouches?.[0];
    if (!t) return;

    const dx = t.clientX - touchRef.current.x;
    const dy = t.clientY - touchRef.current.y;

    // horizontal swipe threshold
    if (Math.abs(dx) > 40 && Math.abs(dy) < 60) {
      dx > 0 ? prev() : next();
    }

    touchRef.current.active = false;
  };

  // pick thumbnails: show next 3 (like design)
  const thumbs = useMemo(() => {
    if (!total) return [];
    // take 3 after current, wrap around
    const out = [];
    for (let k = 1; k <= 3; k++) out.push((index + k) % total);
    return out;
  }, [index, total]);

  return (
    <section className="bg-[#F8F5EF]">
      <div className="mx-auto w-full px-6 md:px-10 lg:px-20 pb-4 pt-6">
        {/* header row */}
        <div className="mb-4 flex items-center justify-between">
          <h3 className="font-finlandica text-xl font-extrabold uppercase tracking-[0.18em] text-[#1b1b1b]">
            ГАЛЕРЕЯ
          </h3>

          <div className="flex items-center gap-2">
            <ArrowBtn onClick={prev} disabled={total <= 1}>
              <ChevronLeft size={20} strokeWidth={2} />
            </ArrowBtn>
            <ArrowBtn onClick={next} disabled={total <= 1}>
              <ChevronRight size={20} strokeWidth={2} />
            </ArrowBtn>
          </div>
        </div>

        {/* main image */}
        <div
          className="relative overflow-hidden rounded-[2px] bg-white"
          onTouchStart={onTouchStart}
          onTouchEnd={onTouchEnd}
        >
          {/* aspect like screenshot */}
          <div className="relative aspect-[16/8.6] w-full">
            {/* slide */}
            <div
              className="absolute inset-0 transition-transform duration-500 ease-out"
              style={{ transform: "translate3d(0,0,0)" }}
            >
              {current ? (
                <img
                  src={current}
                  alt=""
                  className="h-full w-full object-cover"
                  draggable={false}
                />
              ) : (
                <div className="h-full w-full bg-black/5" />
              )}
            </div>
          </div>
        </div>

        {/* thumbnails row */}
        <div className="mt-5 grid grid-cols-1 gap-5 md:grid-cols-3">
          {thumbs.map((imgIndex) => {
            const src = images[imgIndex];
            return (
              <button
                key={`${src}-${imgIndex}`}
                type="button"
                onClick={() => setIndex(imgIndex)}
                className="group relative overflow-hidden rounded-[2px] bg-white"
                aria-label="Open image"
              >
                {/* same height thumbnails like design */}
                <div className="relative aspect-[16/10] w-full">
                  <img
                    src={src}
                    alt=""
                    draggable={false}
                    className="h-full w-full object-cover transition-transform duration-500 ease-out group-hover:scale-[1.03]"
                  />
                </div>
              </button>
            );
          })}
        </div>

        {/* bottom-right arrows like design */}
        <div className="mt-6 flex justify-end">
          <div className="flex items-center gap-2">
            <ArrowBtn onClick={prev} disabled={total <= 1}>
              <ChevronLeft size={20} strokeWidth={2} />
            </ArrowBtn>
            <ArrowBtn onClick={next} disabled={total <= 1}>
              <ChevronRight size={20} strokeWidth={2} />
            </ArrowBtn>
          </div>
        </div>
      </div>
    </section>
  );
}
