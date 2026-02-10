import React, { useEffect } from "react";
import { Link } from "react-router-dom";
import SecondPartImg from "../../assets/newDesign/AboutUs/SecondPart.webp";

import { useSelector } from "react-redux";
import { useTranslation } from "react-i18next";
import { selectLanguage } from "../../redux/languageSlice";

function SecondPart() {
  const lang = useSelector(selectLanguage);
  const { t, i18n } = useTranslation();

  useEffect(() => {
    if (i18n.language !== lang) {
      i18n.changeLanguage(lang);
    }
    document.documentElement.lang = lang;
  }, [lang, i18n]);

  return (
    <section className="bg-white">
      <div className="mx-auto max-w-[1320px] px-6 py-16 lg:py-24">
        <div className="grid items-center gap-12 lg:grid-cols-2 lg:gap-20">
          {/* IMAGE */}
          <div className="overflow-hidden">
            <img
              src={SecondPartImg}
              alt={t("second_part.img_alt")}
              draggable={false}
              className="w-full object-cover"
            />
          </div>

          {/* TEXT */}
          <div className="text-left">
            <h2 className="font-oranienbaum text-[32px]  leading-[1.15] text-[#1b1b1b] md:text-[40px]">
              {t("second_part.title1")}
            </h2>
            <h2 className="mt-1 font-oranienbaum text-[30px] leading-[1.15] text-[#1b1b1b] md:text-[38px]">
              {t("second_part.title2")}
            </h2>

            <div className="mt-6 space-y-4 text-left font-finlandica text-[13px] leading-[1.8] text-[#1b1b1b]/60">
              <p>{t("second_part.p1")}</p>
              <p>{t("second_part.p2")}</p>
              <p>{t("second_part.p3")}</p>
            </div>

            {/* BUTTON */}
            <div className="mt-8 flex justify-start">
              <Link
                to="/aparts"
                className="
                  inline-flex items-center gap-4
                  bg-brand-bordo px-7 py-4
                  font-finlandica text-[13px] font-medium
                  text-brand-beige
                  transition-transform duration-200
                  hover:translate-y-[-1px]
                "
              >
                {t("second_part.view_all")}
                <span className="text-[18px] leading-none">→</span>
              </Link>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}

export default SecondPart;
