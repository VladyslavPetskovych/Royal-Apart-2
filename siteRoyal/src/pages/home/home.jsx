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
import RecApartments from "../../components2/home/recApartments";
import ExeptionalService from "../../components2/home/ExeptionalService";
import ApartmentsBlock from "../../components2/home/apartmentsBlock/apartmentsBlock";
import ReviewsBlock from "../../components2/home/reviewsBlock";
import BlogSection from "../../components2/home/BlogSection";
import History from "../../components2/home/History";
import Instagram from "../../components2/home/InstagramSection";
import FancySection from "../../components2/home/FancySection";

function MainPageBody() {
  const { t } = useTranslation();

  return (
    <>
      <SEO />

      <MainPageContent />
      <RecApartments />
      <ExeptionalService />
      <ApartmentsBlock />
      <ReviewsBlock />
      <BlogSection />
      <History />
      <Instagram />
      <FancySection />

      <Sale />
    </>
  );
}

export default MainPageBody;
