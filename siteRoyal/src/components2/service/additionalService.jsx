import React, { useMemo, useState } from "react";
import { Link } from "react-router-dom";
import flowerLeft from "../../assets/newDesign/home/flowerLeft.png";
import flowerRight from "../../assets/newDesign/home/flowerRight.png";

import s11 from "../../assets/newDesign/Service/s1.png";
import s22 from "../../assets/newDesign/Service/s2.png";
import s33 from "../../assets/newDesign/Service/s3.png";
import s44 from "../../assets/newDesign/Service/s4.png";
import s55 from "../../assets/newDesign/Service/s5.png";

function ServiceCard({ img, title, desc }) {
  return (
    <article
      className="
        group relative z-10
        flex flex-col
        transition-transform duration-300 ease-out
        hover:-translate-y-[2px]
      "
    >
      <div
        className="
          overflow-hidden rounded-[2px] bg-black/5
          transition-shadow duration-300
          group-hover:shadow-[0_18px_40px_rgba(0,0,0,0.12)]
        "
      >
        <div className="aspect-[3/4] w-full">
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

      <h3
        className="
          mt-5 font-finlandica text-[12px] font-extrabold uppercase
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
          mt-3 max-w-[320px]
          font-finlandica text-[12px] leading-[1.7]
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

export default function AdditionalService() {
  const items = useMemo(
    () => [
      {
        img: s11,
        title: "РАНКОВИЙ ЗАТИШОК",
        desc: "Насолоджуйтеся комфортом преміум-класу, м’якою постіллю та атмосферою повного релаксу, абсолютно не поспішаючи.",
      },
      {
        img: s22,
        title: "МОМЕНТИ РЕЛАКСАЦІЇ",
        desc: "Дозвольте собі заслужений відпочинок. Гаряча ванна з ароматною піною, келих улюбленого напою та тиша — ідеально для перезавантаження.",
      },
      {
        img: s33,
        title: "ПРИВАТНИЙ Б’ЮТІ-КУТОК",
        desc: "Зручний туалетний столик, ідеальне освітлення та стильне дзеркало створені для вашого вечірнього ритуалу краси та підготовки до виходу.",
      },
      {
        img: s44,
        title: "НЕПЕРЕВЕРШЕНІ СНІДАНКИ",
        desc: "Сніданок із видом, що надихає. Замов sніданок з ресторану Арісто зі знижкою 15% та почни свій день із насолоди! Промокод - ARISTOSITE",
      },
      {
        img: s55,
        title: "НЕЗАБУТНІ МОМЕНТИ РАЗОМ",
        desc: "Наші апартаменти — ідеальне місце для святкування важливих подій. Зберіть найближчих людей за накритим столом і створіть незабутні спогади!",
      },
    ],
    [],
  );

  // kept (optional)
  const [page, setPage] = useState(0);
  const pages = items.length;

  const canPrev = page > 0;
  const canNext = page < pages - 1;

  const prev = () => setPage((p) => Math.max(0, p - 1));
  const next = () => setPage((p) => Math.min(pages - 1, p + 1));

  return (
    <section className="relative z-0 overflow-hidden bg-[#F4EEDF]">
      {/* ✅ Flowers are BEHIND cards */}
      <img
        src={flowerLeft}
        alt=""
        draggable={false}
        className="
          pointer-events-none select-none
          absolute -left-16 top-24
          w-[220px] opacity-80
          sm:-left-10 sm:w-[220px] sm:opacity-85
          -z-10
        "
      />
      <img
        src={flowerRight}
        alt=""
        draggable={false}
        className="
          pointer-events-none select-none
          absolute -right-14 top-16
          w-[260px] opacity-80
          sm:-right-10 sm:w-[260px] sm:opacity-85
          -z-10
        "
      />

      <div className="relative z-10 mx-auto w-full max-w-[1320px] px-6 pb-16 pt-16 lg:pb-20 lg:pt-20">
        {/* title */}
        <div className="text-center">
          <h2 className="font-oranienbaum text-[34px] leading-[1.05] text-[#1b1b1b] md:text-[52px]">
            ДОДАТКОВИЙ СЕРВІС
          </h2>
          <h2 className="mt-2 font-oranienbaum text-[30px] leading-[1.05] text-[#1b1b1b] md:text-[48px]">
            ДЛЯ СТВОРЕННЯ УНІКАЛЬНИХ ВРАЖЕНЬ!
          </h2>

          <p className="mx-auto mt-6 max-w-[860px] font-finlandica text-[12px] leading-[1.7] text-[#1b1b1b]/55 md:text-[13px]">
            Оскільки кожне перебування має відповідати вашим очікуванням, наш
            додатковий сервіс тут, щоб втілити ваші побажання в життя, від
            найпростіших запитів до найбільш ексклюзивних вражень. Незалежно від
            того, чи йдеться про бронювання столика в найпопулярніших
            ресторанах, організацію приватних екскурсій до знакових місць,
            надання особистого шофера чи курування справді індивідуального
            досвіду, ми беремо на себе кожну деталь з розсудливістю та
            досконалістю.
          </p>
        </div>

        {/* desktop row */}
        <div className="mt-12 hidden gap-6 lg:flex">
          {items.map((it, idx) => (
            <div key={idx} className="w-1/5">
              <ServiceCard {...it} />
            </div>
          ))}
        </div>

        {/* mobile/tablet swipe row with peek */}
        <div className="mt-10 lg:hidden">
          <div className="-mx-6 overflow-x-auto px-6 pb-2 scrollbar-hide">
            <div className="flex gap-6">
              {items.map((it, idx) => (
                <div
                  key={idx}
                  className="shrink-0 w-[74vw] max-w-[360px] sm:w-[52vw]"
                >
                  <ServiceCard {...it} />
                </div>
              ))}
            </div>
          </div>

          {/* optional arrows (screenreader accessible) */}
          <div className="sr-only">
            <button onClick={prev} disabled={!canPrev}>
              Prev
            </button>
            <button onClick={next} disabled={!canNext}>
              Next
            </button>
          </div>
        </div>

        {/* button */}
        <div className="mt-12 flex justify-center">
          <Link
            to="/book"
            className="
              group inline-flex items-center justify-center gap-4
              bg-brand-bordo px-5 py-3
              font-finlandica text-[14px] font-medium text-brand-beige
              transition-all duration-200
              hover:-translate-y-[1px]
              hover:shadow-[0_12px_28px_rgba(0,0,0,0.25)]
            "
          >
            ЗАБРОНЮВАТИ
            <span className="text-brand-beige text-2xl transition-transform duration-200 group-hover:translate-x-[3px]">
              →
            </span>
          </Link>
        </div>
      </div>
    </section>
  );
}
