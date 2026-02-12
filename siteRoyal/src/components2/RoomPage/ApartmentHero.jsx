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

  // ---- hooks must be above any return ----
  const viewportRef = useRef(null);
  const trackRef = useRef(null);

  const [spv, setSpv] = useState(3);
  const gap = 12;

  // ✅ faster, snappier animation
  const TRANSITION_MS = 260; // was 650
  const EASING = "cubic-bezier(0.2, 0.9, 0.2, 1)"; // snappier than your current

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

  // ✅ allow rapid clicks: queue directions
  const animatingRef = useRef(false);
  const pendingRef = useRef(0);

  // ----- drag -----
  const drag = useRef({ active: false, startX: 0, dx: 0, moved: false });

  // ✅ prevent arrows from starting a drag
  const isFromControl = (e) => {
    const t = e?.target;
    return t instanceof Element && t.closest("[data-slider-control='true']");
  };

  useEffect(() => {
    setIndex(images.length > 1 ? clones : 0);
    pendingRef.current = 0;
    animatingRef.current = false;
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
      ? `transform ${TRANSITION_MS}ms ${EASING}`
      : "none";

    track.style.transform = `translate3d(${-offset}px,0,0)`;
  };

  useEffect(() => {
    applyTransformPx(index, true);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [index, spv]);

  const stepOnce = (dir) => {
    if (slides.length <= 1) return;
    animatingRef.current = true;
    setIndex((i) => i + dir);
  };

  const go = (dir) => {
    if (slides.length <= 1) return;

    pendingRef.current += dir;

    // start immediately if idle
    if (!animatingRef.current) {
      const nextDir = pendingRef.current > 0 ? 1 : -1;
      pendingRef.current -= nextDir;
      stepOnce(nextDir);
    }
  };

  const onTransitionEnd = () => {
    if (images.length <= 1) {
      animatingRef.current = false;
      pendingRef.current = 0;
      return;
    }

    const realLen = images.length;

    // infinite loop snap if needed
    if (index < clones) {
      const jumpTo = index + realLen;
      applyTransformPx(jumpTo, false);
      setIndex(jumpTo);
    } else if (index >= clones + realLen) {
      const jumpTo = index - realLen;
      applyTransformPx(jumpTo, false);
      setIndex(jumpTo);
    }

    animatingRef.current = false;

    // ✅ if user clicked more, run next immediately
    if (pendingRef.current !== 0) {
      const nextDir = pendingRef.current > 0 ? 1 : -1;
      pendingRef.current -= nextDir;

      requestAnimationFrame(() => {
        stepOnce(nextDir);
      });
    }
  };

  const down = (e, x) => {
    if (slides.length <= 1) return;
    if (isFromControl(e)) return;

    drag.current.active = true;
    drag.current.startX = x;
    drag.current.dx = 0;
    drag.current.moved = false;

    const track = trackRef.current;
    if (track) track.style.transition = "none";
  };

  const move = (e, x) => {
    if (!drag.current.active) return;
    if (isFromControl(e)) return;

    const track = trackRef.current;
    if (!track) return;

    const dx = x - drag.current.startX;
    drag.current.dx = dx;
    if (Math.abs(dx) > 3) drag.current.moved = true;

    const slideW = getSlideW();
    const offset = index * (slideW + gap);

    track.style.transform = `translate3d(${-(offset - dx)}px,0,0)`;
  };

  const up = () => {
    if (!drag.current.active) return;
    drag.current.active = false;

    // snap back if not dragged
    if (!drag.current.moved) {
      applyTransformPx(index, true);
      return;
    }

    const slideW = getSlideW();
    const absDx = Math.abs(drag.current.dx);
    const threshold = slideW * 0.12; // ✅ more responsive than 0.18

    if (absDx > threshold) {
      go(drag.current.dx < 0 ? 1 : -1);
    } else {
      applyTransformPx(index, true);
    }
  };

  // ✅ render guard after hooks
  if (status !== "succeeded" || !apartment || images.length === 0) {
    return null;
  }

  return (
    <section className="bg-white">
      <div className="mx-auto w-full px-6 md:px-10 lg:px-20 pt-1">
        <div
          ref={viewportRef}
          className="relative overflow-hidden touch-pan-y"
          onMouseDown={(e) => down(e, e.clientX)}
          onMouseMove={(e) => move(e, e.clientX)}
          onMouseUp={up}
          onMouseLeave={up}
          onTouchStart={(e) => down(e, e.touches[0].clientX)}
          onTouchMove={(e) => move(e, e.touches[0].clientX)}
          onTouchEnd={up}
        >
          {/* Arrows */}
          {images.length > 1 && (
            <>
              <button
                data-slider-control="true"
                type="button"
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
                data-slider-control="true"
                type="button"
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
                <div className="h-[240px] sm:h-[320px] lg:h-[420px] w-full">
                  <img
                    src={src}
                    alt=""
                    draggable={false}
                    className="h-full w-full select-none object-cover pointer-events-none"
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
