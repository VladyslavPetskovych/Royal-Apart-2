import React from "react";
import Image from "../../assets/newDesign/AboutUs/JustImage1.jpg";

function JustImage() {
  return (
    <section className="w-full bg-white">
      <div className="relative h-[80vh] w-full overflow-hidden">
        <img
          src={Image}
          alt="Royal Apart Interior"
          draggable={false}
          className="
            h-full w-full
            object-cover
            object-center
          "
        />
      </div>
    </section>
  );
}

export default JustImage;
