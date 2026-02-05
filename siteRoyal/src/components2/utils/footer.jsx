import React from "react";
import { Link } from "react-router-dom";
import blackLogo from "../../assets/newDesign/logo/royal-apart-logo-vertical-short-midnight-black-rgb-900px-w-72ppi.png";

function IconFacebook(props) {
  return (
    <svg viewBox="0 0 24 24" fill="currentColor" aria-hidden="true" {...props}>
      <path d="M13.5 22v-8.2h2.8l.4-3.2h-3.2V8.6c0-.9.3-1.6 1.6-1.6h1.7V4.2c-.3 0-1.3-.1-2.5-.1-2.5 0-4.2 1.5-4.2 4.2v2.3H7.5v3.2H10V22h3.5z" />
    </svg>
  );
}

function IconInstagram(props) {
  return (
    <svg viewBox="0 0 24 24" fill="currentColor" aria-hidden="true" {...props}>
      <path d="M7.8 2h8.4A5.8 5.8 0 0 1 22 7.8v8.4A5.8 5.8 0 0 1 16.2 22H7.8A5.8 5.8 0 0 1 2 16.2V7.8A5.8 5.8 0 0 1 7.8 2zm0 2A3.8 3.8 0 0 0 4 7.8v8.4A3.8 3.8 0 0 0 7.8 20h8.4A3.8 3.8 0 0 0 20 16.2V7.8A3.8 3.8 0 0 0 16.2 4H7.8z" />
      <path d="M12 7a5 5 0 1 1 0 10 5 5 0 0 1 0-10zm0 2a3 3 0 1 0 0 6 3 3 0 0 0 0-6z" />
      <path d="M17.5 6.2a1.1 1.1 0 1 1 0 2.2 1.1 1.1 0 0 1 0-2.2z" />
    </svg>
  );
}

function IconWhatsApp(props) {
  return (
    <svg viewBox="0 0 24 24" fill="currentColor" aria-hidden="true" {...props}>
      <path d="M20.52 3.48A11.91 11.91 0 0 0 12 0C5.38 0 .01 5.37.01 12c0 2.11.55 4.17 1.6 6L0 24l6.2-1.62A11.94 11.94 0 0 0 12 24c6.62 0 11.99-5.37 11.99-12 0-3.2-1.25-6.2-3.47-8.52ZM12 21.82c-1.86 0-3.68-.5-5.27-1.45l-.38-.22-3.68.96.98-3.59-.25-.37A9.83 9.83 0 0 1 2.18 12C2.18 6.57 6.57 2.18 12 2.18c2.62 0 5.08 1.02 6.94 2.88A9.75 9.75 0 0 1 21.82 12c0 5.43-4.39 9.82-9.82 9.82Zm5.67-7.35c-.31-.16-1.86-.92-2.15-1.02-.29-.11-.5-.16-.71.16-.21.31-.81 1.02-.99 1.23-.18.2-.36.23-.67.08-.31-.16-1.3-.48-2.48-1.54-.92-.82-1.54-1.83-1.72-2.14-.18-.31-.02-.48.14-.64.14-.14.31-.36.47-.54.16-.18.21-.31.31-.52.1-.21.05-.39-.03-.54-.08-.16-.71-1.72-.97-2.36-.26-.62-.52-.54-.71-.55h-.6c-.21 0-.55.08-.84.39-.29.31-1.1 1.07-1.1 2.62 0 1.54 1.13 3.03 1.29 3.24.16.21 2.21 3.38 5.35 4.74.75.33 1.34.52 1.79.66.75.24 1.45.21 1.99.13.61-.09 1.86-.76 2.12-1.49.26-.73.26-1.36.18-1.49-.08-.13-.29-.21-.6-.37Z" />
    </svg>
  );
}

