import React from "react";

// ✅ replace paths with your real icons
import iconDesign from "../../assets/instagram/icon1.svg";
import iconLocation from "../../assets/instagram/icon2.svg";
import iconService from "../../assets/instagram/icon3.svg";

function Feature({ icon, title, text }) {
  return (
    <div className="flex flex-col items-center px-6 py-10 text-center">
      <img
        src={icon}
        alt=""
        draggable="false"
        className="h-[28px] w-[28px] opacity-80"
      />

      <h3 className="mt-5 font-finlandica text-[16px] font-semibold uppercase tracking-[0.12em] text-black">
        {title}
      </h3>

      <p className="mt-3 max-w-[360px] font-finlandica text-[15px] leading-[1.35] text-black/55">
        {text}
      </p>
    </div>
  );
}

export default function FancySection() {
  const items = [
    {
      icon: iconDesign,
      title: "ВИШУКАНИЙ ДИЗАЙН ТА ІНТЕР’ЄР",
      text: "Кожен простір ретельно продуманий, щоб відобразити непідвладну львівську елегантність",
    },
    {
      icon: iconLocation,
      title: "ПРЕСТИЖНІ ЛОКАЦІЇ У СЕРЦІ ЛЬВОВА",
      text: "Наші апартаменти розташовані у найбільш ексклюзивних та бажаних районах міста",
    },
    {
      icon: iconService,
      title: "НЕЗАБУТНІ ВРАЖЕННЯ ТА БЕЗДОГАННИЙ СЕРВІС",
      text: "Приватне обслуговування та індивідуалізація кожного моменту Вашого перебування",
    },
  ];

  return (
    <section className="bg-white">
      <div className="mx-auto w-full max-w-[1320px] px-6">
        <div className="grid grid-cols-1 lg:grid-cols-3">
          {items.map((it, idx) => (
            <div key={it.title} className="relative">
              <Feature icon={it.icon} title={it.title} text={it.text} />

              {/* vertical separators like in screenshot (only between columns on desktop) */}
              {idx !== items.length - 1 && (
                <span className="pointer-events-none absolute right-0 top-1/2 hidden h-[92px] -translate-y-1/2 bg-black/15 lg:block w-px" />
              )}
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
