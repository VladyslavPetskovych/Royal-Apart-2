import React, { useEffect, useState } from "react";
import { Link, useLocation } from "react-router-dom";
import { useTranslation } from "react-i18next";
import logo from "../../assets/newDesign/logo/royal-apart-logo-vertical-short-white-cmyk.png";
import logo2 from "../../assets/newDesign/logo/royal-apart-logo-vertical-short-midnight-black-rgb-900px-w-72ppi.png";
import BurgerMenu from "./BurgerMenu/BurgerMenu";

function BurgerIcon({ open }) {
  return (
    <span className="relative block h-[18px] w-[24px]">
      <span
        className={[
          "absolute left-0 top-1/2 h-[2px] w-full rounded-full bg-current",
          "transition-transform duration-300 ease-out",
          open ? "translate-y-0 rotate-45" : "-translate-y-[7px] rotate-0",
        ].join(" ")}
      />
      <span
        className={[
          "absolute left-0 top-1/2 h-[2px] w-full rounded-full bg-current",
          "transition-all duration-200 ease-out",
          open ? "opacity-0 scale-x-0" : "opacity-100 scale-x-100",
        ].join(" ")}
      />
      <span
        className={[
          "absolute left-0 top-1/2 h-[2px] w-full rounded-full bg-current",
          "transition-transform duration-300 ease-out",
          open ? "translate-y-0 -rotate-45" : "translate-y-[7px] rotate-0",
        ].join(" ")}
      />
    </span>
  );
}

function Header() {
  const { t } = useTranslation();
  const location = useLocation();

  const isActiveRoute = (path) =>
    location.pathname === path || `${location.pathname}/` === path;

  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const [copied, setCopied] = useState(false);

  // ✅ NEW: detect scroll
  const [scrolled, setScrolled] = useState(false);

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 30);
    onScroll();
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  const toggleMobileMenu = () => setIsMobileMenuOpen((p) => !p);
  const closeMobileMenu = () => setIsMobileMenuOpen(false);

  const handleCopy = () => {
    navigator.clipboard.writeText("+38(067)677-73-30").then(() => {
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    });
  };

  // keep your open menu style exactly
  const headerOpenStyles = isMobileMenuOpen
    ? "bg-[#F6F0EA] text-[#1b1b1b] shadow-[0_10px_30px_rgba(0,0,0,0.08)]"
    : scrolled
    ? "bg-white text-[#1b1b1b] shadow-[0_6px_20px_rgba(0,0,0,0.08)]"
    : "bg-transparent text-brand-beige";

  // ✅ NEW: use black theme when scrolled (and menu closed)
  const closedText = scrolled ? "text-[#1b1b1b]" : "text-brand-beige";
  const closedHover = scrolled
    ? "hover:text-black/70"
    : "hover:text-brand-bordo";

  return (
    <header
      style={{ "--header-h": "64px" }}
      className={[
        "fixed inset-x-0 top-0 z-[10050] font-finlandica",
        "h-[var(--header-h)]",
        "transition-colors duration-500 ease-out",
        headerOpenStyles,
      ].join(" ")}
    >
      <nav className="h-full px-4 lg:px-6 py-3">
        <div className="mx-auto max-w-screen-xl relative flex h-full items-center">
          {/* LEFT */}
          <div className="flex items-center gap-3">
            <button
              onClick={toggleMobileMenu}
              className={[
                "lg:hidden p-2",
                "transition-colors duration-500 ease-out",
                isMobileMenuOpen ? "text-[#1b1b1b]" : closedText,
              ].join(" ")}
              aria-label={isMobileMenuOpen ? "Close menu" : "Open menu"}
            >
              <BurgerIcon open={isMobileMenuOpen} />
            </button>

            <button
              onClick={toggleMobileMenu}
              className={[
                "hidden lg:flex items-center gap-3 uppercase tracking-[0.25em] text-[15px] font-medium",
                "transition-colors duration-500 ease-out",
                isMobileMenuOpen
                  ? "text-[#1b1b1b] hover:opacity-80"
                  : `${closedText} ${closedHover}`,
              ].join(" ")}
            >
              <BurgerIcon open={isMobileMenuOpen} />
              <span>ЗНАЙТИ АПАРТАМЕНТИ</span>
            </button>
          </div>

          {/* CENTER LOGO (always centered) */}
          <Link
            to="/"
            className="absolute left-1/2 -translate-x-1/2 flex items-center justify-center"
          >
            <span className="relative block h-[32px] w-[120px] lg:h-[50px] lg:w-[160px]">
              <img
                src={logo}
                alt="Royal Apart"
                className={[
                  "absolute inset-0 h-full w-full object-contain",
                  "transition-opacity duration-500 ease-out",
                  isMobileMenuOpen || scrolled ? "opacity-0" : "opacity-100",
                ].join(" ")}
              />
              <img
                src={logo2}
                alt="Royal Apart"
                className={[
                  "absolute inset-0 h-full w-full object-contain",
                  "transition-opacity duration-500 ease-out",
                  isMobileMenuOpen || scrolled ? "opacity-100" : "opacity-0",
                ].join(" ")}
              />
            </span>
          </Link>

          {/* RIGHT */}
          <div className="ml-auto flex items-center">
            <div className="hidden lg:flex items-center gap-3 text-[15px] tracking-[0.18em] uppercase">
              <Link
                to="/rules"
                className={[
                  "transition-colors duration-500 ease-out",
                  isMobileMenuOpen
                    ? "text-[#1b1b1b] hover:opacity-80"
                    : `${closedHover}`,
                ].join(" ")}
              >
              ЗАБрОНЮВАТИ
              </Link>
            </div>

            <Link
              to="/book"
              className={[
                "lg:hidden h-[35px] px-3 flex items-center justify-center",
                "text-[11px] font-semibold uppercase tracking-[0.14em] leading-none rounded-none",
                "transition-all duration-500 ease-out",
                isMobileMenuOpen
                  ? "bg-[#7B2D2D] text-[#F6F0EA]"
                  : scrolled
                  ? "bg-[#1b1b1b] text-white hover:opacity-90"
                  : "bg-brand-bordo text-brand-beige hover:brightness-110",
              ].join(" ")}
            >
              ЗАБРОНЮВАТИ
            </Link>
          </div>
        </div>

        <BurgerMenu
          isOpen={isMobileMenuOpen}
          onClose={closeMobileMenu}
          isActiveRoute={isActiveRoute}
          t={t}
          copied={copied}
          onCopy={handleCopy}
        />
      </nav>
    </header>
  );
}

export default Header;
