import React from "react";
import { useTranslation } from "react-i18next";
import { FiCalendar, FiMapPin, FiBookOpen } from "react-icons/fi";

export default function HeroFeatures() {
  const { t } = useTranslation();
  return (
    <div className="w-full px-4 py-6 sm:px-6 sm:py-8 lg:p-12">
      <div className="mx-auto max-w-7xl">
        <div
          className="
            flex flex-col items-center gap-3
            text-white
            md:flex-row md:flex-wrap
            md:items-center md:justify-center md:gap-x-10 md:gap-y-4
            lg:flex-nowrap lg:gap-12
          "
        >
          {/* ITEM 1 — hidden on mobile */}
          <div className="hidden md:flex items-start text-left gap-3 opacity-90">
            <FiCalendar className="shrink-0 text-[18px] sm:text-lg" />
            <span
              className="
                uppercase tracking-[0.18em] text-[11px] leading-[1.3]
                sm:tracking-[0.2em] sm:text-sm sm:leading-none
              "
            >
              {t("hero_feature_1")}
            </span>
          </div>

          {/* ITEM 2 — hidden on mobile */}
          <div className="hidden md:flex items-start text-left gap-3 opacity-90">
            <FiMapPin className="shrink-0 text-[18px] sm:text-lg" />
            <span
              className="
                uppercase tracking-[0.18em] text-[11px] leading-[1.3]
                sm:tracking-[0.2em] sm:text-sm sm:leading-none
              "
            >
              {t("hero_feature_2")}
            </span>
          </div>

          {/* ITEM 3 — centered on mobile */}
          <div className="flex items-start gap-3  opacity-90 text-left">
            <FiBookOpen className="shrink-0 text-[18px] sm:text-lg" />
            <span
              className="
                text-left
                uppercase tracking-[0.18em] text-[11px] leading-[1.3]
                sm:tracking-[0.2em] sm:text-sm sm:leading-none
              "
            >
              {t("hero_feature_3")}
            </span>
          </div>
        </div>
      </div>
    </div>
  );
}
