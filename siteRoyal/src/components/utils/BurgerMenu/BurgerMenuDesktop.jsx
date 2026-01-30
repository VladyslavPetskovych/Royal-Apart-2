import React from "react";
import { Link } from "react-router-dom";
import menuPhoto from "../../../assets/newDesign/home/testFon.webp";
import LanguageSelector from "../LanguageSelector";

function DesktopBurgerMenu({ onClose, isActiveRoute, copied, onCopy }) {
  return (
    <div className="fixed inset-0 z-[9999] font-finlandica">
      {/* overlay (fade in) */}
      <div
        className="absolute inset-0 bg-black/60 opacity-0 animate-[fadeIn_.22s_ease-out_forwards]"
        onClick={onClose}
      />

      {/* panel (slide in) */}
      <div className="absolute left-0 top-0 h-full w-[92vw] max-w-[1280px] bg-[#F6F0EA] -translate-x-full animate-[slideInLeft_.28s_cubic-bezier(.2,.9,.2,1)_forwards] will-change-transform">
        <div className="h-full px-[72px] py-[44px]">
          <div className="grid h-full grid-cols-[420px_1fr] gap-[72px]">
            {/* LEFT */}
            <div className="flex h-full flex-col items-start text-left">
              {/* top row: close + language */}
              <div className="mb-[56px] flex w-full items-start justify-between">
                <button
                  type="button"
                  onClick={onClose}
                  aria-label="Close menu"
                  className="-ml-2 inline-flex h-16 w-16 items-center justify-center text-[56px] leading-none text-[#1b1b1b]/80 hover:text-[#1b1b1b]"
                >
                  ×
                </button>
              </div>

              {/* MAIN */}
              <div className="space-y-[10px]">
                <Link
                  to="/aparts"
                  onClick={onClose}
                  className={[
                    "block text-[26px] font-extrabold uppercase tracking-[0.04em] leading-[1.05]",
                    isActiveRoute?.("/aparts")
                      ? "text-[#1b1b1b] underline underline-offset-[6px] decoration-[#1b1b1b]"
                      : "text-[#1b1b1b] hover:underline hover:underline-offset-[6px]",
                  ].join(" ")}
                >
                  АПАРТАМЕНТИ
                </Link>

                <Link
                  to="/service"
                  onClick={onClose}
                  className={[
                    "block text-[26px] font-extrabold uppercase tracking-[0.04em] leading-[1.05]",
                    isActiveRoute?.("/")
                      ? "text-[#1b1b1b] underline underline-offset-[6px] decoration-[#1b1b1b]"
                      : "text-[#1b1b1b] hover:underline hover:underline-offset-[6px]",
                  ].join(" ")}
                >
                  НАШІ СЕРВІСИ
                </Link>

                <Link
                  to="/"
                  onClick={onClose}
                  className={[
                    "block text-[26px] font-extrabold uppercase tracking-[0.04em] leading-[1.05]",
                    isActiveRoute?.("/")
                      ? "text-[#1b1b1b] underline underline-offset-[6px] decoration-[#1b1b1b]"
                      : "text-[#1b1b1b] hover:underline hover:underline-offset-[6px]",
                  ].join(" ")}
                >
                  ПРО НАС
                </Link>
              </div>

              {/* SUB */}
              <div className="mt-[44px] space-y-[10px]">
                <Link
                  to="/"
                  onClick={onClose}
                  className={[
                    "block text-[14px] font-semibold uppercase tracking-[0.08em] leading-[1.2]",
                    isActiveRoute?.("/")
                      ? "text-[#1b1b1b]"
                      : "text-[#1b1b1b]/80 hover:text-[#1b1b1b]",
                  ].join(" ")}
                >
                  ВИГІДНІ ПРОПОЗИЦІЇ
                </Link>

                <Link
                  to="/rules"
                  onClick={onClose}
                  className={[
                    "block text-[14px] font-semibold uppercase tracking-[0.08em] leading-[1.2]",
                    isActiveRoute?.("/rules")
                      ? "text-[#1b1b1b]"
                      : "text-[#1b1b1b]/80 hover:text-[#1b1b1b]",
                  ].join(" ")}
                >
                  ДОПОМОГА ТА ПИТАННЯ
                </Link>

                <Link
                  to="/"
                  onClick={onClose}
                  className={[
                    "block text-[14px] font-semibold uppercase tracking-[0.08em] leading-[1.2]",
                    isActiveRoute?.("/")
                      ? "text-[#1b1b1b]"
                      : "text-[#1b1b1b]/80 hover:text-[#1b1b1b]",
                  ].join(" ")}
                >
                  БЛОГ
                </Link>

                <Link
                  to="/"
                  onClick={onClose}
                  className={[
                    "block text-[14px] font-semibold uppercase tracking-[0.08em] leading-[1.2]",
                    isActiveRoute?.("/")
                      ? "text-[#1b1b1b]"
                      : "text-[#1b1b1b]/80 hover:text-[#1b1b1b]",
                  ].join(" ")}
                >
                  КОНТАКТИ
                </Link>
              </div>

              {/* CONTACTS */}
              <div className="mt-[54px] space-y-[26px]">
                <div className="pt-1">
                  <LanguageSelector />
                </div>
                <div className="text-[12px] uppercase tracking-[0.12em] text-[#1b1b1b]/70">
                  <div className="font-bold">АДРЕСА:</div>
                  <div className="mt-[2px] font-medium text-[#1b1b1b]/75">
                    ВУЛ. ВЕСЕЛА 5
                  </div>
                </div>

                <div className="text-[12px] uppercase tracking-[0.12em] text-[#1b1b1b]/70">
                  <div className="font-bold">ТЕЛЕФОН:</div>
                  <button
                    type="button"
                    onClick={onCopy}
                    className="mt-[2px] block text-left font-medium text-[#1b1b1b]/75 hover:text-[#1b1b1b]"
                  >
                    +380 67 677 73 30
                    {copied ? (
                      <span className="ml-2 text-[11px] font-semibold text-[#1b1b1b]/45">
                        COPIED
                      </span>
                    ) : null}
                  </button>
                </div>
              </div>

              {/* TG */}
              <div className="mt-auto pt-[44px]">
                <div className="mb-[18px] max-w-[320px] text-[11px] font-semibold uppercase tracking-[0.1em] leading-[1.35] text-[#1b1b1b]/70">
                  З НАШИМ ТЕЛЕГРАМ-БОТОМ ВИ З ЛЕГКІСТЮ ЗМОЖЕТЕ ПІДІБРАТИ ОМРІЯНЕ
                  ЖИТЛО!
                </div>

                <a
                  href="https://t.me/RoyalApartBot"
                  target="_blank"
                  rel="noreferrer"
                  className="inline-flex items-center gap-3 border border-[#7B2D2D]/50 bg-transparent px-6 py-3 text-[13px] font-semibold text-[#7B2D2D] hover:border-[#7B2D2D] hover:bg-[#7B2D2D]/5"
                >
                  @RoyalApartBot{" "}
                  <span className="text-[18px] leading-none"></span>
                </a>
              </div>
            </div>

            {/* RIGHT IMAGE */}
            <div className="flex items-center justify-center">
              <div className="w-full max-w-[700px]">
                <img
                  src={menuPhoto}
                  alt="Menu visual"
                  draggable={false}
                  className="w-full object-cover"
                />
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* right click zone */}
      <button
        type="button"
        onClick={onClose}
        className="absolute right-0 top-0 h-full w-[8vw] min-w-[60px]"
        aria-label="Close on backdrop"
      />
    </div>
  );
}

export default DesktopBurgerMenu;
