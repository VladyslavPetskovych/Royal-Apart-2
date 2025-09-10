import React, { useEffect } from "react";
import { Link } from "react-router-dom";
import back1 from "../../assets/miniHotel/back1.jpg";
import back2 from "../../assets/miniHotel/back2.jpg";
import back3 from "../../assets/miniHotel/back3.jpg";

import AOS from "aos";
import "aos/dist/aos.css";

function MiniHotel() {
  useEffect(() => {
    AOS.init({ duration: 700 });
  }, []);

  const images = [back1, back2, back3];

  return (
    <div className="bg-back py-16 w-full">
      {/* Заголовок та кнопка */}
      <div
        className="flex flex-col items-center text-center mb-12"
        data-aos="fade-up"
      >
        <h2 className="text-3xl md:text-4xl font-bold font-popins text-amber-900 mb-4">
          Особлива пропозиція смарт-апартаментів
        </h2>
        <Link to="/mini-hotel">
          <button className="px-6 py-3 bg-gradient-to-br from-amber-500 to-amber-400 text-white font-semibold rounded-xl shadow-lg hover:scale-105 transition-transform duration-300">
            Детальніше
          </button>
        </Link>
      </div>

      {/* Галерея */}
      <div className="flex flex-wrap justify-center gap-6 px-4 md:px-16">
        {images.map((img, index) => (
          <Link
            key={index}
            to="/mini-hotel"
            className="group relative w-full sm:w-80 md:w-96 h-96 overflow-hidden rounded-xl shadow-md hover:shadow-xl transition-shadow duration-300"
          >
            <img
              src={img}
              alt={`MiniHotel ${index + 1}`}
              className="w-full h-full object-cover rounded-xl transform group-hover:scale-105 transition-transform duration-500"
            />
            {/* Підсвічування при наведенні */}
            <div className="absolute inset-0 bg-black/20 opacity-0 group-hover:opacity-20 transition-opacity duration-300 rounded-xl"></div>
          </Link>
        ))}
      </div>
    </div>
  );
}

export default MiniHotel;
