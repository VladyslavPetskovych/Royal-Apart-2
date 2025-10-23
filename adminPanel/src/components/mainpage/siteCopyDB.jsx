import React from "react";
import axios from "axios";
function siteCopyDB() {
  async function handleClick() {
    console.log("clicked");
    alert("Зміни завантажуються на сайт..... зачекайте 20секунд");
   const response =  await axios.get(
      "https://royalapart.online/api/siteRoyal/copy-db"
    );
    console.log(response.data)
   
  }
  return (
    <div>
      <button
        onClick={handleClick}
        className="bg-amber-600 h-9 w-[220px] m-1 px-4 ml-4 text-lg font-semibold text-zinc-50 rounded-lg hover:bg-amber-700"
      >
        Оновити дані на сайті
      </button>
    </div>
  );
}

export default siteCopyDB;
