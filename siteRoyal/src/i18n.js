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
const APP_LANG_KEY = "app_lang";

export const i18nReady = loadLocaleData().then((resources) => {
  const savedApp = localStorage.getItem(APP_LANG_KEY);
  const savedI18n = localStorage.getItem(STORAGE_KEY);
  const initialLng =
    savedApp && ["uk", "en"].includes(savedApp)
      ? savedApp
      : savedI18n && ["uk", "en"].includes(savedI18n)
        ? savedI18n
        : "uk";

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
