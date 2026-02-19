import { useState } from "react";
import axios from "axios";
import Wubook from "./wubook";
import Popup from "./popup";
import {
  ADDITIONAL_PROPERTY_KEYS,
  getDefaultAdditionalProperties,
} from "../constants/additionalProperties";

export default function FormComponent() {
  const [image, setImage] = useState("");
  const [selectedImage, setSelectedImage] = useState(null);
  const [address, setAdress] = useState("");
  const [body, setBody] = useState("");
  const [category, setCategory] = useState("romantic");
  const [roomcount, setRoomcount] = useState(1);
  const [price, setPrice] = useState(2000);
  const [beds, setBeds] = useState(2);
  const [guests, setGuests] = useState(4);
  const [floor, setFloor] = useState(4);
  const [square, setSquare] = useState(50);
  const [wubid, setWubid] = useState(50);
  const [isModalOpen, setModalOpen] = useState(false);
  const [additionalProps, setAdditionalProps] = useState(() => getDefaultAdditionalProperties());

  const handleOpenModal = () => {
    setModalOpen(true);
  };

  const handleCloseModal = () => {
    setModalOpen(false);
  };

  const handleImage = (e) => {
    const file = e.target.files[0];
    if (file) {
      setSelectedImage(file);
      setImage(URL.createObjectURL(file));
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    if (!selectedImage) {
      alert("Please select an image.");
      return;
    }

    const formData = new FormData();
    formData.append("image", selectedImage);
    formData.append("address", address);
    formData.append("body", body);
    formData.append("category", category);
    formData.append("roomcount", roomcount);
    formData.append("price", price);
    formData.append("beds", beds);
    formData.append("guests", guests);
    formData.append("square", square);
    formData.append("floor", floor);
    formData.append("wubid", wubid);
    const additionalPropsObj = {};
    ADDITIONAL_PROPERTY_KEYS.forEach(({ key, default: def, type }) => {
      let val = additionalProps[key];
      if (val === undefined || val === "") val = def;
      if (type === "number") val = Number(val) || 0;
      additionalPropsObj[key] = val;
    });
    formData.append("additionalProperties", JSON.stringify(additionalPropsObj));
    try {
      const response = await axios.post(
        "https://royalapart.online/api/aparts/newRoom",
        formData,
        {
          headers: {
            "Content-Type": "multipart/form-data",
          },
        }
      );
      alert("Квартира додана!");
      console.log(response.data);
    } catch (error) {
      console.error(error);
      // Handle error
    }
  };
  return (
    <form className="space-y-6" onSubmit={handleSubmit}>
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Left column - main fields */}
        <div className="lg:col-span-2 space-y-4 p-4 rounded-xl border border-slate-200 bg-white">
          <div>
            <label className="block text-sm font-medium text-slate-700 mb-1">Адреса</label>
            <div className="flex gap-2 items-center">
              <input
                type="text"
                value={address}
                required
                onChange={(e) => setAdress(e.target.value)}
                className="flex-1 px-3 py-2 rounded-lg border border-slate-300 bg-slate-50 focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
              />
              <Popup content="Адреса не має містити ці символи: / \  Найкраще записувати квартиру ось так Ковжуна 2 _ 6" />
            </div>
          </div>
          <div>
            <label className="block text-sm font-medium text-slate-700 mb-1">Опис</label>
            <textarea
              value={body}
              required
              onChange={(e) => setBody(e.target.value)}
              className="w-full h-32 px-3 py-2 rounded-lg border border-slate-300 bg-slate-50 focus:ring-2 focus:ring-blue-500 focus:border-blue-500 resize-y"
            />
          </div>
          <div className="grid grid-cols-2 sm:grid-cols-3 gap-4">
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1">Кількість кімнат</label>
              <input
                type="number"
                value={roomcount}
                onChange={(e) => setRoomcount(Number(e.target.value) || 1)}
                className="w-full px-3 py-2 rounded-lg border border-slate-300 bg-slate-50 focus:ring-2 focus:ring-blue-500"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1">Ціна (грн)</label>
              <input
                type="number"
                value={price}
                onChange={(e) => setPrice(Number(e.target.value) || 0)}
                className="w-full px-3 py-2 rounded-lg border border-slate-300 bg-slate-50 focus:ring-2 focus:ring-blue-500"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1">Поверх</label>
              <input
                type="number"
                value={floor}
                onChange={(e) => setFloor(Number(e.target.value) || 0)}
                className="w-full px-3 py-2 rounded-lg border border-slate-300 bg-slate-50 focus:ring-2 focus:ring-blue-500"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1">Ліжок</label>
              <input
                type="number"
                value={beds}
                onChange={(e) => setBeds(Number(e.target.value) || 0)}
                className="w-full px-3 py-2 rounded-lg border border-slate-300 bg-slate-50 focus:ring-2 focus:ring-blue-500"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1">Гостей</label>
              <input
                type="number"
                value={guests}
                onChange={(e) => setGuests(Number(e.target.value) || 0)}
                className="w-full px-3 py-2 rounded-lg border border-slate-300 bg-slate-50 focus:ring-2 focus:ring-blue-500"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1">Площа (м²)</label>
              <input
                type="number"
                value={square}
                onChange={(e) => setSquare(Number(e.target.value) || 0)}
                className="w-full px-3 py-2 rounded-lg border border-slate-300 bg-slate-50 focus:ring-2 focus:ring-blue-500"
              />
            </div>
          </div>
          <div className="flex flex-wrap gap-2 items-center">
            <div className="min-w-[140px]">
              <label className="block text-sm font-medium text-slate-700 mb-1">wuBook ID</label>
              <input
                type="number"
                value={wubid}
                onChange={(e) => setWubid(Number(e.target.value) || 0)}
                className="w-full px-3 py-2 rounded-lg border border-slate-300 bg-slate-50 focus:ring-2 focus:ring-blue-500"
              />
            </div>
            <button
              type="button"
              className="self-end px-4 py-2 rounded-lg bg-amber-500 hover:bg-amber-600 text-white text-sm font-medium"
              onClick={handleOpenModal}
            >
              Знайти ID
            </button>
          </div>
          <div className="hidden">
            <select
              value={category}
              onChange={(e) => setCategory(e.target.value)}
              aria-hidden="true"
              tabIndex={-1}
            >
              <option value="romantic">romantic</option>
              <option value="family">family</option>
              <option value="business">business</option>
            </select>
          </div>
        </div>

        {/* Right column - photo & submit */}
        <div className="space-y-4 p-4 rounded-xl border border-slate-200 bg-slate-700 text-white">
          <h3 className="font-medium">Фото квартири</h3>
          <p className="text-sm text-slate-200">Назвіть файл англійською (наприклад leontov5.jpg)</p>
          <input
            type="file"
            accept="image/*"
            onChange={handleImage}
            className="block w-full text-sm file:mr-4 file:py-2 file:px-4 file:rounded-lg file:border-0 file:bg-blue-500 file:text-white hover:file:bg-blue-600"
          />
          <div className="aspect-video bg-slate-600 rounded-lg overflow-hidden flex items-center justify-center">
            {image ? (
              <img src={image} alt="Превʼю" className="w-full h-full object-cover" />
            ) : (
              <span className="text-slate-400 text-sm">Попередній перегляд</span>
            )}
          </div>
          <button
            type="submit"
            className="w-full py-3 rounded-lg bg-green-600 hover:bg-green-700 text-white font-semibold transition-colors"
          >
            Записати квартиру
          </button>
        </div>
      </div>

      {/* Additional properties */}
      <div className="p-4 rounded-xl border border-slate-200 bg-slate-50">
        <label className="block text-sm font-semibold text-slate-700 mb-3">Додаткові властивості</label>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {ADDITIONAL_PROPERTY_KEYS.map(({ key, label, type, placeholder, default: def }) => (
            <div key={key} className="flex gap-3 items-center min-h-[2.5rem]">
              {type === "boolean" ? (
                <>
                  <input
                    type="checkbox"
                    id={`addprop-${key}`}
                    checked={additionalProps[key] ?? def}
                    onChange={(e) =>
                      setAdditionalProps((prev) => ({ ...prev, [key]: e.target.checked }))
                    }
                    className="w-4 h-4 rounded border-slate-300"
                  />
                  <label htmlFor={`addprop-${key}`} className="text-sm text-slate-700 cursor-pointer">
                    {label}
                  </label>
                </>
              ) : (
                <>
                  <label className="text-sm text-slate-700 w-32 shrink-0">{label}</label>
                  <input
                    className="flex-1 min-w-0 px-3 py-2 rounded-lg border border-slate-300 bg-white"
                    type={type}
                    placeholder={placeholder}
                    value={additionalProps[key] ?? ""}
                    onChange={(e) =>
                      setAdditionalProps((prev) => ({ ...prev, [key]: e.target.value }))
                    }
                  />
                </>
              )}
            </div>
          ))}
        </div>
      </div>

      <Wubook isOpen={isModalOpen} onClose={handleCloseModal}>
        <div className="text-xl">Hello, World!</div>
      </Wubook>
    </form>
  );
}
