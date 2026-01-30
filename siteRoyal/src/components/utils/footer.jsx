/* eslint-disable react/prop-types */
import Container from "./Container";
import { useTranslation } from "react-i18next";
import { Link } from "react-router-dom";

export default function Footer() {
  const { t } = useTranslation();

  const navigation = [
    { label: t("services"), href: "/" },
    { label: t("opportunities"), href: "/" },
    { label: t("prices"), href: "/" },
    { label: t("company"), href: "/" },
    { label: t("blog"), href: "/" },
  ];

  const legal = [
    { label: t("terms"), href: "/terms-and-conditions" },
    { label: t("privacy"), href: "/privacy-policy" },
  ];

  return (
    <footer className="relative bg-back text-black text-sm font-roboto border-t border-gray-200">
      <Container>
        <div className="grid max-w-screen-xl grid-cols-1 gap-6 pt-6 mx-auto mt-5 lg:grid-cols-4">
          {/* Контактна інформація */}
          <div>
            <div className="mt-2 text-black text-base font-semibold">
              {t("contact_information")}:
            </div>
            <div>{t("address")}: м. Львів, вулиця Весела 5</div>
            <div>{t("phone")}: +38 (067) 677-73-30</div>
            <div>{t("email")}: royal.apartments@ukr.net</div>
          </div>

          {/* Навігація */}
          <div>
            <div className="flex flex-wrap w-full mt-2 -ml-3 lg:ml-0">
              {navigation.map((item, index) => (
                <Link
                  key={index}
                  to={item.href}
                  className="w-full px-4 py-2 text-gray-900 rounded-md hover:text-amber-500 transition-colors"
                >
                  {item.label}
                </Link>
              ))}
            </div>
          </div>

          {/* Правова інформація */}
          <div>
            <div className="flex flex-wrap w-full mt-2 -ml-3 lg:ml-0">
              {legal.map((item, index) => (
                <Link
                  key={index}
                  to={item.href}
                  className="w-full px-4 py-2 text-black rounded-md hover:text-amber-500 transition-colors"
                >
                  {item.label}
                </Link>
              ))}
            </div>
          </div>

          {/* Соцмережі */}
          <div className="flex flex-col items-center justify-center">
            <div className="flex items-center justify-center text-black">
              <p className="text-base m-1">{t("subscribe_us")}</p>
              <a
                href="https://www.instagram.com/royal.apart/"
                target="_blank"
                rel="noopener noreferrer"
                className="relative"
              >
                <span className="animate-ping absolute inline-flex h-3.5 w-3.5 rounded-full bg-amber-500 opacity-75 top-1 right-1"></span>
                <span className="sr-only">Instagram</span>
                <Instagram />
              </a>
            </div>
          </div>
        </div>

        {/* Нижня частина футера */}
        <div className="mt-6 mb-2 text-sm text-center text-gray-600">
          <p>
            © {new Date().getFullYear()} Royal Apart. {t("made_with_love")} ❤️{" "}
            <span className="text-amber-500 font-medium">
              Royal Apart IT {t("department")}
            </span>
          </p>
          <p className="mt-1 text-gray-500">
            Використовуючи цей сайт, ви погоджуєтесь із{" "}
            <Link
              to="/terms-and-conditions"
              className="text-amber-600 hover:text-amber-500 underline underline-offset-2 transition-colors"
            >
              Правилами та умовами користування
            </Link>
            .
          </p>
        </div>
      </Container>
    </footer>
  );
}

const Instagram = ({ size = 24 }) => (
  <svg
    xmlns="http://www.w3.org/2000/svg"
    width={size}
    height={size}
    viewBox="0 0 24 24"
    fill="currentColor"
  >
    <path d="M16.98 0a6.9 6.9 0 0 1 5.08 1.98A6.94 6.94 0 0 1 24 7.02v9.96c0 2.08-.68 3.87-1.98 5.13A7.14 7.14 0 0 1 16.94 24H7.06a7.06 7.06 0 0 1-5.03-1.89A6.96 6.96 0 0 1 0 16.94V7.02C0 2.8 2.8 0 7.02 0h9.96zm.05 2.23H7.06c-1.45 0-2.7.43-3.53 1.25a4.82 4.82 0 0 0-1.3 3.54v9.92c0 1.5.43 2.7 1.3 3.58a5 5 0 0 0 3.53 1.25h9.88a5 5 0 0 0 3.53-1.25 4.73 4.73 0 0 0 1.4-3.54V7.02a5 5 0 0 0-1.3-3.49 4.82 4.82 0 0 0-3.54-1.3zM12 5.76c3.39 0 6.2 2.8 6.2 6.2a6.2 6.2 0 0 1-12.4 0 6.2 6.2 0 0 1 6.2-6.2zm0 2.22a3.99 3.99 0 0 0-3.97 3.97A3.99 3.99 0 0 0 12 15.92a3.99 3.99 0 0 0 3.97-3.97A3.99 3.99 0 0 0 12 7.98zm6.44-3.77a1.4 1.4 0 1 1 0 2.8 1.4 1.4 0 0 1 0-2.8z" />
  </svg>
);
