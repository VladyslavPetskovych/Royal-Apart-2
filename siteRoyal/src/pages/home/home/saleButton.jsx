import React, { useState, useEffect } from "react";
import { useTranslation } from "react-i18next";
import Modal from "./saleModal";
import axios from "axios";
import { apiUrl } from "../../../config/publicSite";

function SaleButton() {
  const { t } = useTranslation();
  const [isOpen, setIsOpen] = useState(false);
  const [hasSales, setHasSales] = useState(false);

  const toggleModal = () => {
    setIsOpen(!isOpen);
  };

  useEffect(() => {
    const fetchSales = async () => {
      try {
        const salesResponse = await axios.get(apiUrl("/api/sales/all"));
        const now = new Date();
        const hasActive = salesResponse.data.some(
          (sale) => new Date(sale.tillDate) > now
        );
        setHasSales(hasActive);
      } catch (error) {
        console.error("Error fetching sales:", error);
      }
    };

    fetchSales();
  }, []);

  useEffect(() => {
    const chance = Math.random();
    if (chance < 0.5 && hasSales) {
      setIsOpen(true);
    }
  }, [hasSales]);

  return (
    <div>
      {hasSales && !isOpen && (
        <button
          type="button"
          onClick={toggleModal}
          className="fixed bottom-4 right-4 z-30 bg-brand-bordo px-4 py-3 font-finlandica text-[12px] font-medium text-brand-beige shadow-[0_6px_20px_rgba(99,18,27,0.3)] transition hover:brightness-110 md:bottom-8 md:right-8"
        >
          {t("special_offers")}
        </button>
      )}

      {isOpen && <Modal toggleModal={toggleModal} />}
    </div>
  );
}

export default SaleButton;
