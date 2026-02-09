import React from "react";
import { Link } from "react-router-dom";

// ✅ reuse your existing assets to keep the same style
import hero from "../assets/newDesign/AboutUs/Hero.webp";
import flowerLeft from "../assets/newDesign/home/flowerLeft.png";
import flowerRight from "../assets/newDesign/home/flowerRight.png";
import flowerRight2 from "../assets/newDesign/home/flowerRight2.png";
import justImage from "../assets/newDesign/AboutUs/JustImage1.jpg";

import { useSelector } from "react-redux";
import { selectLanguage } from "../redux/languageSlice";

function InfoItem({ label, children }) {
  return (
    <div>
      <p className="font-finlandica text-[11px] font-semibold uppercase tracking-[0.16em] text-[#1b1b1b]/60">
        {label}
      </p>
      <div className="mt-2 font-finlandica text-[14px] leading-[1.7] text-[#1b1b1b]/80">
        {children}
      </div>
    </div>
  );
}

export default function Contact() {
  const reduxLang = useSelector(selectLanguage); // "uk" | "en"
  const isEn = reduxLang === "en";
  return (
    <main className=" text-brand-black bg-brand-black pt-16">
      <div className=" bg-brand-beige">
        {/* HERO */}
        <section className="bg-brand-black">
          <div className="relative w-full overflow-hidden">
            <div className="h-[52vh] min-h-[320px] sm:h-[56vh] lg:h-[62vh]">
              <img
                src={hero}
                alt={isEn ? "Contacts" : "Контакти"}
                draggable={false}
                className="h-full w-full object-cover object-top"
              />
            </div>

            {/* overlay */}
            <div className="pointer-events-none absolute inset-0 bg-black/35" />

            {/* title */}
            <div className="absolute inset-0 flex items-center justify-center px-6">
              <div className="text-center">
                <h1
                  className="
                  font-oranienbaum font-extrabold
                  text-[34px] sm:text-[44px] md:text-[54px] lg:text-[64px]
                  tracking-[0.14em]
                  text-white
                  drop-shadow-[0_10px_22px_rgba(0,0,0,0.55)]
                  [text-shadow:0_2px_0_rgba(0,0,0,0.35),0_12px_28px_rgba(0,0,0,0.55)]
                "
                >
                  {isEn ? "CONTACTS" : "КОНТАКТИ"}
                </h1>
                <p
                  className="
                  mt-2 font-oranienbaum font-medium
                  text-[16px] sm:text-[20px] md:text-[24px]
                  tracking-[0.16em]
                  text-white/95
                  drop-shadow-[0_10px_22px_rgba(0,0,0,0.55)]
                  [text-shadow:0_2px_0_rgba(0,0,0,0.35),0_10px_22px_rgba(0,0,0,0.45)]
                "
                >
                  {isEn
                    ? "GET IN TOUCH ANYTIME"
                    : "ЗВ’ЯЖІТЬСЯ З НАМИ У БУДЬ-ЯКИЙ ЧАС"}
                </p>
              </div>
            </div>
          </div>
        </section>

        {/* CONTENT */}
        <section className="relative overflow-hidden">
          {/* flowers behind content */}
          <img
            src={flowerLeft}
            alt=""
            draggable={false}
            className="pointer-events-none select-none absolute -left-16 top-10 w-[240px] opacity-80 sm:-left-10 sm:w-[280px] lg:top-16"
            style={{ zIndex: 0 }}
          />
          <img
            src={flowerRight}
            alt=""
            draggable={false}
            className="pointer-events-none select-none absolute -right-14 top-6 w-[280px] opacity-80 sm:-right-10 sm:w-[320px] lg:top-10"
            style={{ zIndex: 0 }}
          />

          <div className="relative mx-auto w-full max-w-[1320px] px-6 py-14 lg:py-20">
            {/* top title block */}
            <div className="text-center">
              <h2 className="font-oranienbaum text-[32px] leading-[1.08] text-[#1b1b1b] md:text-[44px]">
                {isEn ? "WE ARE ALWAYS IN TOUCH" : "МИ ЗАВЖДИ НА ЗВ’ЯЗКУ"}
              </h2>
              <p className="mx-auto mt-4 max-w-[780px] font-finlandica text-[12px] leading-[1.75] text-[#1b1b1b]/60 md:text-[13px]">
                {isEn
                  ? "Message us or give us a call — we’ll help with booking, check-in, extra services, and any questions during your stay."
                  : "Напишіть нам у месенджер або зателефонуйте — допоможемо з бронюванням, заселенням, додатковими сервісами та будь-якими питаннями під час перебування."}
              </p>
            </div>

            {/* grid */}
            <div className="mt-10 grid gap-10 lg:mt-14 lg:grid-cols-2 lg:gap-14">
              {/* LEFT: CONTACT CARD */}
              <div
                className="
                relative
                rounded-[6px]
                border border-black/10
                bg-white/70
                p-7 sm:p-9
                shadow-[0_18px_50px_rgba(0,0,0,0.10)]
                backdrop-blur-[2px]
              "
              >
                {/* subtle corner flower */}
                <img
                  src={flowerRight2}
                  alt=""
                  draggable={false}
                  className="pointer-events-none select-none absolute -right-10 -top-10 w-[200px] opacity-30 sm:w-[240px]"
                />

                <h3 className="font-oranienbaum text-[26px] leading-[1.15] text-[#1b1b1b] md:text-[30px]">
                  {isEn ? "Contact Information" : "Контактна інформація"}
                </h3>

                <div className="mt-7 grid gap-6 sm:grid-cols-2">
                  <InfoItem label={isEn ? "Address" : "Адреса"}>
                    <p>{isEn ? "Lviv, Ukraine" : "Львів, Україна"}</p>
                    <p className="text-[#1b1b1b]/55">
                      {isEn ? "Vesela Street, 5" : "вул. Весела, 5"}
                    </p>
                  </InfoItem>

                  <InfoItem label={isEn ? "Phone" : "Телефон"}>
                    <a
                      href="tel:+380676777330"
                      className="hover:text-brand-bordo transition-colors"
                    >
                      +380 67 677 73 30
                    </a>
                  </InfoItem>

                  <InfoItem label="Email">
                    <a
                      href="mailto:royal.apartments@ukr.net"
                      className="hover:text-brand-bordo transition-colors"
                    >
                      royal.apartments@ukr.net
                    </a>
                  </InfoItem>

                  <InfoItem label={isEn ? "Schedule" : "Графік"}>
                    <p>{isEn ? "Support: 24/7" : "Підтримка: 24/7"}</p>
                  </InfoItem>

                  {/* FULL WIDTH IMAGE */}
                  <div className="col-span-full">
                    <div className="overflow-hidden rounded-[6px]">
                      <img
                        src={justImage}
                        alt="apartment"
                        className="
                        w-full
                        h-[260px] sm:h-[320px] md:h-[380px]
                        object-cover
                      "
                        draggable={false}
                      />
                    </div>
                  </div>
                </div>

                {/* buttons */}
                <div className="mt-8 flex flex-col gap-3 sm:flex-row sm:flex-wrap">
                  <Link
                    to="/aparts"
                    className="
                    group inline-flex items-center justify-center gap-4
                    bg-brand-bordo px-7 py-4
                    font-finlandica text-[13px] font-medium
                    text-brand-beige
                    shadow-[0_12px_28px_rgba(0,0,0,0.12)]
                    transition-transform duration-200
                    hover:translate-y-[-1px]
                  "
                  >
                    {isEn ? "View Apartments" : "Переглянути Апартаменти"}
                    <span className="text-[18px] leading-none transition-transform duration-200 group-hover:translate-x-[2px]">
                      →
                    </span>
                  </Link>

                  <a
                    href="https://t.me/RoyalApartBot"
                    target="_blank"
                    rel="noreferrer"
                    className="
                    group inline-flex items-center justify-center gap-4
                    border border-brand-bordo/40
                    bg-white/60 px-7 py-4
                    font-finlandica text-[13px] font-semibold
                    text-brand-bordo
                    transition-all duration-200
                    hover:bg-white
                    hover:border-brand-bordo/70
                    hover:shadow-[0_14px_34px_rgba(0,0,0,0.10)]
                  "
                  >
                    @RoyalApartBot
                    <span className="text-[18px] leading-none transition-transform duration-200 group-hover:translate-x-[2px]">
                      →
                    </span>
                  </a>
                </div>

                <p className="mt-6 font-finlandica text-[12px] leading-[1.7] text-[#1b1b1b]/55">
                  {isEn
                    ? "We can also help with: transfers, breakfasts, cleaning, and additional services during your stay."
                    : "Також можемо допомогти з: трансфером, сніданками, прибиранням, додатковими послугами під час проживання."}
                </p>
              </div>

              {/* RIGHT: MAP + QUICK CONTACT */}
              <div className="grid gap-10">
                {/* map */}
                <div
                  className="
                  overflow-hidden rounded-[6px]
                  border border-black/10
                  bg-white/60
                  shadow-[0_18px_50px_rgba(0,0,0,0.10)]
                "
                >
                  <div className="px-6 pt-6">
                    <h3 className="font-oranienbaum text-[26px] leading-[1.15] text-[#1b1b1b] md:text-[30px]">
                      {isEn ? "How to find us" : "Як нас знайти"}
                    </h3>
                  </div>

                  <div className="mt-5 h-[320px] w-full bg-black/5 sm:h-[360px]">
                    <iframe
                      title="map"
                      className="h-full w-full"
                      loading="lazy"
                      referrerPolicy="no-referrer-when-downgrade"
                      src="https://www.google.com/maps/embed?pb=!1m18!1m12!1m3!1d2572.7798208974436!2d24.026981499999998!3d49.846594499999995!2m3!1f0!2f0!3f0!3m2!1i1024!2i768!4f13.1!3m3!1m2!1s0x473add0ccfd9e63f%3A0xc15e4a8be7be479c!2z0LLRg9C70LjRhtGPINCS0LXRgdC10LvQsCwgNSwg0JvRjNCy0ZbQsiwg0JvRjNCy0ZbQstGB0YzQutCwINC-0LHQu9Cw0YHRgtGMLCA3OTAwMA!5e0!3m2!1suk!2sua!4v1770294420762!5m2!1suk!2sua"
                    />
                  </div>
                </div>

                {/* quick contact */}
                <div
                  className="
                  rounded-[6px]
                  border border-black/10
                  bg-white/70
                  p-7 sm:p-9
                  shadow-[0_18px_50px_rgba(0,0,0,0.10)]
                "
                >
                  <h3 className="font-oranienbaum text-[26px] leading-[1.15] text-[#1b1b1b] md:text-[30px]">
                    {isEn ? "Quick contact" : "Швидкий зв’язок"}
                  </h3>

                  <p className="mt-4 font-finlandica text-[12px] leading-[1.7] text-[#1b1b1b]/60">
                    {isEn
                      ? "Choose a convenient option — we respond quickly."
                      : "Оберіть зручний спосіб — ми відповідаємо швидко."}
                  </p>

                  <div className="mt-6 grid gap-3 sm:grid-cols-2">
                    {/* PHONE */}
                    <a
                      href="tel:+380676777330"
                      className="
                      group inline-flex items-center justify-between gap-4
                      rounded-[6px]
                      border border-black/10 bg-white/70
                      px-5 py-4
                      font-finlandica text-[13px] font-semibold
                      text-[#1b1b1b]/80
                      transition-all duration-200
                      hover:border-black/20 hover:bg-white
                      hover:shadow-[0_14px_34px_rgba(0,0,0,0.10)]
                    "
                    >
                      {isEn ? "Call" : "Зателефонувати"}
                      <span className="text-[18px] leading-none transition-transform duration-200 group-hover:translate-x-[2px]">
                        →
                      </span>
                    </a>

                    {/* TELEGRAM */}
                    <a
                      href="https://t.me/Royalreservation"
                      target="_blank"
                      rel="noreferrer"
                      className="
                      group inline-flex items-center justify-between gap-4
                      rounded-[6px]
                      border border-brand-bordo/30 bg-white/60
                      px-5 py-4
                      font-finlandica text-[13px] font-semibold
                      text-brand-bordo
                      transition-all duration-200
                      hover:border-brand-bordo/60 hover:bg-white
                      hover:shadow-[0_14px_34px_rgba(0,0,0,0.10)]
                    "
                    >
                      Telegram
                      <span className="text-[18px] leading-none transition-transform duration-200 group-hover:translate-x-[2px]">
                        →
                      </span>
                    </a>

                    {/* WHATSAPP */}
                    <a
                      href="https://wa.me/380676777330"
                      target="_blank"
                      rel="noreferrer"
                      className="
                      group inline-flex items-center justify-between gap-4
                      rounded-[6px]
                      border border-black/10 bg-white/70
                      px-5 py-4
                      font-finlandica text-[13px] font-semibold
                      text-[#1b6b1b]/80
                      transition-all duration-200
                      hover:border-black/20 hover:bg-white
                      hover:shadow-[0_14px_34px_rgba(0,0,0,0.10)]
                    "
                    >
                      WhatsApp
                      <span className="text-[18px] leading-none transition-transform duration-200 group-hover:translate-x-[2px]">
                        →
                      </span>
                    </a>

                    {/* VIBER */}
                    <a
                      href="viber://chat?number=380676777330"
                      className="
                      group inline-flex items-center justify-between gap-4
                      rounded-[6px]
                      border border-[#7360F2]/30 bg-white/60
                      px-5 py-4
                      font-finlandica text-[13px] font-semibold
                      text-[#7360F2]
                      transition-all duration-200
                      hover:border-[#7360F2]/60 hover:bg-white
                      hover:shadow-[0_14px_34px_rgba(0,0,0,0.10)]
                    "
                    >
                      Viber
                      <span className="text-[18px] leading-none transition-transform duration-200 group-hover:translate-x-[2px]">
                        →
                      </span>
                    </a>
                  </div>
                </div>
              </div>
            </div>

            <div className="mt-14 h-[1px] w-full bg-black/10" />
          </div>
        </section>
      </div>
    </main>
  );
}
