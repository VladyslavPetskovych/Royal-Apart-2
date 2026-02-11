import React, { useMemo, useEffect, useState } from "react";
import { useTranslation } from "react-i18next";
import { useDispatch, useSelector } from "react-redux";
import { useLocation, useNavigate } from "react-router-dom";

import ukFlag from "../../assets/flags/Flag_of_Ukraine.png";
import engFlag from "../../assets/flags/Flag_of_the_United_Kingdom.png";

import { setLanguage, selectLanguage } from "../../redux/languageSlice";

const LanguageSelector = () => {
  const { t, i18n } = useTranslation();
  const dispatch = useDispatch();
  const navigate = useNavigate();
  const location = useLocation();

  const reduxLang = useSelector(selectLanguage); // "uk" | "en"
  const [isOpen, setIsOpen] = useState(false);

  const languages = useMemo(
    () => [
      { code: "uk", name: t("Ukrainian"), flag: ukFlag },
      { code: "en", name: t("English"), flag: engFlag },
    ],
    [t],
  );

  useEffect(() => {
    const current = (i18n.resolvedLanguage || i18n.language || "uk").split(
      "-",
    )[0];
    const next = (reduxLang || "uk").split("-")[0];

    console.log("[LangSelector] reduxLang:", reduxLang, "i18n:", current);

    if (next && current !== next) {
      console.log("[LangSelector] i18n.changeLanguage ->", next);
      i18n.changeLanguage(next);
    }
  }, [reduxLang, i18n]);

  const currentLang = reduxLang === "en" ? "en" : "uk";
  const currentFlag =
    languages.find((l) => l.code === currentLang)?.flag || ukFlag;

  const toggleDropdown = () => setIsOpen((v) => !v);

  const changeLanguage = (language) => {
    const next = language.code;

    console.log("[LangSelector] CLICK change ->", next);
    console.log("[LangSelector] current path:", location.pathname);

    // 1) redux
    dispatch(setLanguage(next));

    // 2) i18n
    i18n.changeLanguage(next);

    // 3) update URL prefix if it starts with /uk or /en
    const newPath = location.pathname.replace(/^\/(uk|en)(\/|$)/, `/${next}$2`);

    // If user is on a non-prefixed route like "/aparts", you can optionally
    // navigate to "/en" or "/uk" home:
    const finalPath =
      newPath === location.pathname
        ? `/${next}` // fallback
        : newPath + location.search + location.hash;

    console.log("[LangSelector] navigate ->", finalPath);
    navigate(finalPath);

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
        <ul className="absolute pr-8 right-0 z-10 mt-2 origin-top-right bg-white border border-gray-200 divide-y divide-gray-100 rounded-md shadow-lg outline-none translate-x-3">
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
