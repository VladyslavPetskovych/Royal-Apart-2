import React from "react";
import { Link } from "react-router-dom";
import exp from "../../assets/newDesign/AboutUs/Exp.jpg";
import flower from "../../assets/newDesign/home/flowerRight2.png";
import simple from "../../assets/newDesign/AboutUs/Simple.jpg";

function Expirience() {
  return (
    <>
      {/* ✅ BLOCK 1: ДОСВІД КОМПАНІЇ (mobile like screenshot: text -> button -> image) */}
      <section className="relative overflow-hidden bg-[#F4EEDF]">
        {/* flower (right-top) */}
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
            {/* TEXT */}
            <div className="order-1">
              <h2 className="font-oranienbaum text-[28px] leading-[1.15] text-[#1b1b1b] sm:text-[32px] md:text-[40px]">
                ДОСВІД КОМПАНІЇ
              </h2>
              <h2 className="mt-1 font-oranienbaum text-[26px] leading-[1.15] text-[#1b1b1b] sm:text-[30px] md:text-[38px]">
                ВІДЧУЙ СЕБЕ ЯК ВДОМА!
              </h2>

              <div className="mt-5 space-y-4 text-left font-finlandica text-[12px] leading-[1.75] text-[#1b1b1b]/60 sm:text-[13px] sm:leading-[1.85]">
                <p>
                  Royal Apart пропонує вам затишні та якісні квартири у
                  найкращих будинках Львова. Це ваш приватний, спокійний куточок
                  у серці старовинного міста.
                </p>

                <p>
                  Кожна квартира повністю обладнана і має свій характер. Ми
                  дбаємо, щоб дизайн був не лише сучасним, але й поважав
                  львівську архітектуру, гармонійно з духом нашого міста.
                </p>

                <p>
                  Наші квартири ми ремонтуємо самі, співпрацюючи з місцевими
                  майстрами та дизайнерами. Ми продумуємо кожну дрібницю, щоб
                  ваше перебування було максимально комфортним, затишним і
                  справжнім.
                </p>
              </div>

              {/* BUTTON (on mobile aligns left like screenshot) */}
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
                  Переглянути Всі Апартаменти
                  <span className="text-[18px] leading-none transition-transform duration-200 group-hover:translate-x-[2px]">
                    →
                  </span>
                </Link>
              </div>
            </div>

            {/* IMAGE (below on mobile, right on desktop) */}
            <div className="order-2 lg:order-2">
              <div className="overflow-hidden bg-black/5">
                <img
                  src={exp}
                  alt="Досвід Royal Apart"
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

      {/* ✅ BLOCK 2: ПРОСТО ТА ЗРУЧНО (mobile like screenshot: title/text -> image) */}
      <section className="relative overflow-hidden bg-[#F4EEDF]">
        {/* (optional small flower corner, like screenshot bottom-right vibe) */}
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

        <div className="mx-auto w-full max-w-[1320px] px-6 pb-14 sm:pb-16 lg:py-24">
          <div className="grid items-center gap-10 lg:grid-cols-2 lg:gap-20">
            {/* TEXT (on mobile first, on desktop right like screenshot style is fine either way) */}
            <div className="order-1 lg:order-2">
              <h2 className="font-oranienbaum text-[28px] leading-[1.15] text-[#1b1b1b] sm:text-[32px] md:text-[40px]">
                ПРОСТО ТА ЗРУЧНО
              </h2>

              <div className="mt-5 space-y-4 font-finlandica text-[12px] leading-[1.75] text-[#1b1b1b]/60 sm:text-[13px] sm:leading-[1.85]">
                <p>
                  Royal Apart — це якість, перевірена роками, і завжди чудові
                  локації! Наші квартири знаходяться у зручних місцях — поруч із
                  центром, але там, де тихо і можна відпочити.
                </p>

                <p>
                  Це наші зручні тимчасові помешкання, де можна розслабитися
                  після прогулянки містом. Вони надійні, безпечні та ідеально
                  підходять для відпочинку. Ми цінуємо ваш час, тому пропонуємо
                  простий сервіс та підтримку. Наша команда завжди на зв’язку і
                  готова допомогти з будь-яким питанням чи порадою.
                </p>

                <p>
                  Ми поєднуємо зручність сучасних технологій (легке бронювання,
                  швидке заселення) з людським підходом та турботою про кожного
                  гостя.
                </p>
              </div>
            </div>

            {/* IMAGE */}
            <div className="order-2 lg:order-1">
              <div className="overflow-hidden bg-black/5">
                <img
                  src={simple}
                  alt="Просто та зручно"
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
