import React, { useEffect, useMemo, useRef, useState } from "react";

function ApartmentGallery({ images }) {
  const safeImages = useMemo(
    () => (Array.isArray(images) ? images.filter(Boolean) : []),
    [images]
  );

  const [index, setIndex] = useState(0);
  const [animating, setAnimating] = useState(false);

  // slider mechanics
  const [trackIndex, setTrackIndex] = useState(1); // 1 = current (because we use [prev, current, next])
  const [dir, setDir] = useState(1); // 1 = next (slide left), -1 = prev (slide right)

  const timerRef = useRef(null);

  useEffect(() => {
    setIndex(0);
    setTrackIndex(1);
    setAnimating(false);
    setDir(1);
    if (timerRef.current) clearTimeout(timerRef.current);
  }, [safeImages.length]);

  const hasMany = safeImages.length > 1;
  const currentSrc = safeImages[index];

  const mod = (n, m) => ((n % m) + m) % m;

  const prevIndex = hasMany ? mod(index - 1, safeImages.length) : 0;
  const nextIndex = hasMany ? mod(index + 1, safeImages.length) : 0;

  const slides = hasMany
    ? [safeImages[prevIndex], safeImages[index], safeImages[nextIndex]]
    : [safeImages[index]];

  const go = (direction) => {
    if (!hasMany || animating) return;

    setDir(direction);
    setAnimating(true);

    // move track to 0 (prev) or 2 (next)
    setTrackIndex(direction === 1 ? 2 : 0);

    // after transition, commit index and snap back to center without animation
    timerRef.current = setTimeout(() => {
      setIndex((i) =>
        direction === 1
          ? mod(i + 1, safeImages.length)
          : mod(i - 1, safeImages.length)
      );
      setAnimating(false);
      setTrackIndex(1);
    }, 320);
  };

  const prev = (e) => {
    e.preventDefault();
    e.stopPropagation();
    go(-1);
  };

  const next = (e) => {
    e.preventDefault();
    e.stopPropagation();
    go(1);
  };

  if (!currentSrc) {
    return <div className="aspect-[4/3] w-full bg-gray-200" />;
  }

  return (
    <div className="group relative h-full w-full overflow-hidden">
      {/* SLIDER */}
      <div
        className={[
          "flex h-full w-full",
          animating
            ? "transition-transform duration-300 ease-out"
            : "transition-none",
        ].join(" ")}
        style={{ transform: `translateX(-${trackIndex * 100}%)` }}
      >
        {slides.map((src, i) => (
          <div key={`${src}-${i}`} className="h-full w-full shrink-0">
            <img
              src={src}
              alt=""
              className="h-full w-full object-cover"
              draggable="false"
            />
          </div>
        ))}
      </div>

      {hasMany && (
        <>
          <button
            type="button"
            onClick={prev}
            className="absolute left-2 top-1/2 -translate-y-1/2 grid h-7 w-7 place-items-center rounded-full bg-black/40 text-white
                       opacity-0 transition-opacity duration-200 ease-out
                       group-hover:opacity-100"
          >
            ‹
          </button>

          <button
            type="button"
            onClick={next}
            className="absolute right-2 top-1/2 -translate-y-1/2 grid h-7 w-7 place-items-center rounded-full bg-black/40 text-white
                       opacity-0 transition-opacity duration-200 ease-out
                       group-hover:opacity-100"
          >
            ›
          </button>

          <div
            className="absolute bottom-3 left-1/2 flex -translate-x-1/2 gap-1
                       opacity-0 transition-opacity duration-200 ease-out
                       group-hover:opacity-100"
          >
            {safeImages.map((_, i) => (
              <span
                key={i}
                className={`h-1.5 w-1.5 rounded-full ${
                  i === index ? "bg-white" : "bg-white/50"
                }`}
              />
            ))}
          </div>
        </>
      )}
    </div>
  );
}

export default ApartmentGallery;
