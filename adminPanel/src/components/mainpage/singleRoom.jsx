/* eslint-disable react/prop-types */
import { useState } from "react";
import edit from "../../assets/4226577.png";
import del from "../../assets/del.png";
import axios from "axios";
import {
  ADDITIONAL_PROPERTY_KEYS,
  getAdditionalPropertiesFromRoom,
  getLabelForKey,
} from "../../constants/additionalProperties";

function SingleRoom({ room, onDelete }) {
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [fileData, setFileData] = useState(null);
  const [editedRoomData, setEditedRoomData] = useState({
    name: room.name,
    price: room.price,
    description: room.description,
    numrooms: room.numrooms,
    category: room.category,
    wubid: room.wubid,
    floor: room.floor,
    beds: room.beds,
    guests: room.guests,
    surface: room.surface,
    imgurl: room.imgurl,
    additionalProperties: room.additionalProperties || {},
  });
  const [formData, setFormData] = useState({
    name: room.name,
    price: room.price,
    description: room.description,
    numrooms: room.numrooms,
    floor: room.floor,
    guests: room.guests,
    surface: room.surface,
    beds: room.beds,
    imgurl: room.imgurl,
    additionalProperties: room.additionalProperties || {},
  });
  const [additionalProps, setAdditionalProps] = useState(() =>
    getAdditionalPropertiesFromRoom(room)
  );

  const openModal = () => {
    setAdditionalProps(getAdditionalPropertiesFromRoom(room));
    setIsModalOpen(true);
  };

  const closeModal = () => {
    setIsModalOpen(false);
  };

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
    if (name === "name") {
      setEditedRoomData((prev) => ({ ...prev, name: value }));
    }
  };

  const handleInputChange = (event) => {
    const { name, value } = event.target;
    console.log("New edited room data for", name, ":", value);

    if (event.target.id === "image-input") {
      const file = event.target.files[0];
      const fileName = file.name;
      setFileData(file);
      setEditedRoomData((prevEditedRoomData) => ({
        ...prevEditedRoomData,
        imgurl: [fileName],
      }));
    } else {
      setEditedRoomData((prevEditedRoomData) => ({
        ...prevEditedRoomData,
        [name]: value,
      }));
    }
  };

  const handleAdditionalPropChange = (key, value) => {
    setAdditionalProps((prev) => ({ ...prev, [key]: value }));
  };

  const handleSubmit = () => {
    const additionalPropsObj = {};
    ADDITIONAL_PROPERTY_KEYS.forEach(({ key, default: def, type }) => {
      let val = additionalProps[key];
      if (val === undefined || val === "") val = def;
      if (type === "number") val = Number(val) || 0;
      additionalPropsObj[key] = val;
    });

    const formDataToSend = new FormData();
    formDataToSend.append("name", editedRoomData.name);
    formDataToSend.append("price", editedRoomData.price);
    formDataToSend.append("description", editedRoomData.description);
    formDataToSend.append("numrooms", editedRoomData.numrooms);
    formDataToSend.append("category", editedRoomData.category);
    formDataToSend.append("wubid", editedRoomData.wubid);
    formDataToSend.append("floor", editedRoomData.floor);
    formDataToSend.append("guests", editedRoomData.guests);
    formDataToSend.append("surface", editedRoomData.surface);
    formDataToSend.append("beds", editedRoomData.beds);
    formDataToSend.append("imgurl", editedRoomData.imgurl[0]);
    formDataToSend.append("additionalProperties", JSON.stringify(additionalPropsObj));
    if (fileData) formDataToSend.append("file", fileData);

    axios
      .put(
        `https://royalapart.online/api/aparts/${room._id}`,
        formDataToSend,
        {
          headers: {
            "Content-Type": "multipart/form-data",
          },
        }
      )
      .then((response) => {
        console.log("Data successfully sent to the backend:", response.data);
        setFormData((prev) => ({ ...prev, additionalProperties: additionalPropsObj }));
        setEditedRoomData((prev) => ({ ...prev, additionalProperties: additionalPropsObj }));
        closeModal();
        alert("Зміни внесено!!!");
      })
      .catch((error) => {
        console.error("Error sending data to the backend:", error);
        alert("Помилка при відправленні даних на сервер. Спробуйте ще раз.");
      });
  };
  const deleteRoom = async () => {
    try {
      if (confirm("Ви впевнені що хочете видалити цю квартиру??")) {
        axios
          .delete(
            `https://royalapart.online/api/aparts/${room._id}`
          )
          .then(() => {
            onDelete(room._id);
          });
      }
    } catch (error) {
      console.error("Error deleting room:", error);
    }
  };

  return (
    <div className="group bg-white rounded-xl shadow-md hover:shadow-lg transition-shadow overflow-hidden m-3 w-[280px] sm:w-[300px] border border-slate-100">
      {/* Image with overlay actions */}
      <div className="relative aspect-[4/3] overflow-hidden">
        <img
          className="object-cover w-full h-full group-hover:scale-105 transition-transform duration-300"
          src={`https://royalapart.online/api/imgs/${room.imgurl?.[0]}`}
          alt={formData.name}
        />
        <div className="absolute top-2 right-2 flex gap-2">
          <button
            type="button"
            onClick={deleteRoom}
            className="p-2 rounded-full bg-white/90 hover:bg-red-500 hover:text-white shadow-md transition-colors"
            title="Видалити"
          >
            <img src={del} className="w-5 h-5 object-contain" alt="Видалити" />
          </button>
          <button
            type="button"
            onClick={openModal}
            className="p-2 rounded-full bg-white/90 hover:bg-blue-500 shadow-md transition-colors"
            title="Редагувати"
          >
            <img src={edit} className="w-5 h-5 object-contain" alt="Редагувати" />
          </button>
        </div>
      </div>

      {/* Card content */}
      <div className="p-4">
        <h3 className="font-semibold text-slate-800 text-base mb-2 truncate" title={formData.name}>
          {formData.name}
        </h3>
        <p className="text-lg font-bold text-blue-600 mb-3">{formData.price} грн</p>
        <div className="grid grid-cols-2 gap-x-4 gap-y-1.5 text-sm text-slate-600">
          <span>Кімнат: {formData.numrooms}</span>
          <span>Поверх: {formData.floor}</span>
          <span>Гостей: {formData.guests}</span>
          <span>Площа: {formData.surface} м²</span>
          <span>Ліжок: {formData.beds}</span>
        </div>
        {formData.additionalProperties &&
          Object.keys(formData.additionalProperties).length > 0 && (
            <div className="mt-3 pt-3 border-t border-slate-100 space-y-0.5">
              {Object.entries(formData.additionalProperties).map(([k, v]) => (
                <p key={k} className="text-xs text-slate-500">
                  {getLabelForKey(k)}: {String(v)}
                </p>
              ))}
            </div>
          )}
      </div>

      {isModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-2 sm:p-4">
          <div
            className="absolute inset-0 bg-black/50 backdrop-blur-sm"
            onClick={closeModal}
            aria-hidden="true"
          />
          <div className="relative z-10 bg-white rounded-xl shadow-2xl flex flex-col w-full max-w-4xl max-h-[95vh] overflow-hidden">
            {/* Header */}
            <div className="flex items-center justify-between px-4 py-3 sm:px-6 bg-slate-600 text-white shrink-0">
              <h2 className="text-base sm:text-lg font-bold">Змінити дані про квартиру</h2>
              <button
                type="button"
                className="px-4 py-2 rounded-lg bg-slate-500 hover:bg-slate-400 transition-colors text-sm font-medium"
                onClick={closeModal}
              >
                Закрити ✕
              </button>
            </div>

            {/* Scrollable content */}
            <div className="flex-1 overflow-y-auto p-4 sm:p-6">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                {/* Left column */}
                <div className="space-y-4">
                  <div>
                    <label className="block text-sm font-medium text-slate-700 mb-1">
                      Назва квартири
                    </label>
                    <input
                      type="text"
                      name="name"
                      value={formData.name}
                      onChange={handleChange}
                      className="w-full px-3 py-2 rounded-lg border border-slate-300 bg-slate-50 focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-slate-700 mb-1">Ціна (грн)</label>
                    <input
                      type="number"
                      name="price"
                      value={editedRoomData.price || ""}
                      onChange={handleInputChange}
                      className="w-full px-3 py-2 rounded-lg border border-slate-300 bg-slate-50 focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-slate-700 mb-1">Опис</label>
                    <textarea
                      name="description"
                      value={editedRoomData.description || ""}
                      onChange={handleInputChange}
                      rows={5}
                      className="w-full px-3 py-2 rounded-lg border border-slate-300 bg-slate-50 focus:ring-2 focus:ring-blue-500 focus:border-blue-500 resize-y min-h-[100px]"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-slate-700 mb-1">
                      Кількість кімнат
                    </label>
                    <input
                      type="number"
                      name="numrooms"
                      value={editedRoomData.numrooms || ""}
                      onChange={handleInputChange}
                      className="w-full px-3 py-2 rounded-lg border border-slate-300 bg-slate-50 focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                    />
                  </div>
                  <select
                    name="category"
                    value={editedRoomData.category || ""}
                    onChange={handleInputChange}
                    className="sr-only"
                    aria-hidden="true"
                    tabIndex={-1}
                  >
                    <option value="romantic">romantic</option>
                    <option value="family">family</option>
                    <option value="business">business</option>
                  </select>
                </div>

                {/* Right column */}
                <div className="space-y-4">
                  <div>
                    <label className="block text-sm font-medium text-slate-700 mb-1">WUBOOK ID</label>
                    <input
                      type="number"
                      name="wubid"
                      value={editedRoomData.wubid || ""}
                      onChange={handleInputChange}
                      className="w-full px-3 py-2 rounded-lg border border-slate-300 bg-slate-50 focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                    />
                  </div>
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <label className="block text-sm font-medium text-slate-700 mb-1">Поверх</label>
                      <input
                        type="number"
                        name="floor"
                        value={editedRoomData.floor || ""}
                        onChange={handleInputChange}
                        className="w-full px-3 py-2 rounded-lg border border-slate-300 bg-slate-50 focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-slate-700 mb-1">Ліжок</label>
                      <input
                        type="number"
                        name="beds"
                        value={editedRoomData.beds || ""}
                        onChange={handleInputChange}
                        className="w-full px-3 py-2 rounded-lg border border-slate-300 bg-slate-50 focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-slate-700 mb-1">Гостей</label>
                      <input
                        type="number"
                        name="guests"
                        value={editedRoomData.guests || ""}
                        onChange={handleInputChange}
                        className="w-full px-3 py-2 rounded-lg border border-slate-300 bg-slate-50 focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-slate-700 mb-1">Площа (м²)</label>
                      <input
                        type="number"
                        name="surface"
                        value={editedRoomData.surface || ""}
                        onChange={handleInputChange}
                        className="w-full px-3 py-2 rounded-lg border border-slate-300 bg-slate-50 focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                      />
                    </div>
                  </div>
                </div>
              </div>

              {/* Additional properties */}
              <div className="mt-6 p-4 rounded-xl border border-slate-200 bg-slate-50">
                <label className="block text-sm font-semibold text-slate-700 mb-3">
                  Додаткові властивості
                </label>
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-x-6 gap-y-3">
                  {ADDITIONAL_PROPERTY_KEYS.map(({ key, label, type, placeholder, default: def }) => (
                    <div
                      key={key}
                      className={`flex items-center gap-3 min-h-[2.5rem] ${
                        type === "boolean" ? "py-1" : ""
                      }`}
                    >
                      {type === "boolean" ? (
                        <>
                          <input
                            type="checkbox"
                            id={`addprop-${key}`}
                            checked={additionalProps[key] ?? def}
                            onChange={(e) => handleAdditionalPropChange(key, e.target.checked)}
                            className="w-4 h-4 shrink-0 rounded border-slate-300 text-blue-600 focus:ring-blue-500 focus:ring-offset-0"
                          />
                          <label
                            htmlFor={`addprop-${key}`}
                            className="text-sm text-slate-600 cursor-pointer select-none"
                          >
                            {label}
                          </label>
                        </>
                      ) : (
                        <>
                          <label className="text-sm text-slate-600 w-28 shrink-0">{label}</label>
                          <input
                            type={type}
                            placeholder={placeholder}
                            value={additionalProps[key] ?? ""}
                            onChange={(e) => handleAdditionalPropChange(key, e.target.value)}
                            className="flex-1 min-w-0 px-3 py-2 rounded-lg border border-slate-300 bg-white focus:ring-2 focus:ring-blue-500 focus:border-blue-500 text-sm"
                          />
                        </>
                      )}
                    </div>
                  ))}
                </div>
              </div>

              {/* Photo upload */}
              <div className="mt-6 flex flex-col sm:flex-row sm:items-center gap-4 p-4 rounded-xl border border-slate-200 bg-slate-50">
                <div className="shrink-0">
                  <label className="block text-sm font-medium text-slate-700 mb-2">
                    Фото квартири
                  </label>
                  {editedRoomData.imgurl?.[0] && (
                    <img
                      src={`https://royalapart.online/api/imgs/${editedRoomData.imgurl[0]}`}
                      alt=""
                      className="w-24 h-24 sm:w-32 sm:h-32 object-cover rounded-lg border border-slate-200"
                    />
                  )}
                </div>
                <div className="flex-1">
                  <input
                    type="file"
                    id="image-input"
                    name="imgurl"
                    accept="image/*"
                    onChange={handleInputChange}
                    className="block w-full text-sm text-slate-600 file:mr-4 file:py-2 file:px-4 file:rounded-lg file:border-0 file:bg-blue-50 file:text-blue-700 hover:file:bg-blue-100"
                  />
                </div>
              </div>
            </div>

            {/* Footer */}
            <div className="shrink-0 px-4 py-3 sm:px-6 border-t border-slate-200 bg-slate-50">
              <button
                type="button"
                className="w-full sm:w-auto px-6 py-2.5 rounded-lg bg-green-600 hover:bg-green-700 text-white font-medium transition-colors"
                onClick={() => handleSubmit(room)}
              >
                Зберегти зміни
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

export default SingleRoom;
