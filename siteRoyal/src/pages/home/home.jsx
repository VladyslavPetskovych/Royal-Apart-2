import React from "react";

import MainPageContent from "./mainPageContent";
import Courosel from "./courosel";
import { useTranslation } from "react-i18next";
import SliderCategories from "./home/sliderCategories";
import WhyRoyal from "./whyRoyal";
import Jaccuzzi from "./jaccuzzi";
import "../../../src/hideScrollbar.css";
import SEO from "../../components/utils/SEO";
import Sale from "./home/saleButton";
import MiniHotelButton from "../../components/buttons/miniHotelButton";

function MainPageBody() {
  const { t } = useTranslation();

  return (
    <>
      <SEO />

      <MainPageContent />

      <Sale />
  
      <Courosel />
      <WhyRoyal />
      <MiniHotelButton />
      <Jaccuzzi />

      <div className="w-[94vw] h-[330px] px-8 lg:h-[500px] mx-auto">
        <SliderCategories />
      </div>

      <div className="left-0 top-0 w-full h-6 -mt-1">
        <div className="bg-gradient-to-b from-black to-back w-full h-full transition-all duration-500"></div>
      </div>
    </>
  );
}

export default MainPageBody;
