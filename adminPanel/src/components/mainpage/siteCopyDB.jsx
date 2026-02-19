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
        className="bg-amber-600 h-8 w-[170px] m-1 px-3 ml-4 text-sm font-semibold text-zinc-50 rounded-lg hover:bg-amber-700"
      >
        Оновити дані на сайті
      </button>
    </div>
  );
}

export default siteCopyDB;
