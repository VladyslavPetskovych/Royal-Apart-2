import React, { useMemo } from "react";
import { useTranslation } from "react-i18next";
import { formatApartmentNameForLang } from "../../utils/apartmentNameDisplay";

export default function ApartmentMap({ apartment, status }) {
  const { t, i18n } = useTranslation();

  const addressRaw = apartment?.name || "lviv";
  const addressDisplay = formatApartmentNameForLang(
    apartment?.name,
    i18n.language,
  ).trim() || addressRaw;

  const mapUrl = useMemo(
    () =>
      `https://www.google.com/maps/embed/v1/place?q=${encodeURIComponent(
        `lviv ${addressDisplay}`,
      )}&key=AIzaSyAZJy8DJMQ37dLwHAw2Cnv0ADC6KNl7zpA`,
    [addressDisplay],
  );

  if (status !== "succeeded" || !apartment) return null;

  return (
    <section className="bg-[#F8F5EF]">
      <div className="mx-auto w-full px-6 md:px-10 lg:px-20 pb-16 pt-1">
        {/* Header row */}
        <div className="mb-4 flex items-center justify-between">
          <h3 className="font-finlandica text-xl font-extrabold uppercase tracking-[0.18em] text-[#1b1b1b]">
            {t("room_address")}
          </h3>

          <div className="text-[12px] font-semibold uppercase tracking-[0.14em] text-[#1b1b1b]/60">
            {t("room_map_city")} {addressDisplay}
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
