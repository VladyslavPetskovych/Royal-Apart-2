import React, { useEffect, useState } from "react";
import axios from "axios";
import SaleList from "./saleList";
import { apiUrl } from "../../../config/publicSite";

function SaleModal({ toggleModal }) {
  const [sales, setSales] = useState([]);
  const [rooms, setRooms] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    document.body.classList.add("overflow-hidden");
    return () => document.body.classList.remove("overflow-hidden");
  }, []);

  useEffect(() => {
    const fetchData = async () => {
      try {
        const [salesResponse, roomsResponse] = await Promise.all([
          axios.get(apiUrl("/api/sales/all")),
          axios.get(apiUrl("/api/siteRoyal/copied-rooms")),
        ]);
        setSales(salesResponse.data);
        setRooms(roomsResponse.data.data);
      } catch (error) {
        console.error("Error fetching data:", error);
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, []);

  const handleOverlayClick = (event) => {
    if (event.target === event.currentTarget) {
      toggleModal();
    }
  };

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-brand-black/40 px-4"
      onClick={handleOverlayClick}
      role="dialog"
      aria-modal="true"
      aria-labelledby="sale-modal-title"
    >
      <div className="relative max-h-[80vh] w-full max-w-md overflow-auto rounded-[4px] bg-brand-beige p-5 shadow-[0_16px_40px_rgba(19,18,23,0.15)] sm:max-w-lg sm:p-6">
        <div className="mb-5 flex items-center justify-between gap-3">
          <h2
            id="sale-modal-title"
            className="font-oranienbaum text-[24px] text-brand-black"
          >
            Акції
          </h2>
          <button
            type="button"
            onClick={toggleModal}
            className="font-finlandica text-[22px] leading-none text-brand-black/40 transition hover:text-brand-bordo"
            aria-label="Закрити"
          >
            ×
          </button>
        </div>

        {loading ? (
          <p className="py-8 text-center font-finlandica text-[14px] text-brand-black/50">
            …
          </p>
        ) : (
          <SaleList sales={sales} rooms={rooms} />
        )}
      </div>
    </div>
  );
}

export default SaleModal;
