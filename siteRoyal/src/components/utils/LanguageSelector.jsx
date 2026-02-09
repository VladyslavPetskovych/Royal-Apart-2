import React, { useMemo, useEffect, useState } from "react";
import { useTranslation } from "react-i18next";
import { useDispatch, useSelector } from "react-redux";

import ukFlag from "../../assets/flags/Flag_of_Ukraine.png";
import engFlag from "../../assets/flags/Flag_of_the_United_Kingdom.png";

import { setLanguage, selectLanguage } from "../../redux/languageSlice";

const LanguageSelector = () => {
  const { t, i18n } = useTranslation();
  const dispatch = useDispatch();

  const reduxLang = useSelector(selectLanguage); // ✅ "uk" | "en"
  const [isOpen, setIsOpen] = useState(false);

  const languages = useMemo(
    () => [
      { code: "uk", name: t("Ukrainian"), flag: ukFlag },
      { code: "en", name: t("English"), flag: engFlag },
    ],
    [t],
  );

  // ✅ Ensure i18n matches Redux on load + whenever Redux changes
  useEffect(() => {
    const current = (i18n.resolvedLanguage || i18n.language || "uk").split(
      "-",
    )[0];

    const next = (reduxLang || "uk").split("-")[0];

    if (next && current !== next) {
      i18n.changeLanguage(next);
    }
  }, [reduxLang, i18n]);

  const currentLang = (reduxLang || "uk").split("-")[0];
  const currentFlag =
    languages.find((lang) => lang.code === currentLang)?.flag || ukFlag;

  const toggleDropdown = () => setIsOpen((v) => !v);

  const changeLanguage = (language) => {
    // ✅ 1) update Redux (your blog uses Redux)
    dispatch(setLanguage(language.code));

    // ✅ 2) update i18n immediately (UI translations)
    i18n.changeLanguage(language.code);

    setIsOpen(false);
  };

  return (
    <div className="relative">
      <button
        type="button"
        onClick={toggleDropdown}
        className="flex items-center space-x-1 text-sm font-medium text-gray-600 focus:outline-none"
      >
        <img className="w-8 h-6" src={currentFlag} alt="Language flag" />
      </button>

      {isOpen && (
        <ul
          // ✅ add right padding so it doesn't stick to the screen edge
          className="absolute pr-8 right-0 z-10 mt-2 origin-top-right bg-white border border-gray-200 divide-y divide-gray-100 rounded-md shadow-lg outline-none translate-x-3"
        >
          {languages.map((language) => (
            <li
              key={language.code}
              onClick={() => changeLanguage(language)}
              className="cursor-pointer select-none text-gray-900 hover:bg-gray-100 py-2 px-4 flex items-center gap-3"
            >
              <img
                className="w-8 h-6"
                src={language.flag}
                alt="Language flag"
              />
              <span className="whitespace-nowrap">{language.name}</span>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
};

export default LanguageSelector;
