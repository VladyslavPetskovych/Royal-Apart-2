import React, { useEffect, useMemo } from "react";
import { useParams, Link } from "react-router-dom";

import { useSelector } from "react-redux";
import { useTranslation } from "react-i18next";

import blogData from "../../blogData.json";
import { selectLanguage } from "../redux/languageSlice";

import imageBlog1 from "../assets/blog/imageBlog1.png";
import imageBlog2 from "../assets/blog/imageBlog2.png";
import imageBlog3 from "../assets/blog/imageBlog3.png";

import flowerLeft from "../assets/newDesign/home/flowerLeft.png";
import flowerRight from "../assets/newDesign/home/flowerRight.png";

const IMAGE_MAP = {
  "imageBlog1.png": imageBlog1,
  "imageBlog2.png": imageBlog2,
  "imageBlog3.png": imageBlog3,
};

// ✅ supports mixed json format:
// - heading: text / text_en
// - paragraph: text / text_en (also works if only text_en exists)
// - list: items / items_en
function BlogContent({ content, isEn }) {
  if (!Array.isArray(content) || content.length === 0) return null;

  return (
    <div className="mt-8 space-y-6">
      {content.map((block, i) => {
        if (!block || typeof block !== "object") return null;

        if (block.type === "heading") {
          const level = Number(block.level) || 2;
          const text =
            (isEn ? block.text_en : block.text) ||
            block.text ||
            block.text_en ||
            "";

          if (!text) return null;

          if (level === 3) {
            return (
              <div key={i} className="pt-2">
                <h3 className="font-finlandica text-[18px] sm:text-[20px] font-semibold uppercase tracking-[0.6px] text-brand-black/85">
                  {text}
                </h3>
                <div className="mt-3 h-[1px] w-full bg-brand-black/10" />
              </div>
            );
          }

          return (
            <div key={i} className="pt-3">
              <h2 className="font-finlandica text-[20px] sm:text-[22px] font-semibold uppercase tracking-[0.6px] text-brand-black/85">
                {text}
              </h2>
              <div className="mt-3 h-[1px] w-full bg-brand-black/10" />
            </div>
          );
        }

        if (block.type === "paragraph") {
          const text =
            (isEn ? block.text_en : block.text) ||
            block.text ||
            block.text_en ||
            "";

          if (!text) return null;

          return (
            <p
              key={i}
              className="font-finlandica text-[16px] sm:text-[17px] leading-[1.85] text-brand-black/70"
            >
              {text}
            </p>
          );
        }

        if (block.type === "list") {
          const items =
            (isEn ? block.items_en : block.items) ||
            block.items ||
            block.items_en ||
            [];

          if (!Array.isArray(items) || items.length === 0) return null;

          return (
            <ul
              key={i}
              className="space-y-2 pl-5 font-finlandica text-[16px] sm:text-[17px] leading-[1.75] text-brand-black/70"
            >
              {items.map((item, idx) => (
                <li key={idx} className="list-disc marker:text-brand-black/40">
                  {item}
                </li>
              ))}
            </ul>
          );
        }

        return null;
      })}
    </div>
  );
}

