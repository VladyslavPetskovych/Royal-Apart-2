import React from "react";

import img1 from "../../assets/newDesign/home/imageService1.png";
import img2 from "../../assets/newDesign/home/imageService2.png";
import img3 from "../../assets/newDesign/home/imageService3.png";
import img4 from "../../assets/newDesign/home/imageService4.png";
import img5 from "../../assets/newDesign/home/imageService5.png";

import flowerLeft from "../../assets/newDesign/home/flowerLeft.png";
import flowerRight from "../../assets/newDesign/home/flowerRight.png";

function ExeptionalService() {
  return (
    <section className="relative overflow-hidden bg-[#F4EEDF] py-10 sm:py-12 lg:py-14">
      {/* DECOR FLOWERS */}
      <img
        src={flowerLeft}
        alt=""
        className="pointer-events-none absolute -left-10 top-8 w-[220px] opacity-40 sm:-left-6 sm:w-[260px] lg:left-0 lg:top-10 lg:opacity-60"
        draggable="false"
      />
      <img
        src={flowerRight}
        alt=""
        className="pointer-events-none absolute -right-10 top-8 w-[220px] opacity-40 sm:-right-6 sm:w-[260px] lg:right-0 lg:top-10 lg:opacity-60"
        draggable="false"
      />

      <div className="mx-auto max-w-[1200px] px-5 sm:px-6">
        {/* TITLE */}
        <h2 className="mx-auto max-w-[700px] text-center font-oranienbaum text-[30px] leading-[1.1] tracking-wide text-brand-black sm:text-[36px] lg:text-[42px]">
          ВИНЯТКОВИЙ СЕРВІС
          <br />І ВІДДАНА КОМАНДА!
        </h2>

        {/* TEXT */}
        <p className="mx-auto mt-5 max-w-[820px] text-center font-finlandica text-[13px] leading-[1.7] text-brand-black/60 sm:mt-6 sm:text-[14px]">
          Кожен наш гість унікальний, тому ми створили добірку індивідуальних
          послуг та вражень, щоб зробити перебування по-справжньому незабутнім.
          Наша команда, сформована з експертів у сфері розкішної гостинності,
          забезпечує бездоганний сервіс. Ми уважно та делікатно передбачаємо
          бажання кожного гостя, піклуючись про найдрібніші деталі.
        </p>

        {/* IMAGES ROW */}
        <div className="md:-mt-5 lg:-mt-12  flex items-center justify-center gap-3  sm:gap-5 lg:gap-8">
          {/* LEFT STACK */}
          <div className="mt-[180px] flex items-start gap-3 sm:mt-[220px] sm:gap-5 lg:mt-[260px] lg:gap-8">
            {/* img1: ONLY desktop (lg+) */}
            <img
              src={img1}
              alt=""
              className={[
                "hidden object-cover shadow-lg lg:block",
                // keep original proportions, but allow shrinking so it never overlaps
                "h-[clamp(200px,18vw,250px)] w-[clamp(120px,9vw,150px)]",
              ].join(" ")}
              draggable="false"
            />

            {/* img2: tablet+ (md+) and desktop */}
            <img
              src={img2}
              alt=""
              className={[
                "hidden object-cover shadow-lg md:block",
                // tablet size -> desktop size (matches your lg:h/w)
                "h-[clamp(220px,22vw,330px)] w-[clamp(140px,11vw,220px)]",
              ].join(" ")}
              draggable="false"
            />
          </div>

          {/* BIG CENTER: always visible */}
          <img
            src={img3}
            alt=""
            className={[
              "object-cover shadow-xl",
              // responsive center that still matches your sm/lg targets
              "h-[clamp(320px,46vw,460px)] w-[clamp(210px,30vw,300px)]",
              // keep your sm sizing feel
              "sm:h-[clamp(380px,40vw,410px)] sm:w-[clamp(240px,28vw,270px)]",
            ].join(" ")}
            draggable="false"
          />

          {/* RIGHT STACK */}
          <div className="mt-[140px] flex items-start gap-3 sm:mt-[220px] sm:gap-5 lg:mt-[260px] lg:gap-8">
            {/* img4: tablet+ (md+) and desktop */}
            <img
              src={img4}
              alt=""
              className={[
                "hidden object-cover shadow-lg md:block",
                "h-[clamp(220px,22vw,330px)] w-[clamp(140px,11vw,220px)]",
              ].join(" ")}
              draggable="false"
            />

            {/* img5: ONLY desktop (lg+) */}
            <img
              src={img5}
              alt=""
              className={[
                "hidden object-cover shadow-lg lg:block",
                "h-[clamp(200px,18vw,250px)] w-[clamp(120px,9vw,150px)]",
              ].join(" ")}
              draggable="false"
            />
          </div>
        </div>
      </div>
    </section>
  );
}

export default ExeptionalService;
