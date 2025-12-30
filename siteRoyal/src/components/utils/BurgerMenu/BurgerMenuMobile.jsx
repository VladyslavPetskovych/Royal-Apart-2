import React, { useEffect } from "react";
import { Link } from "react-router-dom";
import LanguageSelector from "../LanguageSelector";

function MobileBurgerMenu({ onClose, isActiveRoute, copied, onCopy }) {
  useEffect(() => {
    const onKeyDown = (e) => e.key === "Escape" && onClose?.();
    window.addEventListener("keydown", onKeyDown);
    return () => window.removeEventListener("keydown", onKeyDown);
  }, [onClose]);

  return (
    <div className="fixed inset-x-0 bottom-0 top-[64px] z-[40] font-finlandica">
      <div
        className="absolute inset-0 bg-black/60 opacity-0 animate-[fadeIn_.22s_ease-out_forwards]"
        onClick={onClose}
      />

      <div className="absolute left-0 top-0 h-full w-[82vw] max-w-[380px] bg-[#F6F0EA] -translate-x-full animate-[slideInLeft_.28s_cubic-bezier(.2,.9,.2,1)_forwards] will-change-transform">
        <div className="h-full px-6 pt-8 pb-6">
          <div className="h-full flex flex-col items-start">
            <div className="w-full">
              <div className="space-y-1">
                {[
                  { to: "/aparts", label: "АПАРТАМЕНТИ" },
                  { to: "/", label: "НАШІ СЕРВІСИ" },
                  { to: "/", label: "ПРО НАС" },
                ].map((item) => (
                  <Link
                    key={item.to}
                    to={item.to}
                    onClick={onClose}
                    className={[
                      "block text-left text-[22px] font-extrabold uppercase leading-[1.08] tracking-[0.02em]",
                      isActiveRoute?.(item.to)
                        ? "text-[#1b1b1b]"
                        : "text-[#1b1b1b] hover:opacity-80",
                    ].join(" ")}
                  >
                    {item.label}
                  </Link>
                ))}
              </div>

              <div className="mt-5 space-y-1.5">
                {[
                  { to: "/", label: "ВИГІДНІ ПРОПОЗИЦІЇ" },
                  { to: "/rules", label: "ДОПОМОГА ТА ПИТАННЯ" },
                  { to: "/", label: "БЛОГ" },
                  { to: "/contacts", label: "КОНТАКТИ" },
                ].map((item) => (
                  <Link
                    key={item.to}
                    to={item.to}
                    onClick={onClose}
                    className="block text-left text-[12px] font-semibold uppercase tracking-[0.1em] text-[#1b1b1b]/85"
                  >
                    {item.label}
                  </Link>
                ))}
              </div>
            </div>

            <div className="mt-6 w-full space-y-4">
              <div className="text-left text-[11px] uppercase tracking-[0.12em] text-[#1b1b1b]/70">
                <div className="font-bold">АДРЕСА:</div>
                <div className="mt-1 font-medium text-[#1b1b1b]/80">
                  ВУЛ. ВЕСЕЛА 5
                </div>
              </div>

              <div className="text-left text-[11px] uppercase tracking-[0.12em] text-[#1b1b1b]/70">
                <div className="font-bold">ТЕЛЕФОН:</div>
                <button
                  type="button"
                  onClick={onCopy}
                  className="mt-1 block text-left font-medium normal-case tracking-normal text-[#1b1b1b]/80"
                >
                  +380 67 677 73 30
                  {copied ? (
                    <span className="ml-2 text-[10px] font-semibold text-[#1b1b1b]/45">
                      COPIED
                    </span>
                  ) : null}
                </button>
              </div>

              <div className="flex items-center justify-start gap-6 text-[#1b1b1b]">
                <a
                  href="https://t.me/RoyalApartBot"
                  target="_blank"
                  rel="noreferrer"
                  className="inline-flex items-center gap-2 text-[11px] font-semibold uppercase tracking-[0.08em]"
                >
                  <span className="text-[16px]">✈</span> Telegram
                </a>

                <a
                  href="https://wa.me/380676777330"
                  target="_blank"
                  rel="noreferrer"
                  className="inline-flex items-center gap-2 text-[11px] font-semibold uppercase tracking-[0.08em]"
                >
                  <span className="text-[16px]">☻</span> WhatsApp
                </a>
                <div className="mt-0 w-full flex justify-end">
                  <LanguageSelector />
                </div>
              </div>
            </div>

            <div className="mt-[80px] w-full pt-2">
              <div className="mb-3 max-w-[280px] text-left text-[10px] font-semibold uppercase tracking-[0.1em] leading-[1.35] text-[#1b1b1b]/70">
                З НАШИМ ТЕЛЕГРАМ-БОТОМ ВИ З ЛЕГКІСТЮ ЗМОЖЕТЕ ПІДІБРАТИ ОМРІЯНЕ
                ЖИТЛО!
              </div>

              <a
                href="https://t.me/RoyalApartBot"
                target="_blank"
                rel="noreferrer"
                className="inline-flex items-center justify-between gap-3 border border-[#7B2D2D]/60 px-4 py-2.5 text-[12px] font-semibold text-[#7B2D2D]"
              >
                @RoyalApartBot{" "}
             
              </a>
            </div>
          </div>
        </div>
      </div>

      <button
        type="button"
        onClick={onClose}
        className="absolute right-0 top-0 h-full w-[18vw] min-w-[56px]"
        aria-label="Close on backdrop"
      />
    </div>
  );
}

export default MobileBurgerMenu;
