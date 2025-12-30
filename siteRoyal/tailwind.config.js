/** @type {import('tailwindcss').Config} */
import scrollbarHide from "tailwind-scrollbar-hide";

export default {
  content: ["./index.html", "./src/**/*.{js,ts,jsx,tsx}"],
  theme: {
    extend: {
      textShadow: {
        soft: "0 2px 6px rgba(0,0,0,0.45)",
        normal: "0 3px 8px rgba(0,0,0,0.6)",
        strong: "0 8px 14px rgba(0,0,0,0.95)",
        hero: "0 3px 10px rgba(0,0,0,0.85), 0 10px 26px rgba(0,0,0,0.55)",
        hero2: "0 2px 6px rgba(0,0,0,0.9), 0 6px 18px rgba(0,0,0,0.7)",
      },
      keyframes: {
        fadeIn: {
          "0%": { opacity: 0 },
          "100%": { opacity: 1 },
        },
      },

      animation: {
        fadeIn: "fadeIn 1s ease-in-out",
      },

      colors: {
        mainC: "#1f2937",
        textW: "#D5D0D0",
        shit: "#452b05",
        shit2: "#1f1306",
        shit3: "#6b3c00",
        back: "#fff4ed",

        brand: {
          black: "#131217",
          beige: "#EBE6DA",
          beigeDark: "#B1A482",
          bordo: "#63121B",
        },
      },

      fontFamily: {
        nunito: ["Nunito Sans", "sans-serif"],
        josefin: ["Josefin Sans", "sans-serif"],
        popins: ["Poppins", "sans-serif"],
        oswald: ["Oswald", "sans-serif"],
        roboto: ["Roboto Slab", "sans-serif"],

        finlandica: ["Finlandica", "sans-serif"],
        oranienbaum: ["Oranienbaum", "serif"],
      },
    },
  },
  plugins: [
    scrollbarHide,

    function ({ addUtilities, theme }) {
      const shadows = theme("textShadow");
      const utilities = Object.entries(shadows).map(([key, value]) => ({
        [`.text-shadow-${key}`]: {
          textShadow: value,
        },
      }));
      addUtilities(Object.assign({}, ...utilities));
    },
  ],
};
