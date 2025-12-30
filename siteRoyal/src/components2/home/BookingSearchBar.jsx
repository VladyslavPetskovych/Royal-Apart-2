import React from "react";

function Field({ label, onClick, className = "" }) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={[
        "group flex h-full flex-1 items-center px-6 text-left",
        "text-[18px] font-medium font-finlandica text-brand-black/60",
        "transition-colors hover:text-brand-black",
        "focus:outline-none focus-visible:ring-2 focus-visible:ring-brand-bordo/40",
        className,
      ].join(" ")}
    >
      <span className="truncate">{label}</span>
    </button>
  );
}

function Divider() {
  return <div className="h-[44px] w-px bg-brand-black/30" />;
}

function MobileField({ label, onClick, align = "left" }) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={[
        "h-full w-full px-4",
        "font-finlandica font-medium text-brand-black/60",
        "text-[16px] sm:text-[18px]",
        "truncate",
        align === "center" ? "text-center" : "text-left",
        "transition-colors hover:text-brand-black",
        "focus:outline-none focus-visible:ring-2 focus-visible:ring-brand-bordo/40",
      ].join(" ")}
    >
      {label}
    </button>
  );
}

export default function BookingSearchBar({
  onApartmentsClick,
  onCheckInClick,
  onCheckOutClick,
  onGuestsClick,
  onSubmit,
}) {
  return (
    <div className="w-full px-8 sm:px-6 lg:px-16">
      <div className="mx-auto w-full max-w-[1400px]">
        <div
          className="
            w-full overflow-hidden rounded-sm bg-white
            shadow-[0_12px_30px_rgba(0,0,0,0.18)]
          "
        >
          {/* ===== MOBILE (like on screenshot) ===== */}
          <div className="block lg:hidden">
            {/* Top white row: 3 fields + dividers (5 columns) */}
            <div className="grid min-h-[50px] grid-cols-[1fr_1px_1fr_1px_1fr] items-stretch bg-white">
              <MobileField
                label="Усі Апартаменти"
                onClick={onApartmentsClick}
              />
              <div className="h-full w-px bg-brand-black/30" />
              <MobileField
                label="Перевірити"
                onClick={onCheckInClick}
                align="center"
              />
              <div className="h-full w-px bg-brand-black/30" />
              <MobileField
                label="2 Особи"
                onClick={onGuestsClick}
                align="center"
              />
            </div>

            {/* Bottom button (centered text + arrow like screenshot) */}
            <button
              type="button"
              onClick={onSubmit}
              className="
                relative flex min-h-[50px] w-full items-center justify-center
                bg-brand-beigeDark px-6
                font-finlandica text-[18px] font-medium text-brand-black
                transition hover:brightness-95
                focus:outline-none focus-visible:ring-2 focus-visible:ring-brand-bordo/40
              "
            >
              <span className="whitespace-nowrap">Знайти Апартаменти</span>

              <span className="absolute right-6 inline-flex h-10 w-10 items-center justify-center">
                <svg
                  viewBox="0 0 24 24"
                  className="h-7 w-7"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="2.2"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                >
                  <path d="M5 12h14" />
                  <path d="M13 5l7 7-7 7" />
                </svg>
              </span>
            </button>
          </div>

          {/* ===== DESKTOP (keep your current layout) ===== */}
          <div className="hidden lg:flex w-full items-stretch">
            <div className="flex min-h-[84px] flex-1 items-center">
              <Field label="Усі Апартаменти" onClick={onApartmentsClick} />
              <Divider />
              <Field label="Дата Заселення" onClick={onCheckInClick} />
              <Divider />
              <Field label="Дата Виселення" onClick={onCheckOutClick} />
              <Divider />
              <Field label="2 Особи" onClick={onGuestsClick} />
            </div>

            <button
              type="button"
              onClick={onSubmit}
              className="
                group flex min-h-[84px] w-[24%] min-w-[260px]
                items-center justify-between
                bg-brand-beigeDark px-10
                text-[18px] font-medium text-brand-black font-finlandica
                transition hover:brightness-95
                focus:outline-none focus-visible:ring-2 focus-visible:ring-brand-bordo/40
              "
            >
              <span className="whitespace-nowrap">Знайти Апартаменти</span>

              <span className="ml-6 inline-flex h-10 w-10 items-center justify-center">
                <svg
                  viewBox="0 0 24 24"
                  className="h-7 w-7 transition-transform duration-200 group-hover:translate-x-1"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="2.2"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                >
                  <path d="M5 12h14" />
                  <path d="M13 5l7 7-7 7" />
                </svg>
              </span>
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
