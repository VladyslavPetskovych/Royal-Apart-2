import React from "react";
import { Link } from "react-router-dom";
import jac1 from "../../assets/jaccuzzi/jac1.webp";
import jac2 from "../../assets/jaccuzzi/jac2.webp";
import jac3 from "../../assets/jaccuzzi/jac3.webp";

function Jaccuzzi() {
  return (
    <div className="bg-back py-16 w-full">
      {/* Заголовок та кнопка */}
      <div
        className="flex flex-col items-center text-center mb-12"
        data-aos="fade-up"
      >
        <h2 className="text-3xl md:text-4xl font-bold font-popins text-amber-900 mb-4">
          Апартаменти з джакузі / ванною
        </h2>
        <Link to="/aparts?category=bath">
          <button className="px-6 py-3 bg-gradient-to-br from-amber-500 to-amber-400 text-white font-semibold rounded-lg shadow-lg hover:scale-105 transition-transform duration-300">
            Детальніше
          </button>
        </Link>
      </div>

      {/* Галерея */}
      <div className="flex flex-wrap justify-center gap-6 px-4 md:px-16">
        {[jac1, jac2, jac3].map((img, index) => (
          <Link
            key={index}
            to="/aparts?category=bath"
            className="group relative w-full sm:w-80 md:w-96 h-96 overflow-hidden rounded-xl shadow-md hover:shadow-xl transition-shadow duration-300"
          >
            <img
              src={img}
              alt={`Jacuzzi ${index + 1}`}
              className="w-full h-full object-cover transform group-hover:scale-105 transition-transform duration-500"
            />
            {/* Підсвічування при наведенні */}
            <div className="absolute inset-0 bg-black/20 opacity-0 group-hover:opacity-20 transition-opacity duration-300 rounded-xl"></div>
          </Link>
        ))}
      </div>
    </div>
  );
}

export default Jaccuzzi;
