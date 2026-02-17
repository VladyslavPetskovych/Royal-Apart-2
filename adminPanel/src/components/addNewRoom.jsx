import { useState } from "react";
import axios from "axios";
import Wubook from "./wubook";
import Popup from "./popup";

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
  const [additionalPropsArray, setAdditionalPropsArray] = useState([]);

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
    additionalPropsArray.forEach(({ key, value }) => {
      if (key && key.trim()) additionalPropsObj[key.trim()] = value;
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
    <form className="flex flex-col md:flex-row p-1 mt-2" onSubmit={handleSubmit}>
      <div className=" flex flex-col md:w-[60%] w-[90%] h-full bg-slate-400  p-3">
        <div className="flex flex-row mt-2">
          <label className="block mb-2  text-sm font-medium w-[130px] text-gray-900 mr-3">
            Адреса
          </label>

          <input
            type="text"
            value={address}
            required
            onChange={(e) => setAdress(e.target.value)}
          />
     
            <Popup
           
              content="Адреса не має містити ці символи: / \  Найкраще записувати квартиру ось так Ковжуна 2 _ 6"
            />
         
        </div>
        <div className="flex flex-row mt-2">
          <label className="block mb-2 text-sm font-medium w-[130px] text-gray-900 mr-3">
            Опис
          </label>
          <textarea
            value={body}
            required
            onChange={(e) => setBody(e.target.value)}
            className="h-[200px] w-[300px]  rounded-md resize-none"
          ></textarea>
        </div>
        <div className="flex flex-row mt-2">
          <label className="block mb-2 text-sm font-medium w-[130px] text-gray-900 mr-3">
            Кількість кімнат
          </label>
          <input type="number" onChange={(e) => setRoomcount(e.target.value)} />
        </div>
        <div className="flex flex-row mt-2">
          <label className="block mb-2 text-sm font-medium w-[130px] text-gray-900 mr-3">
            Категорія
          </label>
          <select
            value={category}
            onChange={(e) => setCategory(e.target.value)}
            className=" px-4 py-2 border rounded-md"
          >
            <option value="romantic">romantic</option>
            <option value="family">family</option>
            <option value="business">business</option>
          </select>
        </div>
        <div className="flex flex-row mt-2 ">
          <label className="block mb-2 text-sm font-medium w-[130px] text-gray-900 mr-3">
            Ціна
          </label>
          <input type="number" onChange={(e) => setPrice(e.target.value)} />
        </div>
        <div className="flex flex-row mt-2">
          <label className="block mb-2 text-sm font-medium w-[130px] text-gray-900 mr-3">
            Поверх
          </label>
          <input type="number" onChange={(e) => setFloor(e.target.value)} />
        </div>
        <div className="flex flex-row mt-2">
          <label className="block mb-2 text-sm font-medium w-[130px] text-gray-900 mr-3">
            Кількість ліжок
          </label>
          <input type="number" onChange={(e) => setBeds(e.target.value)} />
        </div>
        <div className="flex flex-row mt-2">
          <label className="block mb-2 text-sm font-medium w-[130px] text-gray-900 mr-3">
            Кількість гостей
          </label>
          <input type="number" onChange={(e) => setGuests(e.target.value)} />
        </div>
        <div className="flex flex-row mt-2">
          <label className="block mb-2 text-sm font-medium w-[130px] text-gray-900 mr-3">
            площа
          </label>
          <input type="number" onChange={(e) => setSquare(e.target.value)} />
        </div>
        <div className="flex flex-row mt-2">
          <label className="block mb-2 text-sm font-medium w-[130px] text-gray-900 mr-3">
            wuBook id
          </label>
          <input type="number" onChange={(e) => setWubid(e.target.value)} />
          <button className="bg-red-500 m-2" type="button" onClick={handleOpenModal}>
            знайти ID
          </button>
          <Wubook isOpen={isModalOpen} onClose={handleCloseModal}>
            <div className="text-xl">Hello, World!</div>
          </Wubook>
        </div>
        <div className="mt-2 p-2 border border-slate-300 rounded">
          <div className="flex justify-between items-center mb-2">
            <label className="block text-sm font-medium text-gray-900">Додаткові властивості:</label>
            <button
              type="button"
              className="bg-blue-500 text-white px-2 py-1 rounded text-sm"
              onClick={() => setAdditionalPropsArray((prev) => [...prev, { key: "", value: "" }])}
            >
              + Додати
            </button>
          </div>
          {additionalPropsArray.map((item, idx) => (
            <div key={idx} className="flex gap-2 mb-2 items-center">
              <input
                className="bg-slate-200 flex-1 p-1 rounded"
                type="text"
                placeholder="Назва (напр. WiFi)"
                value={item.key}
                onChange={(e) => {
                  const next = [...additionalPropsArray];
                  next[idx] = { ...next[idx], key: e.target.value };
                  setAdditionalPropsArray(next);
                }}
              />
              <input
                className="bg-slate-200 flex-1 p-1 rounded"
                type="text"
                placeholder="Значення"
                value={item.value}
                onChange={(e) => {
                  const next = [...additionalPropsArray];
                  next[idx] = { ...next[idx], value: e.target.value };
                  setAdditionalPropsArray(next);
                }}
              />
              <button
                type="button"
                className="bg-red-400 text-white px-2 py-1 rounded text-sm"
                onClick={() => setAdditionalPropsArray((prev) => prev.filter((_, i) => i !== idx))}
              >
                Видалити
              </button>
            </div>
          ))}
        </div>
      </div>
      <div className="bg-slate-600 w-[90%] md:w-[30%] flex-row text-white p-3">
        <h3 className="mb-5">
          Назвіть файл англійською - наприклад (leontov5.jpg)
        </h3>
        <p>Завантажити фото</p>
        <input type="file" onChange={handleImage} />
        <div className="w-80 h-60">
          {image && (
            <img
              src={image}
              alt="Uploaded"
              className="  object-cover max-w-full max-h-full"
            />
          )}
        </div>
        <button
          type="submit"
          className="text-white bg-green-700 hover:bg-blue-800 focus:ring-4 focus:ring-blue-300 text-2xl font-medium rounded-lg  px-5 py-2.5 me-2 mb-20 dark:bg-blue-600 dark:hover:bg-blue-700 focus:outline-none dark:focus:ring-blue-800"
        >
          Записати Квартиру!
        </button>
      </div>
    </form>
  );
}
