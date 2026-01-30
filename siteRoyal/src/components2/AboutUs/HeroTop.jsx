import React from "react";
import hero from "../../assets/newDesign/AboutUs/Hero.webp";

function HeroTop() {
  return (
    <section className="bg-brand-black pt-16">
      <div className="relative w-full overflow-hidden">
        {/* IMAGE */}
        <div className="h-[70vh] sm:h-[70vh] md:h-[75vh] lg:h-[75vh]">
          <img
            src={hero}
            alt="Про нас"
            draggable={false}
            className="h-full w-full object-cover object-top"
          />
        </div>

        {/* DARK OVERLAY */}
        <div className="pointer-events-none absolute inset-0 bg-black/25" />

        {/* TEXT */}
        <div className="absolute inset-0 flex items-center justify-center px-6">
          <div className="relative text-center">
            {/* subtle glow behind text */}
            <div className="absolute inset-0 -z-10 blur-2xl bg-black/30 rounded-full" />

            <p
              className="
                font-oranienbaum font-extrabold
                text-[35px] sm:text-[38px] md:text-[48px] lg:text-[59px]
                tracking-[0.14em]
                text-white

                /* OUTLINE EFFECT */
                [text-shadow:
                  -1px_-1px_0_rgba(0,0,0,0.45),
                  1px_-1px_0_rgba(0,0,0,0.45),
                  -1px_1px_0_rgba(0,0,0,0.45),
                  1px_1px_0_rgba(0,0,0,0.45),
                  0_8px_24px_rgba(0,0,0,0.45)
                ]
              "
            >
              ПРО НАС
            </p>

            <p
              className="
                mt-2
                font-oranienbaum font-medium
                text-[18px] sm:text-[22px] md:text-[28px] lg:text-[34px]
                tracking-[0.16em]
                text-white

                [text-shadow:
                  -1px_-1px_0_rgba(0,0,0,0.45),
                  1px_-1px_0_rgba(0,0,0,0.45),
                  -1px_1px_0_rgba(0,0,0,0.45),
                  1px_1px_0_rgba(0,0,0,0.45),
                  0_6px_20px_rgba(0,0,0,0.45)
                ]
              "
            >
              ТА НАШ ОСОБЛИВИЙ ДОСВІД!
            </p>
          </div>
        </div>
      </div>
    </section>
  );
}

export default HeroTop;
