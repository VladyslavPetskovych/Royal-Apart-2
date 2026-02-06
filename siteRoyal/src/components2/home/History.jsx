import React from "react";
import { useTranslation } from "react-i18next";
import historyImg1 from "../../assets/newDesign/home/history1.png";
import historyImg2 from "../../assets/newDesign/home/history2.png";
import { Link } from "react-router-dom";

function Tile({ img, top, bottom }) {
  return (
    <Link
      className="
        group relative w-full overflow-hidden bg-[#9b8f80]
        md:w-1/2
      "
      to="/service"
    >
      {/* ✅ mobile: tall tiles like screenshot, md+: square */}
      <div className="relative flex aspect-[9/11] items-center justify-center md:aspect-square">
        <img
          src={img}
          alt=""
          draggable="false"
          className="
            h-full w-full object-cover
            opacity-90
            transition-[transform,opacity]
            duration-[900ms]
            ease-[cubic-bezier(0.22,1,0.36,1)]
            group-hover:scale-50
            group-hover:opacity-60
          "
        />

        {/* TEXT */}
        <div className="pointer-events-none absolute inset-0 flex flex-col items-center justify-center text-white">
          <p className="font-oranienbaum text-[30px] tracking-[2px] sm:text-[34px] md:text-[26px] lg:text-[30px]">
            {top}
          </p>
          <p className="mt-2 font-finlandica text-[42px] font-semibold tracking-[6px] sm:text-[48px] md:text-[38px] lg:text-[44px]">
            {bottom}
          </p>
        </div>
      </div>
    </Link>
  );
}

export default function History() {
  const { t } = useTranslation();
  return (
    <div className="w-full">
      <div className="flex w-full flex-col md:flex-row">
        <Tile img={historyImg1} top={t("history_our")} bottom={t("history_service")} />
        <Tile img={historyImg2} top={t("history_our_plural")} bottom={t("history_apartments")} />
      </div>
    </div>
  );
}
