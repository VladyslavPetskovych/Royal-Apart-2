import React from "react";
import { Helmet } from "react-helmet-async";
import { useTranslation } from "react-i18next";
import { useLocation } from "react-router-dom";

function SEO({ title, description }) {
  const { i18n } = useTranslation();
  const location = useLocation();

  const baseUrl = "https://royalapart.online";
  const currentUrl = baseUrl + location.pathname;

  const defaultTitle = "Оренда квартир у Львові подобово | Royal Apart";
  const defaultDescription =
    "Бронюй квартиру у Львові за доступними цінами. Зручне розташування, комфортні умови.";

  return (
    <Helmet>
      <html lang={i18n.language || "uk"} />

      <title>{title || defaultTitle}</title>
      <meta name="description" content={description || defaultDescription} />

      <link rel="canonical" href={currentUrl} />

      <meta property="og:title" content={title || defaultTitle} />
      <meta
        property="og:description"
        content={description || defaultDescription}
      />
      <meta property="og:url" content={currentUrl} />
      <meta property="og:type" content="website" />
      <meta property="og:image" content="https://royalapart.online/og.jpg" />

      <meta name="twitter:card" content="summary_large_image" />
      <meta name="twitter:title" content={title || defaultTitle} />
      <meta
        name="twitter:description"
        content={description || defaultDescription}
      />
      <meta name="twitter:image" content="https://royalapart.online/og.jpg" />
    </Helmet>
  );
}

export default SEO;
