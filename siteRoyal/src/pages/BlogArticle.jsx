import React, { useMemo } from "react";
import { useParams, Link, Navigate } from "react-router-dom";

import blogData from "../../blogData.json";

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

function BlogContent({ content }) {
  if (!Array.isArray(content) || content.length === 0) return null;

  return (
    <div className="mt-8 space-y-6">
      {content.map((block, i) => {
        if (!block || typeof block !== "object") return null;

        if (block.type === "heading") {
          const level = Number(block.level) || 2;
          const text = block.text || "";

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

          // default h2
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
          if (!block.text) return null;
          return (
            <p
              key={i}
              className="font-finlandica text-[16px] sm:text-[17px] leading-[1.85] text-brand-black/70"
            >
              {block.text}
            </p>
          );
        }

        if (block.type === "list") {
          const items = Array.isArray(block.items) ? block.items : [];
          if (items.length === 0) return null;

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
  const { id } = useParams(); // /blog/:id/*
  const index = Number(id) - 1;

  const article = useMemo(() => {
    if (!Array.isArray(blogData)) return null;
    if (!Number.isInteger(index) || index < 0) return null;
    return blogData[index] ?? null;
  }, [index]);

  if (!article) return <Navigate to="*" replace />;

  const imageSrc = IMAGE_MAP[article.image];

  return (
    <main className="bg-brand-beige">
      {/* Top dark strip (matches your layout) */}
      <div className="pt-16  bg-brand-black " />

      {/* Hero with flowers */}
      <section className="relative overflow-hidden bg-brand-beige">
        {/* Flowers */}
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
          {/* Card container */}
          <div className="relative -mt-1 rounded-[6px] border border-brand-black/10 bg-white/50 backdrop-blur-[2px] shadow-[0_10px_30px_rgba(0,0,0,0.06)]">
            <div className="px-5 py-6 sm:px-8 sm:py-8 lg:px-10">
              {/* breadcrumbs */}
              <div className="mb-5 flex items-center gap-2 font-finlandica text-[14px] text-brand-black/60">
                <Link to="/" className="hover:underline underline-offset-4">
                  Головна
                </Link>
                <span className="opacity-60">/</span>
                <span className="text-brand-black/80">Блог</span>
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
                <BlogContent content={article.content} />
              </article>

              {/* back */}
              <div className="mt-10">
                <Link
                  to="/"
                  className="inline-flex items-center gap-2 font-finlandica text-[14px] font-semibold text-brand-black underline underline-offset-[6px] decoration-brand-black/60 hover:decoration-brand-black"
                >
                  ← Назад
                </Link>
              </div>
            </div>
          </div>
        </div>

        {/* bottom spacing */}
        <div className="h-14 sm:h-16" />
      </section>
    </main>
  );
}
