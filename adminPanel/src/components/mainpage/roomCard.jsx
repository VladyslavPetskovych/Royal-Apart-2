/* eslint-disable no-unused-vars */
/* eslint-disable react/prop-types */
import React, { useEffect, useState } from "react";
import axios from "axios";
import AddRoom from "../Addrooms";
import SingleRoom from "./singleRoom";
import AdvertModule from "../advertModule";
import SiteCopyDB from "./siteCopyDB";
import AddSale from "./sale/addSale";
import { Link } from "react-router-dom";

function AnalisButton() {
  return (
    <Link
      to="/analis"
      className="bg-orange-800 h-8 w-[170px] m-1 px-3 ml-4 text-sm font-semibold text-white flex justify-center items-center gap-2 hover:bg-orange-700 rounded-lg transition"
    >
      <svg
        xmlns="http://www.w3.org/2000/svg"
        viewBox="0 0 256 256"
        className="w-5 h-5"
        fill="none"
      >
        <polyline
          points="48 208 48 136 96 136"
          fill="none"
          stroke="currentColor"
          strokeLinecap="round"
          strokeLinejoin="round"
          strokeWidth="16"
        />
        <line
          x1="224"
          y1="208"
          x2="32"
          y2="208"
          fill="none"
          stroke="currentColor"
          strokeLinecap="round"
          strokeLinejoin="round"
          strokeWidth="16"
        />
        <polyline
          points="96 208 96 88 152 88"
          fill="none"
          stroke="currentColor"
          strokeLinecap="round"
          strokeLinejoin="round"
          strokeWidth="16"
        />
        <polyline
          points="152 208 152 40 208 40 208 208"
          fill="none"
          stroke="currentColor"
          strokeLinecap="round"
          strokeLinejoin="round"
          strokeWidth="16"
        />
      </svg>
      Відкрити Аналіз
    </Link>
  );
}

const API_BASE = "https://royalapart.online/api";
const IMAGES_TIMEOUT = 300000; // 5 min - update-wodoo-images iterates over many rooms
const PRICES_TIMEOUT = 90000;  // 90s for getprices/setPrice

function RoomCard() {
  const [rooms, setRooms] = useState([]);
  const [cooldown, setCooldown] = useState(false);
  const [isUpdating, setIsUpdating] = useState(false);
  const [isUpdatingImages, setIsUpdatingImages] = useState(false);
  const [isModalOpen, setIsModalOpen] = useState(false);

  function sendAdvert() {
    setIsModalOpen(true);
  }

  async function updtPrices() {
    if (cooldown || isUpdating) {
      console.log("[updtPrices] Blocked by cooldown or already updating");
      alert("Зачекайте хвилину, щоб оновити ціни ще раз!");
      return;
    }
    setIsUpdating(true);
    console.log("[updtPrices] 1/2 Starting getprices...");
    try {
      await axios.get(`${API_BASE}/getprices`, { timeout: PRICES_TIMEOUT });
      console.log("[updtPrices] 1/2 getprices done");

      console.log("[updtPrices] 2/2 Starting setPrice...");
      await axios.get(`${API_BASE}/getprices/setPrice`, { timeout: PRICES_TIMEOUT });
      console.log("[updtPrices] 2/2 setPrice done");

      alert("Ціни оновлено!");
    } catch (error) {
      console.error("[updtPrices] Error:", error?.message, error?.response?.status, error?.response?.data);
      alert("Помилка при оновленні цін. Спробуйте ще раз.");
    } finally {
      setIsUpdating(false);
      setCooldown(true);
      setTimeout(() => setCooldown(false), 60000);
    }
  }

  async function updtImages() {
    if (isUpdatingImages) {
      console.log("[updtImages] Already updating");
      return;
    }
    setIsUpdatingImages(true);
    console.log("[updtImages] Starting update-wodoo-images (timeout 5 min)...");
    try {
      const imgRes = await axios.get(`${API_BASE}/siteRoyal/update-wodoo-images`, {
        timeout: IMAGES_TIMEOUT,
      });
      console.log("[updtImages] Done:", imgRes?.data);

      const updated = imgRes?.data?.updatedRooms?.filter((r) => r.status === "✅ Оновлено").length ?? 0;
      const failed = imgRes?.data?.updatedRooms?.filter((r) => r.status?.includes("❌")).length ?? 0;
      const msg =
        failed > 0
          ? `Зображення: ${updated} оновлено, ${failed} без змін.`
          : "Зображення оновлено!";
      alert(msg);
    } catch (error) {
      const isTimeout = error?.code === "ECONNABORTED" || error?.message?.includes("timeout");
      const errMsg = isTimeout
        ? "Час очікування вичерпано. Запит занадто довгий – спробуйте ще раз."
        : "Помилка при оновленні зображень. Спробуйте ще раз.";
      console.error("[updtImages] Error:", error?.message, error?.response?.data);
      alert(errMsg);
    } finally {
      setIsUpdatingImages(false);
    }
  }
  const updateRooms = () => {
    axios.get("https://royalapart.online/api/aparts").then((response) => {
      setRooms(response.data.data);
    });
  };
  useEffect(() => {
    const fetchData = async () => {
      try {
        const response = await axios.get(
          "https://royalapart.online/api/aparts"
        );
        setRooms(response.data.data);
      } catch (error) {
        console.error("Error fetching rooms:", error);
      }
    };

    fetchData();
  }, []);

  console.log(rooms);

  return (
    <div className="">
      <div className="flex flex-col md:flex-row">
        <button
          onClick={updtPrices}
          disabled={isUpdating}
          className="bg-blue-600 h-8 w-[170px] m-1 px-3 ml-4 text-sm font-semibold text-zinc-50 hover:bg-sky-700 rounded-lg transition duration-200 disabled:opacity-70 disabled:cursor-not-allowed"
        >
          {isUpdating ? "Оновлення… (зачекайте)" : "Оновити ціни"}
        </button>

        <button
          onClick={updtImages}
          disabled={isUpdatingImages}
          className="bg-emerald-600 h-8 w-[170px] m-1 px-3 ml-4 text-sm font-semibold text-zinc-50 hover:bg-emerald-700 rounded-lg transition duration-200 disabled:opacity-70 disabled:cursor-not-allowed"
        >
          {isUpdatingImages ? "Оновлення зображень…" : "Оновити зображення"}
        </button>

        <button
          onClick={sendAdvert}
          className="bg-sky-600 h-8 w-[170px] m-1 px-3 ml-4 text-sm font-semibold text-zinc-50 hover:bg-sky-700 rounded-lg transition duration-200"
        >
          надіслати рекламку
        </button>

        <SiteCopyDB />
        <AnalisButton />
        <AddSale />
        <div className="flex flex-col p-2 text-white">
          <p className="">Контакти розробника TG @stepbaka.</p>
          <p> +380983405578</p>
        </div>
      </div>

      <AdvertModule
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
      />
      <div className="flex flex-wrap ">
        <AddRoom />
        {Array.isArray(rooms) && rooms.length > 0 ? (
          rooms.map((room) => (
            <SingleRoom key={room.wubid} room={room} onDelete={updateRooms} />
          ))
        ) : (
          <p>No rooms available</p>
        )}
      </div>
    </div>
  );
}

export default RoomCard;
