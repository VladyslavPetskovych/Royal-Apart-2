import React from "react";
import { Link } from "react-router-dom";
import { useTranslation } from "react-i18next";

import card1 from "../../assets/newDesign/Service/Card1.jpg";
import card2 from "../../assets/newDesign/Service/Card2.webp";
import card3 from "../../assets/newDesign/Service/Card3.jpg";

function ServiceCard({ img, title, desc }) {
  return (
    <article
      className="
        group
        flex flex-col
        transition-transform duration-300 ease-out
        hover:-translate-y-[2px]
      "
    >
      {/* image */}
      <div
        className="
          overflow-hidden rounded-[2px] bg-neutral-200
          transition-shadow duration-300
          group-hover:shadow-[0_18px_40px_rgba(0,0,0,0.12)]
        "
      >
        <div className="aspect-[4/3] w-full">
          <img
            src={img}
            alt={title}
            draggable={false}
            className="
              h-full w-full object-cover
              transition-transform duration-[900ms]
              ease-[cubic-bezier(0.22,1,0.36,1)]
              group-hover:scale-[1.04]
            "
          />
        </div>
      </div>

      {/* text */}
      <h3
        className="
          mt-6 font-finlandica text-[12px] font-extrabold uppercase
          tracking-[0.14em]
          text-[#1b1b1b]
          transition-colors duration-300
          group-hover:text-brand-bordo
        "
      >
        {title}
      </h3>

      <p
        className="
          mt-3 max-w-[360px]
          font-finlandica text-[12px] leading-[1.65]
          text-[#1b1b1b]/55
          transition-opacity duration-300
          group-hover:opacity-80
        "
      >
        {desc}
      </p>
    </article>
  );
}

export default function Cozyness() {
  const { t } = useTranslation();

  return (
    <section className="bg-white">
      <div className="mx-auto w-full max-w-[1320px] px-6 pb-16 pt-14 lg:pb-20 lg:pt-16">
        {/* title */}
        <div className="text-center">
          <h2 className="font-oranienbaum text-[34px] leading-[1.05] text-[#1b1b1b] md:text-[46px]">
            {t("service_cozyness_title1")}
          </h2>
          <h2 className="mt-2 font-oranienbaum text-[30px] leading-[1.05] text-[#1b1b1b] md:text-[44px]">
            {t("service_cozyness_title2")}
          </h2>

          <p className="mx-auto mt-5 max-w-[760px] font-finlandica text-[12px] leading-[1.7] text-[#1b1b1b]/55 md:text-[13px]">
            {t("service_cozyness_intro")}
          </p>
        </div>

        {/* cards */}
        <div className="mt-10 grid grid-cols-1 gap-10 md:grid-cols-3 md:gap-8 lg:mt-12 lg:gap-10">
          <ServiceCard
            img={card1}
            title={t("service_cozyness_card1_title")}
            desc={t("service_cozyness_card1_desc")}
          />
          <ServiceCard
            img={card2}
            title={t("service_cozyness_card2_title")}
            desc={t("service_cozyness_card2_desc")}
          />
          <ServiceCard
            img={card3}
            title={t("service_cozyness_card3_title")}
            desc={t("service_cozyness_card3_desc")}
          />
        </div>

        {/* button */}
        <div className="mt-12 flex justify-center">
          <Link
            to="/aparts"
            className="
              group inline-flex items-center justify-center gap-4
              bg-brand-bordo px-5 py-3
              font-finlandica text-[14px] font-medium text-brand-beige
              transition-all duration-200
              hover:-translate-y-[1px]
              hover:shadow-[0_12px_28px_rgba(0,0,0,0.25)]
            "
          >
            {t("service_cozyness_button")}
            <span className="text-brand-beige text-2xl transition-transform duration-200 group-hover:translate-x-[3px]">
              →
            </span>
          </Link>
        </div>
      </div>
    </section>
  );
}
