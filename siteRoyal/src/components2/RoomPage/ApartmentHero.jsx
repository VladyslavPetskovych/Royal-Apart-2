import React, { useEffect, useMemo, useRef, useState } from "react";

export default function ApartmentHero({ wubid, apartments = [], status }) {
  const wanted = useMemo(() => {
    const n = Number(wubid);
    return Number.isFinite(n) ? n : null;
  }, [wubid]);

  const apartment = useMemo(() => {
    if (wanted == null) return null;
    return apartments.find((a) => Number(a?.wubid) === wanted) || null;
  }, [apartments, wanted]);

  const images = useMemo(() => {
    const raw = apartment?.imgurl;
    return Array.isArray(raw) ? raw.filter(Boolean) : [];
  }, [apartment]);

  if (status !== "succeeded" || !apartment || images.length === 0) {
    return null;
  }

  const viewportRef = useRef(null);
  const trackRef = useRef(null);

  const [spv, setSpv] = useState(3);
  const gap = 12;

  useEffect(() => {
    const el = viewportRef.current;
    if (!el) return;

    const ro = new ResizeObserver((entries) => {
      const w = entries[0]?.contentRect?.width || 0;

      if (w < 640) setSpv(1.15);
      else if (w < 1024) setSpv(2);
      else setSpv(3);
    });

    ro.observe(el);
    return () => ro.disconnect();
  }, []);

  const clones = Math.min(Math.ceil(spv) + 1, images.length);
  const slides = useMemo(() => {
    if (images.length <= 1) return images;

    const head = images.slice(0, clones);
    const tail = images.slice(-clones);

    return [...tail, ...images, ...head];
  }, [images, clones]);

  const startIndex = images.length > 1 ? clones : 0;
  const [index, setIndex] = useState(startIndex);
  const [animating, setAnimating] = useState(false);

  useEffect(() => {
    setIndex(images.length > 1 ? clones : 0);
  }, [images.length, clones]);

  const getSlideW = () => {
    const vp = viewportRef.current;
    if (!vp) return 1;
    const w = vp.getBoundingClientRect().width || 1;
    const gapsTotal = gap * (spv - 1);
    return (w - gapsTotal) / spv;
  };

  const applyTransformPx = (i, withAnim) => {
    const track = trackRef.current;
    const vp = viewportRef.current;
    if (!track || !vp) return;

    const slideW = getSlideW();
    const offset = i * (slideW + gap);

    track.style.transition = withAnim
      ? "transform 650ms cubic-bezier(0.22,1,0.36,1)"
      : "none";

    track.style.transform = `translate3d(${-offset}px,0,0)`;
  };

  useEffect(() => {
    applyTransformPx(index, true);
  }, [index, spv]);

  const onTransitionEnd = () => {
    if (images.length <= 1) return;
    setAnimating(false);

    const realLen = images.length;

    if (index < clones) {
      const jumpTo = index + realLen;
      applyTransformPx(jumpTo, false);
      setIndex(jumpTo);
      return;
    }

    if (index >= clones + realLen) {
      const jumpTo = index - realLen;
      applyTransformPx(jumpTo, false);
      setIndex(jumpTo);
    }
  };

  const go = (dir) => {
    if (animating || slides.length <= 1) return;
    setAnimating(true);
    setIndex((i) => i + dir);
  };

  const drag = useRef({ active: false, startX: 0, dx: 0 });

  const down = (x) => {
    if (slides.length <= 1) return;
    drag.current.active = true;
    drag.current.startX = x;
    drag.current.dx = 0;
    const track = trackRef.current;
    if (track) track.style.transition = "none";
  };

  const move = (x) => {
    if (!drag.current.active) return;
    const track = trackRef.current;
    if (!track) return;

    const dx = x - drag.current.startX;
    drag.current.dx = dx;

    const slideW = getSlideW();
    const offset = index * (slideW + gap);

    track.style.transform = `translate3d(${-(offset - dx)}px,0,0)`;
  };

  const up = () => {
    if (!drag.current.active) return;
    drag.current.active = false;

    const slideW = getSlideW();
    const absDx = Math.abs(drag.current.dx);

    // threshold: 18% of a slide
    const threshold = slideW * 0.18;

    if (absDx > threshold) {
      setAnimating(true);
      setIndex((i) => (drag.current.dx < 0 ? i + 1 : i - 1));
    } else {
      applyTransformPx(index, true);
    }
  };

  return (
    <section className="bg-white ">
      <div className="mx-auto w-full px-6 md:px-10 lg:px-20 pt-1 ">
        <div
          ref={viewportRef}
          className="relative overflow-hidden "
          onMouseDown={(e) => down(e.clientX)}
          onMouseMove={(e) => move(e.clientX)}
          onMouseUp={up}
          onMouseLeave={up}
          onTouchStart={(e) => down(e.touches[0].clientX)}
          onTouchMove={(e) => move(e.touches[0].clientX)}
          onTouchEnd={up}
        >
          {/* Arrows */}
          {images.length > 1 && (
            <>
              <button
                type="button"
                onMouseDown={(e) => e.stopPropagation()}
                onTouchStart={(e) => e.stopPropagation()}
                onClick={(e) => {
                  e.preventDefault();
                  e.stopPropagation();
                  go(-1);
                }}
                className="absolute left-3 top-1/2 -translate-y-1/2 z-20
    h-12 w-12 rounded-full
    bg-white/80 backdrop-blur
    flex items-center justify-center
    text-black shadow hover:bg-white"
                aria-label="Previous"
              >
                <svg
                  width="24"
                  height="24"
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="2.5"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                >
                  <polyline points="15 18 9 12 15 6" />
                </svg>
              </button>

              <button
                type="button"
                onMouseDown={(e) => e.stopPropagation()}
                onTouchStart={(e) => e.stopPropagation()}
                onClick={(e) => {
                  e.preventDefault();
                  e.stopPropagation();
                  go(1);
                }}
                className="absolute right-3 top-1/2 -translate-y-1/2 z-20
    h-12 w-12 rounded-full
    bg-white/80 backdrop-blur
    flex items-center justify-center
    text-black shadow hover:bg-white"
                aria-label="Next"
              >
                <svg
                  width="24"
                  height="24"
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="2.5"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                >
                  <polyline points="9 18 15 12 9 6" />
                </svg>
              </button>
            </>
          )}

          <div
            ref={trackRef}
            className="flex"
            style={{ gap: `${gap}px`, willChange: "transform" }}
            onTransitionEnd={onTransitionEnd}
          >
            {slides.map((src, i) => (
              <div
                key={`${src}-${i}`}
                className="flex-none"
                style={{
                  width: `calc((100% - ${(spv - 1) * gap}px) / ${spv})`,
                }}
              >
                {/* same height for all images */}
                <div className="h-[240px] sm:h-[320px] lg:h-[420px] w-full">
                  <img
                    src={src}
                    alt=""
                    draggable={false}
                    className="h-full w-full select-none object-cover"
                  />
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </section>
  );
}
