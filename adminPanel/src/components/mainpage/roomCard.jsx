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
      className="bg-orange-800 h-9 w-[220px] m-1 px-4 ml-4 text-lg font-semibold text-white flex justify-center items-center gap-2 hover:bg-orange-700 rounded-lg transition"
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

function RoomCard() {
  const [rooms, setRooms] = useState([]);
  const [cooldown, setCooldown] = useState(false);
  const [isModalOpen, setIsModalOpen] = useState(false);

  function sendAdvert() {
    setIsModalOpen(true);
  }
  async function updtPrices() {
    if (!cooldown) {
      await axios.get("https://royalapart.online/api/getprices");
      await axios.get("https://royalapart.online/api/getprices/setPrice");
      // Show an alert
      alert("Ціни Оновлені!");

      // Set cooldown to true
      setCooldown(true);

      // Reset cooldown after 1 minute (60 seconds)
      setTimeout(() => {
        setCooldown(false);
      }, 60000);
    } else {
      alert("Зачекайте хвилину, щоб оновити ціни ще раз!");
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
          className="bg-blue-600 h-9 w-[220px] m-1 px-4 ml-4 text-lg font-semibold text-zinc-50 hover:bg-sky-700 rounded-lg transition duration-200"
        >
          Оновити ціни
        </button>

        <button
          onClick={sendAdvert}
          className="bg-sky-600 h-9 w-[220px] m-1 px-4 ml-4 text-lg font-semibold text-zinc-50 hover:bg-sky-700 rounded-lg transition duration-200"
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
