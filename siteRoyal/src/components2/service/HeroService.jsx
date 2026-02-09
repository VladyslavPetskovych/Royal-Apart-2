import React from "react";
import { useTranslation } from "react-i18next";
import hero from "../../assets/newDesign/Service/Hero.webp";

function HeroService() {
  const { t } = useTranslation();

  return (
    <section className="w-full  bg-brand-black ">
      <div className="relative w-full">
        <img
          src={hero}
          alt="Hero"
          className=" w-full h-[85vh] sm:h-[90vh] lg:h-[80vh] object-cover opacity-50"
        />

        <div className="absolute inset-0 bg-gradient-to-b from-black/15 via-black/30 to-black/10" />
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 px-5">
          <p className="whitespace-nowrap text-4xl lg:text-6xl font-oranienbaum text-white ">
            {t("service_hero_brand")}
          </p>
          <p className="whitespace-nowrap text-3xl lg:text-5xl font-finlandica text-white ">
            {t("service_hero_title")}
          </p>
        </div>
      </div>
    </section>
  );
}

export default HeroService;
