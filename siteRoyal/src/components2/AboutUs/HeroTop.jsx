import React, { useEffect } from "react";
import hero from "../../assets/newDesign/AboutUs/Hero.webp";

import { useSelector } from "react-redux";
import { useTranslation } from "react-i18next";
import { selectLanguage } from "../../redux/languageSlice";

function HeroTop() {
  const lang = useSelector(selectLanguage);
  const { t, i18n } = useTranslation();

  useEffect(() => {
    if (i18n.language !== lang) {
      i18n.changeLanguage(lang);
    }
    document.documentElement.lang = lang;
  }, [lang, i18n]);

  return (
    <section className="bg-brand-black pt-16">
      <div className="relative w-full overflow-hidden">
        {/* IMAGE */}
        <div className="h-[70vh] sm:h-[70vh] md:h-[75vh] lg:h-[75vh]">
          <img
            src={hero}
            alt={t("hero.alt")}
            draggable={false}
            className="h-full w-full object-cover object-top"
          />
        </div>

        {/* DARK OVERLAY */}
        <div className="pointer-events-none absolute inset-0 bg-black/25" />

        {/* TEXT */}
        <div className="absolute inset-0 flex items-center justify-center px-6">
          <div className="relative text-center">
            {/* subtle glow behind text */}
            <div className="absolute inset-0 -z-10 blur-2xl bg-black/30 rounded-full" />

            <p
              className="
                font-oranienbaum font-extrabold
                text-[35px] sm:text-[38px] md:text-[48px] lg:text-[59px]
                tracking-[0.14em]
                text-white
                [text-shadow:
                  -1px_-1px_0_rgba(0,0,0,0.45),
                  1px_-1px_0_rgba(0,0,0,0.45),
                  -1px_1px_0_rgba(0,0,0,0.45),
                  1px_1px_0_rgba(0,0,0,0.45),
                  0_8px_24px_rgba(0,0,0,0.45)
                ]
              "
            >
              {t("hero.title")}
            </p>

            <p
              className="
                mt-2
                font-oranienbaum font-medium
                text-[18px] sm:text-[22px] md:text-[28px] lg:text-[34px]
                tracking-[0.16em]
                text-white
                [text-shadow:
                  -1px_-1px_0_rgba(0,0,0,0.45),
                  1px_-1px_0_rgba(0,0,0,0.45),
                  -1px_1px_0_rgba(0,0,0,0.45),
                  1px_1px_0_rgba(0,0,0,0.45),
                  0_6px_20px_rgba(0,0,0,0.45)
                ]
              "
            >
              {t("hero.subtitle")}
            </p>
          </div>
        </div>
      </div>
    </section>
  );
}

export default HeroTop;
