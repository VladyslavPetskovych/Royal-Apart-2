import React, { useMemo } from "react";

export default function ApartmentMap({ apartment, status }) {
  if (status !== "succeeded" || !apartment) return null;

  const address = apartment?.name || "lviv";

  const mapUrl = `https://www.google.com/maps/embed/v1/place?q=${encodeURIComponent(
    `lviv ${address}`,
  )}&key=AIzaSyAZJy8DJMQ37dLwHAw2Cnv0ADC6KNl7zpA`;

  return (
    <section className="bg-[#F8F5EF]">
      <div className="mx-auto w-full px-6 md:px-10 lg:px-20 pb-16 pt-1">
        {/* Header row */}
        <div className="mb-4 flex items-center justify-between">
          <h3 className="font-finlandica text-xl font-extrabold uppercase tracking-[0.18em] text-[#1b1b1b]">
            АДРЕСА
          </h3>

          <div className="text-[12px] font-semibold uppercase tracking-[0.14em] text-[#1b1b1b]/60">
            Lviv {address}
          </div>
        </div>

        {/* Map frame */}
        <div className="overflow-hidden rounded-[2px] bg-white shadow-[0_12px_30px_rgba(0,0,0,0.06)]">
          <div className="relative aspect-[16/7] w-full">
            <iframe
              title="Google Map"
              className="absolute inset-0 h-full w-full"
              frameBorder="0"
              style={{ border: 0 }}
              src={mapUrl}
              allowFullScreen
              loading="lazy"
              referrerPolicy="no-referrer-when-downgrade"
            />
          </div>
        </div>
      </div>
    </section>
  );
}
