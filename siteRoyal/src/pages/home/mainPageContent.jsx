import React from "react";
import { useTranslation } from "react-i18next";
import BookingSearchBar from "../../components2/home/BookingSearchBar";
import HeroFeatures from "../../components2/home/HeroFeatures";
import fon from "../../assets/newDesign/home/mainFon.webp";

function MainPageContent() {
  const { t } = useTranslation();

  return (
    <div className="h-screen md:h-[85vh]">
      <div
        className="text-textW relative h-full overflow-hidden bg-cover bg-center bg-no-repeat text-center"
        style={{
          backgroundImage: `url(${fon})`,
        }}
      >
        <div
          className="z-1 h-screen md:h-[85vh] w-screen overflow-hidden bg-fixed"
          style={{ backgroundColor: "rgba(0, 0, 0, 0.5)" }}
        >
          <div className="flex h-full flex-col justify-center items-center">
            <div className="text-textW h-full w-full">
              <div className="w-full h-full mt-10 flex flex-col justify-center items-center px-6">
                <h2 className="text-4xl lg:text-6xl text-white font-oranienbaum text-shadow-hero tracking-wide text-center">
                  ROYAL APART
                </h2>

                <p className="mt-4  text-lg md:text-4xl text-white font-finlandica text-shadow-hero2 text-center">
                  ЗНАЙДІТЬ СВОЮ ІДЕАЛЬНУ КВАРТИРУ!
                </p>
              </div>
            </div>

            <BookingSearchBar />

            <HeroFeatures />
          </div>
        </div>
      </div>
    </div>
  );
}

export default MainPageContent;
