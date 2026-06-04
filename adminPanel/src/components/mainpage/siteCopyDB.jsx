import React from "react";
import axios from "axios";
function siteCopyDB() {
  const delay = (ms) => new Promise((resolve) => setTimeout(resolve, ms));

  async function handleClick() {
    console.log("clicked");
    alert("Зміни завантажуються на сайт..... зачекайте 20секунд");
    try {
      const response = await axios.get(
        "https://royalapart.online/api/siteRoyal/copy-db"
      );
      console.log("copy-db:", response.data);

      await delay(5000);
      const imagesResponse = await axios.get(
        "https://royalapart.online/api/siteRoyal/update-wodoo-images"
      );
      console.log("update-wodoo-images:", imagesResponse.data);

      await delay(5000);
      const wodooResponse = await axios.get(
        "https://royalapart.online/api/siteRoyal/get-all-wodoo"
      );
      console.log("get-all-wodoo:", wodooResponse.data);

      alert("Готово! Дані та зображення оновлено на сайті.");
    } catch (error) {
      console.error("Error updating site data:", error);
      alert("Помилка при оновленні даних на сайті. Спробуйте ще раз.");
    }
  }
  return (
    <div>
      <button
        onClick={handleClick}
        className="bg-amber-600 h-8 w-[170px] m-1 px-3 ml-4 text-sm font-semibold text-zinc-50 rounded-lg hover:bg-amber-700"
      >
        Оновити дані на сайті
      </button>
    </div>
  );
}

export default siteCopyDB;
