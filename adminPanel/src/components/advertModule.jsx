import React, { useRef } from "react";
import axios from "axios";

const ModalAdvert = ({ isOpen, onClose, onSubmit, children }) => {
  const textRef = useRef(null);
  const imageRef = useRef(null);

  const handleSubmit = async () => {
    const text = textRef.current.value;
    const image = imageRef.current.files[0]; 

    const formData = new FormData();
    formData.append("msg", text);
    formData.append("image", image);

    try {
      await axios.post("https://royalapart.online/api/advert/save", formData);
      alert("Дані збережено! Реклама буде надіслана користувачам протягом 2 хвилин.");
      onClose();
    } catch (error) {
      console.error("Error saving data:", error);
      alert("Помилка при збереженні");
    }
  };

  return (
    <>
      {isOpen && (
        <div className="fixed inset-0 z-10 overflow-y-auto">
          <div className="flex items-center justify-center min-h-screen">
            <div className="fixed inset-0 transition-opacity" onClick={onClose}>
              <div className="absolute inset-0 bg-gray-500 opacity-75"></div>
            </div>
            <div className="z-20 bg-white p-6 rounded-lg shadow-lg">
              <div className="mb-4">
                <label
                  htmlFor="advertText"
                  className="block text-sm font-medium text-gray-700"
                >
                  Text:
                </label>
                <input
                  type="text"
                  ref={textRef}
                  id="advertText"
                  className="mt-1 focus:ring-indigo-500 focus:border-indigo-500 block w-full shadow-sm sm:text-sm border-gray-300 rounded-md"
                />
              </div>
              <div className="mb-4">
                <label
                  htmlFor="advertImage"
                  className="block text-sm font-medium text-gray-700"
                >
                  Image:
                </label>
                <input
                  type="file"
                  ref={imageRef}
                  id="advertImage"
                  className="mt-1 focus:ring-indigo-500 focus:border-indigo-500 block w-full shadow-sm sm:text-sm border-gray-300 rounded-md"
                />
              </div>
              <div className="flex justify-between">
                <button
                  onClick={handleSubmit}
                  className="bg-blue-500 text-white py-2 px-4 rounded hover:bg-blue-600"
                >
                  Надіслати дані
                </button>
                <button
                  onClick={onClose}
                  className="bg-gray-300 text-gray-800 py-2 px-4 rounded hover:bg-gray-400"
                >
                  Закрити
                </button>
              </div>
              <div>{children}</div>
            </div>
          </div>
        </div>
      )}
    </>
  );
};

export default ModalAdvert;
