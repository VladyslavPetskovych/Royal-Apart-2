import React from "react";
import { Link } from "react-router-dom";

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
  return (
    <section className="bg-white">
      <div className="mx-auto w-full max-w-[1320px] px-6 pb-16 pt-14 lg:pb-20 lg:pt-16">
        {/* title */}
        <div className="text-center">
          <h2 className="font-oranienbaum text-[34px] leading-[1.05] text-[#1b1b1b] md:text-[46px]">
            ЗАТИШОК АПАРТАМЕНТІВ
          </h2>
          <h2 className="mt-2 font-oranienbaum text-[30px] leading-[1.05] text-[#1b1b1b] md:text-[44px]">
            ТА ВИНЯТКОВИЙ СЕРВІС!
          </h2>

          <p className="mx-auto mt-5 max-w-[760px] font-finlandica text-[12px] leading-[1.7] text-[#1b1b1b]/55 md:text-[13px]">
            Royal Apart — це не просто апартаменти. Це ваш особистий простір у
            серці Львова, де затишок домашнього відпочинку гармонійно
            поєднується з персоналізованим сервісом елітного готелю. Ми створили
            ідеальне місце, щоб ви могли насолоджуватися неперевершеною
            атмосферою старовинного міста, не відмовляючись від максимального
            комфорту та уваги.
          </p>
        </div>

        {/* cards */}
        <div className="mt-10 grid grid-cols-1 gap-10 md:grid-cols-3 md:gap-8 lg:mt-12 lg:gap-10">
          <ServiceCard
            img={card1}
            title="ЩОТИЖНЕВЕ ПРИБИРАННЯ"
            desc="Стримана та ретельна послуга прибирання, яка гарантує, що ваші апартаменти завжди будуть бездоганно чистими та готовими зустріти вас."
          />
          <ServiceCard
            img={card2}
            title="РЕСТОРАН АРІСТО"
            desc="Арісто - це ресторан європейської кухні, де смак, музика та емоції створюють особливу атмосферу✨. Даруємо Вам знижку 15% на доставку, за промокодом ARISTOSITE"
          />
          <ServiceCard
            img={card3}
            title="ЗВ'ЯЗОК З МЕНЕДЖЕРОМ 24/7"
            desc="Наш менеджер завжди на зв'язку, щоб допомогти вам з будь-якими питаннями чи потребами, забезпечуючи безперебійний та комфортний відпочинок."
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
            ПЕРЕГЛЯНУТИ ВСІ АПАРАТМЕНТИ
            <span className="text-brand-beige text-2xl transition-transform duration-200 group-hover:translate-x-[3px]">
              →
            </span>
          </Link>
        </div>
      </div>
    </section>
  );
}
