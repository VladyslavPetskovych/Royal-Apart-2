import React from "react";
import { Link } from "react-router-dom";
import SecondPartImg from "../../assets/newDesign/AboutUs/SecondPart.webp";

function SecondPart() {
  return (
    <section className="bg-white">
      <div className="mx-auto max-w-[1320px] px-6 py-16 lg:py-24">
        <div className="grid items-center gap-12 lg:grid-cols-2 lg:gap-20">
          {/* IMAGE */}
          <div className="overflow-hidden">
            <img
              src={SecondPartImg}
              alt="Апартаменти Royal Apart"
              draggable={false}
              className="w-full object-cover"
            />
          </div>

          {/* TEXT */}
          <div>
            <h2 className="font-oranienbaum text-[32px] leading-[1.15] text-[#1b1b1b] md:text-[40px]">
              ВИНЯТКОВІ КВАРТИРИ
            </h2>
            <h2 className="mt-1 font-oranienbaum text-[30px] leading-[1.15] text-[#1b1b1b] md:text-[38px]">
              ДЛЯ ВАШИХ ЗРУЧНОСТЕЙ!
            </h2>

            <div className="mt-6 space-y-4 text-left font-finlandica text-[13px] leading-[1.8] text-[#1b1b1b]/60">
              <p>
                Ми просто обожнюємо Львів — його історію та неймовірну
                архітектуру!
              </p>

              <p>
                Команда Royal Apart створила ці апартаменти для мандрівників,
                які цінують розкіш та приватність, щоб досліджувати місто
                по-новому. Пропонуємо особисті, стильно оформлені квартири та
                прикріплюємо до вас особистого менеджера, який допоможе з усім.
              </p>

              <p>
                Royal Apart — це не просто апартаменти. Це ваш особистий простір
                у серці Львова, де затишок домашнього відпочинку гармонійно
                поєднується з персоналізованим сервісом елітного готелю. Ми
                створили ідеальне місце, щоб ви могли насолоджуватися
                неперевершеною атмосферою старовинного міста, не відмовляючись
                від максимального комфорту та уваги.
              </p>
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
                Переглянути Всі Апартаменти
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
