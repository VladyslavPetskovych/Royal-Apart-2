import React from "react";
import { Link } from "react-router-dom";
import { useTranslation } from "react-i18next";
import coffe from "../../assets/newDesign/Service/coffe.webp";

function Coffe() {
  const { t } = useTranslation();

  return (
    <section className="bg-brand-black">
      {/* ✅ FULL BLEED WRAP (no max width / no side padding) */}
      <div className="relative w-full">
        <div className="relative overflow-hidden">
          {/* IMAGE */}
          <div className="h-[320px] sm:h-[360px] md:h-[420px] lg:h-[780px] w-full">
            <img
              src={coffe}
              alt="Service"
              draggable={false}
              className="
                h-full w-full
                object-cover
                object-[center_top]
                sm:object-center
              "
            />
          </div>

          {/* GRADIENT */}
          <div className="pointer-events-none absolute inset-0 bg-gradient-to-r from-black/60 via-black/20 to-black/0" />

          {/* ✅ CONTENT CONTAINER (keeps nice left spacing like before) */}
          <div className="absolute inset-0">
            <div className="mx-auto h-full w-full max-w-[1400px] px-4 sm:px-6">
              <div
                className="
                  absolute left-4 sm:left-10
                  top-1/2 -translate-y-1/2
                  w-[88%] sm:w-[78%]
                  max-w-[520px]
                "
              >
                <h2 className="font-oranienbaum text-[28px] leading-[1.05] text-white sm:text-[38px] md:text-[44px]">
                  {t("service_coffee_title_line1")}
                  <br />
                  {t("service_coffee_title_line2")}
                </h2>

                <Link
                  to="/aparts"
                  className="
                    mt-6
                    inline-flex items-center
                    gap-6 sm:gap-10
                    h-[44px]
                    whitespace-nowrap
                    bg-brand-beigeDark
                    px-4 sm:px-5
                    font-finlandica
                    text-[13px]
                    font-semibold
                    tracking-[0.02em]
                    text-brand-black
                    shadow-[0_10px_25px_rgba(0,0,0,0.18)]
                    transition-transform duration-200
                    hover:translate-y-[-1px]
                  "
                  >
                    <span>{t("view_all_apartments")}</span>
                  <span className="text-[18px] leading-none">→</span>
                </Link>
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}

export default Coffe;