function IconTelegram(props) {
  return (
    <svg viewBox="0 0 24 24" fill="currentColor" aria-hidden="true" {...props}>
      <path d="M21.8 4.3 3.4 11.6c-1.3.5-1.3 1.3-.2 1.7l4.7 1.5 1.8 5.6c.2.6.1.8.8.8.5 0 .7-.2 1-.5l2.3-2.2 4.7 3.4c.9.5 1.5.2 1.7-.8L23 5.6c.3-1.3-.5-1.8-1.2-1.3zM9 14.3l10.6-6.7c.5-.3 1-.1.6.3L11.1 16l-.4 3.9L9 14.3z" />
    </svg>
  );
}

function IconArrow(props) {
  return (
    <svg viewBox="0 0 24 24" fill="none" aria-hidden="true" {...props}>
      <path
        d="M5 12h12"
        stroke="currentColor"
        strokeWidth="2"
        strokeLinecap="round"
      />
      <path
        d="M13 6l6 6-6 6"
        stroke="currentColor"
        strokeWidth="2"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  );
}

export default function Footer() {
  return (
    <footer className="bg-[#EDE6D8] text-black">
      <div className="mx-auto w-full max-w-[1320px] px-6">
        {/* TOP (desktop unchanged, mobile rearranged) */}
        <div className="grid grid-cols-1 gap-10 pb-10 pt-10 lg:grid-cols-[360px_1fr_1fr_420px] lg:gap-6 lg:pb-14 lg:pt-12">
          {/* brand */}
          <div className="order-1 lg:order-none">
            <div className="flex items-center gap-3">
              <img src={blackLogo} className="h-16" alt="" />
            </div>

            <div className="mt-6 flex items-center gap-5 lg:mt-14">
              <a
                href="https://t.me/+380676777330"
                target="_blank"
                rel="noreferrer"
                aria-label="Telegram"
                className="text-black/85 transition-opacity hover:opacity-70"
              >
                <IconTelegram className="h-7 w-7" />
              </a>

              <a
                href="https://www.instagram.com/royal.apart"
                aria-label="Instagram"
                className="text-black/85 transition-opacity hover:opacity-70"
              >
                <IconInstagram className="h-7 w-7" />
              </a>
              <a
                href="https://wa.me/380676777330"
                target="_blank"
                rel="noreferrer"
                aria-label="WhatsApp"
                className="text-black/85 transition-opacity hover:opacity-70"
              >
                <IconWhatsApp className="h-7 w-7" />
              </a>
            </div>
          </div>

          <div className="order-2 grid grid-cols-2 gap-x-10 gap-y-10 lg:order-none lg:contents">
            {/* links col 1 */}
            <div className="font-finlandica flex items-start flex-col">
              <div className="text-[14px] font-semibold uppercase tracking-[0.14em] text-black/85">
                ОСНОВНЕ
              </div>
              <nav className="mt-7 flex flex-col gap-4 text-[15px] items-start text-start text-black/65">
                <Link className="hover:text-black" to="/">
                  ГОЛОВНА
                </Link>
                <Link className="hover:text-black" to="/aparts">
                  АПАРТАМЕНТИ
                </Link>
                <Link className="hover:text-black" to="/">
                  ВИГІДНІ ПРОПОЗИЦІЇ
                </Link>
                <Link className="hover:text-black" to="/">
                  СЕРВІСИ
                </Link>
              </nav>
            </div>

            {/* links col 2 */}
            <div className="font-finlandica flex items-start flex-col">
              <div className="text-[14px] font-semibold uppercase tracking-[0.14em] text-black/85">
                ІНШЕ
              </div>
              <nav className="mt-7 flex flex-col gap-4 text-[15px] text-start items-start text-black/65">
                <Link className="hover:text-black" to="/rules">
                  КОНТАКТИ
                </Link>
                <Link className="hover:text-black" to="/">
                  ДОПОМОГА
                </Link>
                <Link className="hover:text-black" to="/">
                  БЛОГ
                </Link>
                {/* screenshot shows contacts twice; if you need it: */}
                {/* <Link className="hover:text-black" to="/contacts">КОНТАКТИ</Link> */}
              </nav>
            </div>
          </div>

          {/* subscribe */}
          <div className="order-3 font-finlandica lg:order-none">
            <div className="text-[14px] font-semibold uppercase tracking-[0.14em] text-black/85">
              БУДЬТЕ НА ЗВ&apos;ЯЗКУ
            </div>

            <p className="mt-4 max-w-[460px] text-[15px] leading-[1.45] text-black/55">
              Підпишіться, щоб бути в курсі наших останніх новин
            </p>

            <div className="mt-8 lg:mt-10">
              <div className="flex items-end gap-4 border-b border-black/25 pb-3">
                <input
                  type="email"
                  placeholder="Email"
                  className="w-full bg-transparent text-[15px] text-black/80 placeholder:text-black/45 focus:outline-none"
                />
                <button
                  type="button"
                  className="flex items-center gap-3 text-[14px] font-semibold uppercase tracking-[0.14em] text-black/85 hover:text-black"
                >
                  НАДІСЛАТИ <IconArrow className="h-5 w-5" />
                </button>
              </div>
            </div>
          </div>
        </div>

        {/* MIDDLE */}
        <div className="flex flex-col gap-10 pb-10 lg:flex-row lg:items-center lg:justify-between lg:pb-14">
          {/* telegram bot */}
          <div className="font-finlandica flex items-start flex-col">
            <div className="text-[14px] font-semibold uppercase tracking-[0.14em] text-black/85">
              З НАШИМ ТЕЛЕГРАМ-БОТОМ ВИ З ЛЕГКІСТЮ ЗМОЖЕТЕ ПІДІБРАТИ ОМРІЯНЕ
              ЖИТЛО!
            </div>

            <a
              href="https://t.me/RoyalApartBot"
              target="_blank"
              rel="noreferrer"
              className="mt-5 inline-flex items-center justify-start gap-4 border border-[#8B3A3A] px-6 py-4 text-[#8B3A3A]"
            >
              <span className="font-finlandica text-[16px] font-semibold">
                @RoyalApartBot
              </span>
              <IconTelegram className="h-6 w-6" />
            </a>
          </div>

          {/* ✅ MOBILE: show Booking + list badge like screenshot */}
          <div className="flex items-center gap-10 lg:gap-14">
            <Link
              className="font-finlandica text-[34px] font-semibold text-black/85 lg:text-[36px]"
              to="https://www.booking.com/hotel/ua/royal-apartament-on-voloshyna-2.uk.html?label=gog235jc-10CAso6QFCH3JveWFsLWFwYXJ0YW1lbnQtb24tdm9sb3NoeW5hLTJIM1gDaOkBiAEBmAEzuAEXyAEV2AED6AEB-AEBiAIBqAIBuALt_p3LBsACAdICJDBhMjUzNmUyLTBhNjktNDA3Zi04NWE3LWYyZmE5ZDIxN2M1N9gCAeACAQ&sid=7c9e55ff490d2548d149307e6a345d64&aid=356980&ucfs=1&arphpl=1&checkin=2026-01-14&checkout=2026-01-15&dest_id=-1045268&dest_type=city&group_adults=2&req_adults=2&no_rooms=1&group_children=0&req_children=0&hpos=1&hapos=1&sr_order=popularity&srpvid=e86f2a707a4652ecf861d6d4768885e9&srepoch=1768390518&soh=1&from=searchresults#no_availability_msg"
            >
              Booking<span className="font-normal">.com</span>
            </Link>
          </div>
        </div>

        {/* BOTTOM (mobile stacked like screenshot) */}
        <div className="flex flex-col items-start gap-4 border-t border-black/10 py-8 lg:flex-row lg:items-center lg:justify-between lg:gap-6">
          <div className="flex flex-col gap-3 font-finlandica text-[14px] text-black/55 lg:flex-row lg:flex-wrap lg:gap-x-10 lg:gap-y-3">
            <Link className="hover:text-black" to="/privacy-policy">
              Політика Конфіденційності
            </Link>
            <Link className="hover:text-black" to="/terms-and-conditions">
              Умови Користування
            </Link>
          </div>

          <div className="font-finlandica text-[14px] text-black/45">
            © 2025 Royal Apart. All Rights Reserved
          </div>
        </div>
      </div>
    </footer>
  );
}
