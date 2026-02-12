import React from "react";

export default function Pagination({
  page,
  totalPages,
  onPage,
  windowSize = 4,
}) {
  if (totalPages <= 1) return null;

  const clamp = (n) => Math.max(1, Math.min(totalPages, n));
  const safePage = clamp(page);

  const pages = [];
  if (totalPages <= windowSize + 2) {
    for (let i = 1; i <= totalPages; i++) pages.push(i);
  } else {
    if (safePage <= windowSize) {
      for (let i = 1; i <= windowSize; i++) pages.push(i);
      pages.push("dots-right");
      pages.push(totalPages);
    } else if (safePage > windowSize && safePage <= totalPages - windowSize) {
      pages.push(1);
      pages.push("dots-left");
      for (let i = safePage - 1; i <= safePage + 1; i++) pages.push(i);
      pages.push("dots-right");
      pages.push(totalPages);
    } else {
      pages.push(1);
      pages.push("dots-left");
      for (let i = totalPages - windowSize + 1; i <= totalPages; i++)
        pages.push(i);
    }
  }

  return (
    <div className="mt-10 flex items-center justify-center gap-2">
      <button
        type="button"
        onClick={() => onPage(clamp(safePage - 1))}
        disabled={safePage === 1}
        className={[
          "h-10 px-4 rounded-lg border text-sm",
          safePage === 1
            ? "border-black/10 text-black/30"
            : "border-black/15 text-black/70 hover:text-black hover:border-black/25",
        ].join(" ")}
      >
        Назад
      </button>

      <div className="flex items-center gap-2">
        {pages.map((p, idx) =>
          p === "dots-left" || p === "dots-right" ? (
            <span
              key={`${p}-${idx}`}
              className="px-1 text-black/35 select-none"
            >
              …
            </span>
          ) : (
            <button
              key={p}
              type="button"
              onClick={() => onPage(p)}
              className={[
                "h-10 min-w-[40px] px-3 rounded-lg border text-sm",
                p === safePage
                  ? "border-black bg-black text-white"
                  : "border-black/15 text-black/70 hover:text-black hover:border-black/25",
              ].join(" ")}
            >
              {p}
            </button>
          ),
        )}
      </div>

      <button
        type="button"
        onClick={() => onPage(clamp(safePage + 1))}
        disabled={safePage === totalPages}
        className={[
          "h-10 px-4 rounded-lg border text-sm",
          safePage === totalPages
            ? "border-black/10 text-black/30"
            : "border-black/15 text-black/70 hover:text-black hover:border-black/25",
        ].join(" ")}
      >
        Вперед
      </button>
    </div>
  );
}
