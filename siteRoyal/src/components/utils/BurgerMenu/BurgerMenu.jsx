import React, { useEffect } from "react";
import DesktopBurgerMenu from "./BurgerMenuDesktop";
import MobileBurgerMenu from "./BurgerMenuMobile";

function BurgerMenu(props) {
  const { isOpen, onClose } = props;

  useEffect(() => {
    if (!isOpen) return;
    const onKeyDown = (e) => e.key === "Escape" && onClose?.();
    window.addEventListener("keydown", onKeyDown);
    return () => window.removeEventListener("keydown", onKeyDown);
  }, [isOpen, onClose]);

  useEffect(() => {
    if (!isOpen) return;
    const prev = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    return () => (document.body.style.overflow = prev);
  }, [isOpen]);

  if (!isOpen) return null;

  return (
    <>
      {/* MOBILE */}
      <div className="lg:hidden">
        <MobileBurgerMenu {...props} />
      </div>

      {/* DESKTOP */}
      <div className="hidden lg:block">
        <DesktopBurgerMenu {...props} />
      </div>
    </>
  );
}

export default BurgerMenu;
