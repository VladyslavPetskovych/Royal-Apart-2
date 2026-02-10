import React, { useEffect } from "react";
import { Link } from "react-router-dom";
import { useSelector } from "react-redux";
import { useTranslation } from "react-i18next";

import { selectLanguage } from "../../redux/languageSlice";

import exp from "../../assets/newDesign/AboutUs/Exp.jpg";
import flower from "../../assets/newDesign/home/flowerRight2.png";
import simple from "../../assets/newDesign/AboutUs/Simple.jpg";

function Expirience() {
  const lang = useSelector(selectLanguage);

  // ✅ get i18n from hook (no separate import needed)
  const { t, i18n } = useTranslation();

  useEffect(() => {
    // ✅ avoid extra calls if already correct
    if (i18n.language !== lang) {
      i18n.changeLanguage(lang);
    }
    document.documentElement.lang = lang;
  }, [lang, i18n]);

  return (
    <>
      {/* ✅ BLOCK 1 */}
      <section className="relative overflow-hidden bg-[#F4EEDF]">
        <img
          src={flower}
          alt=""
          draggable={false}
          className="
            pointer-events-none select-none
            absolute -right-10 -top-10
            w-[220px] opacity-70
            sm:w-[260px] sm:opacity-80
            lg:w-[320px]
          "
        />

        <div className="mx-auto w-full max-w-[1320px] px-6 py-14 sm:py-16 lg:py-24">
          <div className="grid items-center gap-10 lg:grid-cols-2 lg:gap-20">
            <div className="order-1">
              <h2 className="font-oranienbaum text-[28px] leading-[1.15] text-[#1b1b1b] sm:text-[32px] md:text-[40px]">
                {t("experience.company_experience")}
              </h2>
              <h2 className="mt-1 font-oranienbaum text-[26px] leading-[1.15] text-[#1b1b1b] sm:text-[30px] md:text-[38px]">
                {t("experience.feel_home")}
              </h2>

              <div className="mt-5 space-y-4 text-left font-finlandica text-[12px] leading-[1.75] text-[#1b1b1b]/60 sm:text-[13px] sm:leading-[1.85]">
                <p>{t("experience.p1")}</p>
                <p>{t("experience.p2")}</p>
                <p>{t("experience.p3")}</p>
              </div>

              <div className="mt-7 flex justify-start">
                <Link
                  to="/aparts"
                  className="
                    group inline-flex items-center gap-4
                    bg-brand-bordo px-7 py-4
                    font-finlandica text-[13px] font-medium
                    text-brand-beige
                    transition-transform duration-200
                    hover:translate-y-[-1px]
                  "
                >
                  {t("experience.view_all")}
                  <span className="text-[18px] leading-none transition-transform duration-200 group-hover:translate-x-[2px]">
                    →
                  </span>
                </Link>
              </div>
            </div>

            <div className="order-2 lg:order-2">
              <div className="overflow-hidden bg-black/5">
                <img
                  src={exp}
                  alt={t("experience.exp_alt")}
                  draggable={false}
                  className="
                    w-full object-cover
                    aspect-[4/3] sm:aspect-[16/10] lg:aspect-auto
                  "
                />
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* ✅ BLOCK 2 */}
      <section className="relative overflow-hidden bg-[#F4EEDF]">
        <img
          src={flower}
          alt=""
          draggable={false}
          className="
            pointer-events-none select-none
            absolute -right-12 bottom-0
            w-[220px] opacity-50
            sm:w-[260px] sm:opacity-60
            lg:hidden
          "
        />

        <div className="mx-auto w-full max-w-[1320px]  px-6 pb-14 sm:pb-16 lg:py-24">
          <div className="grid items-center gap-10 lg:grid-cols-2 lg:gap-20">
            <div className="order-1 lg:order-2">
              <h2 className="font-oranienbaum text-[28px] leading-[1.15] text-[#1b1b1b] sm:text-[32px] md:text-[40px]">
                {t("experience.simple_title")}
              </h2>

              <div className="mt-5 space-y-4 font-finlandica text-left text-[12px] leading-[1.75] text-[#1b1b1b]/60 sm:text-[13px] sm:leading-[1.85]">
                <p>{t("experience.s1")}</p>
                <p>{t("experience.s2")}</p>
                <p>{t("experience.s3")}</p>
              </div>
            </div>

            <div className="order-2 lg:order-1">
              <div className="overflow-hidden bg-black/5">
                <img
                  src={simple}
                  alt={t("experience.simple_alt")}
                  draggable={false}
                  className="
                    w-full object-cover
                    aspect-[4/3] sm:aspect-[16/10] lg:aspect-auto
                  "
                />
              </div>
            </div>
          </div>
        </div>
      </section>
    </>
  );
}

export default Expirience;
