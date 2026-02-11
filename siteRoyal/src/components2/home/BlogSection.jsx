import React, { useMemo } from "react";
import { useTranslation } from "react-i18next";
import { Link } from "react-router-dom";
import { useSelector } from "react-redux";

import { selectLanguage } from "../../redux/languageSlice";
import blogData from "../../../blogData.json";

import imageBlog1 from "../../assets/blog/imageBlog1.png";
import imageBlog2 from "../../assets/blog/imageBlog2.png";
import imageBlog3 from "../../assets/blog/imageBlog3.png";

const IMAGE_MAP = {
  "imageBlog1.png": imageBlog1,
  "imageBlog2.png": imageBlog2,
  "imageBlog3.png": imageBlog3,
};

const slugifyLocal = (s = "") =>
  s
    .toString()
    .toLowerCase()
    .trim()
    .replace(/[’']/g, "")
    .replace(/[^a-z0-9а-яіїєґ\s-]/gi, "")
    .replace(/\s+/g, "-")
    .replace(/-+/g, "-");

export default function BlogSection() {
  const { t } = useTranslation();

  // ✅ ONLY redux decides URL language
  const reduxLang = useSelector(selectLanguage); // "uk" | "en"
  const lang = reduxLang === "en" ? "en" : "uk";
  const isEn = lang === "en";

  const blogs = useMemo(() => {
    if (!Array.isArray(blogData)) return [];

    return blogData
      .map((item) => {
        const title = isEn ? item.title_en || item.title : item.title;
        const category = isEn
          ? item.category_en || item.category
          : item.category;
        const excerpt = isEn ? item.excerpt_en || item.excerpt : item.excerpt;

        return {
          ...item,
          titleView: title,
          categoryView: category,
          excerptView: excerpt,
          slug: item.slug || slugifyLocal(title),
          imageSrc: IMAGE_MAP[item.image],
        };
      })
      .filter((b) => b.slug);
  }, [isEn]);

  const visible = blogs.slice(0, 6);

  return (
    <section className="bg-brand-beige">
      <div className="mx-auto w-full max-w-[1320px] px-4 py-10 sm:px-6 sm:py-12 lg:py-14">
        <div className="flex items-center justify-between">
          <h2 className="font-finlandica text-[20px] font-semibold uppercase tracking-[0.8px] text-brand-black">
            {t("our_blog")}
          </h2>

          <Link
            to={`/${lang}/blog`}
            className="group inline-flex items-center gap-3 font-finlandica text-[14px] font-medium text-brand-black hover:text-brand-black"
          >
            <span className="text-brand-black/80">{t("all_articles")}</span>
            <span className="text-[18px] transition-transform duration-200 group-hover:translate-x-[2px]">
              →
            </span>
          </Link>
        </div>

        {/* MOBILE */}
        <div className="mt-7 md:hidden">
          <div className="-mx-4 flex gap-6 overflow-x-auto px-4 pb-2 scrollbar-hide">
            {visible.map((blog, idx) => (
              <article
                key={blog.id ?? blog.slug ?? idx}
                className="shrink-0 w-[82vw] max-w-[460px]"
              >
                <Link to={`/${lang}/blog/${idx + 1}`} className="group block">
                  <div className="overflow-hidden rounded-[3px] bg-brand-beigeDark/20">
                    <div className="aspect-[4/5] w-full">
                      {blog.imageSrc && (
                        <img
                          src={blog.imageSrc}
                          alt={blog.titleView}
                          className="h-full w-full object-cover transition-transform duration-300 group-hover:scale-[1.02]"
                          loading="lazy"
                        />
                      )}
                    </div>
                  </div>

                  <div className="mt-5 text-left">
                    <div className="font-finlandica text-[12px] font-semibold uppercase tracking-[0.8px] text-brand-black/45">
                      {blog.categoryView}
                    </div>

                    <h3 className="mt-2 font-finlandica text-[16px] font-semibold uppercase leading-[1.25] tracking-[0.6px] text-brand-black/70">
                      {blog.titleView}
                    </h3>

                    <div className="mt-3 inline-flex font-finlandica text-[14px] font-semibold text-brand-black underline underline-offset-[6px] decoration-brand-black/70">
                      {t("read_more")}
                    </div>
                  </div>
                </Link>
              </article>
            ))}
          </div>
        </div>

        {/* DESKTOP */}
        <div className="mt-8 hidden grid-cols-1 gap-6 md:grid md:grid-cols-3 md:gap-7">
          {visible.slice(0, 3).map((blog, idx) => (
            <article key={blog.id ?? blog.slug ?? idx}>
              <Link to={`/blog/${idx + 1}`} className="group block">
                <div className="overflow-hidden rounded-[3px] bg-brand-beigeDark/20">
                  <div className="aspect-[4/5] w-full">
                    {blog.imageSrc && (
                      <img
                        src={blog.imageSrc}
                        alt={blog.titleView}
                        className="h-full w-full object-cover transition-transform duration-300 group-hover:scale-[1.02]"
                        loading="lazy"
                      />
                    )}
                  </div>
                </div>

                <div className="mt-5 text-left">
                  <div className="font-finlandica text-[12px] font-semibold uppercase tracking-[0.8px] text-brand-black/45">
                    {blog.categoryView}
                  </div>

                  <h3 className="mt-2 font-finlandica text-[14px] font-semibold uppercase leading-[1.35] tracking-[0.6px] text-brand-black/70">
                    {blog.titleView}
                  </h3>

                  <div className="mt-3 inline-flex font-finlandica text-[14px] font-semibold text-brand-black underline underline-offset-[6px] decoration-brand-black/70">
                    {t("read_more")}
                  </div>
                </div>
              </Link>
            </article>
          ))}
        </div>
      </div>
    </section>
  );
}
