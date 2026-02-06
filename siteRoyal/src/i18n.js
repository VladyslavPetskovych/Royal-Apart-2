import { initReactI18next } from "react-i18next";
import i18n from "i18next";

const loadLocaleData = async () => {
  const [en, uk] = await Promise.all([
    import("./en.json"),
    import("./uk.json"),
  ]);
  return {
    en: { translation: en.default },
    uk: { translation: uk.default },
  };
};

const STORAGE_KEY = "i18nextLng";

export const i18nReady = loadLocaleData().then((resources) => {
  const savedLng = localStorage.getItem(STORAGE_KEY);
  const initialLng = savedLng && ["uk", "en"].includes(savedLng) ? savedLng : "uk";

  return i18n.use(initReactI18next).init({
    resources,
    lng: initialLng,
    fallbackLng: "uk",
    supportedLngs: ["uk", "en"],
    interpolation: {
      escapeValue: false,
    },
  }).then(() => {
    i18n.on("languageChanged", (lng) => {
      localStorage.setItem(STORAGE_KEY, lng);
    });
  });
});
