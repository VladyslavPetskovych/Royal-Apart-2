import React from "react";
import { Link } from "react-router-dom";
import ApartmentGallery from "./ApartmentGallery";

/** Icons tuned to match screenshot (thin outline, soft gray, correct shapes) */
function IconCube(props) {
  return (
    <svg viewBox="0 0 24 24" fill="none" aria-hidden="true" {...props}>
      <path
        d="M12 2.8 20 7.4v9.2L12 21.2 4 16.6V7.4L12 2.8Z"
        stroke="currentColor"
        strokeWidth="1.6"
        strokeLinejoin="round"
      />
      <path
        d="M12 2.8v18.4"
        stroke="currentColor"
        strokeWidth="1.6"
        strokeLinecap="round"
      />
      <path
        d="M4 7.4l8 4.6 8-4.6"
        stroke="currentColor"
        strokeWidth="1.6"
        strokeLinejoin="round"
      />
    </svg>
  );
}

function IconBed(props) {
  return (
    <svg viewBox="0 0 24 24" fill="none" aria-hidden="true" {...props}>
      <path
        d="M5.3 10.5c0-1.6 1.3-2.9 2.9-2.9h7.6c1.6 0 2.9 1.3 2.9 2.9"
        stroke="currentColor"
        strokeWidth="1.6"
        strokeLinecap="round"
      />
      <path
        d="M4.6 11.2h14.8c.9 0 1.6.7 1.6 1.6v4.2H3v-4.2c0-.9.7-1.6 1.6-1.6Z"
        stroke="currentColor"
        strokeWidth="1.6"
        strokeLinejoin="round"
      />
      <path
        d="M6 17v2M18 17v2"
        stroke="currentColor"
        strokeWidth="1.6"
        strokeLinecap="round"
      />
      <path
        d="M8.2 7.6v2.9M15.8 7.6v2.9"
        stroke="currentColor"
        strokeWidth="1.6"
        strokeLinecap="round"
      />
    </svg>
  );
}

function IconUsers(props) {
  return (
    <svg viewBox="0 0 24 24" fill="none" aria-hidden="true" {...props}>
      <path
        d="M9.2 11.4a3.2 3.2 0 1 0 0-6.4 3.2 3.2 0 0 0 0 6.4Z"
        stroke="currentColor"
        strokeWidth="1.6"
      />
      <path
        d="M3.7 19.2c.6-3.2 3.2-5.5 5.5-5.5s4.9 2.3 5.5 5.5"
        stroke="currentColor"
        strokeWidth="1.6"
        strokeLinecap="round"
      />
      <path
        d="M16.6 11.1a2.7 2.7 0 1 0 0-5.4 2.7 2.7 0 0 0 0 5.4Z"
        stroke="currentColor"
        strokeWidth="1.6"
      />
      <path
        d="M15.4 13.9c2.1.4 3.9 2.2 4.4 5.1"
        stroke="currentColor"
        strokeWidth="1.6"
        strokeLinecap="round"
      />
    </svg>
  );
}

export default function ApartmentCard({ apartment }) {
  if (!apartment) return null;

  const title = apartment?.name || "Апартаменти";
  const floor = apartment?.floor ?? "-";
  const area = apartment?.surface ?? "-";
  const bedrooms = apartment?.beds ?? apartment?.numrooms ?? "-";
  const guests = apartment?.guests ?? "-";
  const images = apartment?.imgurl || [];
  const wubid = apartment?.wubid;

  // keep your own logic (example)
  const isTopPick = apartment?.category === "business";

  return (
    <Link to={wubid ? `/room/${wubid}` : "#"} className="group block">
      {/* IMAGE wrapper: copy your ApartHighlight styles (no radius, no shadow) */}
      <div className="relative aspect-[3/4] w-full overflow-hidden bg-brand-beige">
        {isTopPick && (
          <span className="absolute left-3 top-3 z-10 bg-brand-beigeDark px-3 py-1 font-finlandica text-[12px] font-semibold uppercase tracking-[0.6px] text-white">
            ТОП ВИБІР
          </span>
        )}

        {/* Slider (your current functionality) */}
        <ApartmentGallery images={images} />
      </div>

      {/* TEXT: copy your ApartHighlight styles */}
      <div className="mt-4">
        <div className="flex items-baseline justify-start text-left font-finlandica text-[14px] font-semibold uppercase tracking-[0.6px] text-brand-black">
          <span>вул. {title}</span>
          <span className="mx-2 text-brand-black/35">|</span>
          <span className="font-semibold text-brand-black/60">
            {floor} поверх
          </span>
        </div>

        <div className="mt-2 flex flex-wrap items-center gap-x-7 gap-y-2 font-finlandica text-[14px] text-brand-black/55">
          <span className="inline-flex items-start gap-3">
            <IconCube className="h-[22px] w-[22px] text-brand-black/55" />
            {area} м2
          </span>

          <span className="inline-flex items-start gap-3">
            <IconBed className="h-[22px] w-[22px] text-brand-black/55" />
            {bedrooms} Спальні
          </span>

          <span className="inline-flex items-start gap-3">
            <IconUsers className="h-[22px] w-[22px] text-brand-black/55" />
            {guests} Осіб
          </span>
        </div>
      </div>
    </Link>
  );
}