export default function BlogArticle() {
  const { id } = useParams(); // /blog/:id
  const { i18n } = useTranslation();

  // ✅ language from Redux only
  const reduxLang = useSelector(selectLanguage); // "uk" | "en"
  const lang = reduxLang === "en" ? "en" : "uk";
  const isEn = lang === "en";

  // ✅ keep i18n synced with redux
  useEffect(() => {
    if (i18n.language !== lang) i18n.changeLanguage(lang);
    document.documentElement.lang = lang;
  }, [lang, i18n]);

  // ✅ find article by id (url starts from 1)
  const articleRaw = useMemo(() => {
    if (!Array.isArray(blogData)) return null;
    const index = Number(id) - 1;
    if (Number.isNaN(index) || index < 0 || index >= blogData.length)
      return null;
    return blogData[index];
  }, [id]);

  // ✅ translate top fields (content stays as original array with text/text_en)
  const article = useMemo(() => {
    if (!articleRaw) return null;

    const title = isEn
      ? articleRaw.title_en || articleRaw.title
      : articleRaw.title;

    const category = isEn
      ? articleRaw.category_en || articleRaw.category
      : articleRaw.category;

    const excerpt = isEn
      ? articleRaw.excerpt_en || articleRaw.excerpt
      : articleRaw.excerpt;

    return {
      ...articleRaw,
      title,
      category,
      excerpt,
      content: articleRaw.content, // ✅ important: use mixed format (text_en/items_en inside)
    };
  }, [articleRaw, isEn]);

  const imageSrc = useMemo(() => {
    if (!articleRaw?.image) return null;
    return IMAGE_MAP[articleRaw.image] || null;
  }, [articleRaw]);

  if (!article) {
    return (
      <main className="bg-brand-beige">
        <div className="pt-16 bg-brand-black" />
        <div className="mx-auto max-w-[980px] px-6 py-16">
          <p className="font-finlandica text-[16px] text-brand-black/70">
            {isEn ? "Article not found" : "Статтю не знайдено"}
          </p>
          <Link
            to="/"
            className="mt-4 inline-flex font-finlandica text-[14px] font-semibold underline underline-offset-[6px]"
          >
            ← {isEn ? "Back" : "Назад"}
          </Link>
        </div>
      </main>
    );
  }

  return (
    <main className="bg-brand-beige">
      <div className="pt-16 bg-brand-black" />

      <section className="relative overflow-hidden bg-brand-beige">
        <img
          src={flowerLeft}
          alt=""
          className="pointer-events-none absolute left-0 top-[-10px] w-[180px] sm:w-[220px] opacity-80"
          loading="lazy"
        />
        <img
          src={flowerRight}
          alt=""
          className="pointer-events-none absolute right-0 top-[-10px] w-[180px] sm:w-[220px] opacity-80"
          loading="lazy"
        />

        <div className="mx-auto w-full max-w-[980px] px-4 sm:px-6">
          <div className="relative -mt-1 rounded-[6px] border border-brand-black/10 bg-white/50 backdrop-blur-[2px] shadow-[0_10px_30px_rgba(0,0,0,0.06)]">
            <div className="px-5 py-6 sm:px-8 sm:py-8 lg:px-10">
              {/* breadcrumbs */}
              <div className="mb-5 flex items-center gap-2 font-finlandica text-[14px] text-brand-black/60">
                <Link to="/" className="hover:underline underline-offset-4">
                  {isEn ? "Home" : "Головна"}
                </Link>
                <span className="opacity-60">/</span>
                <span className="text-brand-black/80">
                  {isEn ? "Blog" : "Блог"}
                </span>
              </div>

              {/* title */}
              <div className="mb-6 text-left">
                <div className="font-finlandica text-[12px] font-semibold uppercase tracking-[0.9px] text-brand-black/45">
                  {article.category}
                </div>

                <h1 className="mt-2 font-finlandica text-[22px] sm:text-[30px] font-semibold uppercase leading-[1.2] tracking-[0.6px] text-brand-black/85">
                  {article.title}
                </h1>

                {article.excerpt && (
                  <p className="mt-4 max-w-[760px] font-finlandica text-[16px] sm:text-[17px] leading-[1.85] text-brand-black/65">
                    {article.excerpt}
                  </p>
                )}
              </div>

              {/* image */}
              {imageSrc && (
                <div className="overflow-hidden rounded-[4px] bg-brand-beigeDark/20">
                  <div className="aspect-[16/9] w-full">
                    <img
                      src={imageSrc}
                      alt={article.title}
                      className="h-full w-full object-cover"
                      loading="lazy"
                    />
                  </div>
                </div>
              )}

              {/* content */}
              <article className="mt-8 text-left">
                <BlogContent content={article.content} isEn={isEn} />
              </article>

              {/* back */}
              <div className="mt-10">
                <Link
                  to="/"
                  className="inline-flex items-center gap-2 font-finlandica text-[14px] font-semibold text-brand-black underline underline-offset-[6px] decoration-brand-black/60 hover:decoration-brand-black"
                >
                  ← {isEn ? "Back" : "Назад"}
                </Link>
              </div>
            </div>
          </div>
        </div>

        <div className="h-14 sm:h-16" />
      </section>
    </main>
  );
}
